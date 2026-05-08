// Express app factory — pure setup, no listening
// server.ts wraps this with an HTTP server so Socket.io can attach to the same port

import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { expertRoutes } from "./routes/expertRoutes.js";
import { bookingRoutes } from "./routes/bookingRoutes.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export const buildApp = (allowedOrigins: string[]): Express => {
  const app = express();

  // Security headers — sets CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.
  app.use(helmet());

  // Origins must match Socket.io CORS config exactly or the WS upgrade will fail
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );

  // Body parsers with conservative size limits — booking payloads are tiny
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  // Request logging — minimal in prod, dev-friendly format locally
  if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // Global rate limit — applies to every request
  app.use(generalLimiter);

  // Liveness probe — render/k8s/uptime monitors hit this; never DB-touching
  app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/v1/experts", expertRoutes);
  app.use("/api/v1/bookings", bookingRoutes);

  // 404 must come AFTER all valid routes
  app.use(notFoundHandler);
  // Error handler must be the LAST middleware
  app.use(errorHandler);

  return app;
};
