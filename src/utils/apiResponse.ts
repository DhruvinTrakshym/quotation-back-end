import { Response } from 'express';

export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  fields?: Record<string, string>; // ✅ key-value field errors
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
): Response<ApiSuccessResponse<T>> => {
  return res.status(statusCode).json({
    statusCode,
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  code: string,
  message: string,
  fields?: Record<string, string>,
  statusCode = 400
): Response<ApiErrorResponse> => {
  return res.status(statusCode).json({
    statusCode,
    success: false,
    code,
    message,
    ...(fields && { fields }), // only include if exists
  });
};
