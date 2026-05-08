// Zod validation middleware factory — generates a typed validator for any route
// Validates body / query / params against a Zod schema and writes parsed data back to req

import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError.js";

type Source = "body" | "query" | "params";

export const validate =
  (schema: ZodSchema, source: Source = "body") =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Replace the original payload with the parsed (and coerced) version
      const parsed = schema.parse(req[source]);
      // Express 5: req.query is a getter — use Object.defineProperty to overwrite cleanly
      Object.defineProperty(req, source, { value: parsed, writable: true });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors
          .map((e) => `${e.path.join(".") || "field"}: ${e.message}`)
          .join("; ");
        return next(ApiError.badRequest(messages));
      }
      next(err);
    }
  };
