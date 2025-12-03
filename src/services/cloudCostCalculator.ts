// src/services/cloudCostCalculator.ts
import { estimationConfig } from '../config/estimationConfig';
import { QuoteInputs } from '../types/QuoteInputs';

type OptionKey = 'A' | 'B' | 'C';
type ScaleBand = '10k-100k' | '100k-1m' | '>1m';

interface CloudCostInputs {
  scaleBand: ScaleBand;
  includesAI: boolean;
  perf: boolean;
  compliance: 'none' | 'moderate' | 'high';
  buildTypes: string[];
  integrations: string[];
  option: OptionKey;
}

interface MonthlyCostBreakdown {
  compute: number;
  storage: number;
  database: number;
  networking: number;
  monitoring: number;
  additionalServices: number;
  total: number;
}

export class CloudCostCalculator {
  private config = estimationConfig.cloudConfig;
  private usdToInr: number;

  constructor(usdToInr?: number) {
    this.usdToInr = usdToInr || Number(process.env.CLOUD_USD_TO_INR) || this.config.usdToInr;
  }

  calculateMonthlyCost(inputs: CloudCostInputs): MonthlyCostBreakdown {
    // Determine base tier based on scale
    const baseTier = this.getBaseTier(inputs.scaleBand);
    const baseCosts = this.config.baseCosts[baseTier];

    // Apply multipliers
    let multiplier = 1.0;

    // Scale multiplier
    multiplier *= this.config.multipliers.scale[inputs.scaleBand];

    // AI multiplier
    if (inputs.includesAI) {
      multiplier *= this.config.multipliers.aiIncluded;
    }

    // Performance multiplier
    if (inputs.perf) {
      multiplier *= this.config.multipliers.highPerf;
    }

    // Compliance multiplier
    if (inputs.compliance === 'high') {
      multiplier *= this.config.multipliers.highCompliance;
    }

    // Mobile app multiplier
    if (this.hasMobileApp(inputs.buildTypes)) {
      multiplier *= this.config.multipliers.mobileApp;
    }

    // Real-time features check
    if (this.hasRealtimeFeatures(inputs.integrations)) {
      multiplier *= this.config.multipliers.realtime;
    }

    // Option scaling
    multiplier *= this.config.optionScaling[inputs.option];

    // Calculate costs
    const compute = baseCosts.compute * multiplier;
    const storage = baseCosts.storage * multiplier;
    const database = baseCosts.database * multiplier;
    const networking = baseCosts.networking * multiplier;
    const monitoring = baseCosts.monitoring * multiplier;

    // Additional services based on integrations
    const additionalServices = this.calculateAdditionalServices(inputs);

    const totalUSD = compute + storage + database + networking + monitoring + additionalServices;

    // Convert to INR
    const totalINR = Math.round(totalUSD * this.usdToInr);

    return {
      compute: Math.round(compute * this.usdToInr),
      storage: Math.round(storage * this.usdToInr),
      database: Math.round(database * this.usdToInr),
      networking: Math.round(networking * this.usdToInr),
      monitoring: Math.round(monitoring * this.usdToInr),
      additionalServices: Math.round(additionalServices * this.usdToInr),
      total: totalINR,
    };
  }

  private getBaseTier(scaleBand: ScaleBand): 'small' | 'medium' | 'large' | 'enterprise' {
    switch (scaleBand) {
      case '10k-100k':
        return 'small';
      case '100k-1m':
        return 'medium';
      case '>1m':
        return 'large';
      default:
        return 'medium';
    }
  }

  private hasMobileApp(buildTypes: string[]): boolean {
    return buildTypes.some(
      (type) => type.includes('Mobile App') || type.includes('iOS') || type.includes('Android')
    );
  }

  private hasRealtimeFeatures(integrations: string[]): boolean {
    const realtimeKeywords = ['socket', 'websocket', 'real-time', 'live', 'chat', 'notification'];
    return integrations.some((integration) =>
      realtimeKeywords.some((keyword) => integration.toLowerCase().includes(keyword))
    );
  }

  private calculateAdditionalServices(inputs: CloudCostInputs): number {
    let additionalCost = 0;

    // CDN cost for mobile/web apps
    if (this.hasMobileApp(inputs.buildTypes) || inputs.buildTypes.includes('Web Application')) {
      additionalCost += 50; // USD/month for CDN
    }

    // AI/ML services
    if (inputs.includesAI) {
      additionalCost += 200; // USD/month for AI model hosting/inference
    }

    // CI/CD pipelines
    additionalCost += 30; // USD/month for CI/CD services

    // Backup & disaster recovery
    additionalCost += 40; // USD/month for backups

    // Security services
    if (inputs.compliance === 'high') {
      additionalCost += 100; // USD/month for enhanced security
    }

    return additionalCost;
  }

  // Calculate yearly cost with discounts
  calculateYearlyCost(monthlyCost: number): number {
    const yearlyCost = monthlyCost * 12;
    // Apply 10% discount for yearly commitment
    return Math.round(yearlyCost * 0.9);
  }

  // Get cost breakdown for display
  getCostBreakdown(inputs: CloudCostInputs) {
    const monthly = this.calculateMonthlyCost(inputs);
    const yearly = this.calculateYearlyCost(monthly.total);

    return {
      monthly,
      yearly,
      savings: monthly.total * 12 - yearly,
      breakdown: {
        infrastructure: monthly.compute + monthly.storage + monthly.database + monthly.networking,
        managedServices: monthly.monitoring + monthly.additionalServices,
      },
    };
  }
}
