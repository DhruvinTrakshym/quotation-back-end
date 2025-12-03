function estimate(inputs, adminConfig) {
  const fp = sum(
    inputs.features.map((f) => {
      const base = adminConfig.basePoints[f.key];
      const depth = adminConfig.depthMult[f.depth]; // CRUD/Std/Advanced
      const scale = adminConfig.scaleMult[inputs.scaleBand];
      const quality =
        1 + (inputs.a11y ? 0.1 : 0) + (inputs.i18n ? 0.1 : 0) + (inputs.perf ? 0.1 : 0);
      return base * depth * scale * quality;
    })
  );
  const complianceMult =
    1 + (inputs.compliance === 'high' ? 0.2 : inputs.compliance === 'moderate' ? 0.1 : 0);
  let totalFP = fp * complianceMult;
  // Buffers
  let buffer = 1;
  if (inputs.likeExistingProduct && !inputs.detailedDocs) buffer += 0.1;
  const unknownIntegrations = Math.max(0, inputs.integrationsCount - 2);
  buffer += unknownIntegrations * 0.1;
  if (inputs.includesAI && inputs.aiNovelty === 'high') buffer += 0.3;
  const devWeeks = totalFP * adminConfig.fpToDevWeek * buffer;
  // Split devWeeks by role
  const roleDist = pickRoleDistribution(inputs, adminConfig);
  const roleWeeks = distribute(devWeeks, roleDist);
  // Build options A/B/C
  return ['cost', 'balanced', 'fast'].map((opt) => {
    const teamPlan = buildTeam(roleWeeks, opt, adminConfig); // decides headcount
    const weeks = calcTimeline(roleWeeks, teamPlan, adminConfig);
    const cost = calcCost(roleWeeks, teamPlan, adminConfig, opt);
    const cloud = estimateCloud(inputs, adminConfig, opt);
    return { option: opt, weeks, cost, teamPlan, cloud };
  });
}
