import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

export function multerErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Multer built-in errors
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          code: 'TOO_MANY_FILES',
          message: 'You can upload up to 10 files only.',
        });

      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds 5MB.',
        });

      default:
        return res.status(400).json({
          success: false,
          code: err.code,
          message: err.message,
        });
    }
  }

  // Custom validation errors
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_FILE_TYPE',
      message: 'Only PDF, DOCX, and Image files are allowed.',
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      code: 'FILE_TOO_LARGE',
      message: 'File size must be less than 5MB',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      code: 'TOO_MANY_FILES',
      message: 'Maximum 10 files allowed',
    });
  }

  next(err);
}
