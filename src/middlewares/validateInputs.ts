import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { quoteInputsSchema } from '../validators/quoteInputsValidator';
import { sendError } from '../utils/apiResponse';

export const validateQuoteInputs = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inputs } = req.body;
    console.log('🚀 ~ validateQuoteInputs ~ inputs:', inputs);

    if (!inputs || typeof inputs !== 'object') {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid or missing inputs', undefined, 400);
    }

    quoteInputsSchema.partial().parse(inputs);

    next();
  } catch (err: unknown) {
    console.log('🚀 ~ validateQuoteInputs ~ err:', err);
    if (err instanceof ZodError) {
      const formatted = (err.issues as ZodIssue[]).map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      const fieldErrors: Record<string, string> = {};
      formatted.forEach((f) => {
        fieldErrors[f.field] = f.message;
      });

      return sendError(res, 'VALIDATION_ERROR', 'Input validation failed', fieldErrors, 400);
    }

    const message = err instanceof Error ? err.message : 'Unexpected server error';
    return sendError(res, 'SERVER_ERROR', message, undefined, 500);
  }
};
