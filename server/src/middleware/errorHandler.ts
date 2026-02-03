import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, string[]>;
}

/**
 * Create a standardized error
 */
export function createError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: Record<string, string[]>
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Format Zod validation errors
 */
function formatZodError(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }
  
  return details;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: formatZodError(error),
    });
    return;
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        res.status(409).json({
          error: 'Resource already exists',
          code: 'DUPLICATE_ENTRY',
          details: { field: (error.meta?.target as string[]) || [] },
        });
        return;
      case 'P2025':
        res.status(404).json({
          error: 'Resource not found',
          code: 'NOT_FOUND',
        });
        return;
      default:
        res.status(500).json({
          error: 'Database error',
          code: 'DATABASE_ERROR',
        });
        return;
    }
  }

  // App errors with status codes
  const appError = error as AppError;
  if (appError.statusCode) {
    res.status(appError.statusCode).json({
      error: appError.message,
      code: appError.code,
      details: appError.details,
    });
    return;
  }

  // Default 500 error
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    code: 'INTERNAL_ERROR',
  });
}
