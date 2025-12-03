import { ZodError, ZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

export const validateRequest = (schema: ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Convert Zod issues to { fieldName: message }
        const fieldErrors: Record<string, string> = {};
        for (const issue of err.issues) {
          fieldErrors[issue.path.join('.')] = issue.message;
        }

        // Pick first message for global display
        const firstMessage = Object.values(fieldErrors)[0] || 'Validation failed';

        return sendError(res, 'VALIDATION_ERROR', firstMessage, fieldErrors, 400);
      }

      // fallback for unknown errors
      const message = err instanceof Error ? err.message : 'Unexpected validation error';

      return sendError(res, 'UNKNOWN_ERROR', message, undefined, 500);
    }
  };
};
