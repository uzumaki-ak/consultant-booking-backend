// Pino logger — JSON structured logs in prod, pretty-printed in dev
// Pino is 5x faster than Winston and is the industry standard in 2026

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  // Pretty-print only in development — JSON in production for log aggregators
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});
