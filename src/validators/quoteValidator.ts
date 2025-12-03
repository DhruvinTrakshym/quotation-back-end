// import { z } from 'zod';

// export const createQuoteSchema = z.object({
//   client: z.object({
//     name: z.string().min(1, 'Client name is required'),
//     email: z
//       .string()
//       .min(1, 'Client email is required')
//       .regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Invalid email address'),
//     phone: z.string().min(10, 'Phone number is required'),
//     company: z.string().optional(),
//   }),

//   engagementModel: z.enum(['project', 'dedicated'], {
//     message: 'Engagement model must be "project" or "dedicated"',
//   }),

//   userProfile: z.enum(['tech', 'non-tech'], {
//     message: 'User profile must be "tech" or "non-tech"',
//   }),
// });

// export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

import { z } from 'zod';
import { buildOptions } from '../constants/buildOptions';

// export const createQuoteSchema = z.object({
//   client: z.object({
//     name: z.string().min(1, 'Client name is required'),
//     email: z.string().email('Invalid email address'),
//     phone: z.string().min(10, 'Phone number is required'),
//     company: z.string().optional(),
//   }),

//   engagementModel: z.enum(['project', 'dedicated']),
//   userProfile: z.enum(['tech', 'non-tech']),

//   inputs: z.object({
//     goals: z.string().min(5, 'Goals must be at least 5 characters long'),
//     buildTypes: z.array(z.enum(buildOptions)).min(1),
//     artifacts: z.array(z.string().url()).max(5),

//     features: z.array(
//       z.object({
//         key: z.string(),
//         depth: z.enum(['basic', 'standard', 'advanced']),
//       })
//     ),

//     scaleBand: z.enum(['10k-100k', '100k-1m', '>1m']),
//     a11y: z.boolean(),
//     i18n: z.boolean(),
//     perf: z.boolean(),
//     compliance: z.enum(['none', 'moderate', 'high']),

//     techPrefs: z.object({
//       frontend: z.string().min(1),
//       backend: z.string().min(1),
//       db: z.string().min(1),
//       cloud: z.string().min(1),
//     }),

//     budget: z.object({
//       type: z.enum(['fixed', 'flexible', 'unknown']),
//       amount: z.number().nonnegative(),
//     }),

//     timeline: z
//       .object({
//         type: z.enum(['fixed', 'flexible', 'quality-first'], {
//           message: 'Timeline type is required',
//         }),

//         deadline: z.string().datetime().optional(),
//       })
//       .superRefine((data, ctx) => {
//         if (data.type === 'fixed') {
//           if (!data.deadline) {
//             ctx.addIssue({
//               path: ['deadline'],
//               code: z.ZodIssueCode.custom,
//               message: 'Deadline is required when timeline type is fixed',
//             });
//             return;
//           }

//           const parsed = new Date(data.deadline);
//           if (isNaN(parsed.getTime())) {
//             ctx.addIssue({
//               path: ['deadline'],
//               code: z.ZodIssueCode.custom,
//               message: 'Deadline must be a valid ISO date',
//             });
//           }
//         }
//       })
//       .transform((data) => ({
//         ...data,
//         deadline: data.deadline ? new Date(data.deadline) : null,
//       })),

//     priority: z.enum(['cost', 'speed', 'quality']),
//     supportMonths: z.number().min(0),
//   }),
// });

export const createQuoteSchema = z.object({
  client: z.object({
    name: z.string().min(1, 'Client name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number is required'),
    company: z.string().optional(),
  }),

  engagementModel: z.enum(['project', 'dedicated']),
  userProfile: z.enum(['tech', 'non-tech']),

  inputs: z.object({
    goals: z.string().min(5, 'Goals must be at least 5 characters long'),
    buildTypes: z.array(z.enum(buildOptions)).min(1),
    artifacts: z.array(z.string().url()).max(5),

    features: z.array(
      z.object({
        key: z.string(),
        depth: z.enum(['basic', 'standard', 'advanced']),
      })
    ),

    scaleBand: z.enum(['10k-100k', '100k-1m', '>1m']),
    a11y: z.boolean(),
    i18n: z.boolean(),
    perf: z.boolean(),
    compliance: z.enum(['none', 'moderate', 'high']),

    techPrefs: z.object({
      frontend: z.string().min(1),
      backend: z.string().min(1),
      db: z.string().min(1),
      cloud: z.string().min(1),
    }),

    budget: z.object({
      type: z.enum(['fixed', 'flexible', 'unknown']),
      amount: z.number().nonnegative(),
    }),

    timeline: z
      .object({
        type: z.enum(['fixed', 'flexible', 'quality-first'], {
          message: 'Timeline type is required',
        }),

        deadline: z.string().datetime().optional(),
      })
      .superRefine((data, ctx) => {
        if (data.type === 'fixed') {
          if (!data.deadline) {
            ctx.addIssue({
              path: ['deadline'],
              code: z.ZodIssueCode.custom,
              message: 'Deadline is required when timeline type is fixed',
            });
            return;
          }

          const parsed = new Date(data.deadline);
          if (isNaN(parsed.getTime())) {
            ctx.addIssue({
              path: ['deadline'],
              code: z.ZodIssueCode.custom,
              message: 'Deadline must be a valid ISO date',
            });
          }
        }
      })
      .transform((data) => ({
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : null,
      })),
    priority: z.enum(['cost', 'speed', 'quality']),
    supportMonths: z.number().min(0),

    integrations: z.array(z.string()),
    likeExistingProduct: z.boolean(),
    detailedDocs: z.boolean(),
    includesAI: z.boolean(),
    aiNovelty: z.enum(['low', 'medium', 'high']),
  }),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
