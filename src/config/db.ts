// MongoDB connection — uses Mongoose with sensible production defaults
// Crashes the process on failure so the orchestrator (PM2/Docker/Render) can restart it

import mongoose from "mongoose";
import { configureMongoDns } from "./dns.js";
import { logger } from "../utils/logger.js";

configureMongoDns();

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  try {
    // strictQuery prevents silent typos in query filters from matching everything
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    logger.info("MongoDB connected");
  } catch (err) {
    logger.error({ err }, "MongoDB connection failed");
    // Fail fast — better than running with a broken DB connection
    process.exit(1);
  }

  // Surface runtime DB errors to the logger so we know about them in production
  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB runtime error");
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });
};
