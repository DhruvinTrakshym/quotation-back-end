// src/models/Quote.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IQuote extends Document {
  publicId: string;
  status: 'draft' | 'final';
  version: string;
  client: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  engagementModel: 'project' | 'dedicated';
  userProfile: 'tech' | 'non-tech';
  inputs: {
    goals: string;
    buildTypes: string[];
    artifacts: string[];
    features: { key: string; depth: 'basic' | 'standard' | 'advanced' }[];
    scaleBand: '10k-100k' | '100k-1m' | '>1m';
    a11y: boolean;
    i18n: boolean;
    perf: boolean;
    compliance: 'none' | 'moderate' | 'high'; // risk
    techPrefs: {
      frontend: string;
      backend: string;
      db: string;
      cloud: string;
    };
    budget: { type: 'fixed' | 'flexible' | 'unknown'; amount: number };
    timeline: {
      type: 'fixed' | 'flexible' | 'quality-first';
      deadline: Date | null;
    };
    priority: 'cost' | 'speed' | 'quality';
    supportMonths: number;
    integrations: string[];
    likeExistingProduct: boolean;
    detailedDocs: boolean;
    includesAI: boolean;
    aiNovelty: 'low' | 'medium' | 'high';
  };
  computed: {
    totalFP: number;
    adjustedFP: number;
    buffers: {
      // unknownIntegrations: number;
      // ai: number;
      // other: number;
      integrationBuffer: number;
      clarityBuffer: number;
      aiBaseBuffer: number;
      aiNoveltyMultiplier: number;
    };
    devWeeks: number;
  };
  options: {
    A: QuoteOption;
    B: QuoteOption;
    C: QuoteOption;
  };
  assumptions: string[];
  exclusions: string[];
  files: mongoose.Types.ObjectId[];
  pdfKey: string;
  createdAt: Date;
  updatedAt: Date;
}

interface QuoteOption {
  label: string;
  team: any[];
  weeks: number;
  costMin: number;
  costMax: number;
  cloudMonthly: number;
  cloudYearly?: number; // Add this
  cloudBreakdown?: {
    // Add this
    compute: number;
    storage: number;
    database: number;
    networking: number;
    monitoring: number;
    additionalServices: number;
    total: number;
  };
  cloudSavings?: number; // Add this
  recommended: boolean;
  isSelected: boolean;
}

const QuoteSchema = new Schema<IQuote>(
  {
    publicId: { type: String, unique: true },
    status: {
      type: String,
      enum: ['draft', 'final'],
      default: 'draft',
    },
    version: { type: String, default: '1.0' },

    client: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      company: { type: String, default: '' },
    },

    engagementModel: {
      type: String,
      enum: ['project', 'dedicated'],
      required: true,
    },

    userProfile: {
      type: String,
      enum: ['tech', 'non-tech'],
      default: 'non-tech',
    },

    // ───── Inputs ─────
    inputs: {
      goals: String,
      buildTypes: [String],
      artifacts: [String],
      features: [
        {
          key: String,
          depth: { type: String, enum: ['basic', 'standard', 'advanced'] },
        },
      ],
      scaleBand: { type: String, enum: ['10k-100k', '100k-1m', '>1m'] },
      a11y: { type: Boolean, default: false },
      i18n: { type: Boolean, default: false },
      perf: { type: Boolean, default: false },
      techPrefs: {
        frontend: { type: String },
        backend: { type: String },
        db: { type: String },
        cloud: { type: String },
      },
      budget: {
        type: {
          type: String,
          enum: ['fixed', 'flexible', 'unknown'],
          default: 'unknown',
        },
        amount: { type: Number, default: 0 },
      },
      timeline: {
        type: {
          type: String,
          enum: ['fixed', 'flexible', 'quality-first'],
          default: 'flexible',
        },
        deadline: { type: Date, default: null },
      },
      priority: {
        type: String,
        enum: ['cost', 'speed', 'quality'],
        default: 'cost',
      },
      compliance: {
        // risk
        type: String,
        enum: ['none', 'moderate', 'high'],
        default: 'none',
      },
      supportMonths: { type: Number, default: 6 },
      integrations: [String],
      likeExistingProduct: Boolean,
      detailedDocs: Boolean,
      includesAI: Boolean,
      aiNovelty: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low',
      },
    },

    // ───── Computed ─────
    computed: {
      totalFP: { type: Number, default: 0 },

      // FP after applying all buffers
      adjustedFP: { type: Number, default: 0 },

      // Production-level detailed buffers
      buffers: {
        integrationBuffer: { type: Number, default: 0 },
        clarityBuffer: { type: Number, default: 0 },
        aiBaseBuffer: { type: Number, default: 0 },
        aiNoveltyMultiplier: { type: Number, default: 1 },
      },

      // Estimated timeline
      devWeeks: { type: Number, default: 0 },
    },

    // ───── Options (A, B, C) ─────
    options: {
      A: {
        label: { type: String, default: 'Cost-Optimized' },
        team: { type: Array, default: [] },
        weeks: { type: Number, default: 0 },
        costMin: { type: Number, default: 0 },
        costMax: { type: Number, default: 0 },
        cloudMonthly: { type: Number, default: 0 },
        cloudYearly: { type: Number, default: 0 },
        cloudBreakdown: {
          compute: { type: Number, default: 0 },
          storage: { type: Number, default: 0 },
          database: { type: Number, default: 0 },
          networking: { type: Number, default: 0 },
          monitoring: { type: Number, default: 0 },
          additionalServices: { type: Number, default: 0 },
          total: { type: Number, default: 0 },
        },
        cloudSavings: { type: Number, default: 0 },
        recommended: { type: Boolean, default: false },
        isSelected: { type: Boolean, default: false },
      },
      B: {
        label: { type: String, default: 'Balanced' },
        team: { type: Array, default: [] },
        weeks: { type: Number, default: 0 },
        costMin: { type: Number, default: 0 },
        costMax: { type: Number, default: 0 },
        cloudMonthly: { type: Number, default: 0 },
        cloudYearly: { type: Number, default: 0 },
        cloudBreakdown: {
          compute: { type: Number, default: 0 },
          storage: { type: Number, default: 0 },
          database: { type: Number, default: 0 },
          networking: { type: Number, default: 0 },
          monitoring: { type: Number, default: 0 },
          additionalServices: { type: Number, default: 0 },
          total: { type: Number, default: 0 },
        },
        cloudSavings: { type: Number, default: 0 },
        recommended: { type: Boolean, default: false },
        isSelected: { type: Boolean, default: false },
      },
      C: {
        label: { type: String, default: 'Fast-Track' },
        team: { type: Array, default: [] },
        weeks: { type: Number, default: 0 },
        costMin: { type: Number, default: 0 },
        costMax: { type: Number, default: 0 },
        cloudMonthly: { type: Number, default: 0 },
        cloudYearly: { type: Number, default: 0 },
        cloudBreakdown: {
          compute: { type: Number, default: 0 },
          storage: { type: Number, default: 0 },
          database: { type: Number, default: 0 },
          networking: { type: Number, default: 0 },
          monitoring: { type: Number, default: 0 },
          additionalServices: { type: Number, default: 0 },
          total: { type: Number, default: 0 },
        },
        cloudSavings: { type: Number, default: 0 },
        recommended: { type: Boolean, default: false },
        isSelected: { type: Boolean, default: false },
      },
    },

    assumptions: { type: [String], default: [] },
    exclusions: {
      type: [String],
      default: ['Content writing', 'Stock imagery', '3rd-party fees'],
    },
    files: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    pdfKey: { type: String, default: null },
  },
  { timestamps: true }
);

QuoteSchema.pre<IQuote>('save', async function (next) {
  if (this.publicId) return next();

  const prefix = 'Q-TRK';
  const year = new Date().getFullYear();

  try {
    const lastQuote = await mongoose
      .model<IQuote>('Quote')
      .findOne({ publicId: new RegExp(`^${prefix}-${year}`) })
      .sort({ createdAt: -1 })
      .exec();

    let nextNumber = 1;
    if (lastQuote?.publicId) {
      const match = lastQuote.publicId.match(/(\d+)$/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }

    this.publicId = `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
    next();
  } catch (err) {
    next(err as any);
  }
});

export default mongoose.model<IQuote>('Quote', QuoteSchema);
