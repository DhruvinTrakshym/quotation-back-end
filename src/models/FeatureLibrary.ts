import mongoose, { Schema, Document } from 'mongoose';

export interface IFeature extends Document {
  key: string; // e.g., "auth", "payments"
  name: string; // e.g., "User Authentication"
  description: string;
  basePoints: number; // baseline complexity
  multipliers: {
    basic: number;
    standard: number;
    advanced: number;
  };
  category: string; // e.g., "core", "integration", "ai"
}

const FeatureSchema = new Schema<IFeature>({
  key: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  basePoints: { type: Number, default: 10 },
  multipliers: {
    basic: { type: Number, default: 0.8 },
    standard: { type: Number, default: 1.0 },
    advanced: { type: Number, default: 1.5 },
  },
  category: { type: String, default: 'core' },
});

export default mongoose.model<IFeature>('FeatureLibrary', FeatureSchema);
