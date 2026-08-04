import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  console.error(`[Error] ${statusCode}: ${message}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

export function createError(statusCode: number, message: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  return error;
}
