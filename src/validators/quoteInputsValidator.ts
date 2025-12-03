import { z } from 'zod';
import { buildOptions } from '../constants/buildOptions';

const goalsSchema = z.string().min(5, 'Goals must be at least 5 characters long');
const buildTypesSchema = z
  .array(z.enum(buildOptions))
  .min(1, 'At least one build type is required');
const artifactsSchema = z
  .array(z.string().url('Each artifact must be a valid URL'))
  .max(5, 'You can upload up to 5 artifacts');

const scaleBandSchema = z.enum(['10k-100k', '100k-1m', '>1m']);
const techPrefsSchema = z.object({
  frontend: z.string().min(1, 'Frontend preference is required'),
  backend: z.string().min(1, 'Backend preference is required'),
  db: z.string().min(1, 'Database preference is required'),
  cloud: z.string().min(1, 'Cloud provider is required'),
});

export const quoteInputsSchema = z.object({
  goals: goalsSchema.optional(),
  buildTypes: buildTypesSchema.optional(),
  artifacts: artifactsSchema.optional(),

  features: z
    .array(
      z.object({
        key: z.string(),
        depth: z.enum(['basic', 'standard', 'advanced']),
      })
    )
    .optional(),

  scaleBand: scaleBandSchema.optional(),
  a11y: z.boolean().optional(),
  i18n: z.boolean().optional(),
  perf: z.boolean().optional(),
  techPrefs: techPrefsSchema.optional(),

  // other optional sections (for S3–S5 steps)
  budget: z
    .object({
      type: z.enum(['fixed', 'flexible', 'unknown']),
      amount: z.number().nonnegative(),
    })
    .optional(),
  timeline: z
    .object({
      type: z.enum(['fixed', 'flexible', 'quality-first']),
      deadline: z
        .any()
        .nullable()
        .transform((val) => {
          if (!val) return null;
          return val instanceof Date ? val : new Date(val);
        })
        .refine((val) => (val ? !isNaN(val.getTime()) : true), {
          message: 'Invalid date',
        }),
    })
    .optional(),
});
