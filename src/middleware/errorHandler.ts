// Global error handler — converts every thrown error into a consistent JSON response
// Distinguishes operational errors (safe to expose) from programmer errors (hide stack in prod)

import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import type { ApiResponse } from "../types/index.js";

interface MongoDuplicateKeyError extends Error {
  code: number;
  keyValue?: Record<string, unknown>;
}

const isMongoDuplicateKey = (err: unknown): err is MongoDuplicateKeyError =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  (err as { code: unknown }).code === 11000;

// 404 handler — registered after all routes so unmatched paths land here
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Internal server error";
  let isOperational = false;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
    isOperational = true;
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    isOperational = true;
  } else if (isMongoDuplicateKey(err)) {
    statusCode = 409;
    const fields = err.keyValue ? Object.keys(err.keyValue).join(", ") : "field";
    message = `Duplicate value for ${fields}`;
    isOperational = true;
  }

  // Log full error for unexpected failures; operational errors logged at warn level only
  if (isOperational) {
    logger.warn({ statusCode, message, url: req.originalUrl }, "Operational error");
  } else {
    logger.error({ err, url: req.originalUrl }, "Unexpected error");
  }

  const response: ApiResponse = { success: false, message };

  // Stack traces only in dev — production responses must never leak internals
  if (process.env.NODE_ENV !== "production") {
    (response as ApiResponse & { stack?: string }).stack = err.stack;
  }

  res.status(statusCode).json(response);
};
