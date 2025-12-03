export type FeatureDepth = 'basic' | 'standard' | 'advanced';
export type ScaleBand = '10k-100k' | '100k-1m' | '>1m';
export type ComplianceLevel = 'none' | 'moderate' | 'high';
export type AiNovelty = 'low' | 'medium' | 'high';

export interface FeatureInput {
  key: string;
  depth: FeatureDepth;
}

export interface TechPrefs {
  frontend: string;
  backend: string;
  db: string;
  cloud: string;
}

export interface Budget {
  type: 'fixed' | 'flexible' | 'unknown';
  amount: number;
}

export interface Timeline {
  type: 'fixed' | 'flexible' | 'quality-first';
  deadline: Date | null;
}

export interface QuoteInputs {
  goals: string;
  buildTypes: string[];
  artifacts: string[];
  features: FeatureInput[];
  scaleBand: ScaleBand;

  a11y: boolean;
  i18n: boolean;
  perf: boolean;
  compliance: ComplianceLevel;

  techPrefs: TechPrefs;

  budget: Budget;
  timeline: Timeline;

  priority: 'cost' | 'balanced' | 'speed' | 'quality';
  supportMonths: number;

  integrations: string[];
  likeExistingProduct: boolean;
  detailedDocs: boolean;
  includesAI: boolean;
  aiNovelty: AiNovelty;
}
