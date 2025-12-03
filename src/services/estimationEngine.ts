// import { QuoteInputs, FeatureInput } from '../types/QuoteInputs';
// import { estimationConfig, EstimationConfig } from '../config/estimationConfig';
// import FeatureLibrary, { IFeature } from '../models/FeatureLibrary';
// import { IQuote } from '../models/Quote';

// type OptionKey = 'A' | 'B' | 'C';

// interface QuoteOption {
//   label: string;
//   team: { role: string; count: number }[];
//   weeks: number;
//   costMin: number;
//   costMax: number;
//   cloudMonthly: number;
//   recommended: boolean;
// }

// interface QuoteOptions {
//   A: QuoteOption;
//   B: QuoteOption;
//   C: QuoteOption;
// }

// const countFeaturePoints = (
//   inputs: QuoteInputs,
//   library: IFeature[],
//   config: EstimationConfig
// ): number => {
//   let FP = 0;

//   inputs.features.forEach((feature: FeatureInput) => {
//     const lib = library.find((f) => f.key === feature.key);
//     if (!lib) return;

//     const base = lib.basePoints;
//     const depthMult = config.depthMult[feature.depth];
//     const scaleMult = config.scaleMult[inputs.scaleBand];

//     const quality =
//       1 +
//       (inputs.a11y ? config.qualityMult.a11y : 0) +
//       (inputs.i18n ? config.qualityMult.i18n : 0) +
//       (inputs.perf ? config.qualityMult.perf : 0);

//     FP += base * depthMult * scaleMult * quality;
//   });

//   return FP;
// };

// const computeBuffers = (inputs: QuoteInputs, FP: number, config: EstimationConfig): number => {
//   let buffer = 1.0;

//   const buildTypeMult = 1 + (inputs.buildTypes.length - 1) * 0.15;
//   const clarity = inputs.likeExistingProduct ? 0.95 : 1.05;
//   const docs = inputs.detailedDocs ? 1.1 : 1.0;

//   const integrations = inputs.integrations.length;
//   const integrationMult =
//     integrations <= 1 ? 1.0 : integrations <= 3 ? 1.1 : integrations <= 6 ? 1.2 : 1.3;

//   const aiBase = inputs.includesAI ? 1.15 : 1.0;

//   const noveltyMult = estimationConfig.aiNoveltyMult[inputs.aiNovelty] ?? 1.1;

//   const compliance = config.complianceMult[inputs.compliance];

//   buffer *= buildTypeMult;
//   buffer *= clarity;
//   buffer *= docs;
//   buffer *= integrationMult;
//   buffer *= aiBase;
//   buffer *= noveltyMult;
//   buffer *= compliance;

//   return parseFloat(buffer.toFixed(2));
// };

// const buildOptions = (devWeeks: number, inputs: QuoteInputs) => {
//   const baseCost = devWeeks * 1000;

//   const options = {
//     A: {
//       label: 'Cost-Optimized',
//       team: [{ role: 'Fullstack Dev', count: 1 }],
//       weeks: devWeeks,
//       costMin: baseCost * 0.9,
//       costMax: baseCost * 1.0,
//       cloudMonthly: 50,
//       recommended: false,
//     },
//     B: {
//       label: 'Balanced',
//       team: [
//         { role: 'Fullstack Dev', count: 1 },
//         { role: 'QA', count: 1 },
//       ],
//       weeks: Math.ceil(devWeeks * 0.85),
//       costMin: baseCost * 1.0,
//       costMax: baseCost * 1.25,
//       cloudMonthly: 75,
//       recommended: false,
//     },
//     C: {
//       label: 'Fast-Track',
//       team: [
//         { role: 'Fullstack Dev', count: 2 },
//         { role: 'QA', count: 1 },
//       ],
//       weeks: Math.ceil(devWeeks * 0.75),
//       costMin: baseCost * 1.25,
//       costMax: baseCost * 1.5,
//       cloudMonthly: 100,
//       recommended: false,
//     },
//   };

//   return options;
// };

// const pickRecommended = (options: QuoteOptions, budget: number): OptionKey => {
//   const keys: OptionKey[] = ['A', 'B', 'C'];

//   const fits = keys.filter((key) => budget >= options[key].costMin);

//   if (fits.length === 0) return 'A';

//   return fits[fits.length - 1];
// };

// export const estimateQuote = async (quote: IQuote) => {
//   const inputs: QuoteInputs = quote.inputs;

//   const library = await FeatureLibrary.find();

//   const FP = countFeaturePoints(inputs, library, estimationConfig);
//   const buffer = computeBuffers(inputs, FP, estimationConfig);
//   const adjustedFP = FP * buffer;
//   const devWeeks = Math.ceil(adjustedFP * estimationConfig.fpToDevWeek);

//   const options = buildOptions(devWeeks, inputs);

//   const recommendedKey: OptionKey = pickRecommended(options, inputs.budget.amount);
//   options[recommendedKey].recommended = true;

//   return {
//     computed: {
//       totalFP: FP,
//       adjustedFP,
//       devWeeks,
//       buffers: {
//         integrationBuffer: buffer, // or break down if needed
//         clarityBuffer: 0,
//         aiBaseBuffer: 0,
//         aiNoveltyMultiplier: 0,
//       },
//     },
//     options,
//   };
// };

import { QuoteInputs, FeatureInput } from '../types/QuoteInputs';
import { estimationConfig, EstimationConfig } from '../config/estimationConfig';
import FeatureLibrary, { IFeature } from '../models/FeatureLibrary';
import { IQuote } from '../models/Quote';
import { CloudCostCalculator } from './cloudCostCalculator';

type OptionKey = 'A' | 'B' | 'C';

interface QuoteOption {
  label: string;
  team: { role: string; count: number }[];
  weeks: number;
  costMin: number;
  costMax: number;
  cloudMonthly: number;
  recommended: boolean;
}

interface QuoteOptions {
  A: QuoteOption;
  B: QuoteOption;
  C: QuoteOption;
}

const countFeaturePoints = (
  inputs: QuoteInputs,
  library: IFeature[],
  config: EstimationConfig
): number => {
  let FP = 0;

  inputs.features.forEach((feature: FeatureInput) => {
    const lib = library.find((f) => f.key === feature.key);
    if (!lib) return;

    const base = lib.basePoints;
    const depthMult = config.depthMult[feature.depth];
    const scaleMult = config.scaleMult[inputs.scaleBand];

    const quality =
      1 +
      (inputs.a11y ? config.qualityMult.a11y : 0) +
      (inputs.i18n ? config.qualityMult.i18n : 0) +
      (inputs.perf ? config.qualityMult.perf : 0);

    FP += base * depthMult * scaleMult * quality;
  });

  return FP;
};

const computeBuffers = (inputs: QuoteInputs, FP: number, config: EstimationConfig): number => {
  let buffer = 1.0;

  const buildTypeMult = 1 + (inputs.buildTypes.length - 1) * 0.15;
  const clarity = inputs.likeExistingProduct ? 0.95 : 1.05;
  const docs = inputs.detailedDocs ? 1.1 : 1.0;

  const integrations = inputs.integrations.length;
  const integrationMult =
    integrations <= 1 ? 1.0 : integrations <= 3 ? 1.1 : integrations <= 6 ? 1.2 : 1.3;

  const aiBase = inputs.includesAI ? 1.15 : 1.0;

  const noveltyMult = estimationConfig.aiNoveltyMult[inputs.aiNovelty] ?? 1.1;

  const compliance = config.complianceMult[inputs.compliance];

  buffer *= buildTypeMult;
  buffer *= clarity;
  buffer *= docs;
  buffer *= integrationMult;
  buffer *= aiBase;
  buffer *= noveltyMult;
  buffer *= compliance;

  return parseFloat(buffer.toFixed(2));
};

const buildTeamPlan = (inputs: QuoteInputs, FP: number) => {
  const team: { role: string; count: number }[] = [];

  // 1) Baseline devs from FP
  const baseDevCount = Math.ceil(FP / 80); // Rough rule: 1 dev per 80 FP
  team.push({ role: 'Fullstack Dev', count: baseDevCount });

  // 2) If AI included → add AI engineer
  if (inputs.includesAI) {
    team.push({
      role: 'AI Engineer',
      count: inputs.aiNovelty === 'high' ? 2 : 1,
    });
  }

  // 3) More than 3 integrations → include DevOps
  if (inputs.integrations.length > 3) {
    team.push({ role: 'DevOps Engineer', count: 1 });
  }

  // 4) If mobile apps included
  if (
    inputs.buildTypes.includes('Mobile App (iOS)') ||
    inputs.buildTypes.includes('Mobile App (Android)') ||
    inputs.buildTypes.includes('Mobile App (Cross-platform)')
  ) {
    team.push({
      role: 'Mobile Dev',
      count: inputs.buildTypes.length > 1 ? 2 : 1,
    });
  }

  // 5) QA based on FP
  const qaCount = Math.ceil(FP / 120);
  team.push({ role: 'QA Engineer', count: qaCount });

  return team;
};

const scaleTeam = (
  team: { role: string; count: number }[],
  multiplier: number
): { role: string; count: number }[] => {
  return team.map((m) => ({
    role: m.role,
    count: Math.max(1, Math.ceil(m.count * multiplier)),
  }));
};

// const buildOptions = (devWeeks: number, inputs: QuoteInputs, FP: number) => {
//   const baseTeam = buildTeamPlan(inputs, FP);

//   const multiplier = {
//     A: 1.0, // cost-optimized
//     B: 1.2, // balanced
//     C: 1.6, // fast-track / speed
//   };

//   const options = {
//     A: {
//       label: 'Cost-Optimized',
//       team: scaleTeam(baseTeam, multiplier.A),
//       weeks: devWeeks,
//       costMin: devWeeks * 900,
//       costMax: devWeeks * 1000,
//       cloudMonthly: 50,
//       recommended: false,
//       isSelected: false,
//     },
//     B: {
//       label: 'Balanced',
//       team: scaleTeam(baseTeam, multiplier.B),
//       weeks: Math.ceil(devWeeks * 0.85),
//       costMin: devWeeks * 1000,
//       costMax: devWeeks * 1300,
//       cloudMonthly: 75,
//       recommended: false,
//       isSelected: false,
//     },
//     C: {
//       label: 'Fast-Track',
//       team: scaleTeam(baseTeam, multiplier.C),
//       weeks: Math.ceil(devWeeks * 0.7),
//       costMin: devWeeks * 1250,
//       costMax: devWeeks * 1500,
//       cloudMonthly: 100,
//       recommended: false,
//       isSelected: false,
//     },
//   };

//   return options;
// };

// const buildOptions = (devWeeks: number, inputs: QuoteInputs, FP: number) => {
//   const baseTeam = buildTeamPlan(inputs, FP);
  
//   const cloudCalculator = new CloudCostCalculator();
  
//   const optionsConfig = {
//     A: {
//       label: 'Cost-Optimized',
//       teamMultiplier: 1.0,
//       weeksMultiplier: 1.0,
//       costPerWeek: 900,
//       cloudMultiplier: 0.8,
//     },
//     B: {
//       label: 'Balanced',
//       teamMultiplier: 1.2,
//       weeksMultiplier: 0.85,
//       costPerWeek: 1000,
//       cloudMultiplier: 1.0,
//     },
//     C: {
//       label: 'Fast-Track',
//       teamMultiplier: 1.6,
//       weeksMultiplier: 0.7,
//       costPerWeek: 1250,
//       cloudMultiplier: 1.4,
//     },
//   };

//   const options = {} as any;

//   (['A', 'B', 'C'] as const).forEach((key) => {
//     const config = optionsConfig[key];
    
//     // Calculate team
//     const team = scaleTeam(baseTeam, config.teamMultiplier);
    
//     // Calculate timeline
//     const weeks = Math.ceil(devWeeks * config.weeksMultiplier);
    
//     // Calculate development costs
//     const costMin = Math.round(weeks * config.costPerWeek);
//     const costMax = Math.round(costMin * 1.15); // +15% buffer
    
//     // Calculate cloud costs
//     const cloudInputs = {
//       scaleBand: inputs.scaleBand,
//       includesAI: inputs.includesAI,
//       perf: inputs.perf,
//       compliance: inputs.compliance,
//       buildTypes: inputs.buildTypes,
//       integrations: inputs.integrations,
//       option: key,
//     };
    
//     const cloudCosts = cloudCalculator.getCostBreakdown(cloudInputs);

//     options[key] = {
//       label: config.label,
//       team,
//       weeks,
//       costMin,
//       costMax,
//       cloudMonthly: cloudCosts.monthly.total,
//       cloudYearly: cloudCosts.yearly,
//       cloudBreakdown: cloudCosts.monthly,
//       cloudSavings: cloudCosts.savings,
//       recommended: false,
//       isSelected: false,
//     };
//   });

//   return options;
// };

const buildOptions = (devWeeks: number, inputs: QuoteInputs, FP: number) => {
  const baseTeam = buildTeamPlan(inputs, FP);

  // Create cloud calculator
  const cloudCalculator = new CloudCostCalculator();

  // Initialize with empty cloud breakdown structure
  const emptyCloudBreakdown = {
    compute: 0,
    storage: 0,
    database: 0,
    networking: 0,
    monitoring: 0,
    additionalServices: 0,
    total: 0,
  };

  const options = {
    A: {
      label: 'Cost-Optimized',
      team: scaleTeam(baseTeam, 1.0),
      weeks: devWeeks,
      costMin: devWeeks * 900,
      costMax: devWeeks * 1000,
      // Cloud costs - initialized with empty values
      cloudMonthly: 0,
      cloudYearly: 0,
      cloudBreakdown: emptyCloudBreakdown,
      cloudSavings: 0,
      recommended: false,
      isSelected: false,
    },
    B: {
      label: 'Balanced',
      team: scaleTeam(baseTeam, 1.2),
      weeks: Math.ceil(devWeeks * 0.85),
      costMin: devWeeks * 1000,
      costMax: devWeeks * 1300,
      // Cloud costs - initialized with empty values
      cloudMonthly: 0,
      cloudYearly: 0,
      cloudBreakdown: { ...emptyCloudBreakdown },
      cloudSavings: 0,
      recommended: false,
      isSelected: false,
    },
    C: {
      label: 'Fast-Track',
      team: scaleTeam(baseTeam, 1.6),
      weeks: Math.ceil(devWeeks * 0.7),
      costMin: devWeeks * 1250,
      costMax: devWeeks * 1500,
      // Cloud costs - initialized with empty values
      cloudMonthly: 0,
      cloudYearly: 0,
      cloudBreakdown: { ...emptyCloudBreakdown },
      cloudSavings: 0,
      recommended: false,
      isSelected: false,
    },
  };

  // Calculate cloud costs for each option
  (['A', 'B', 'C'] as const).forEach((key) => {
    const cloudInputs = {
      scaleBand: inputs.scaleBand,
      includesAI: inputs.includesAI,
      perf: inputs.perf,
      compliance: inputs.compliance,
      buildTypes: inputs.buildTypes,
      integrations: inputs.integrations,
      option: key,
    };

    const cloudCosts = cloudCalculator.getCostBreakdown(cloudInputs);

    // Update cloud cost fields
    options[key].cloudMonthly = cloudCosts.monthly.total;
    options[key].cloudYearly = cloudCosts.yearly;
    options[key].cloudBreakdown = cloudCosts.monthly;
    options[key].cloudSavings = cloudCosts.savings;
  });

  return options;
};

const pickRecommended = (options: QuoteOptions, budget: number): OptionKey => {
  const keys: OptionKey[] = ['A', 'B', 'C'];

  const fits = keys.filter((key) => budget >= options[key].costMin);

  if (fits.length === 0) return 'A';

  return fits[fits.length - 1];
};

export const estimateQuote = async (quote: IQuote) => {
  const inputs: QuoteInputs = quote.inputs;

  const library = await FeatureLibrary.find();

  const FP = countFeaturePoints(inputs, library, estimationConfig);
  const buffer = computeBuffers(inputs, FP, estimationConfig);
  const adjustedFP = FP * buffer;
  const devWeeks = Math.ceil(adjustedFP * estimationConfig.fpToDevWeek);

  const options = buildOptions(devWeeks, inputs, FP);

  const recommendedKey: OptionKey = pickRecommended(options, inputs.budget.amount);
  options[recommendedKey].recommended = true;

  return {
    computed: {
      totalFP: FP,
      adjustedFP,
      devWeeks,
      buffers: {
        integrationBuffer: buffer, // or break down if needed
        clarityBuffer: 0,
        aiBaseBuffer: 0,
        aiNoveltyMultiplier: 0,
      },
    },
    options,
  };
};
