// src/config/estimationConfig.ts
export const estimationConfig = {
  aiNoveltyMult: {
    low: 1.1,
    medium: 1.25,
    high: 1.4,
  },
  complianceMult: {
    none: 1.0,
    moderate: 1.1,
    high: 1.25,
  },
  fpToDevWeek: 0.1,
  depthMult: {
    basic: 0.8,
    standard: 1.0,
    advanced: 1.5,
  },
  scaleMult: {
    '10k-100k': 1.0,
    '100k-1m': 1.25,
    '>1m': 1.5,
  },
  qualityMult: {
    a11y: 0.1,
    i18n: 0.1,
    perf: 0.15,
  },
  roleWeights: {
    fullstack: 1, // handles backend + web UI
    backend: 0.7,
    frontend: 0.7,
    mobile: 0.8,
    qa: 0.4,
    devops: 0.3,
    aiEngineer: 0.8,
  },
  priorityMult: {
    cost: 1.0,
    speed: 1.5,
    quality: 1.3,
  },
  cloudConfig: {
    // Base costs per month (in USD, will convert to INR)
    baseCosts: {
      small: {
        compute: 50, // AWS EC2 t3.medium / GCP e2-medium
        storage: 20, // S3/EBS
        database: 40, // RDS PostgreSQL small
        networking: 10,
        monitoring: 15,
      },
      medium: {
        compute: 150, // AWS EC2 m5.large / GCP n2-standard-2
        storage: 50,
        database: 120,
        networking: 25,
        monitoring: 30,
      },
      large: {
        compute: 400, // AWS EC2 m5.xlarge / GCP n2-standard-4
        storage: 100,
        database: 250,
        networking: 50,
        monitoring: 50,
      },
      enterprise: {
        compute: 1000, // Multi-AZ, auto-scaling
        storage: 300,
        database: 600,
        networking: 100,
        monitoring: 100,
      },
    },

    // Multipliers based on requirements
    multipliers: {
      scale: {
        '10k-100k': 1.0,
        '100k-1m': 2.0,
        '>1m': 4.0,
      },
      aiIncluded: 1.5, // AI workloads need GPUs
      highPerf: 1.3, // Performance requirements
      highCompliance: 1.4, // GDPR/HIPAA etc.
      mobileApp: 1.2, // Push notifications, CDN
      realtime: 1.3, // WebSockets, real-time features
      microservices: 1.4, // Container orchestration
    },

    // Option scaling factors (A=lean, B=balanced, C=enterprise)
    optionScaling: {
      A: 0.8, // Cost-optimized
      B: 1.0, // Balanced
      C: 1.4, // High-availability, auto-scaling
    },

    // Currency conversion (USD to INR)
    usdToInr: 89,
  },
};

export type EstimationConfig = typeof estimationConfig;
