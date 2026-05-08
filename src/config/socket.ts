// Socket.io setup — singleton instance attached to the HTTP server
// initSocket() is called once from server.ts; getIO() returns the same instance everywhere
// Rooms are per-expert ("expert:{id}") so emits only reach clients viewing that expert

import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { logger } from "../utils/logger.js";
import type { ServerToClientEvents, ClientToServerEvents } from "../types/index.js";

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;

export const initSocket = (
  httpServer: HttpServer,
  allowedOrigins: string[]
): SocketIOServer<ClientToServerEvents, ServerToClientEvents> => {
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.debug({ socketId: socket.id }, "Socket connected");

    // Client subscribes when opening an expert detail page
    socket.on("join:expert", (expertId) => {
      if (typeof expertId !== "string" || !expertId) return;
      socket.join(`expert:${expertId}`);
      logger.debug({ socketId: socket.id, expertId }, "Joined expert room");
    });

    // Client unsubscribes when navigating away — keeps rooms tidy
    socket.on("leave:expert", (expertId) => {
      if (typeof expertId !== "string" || !expertId) return;
      socket.leave(`expert:${expertId}`);
    });

    socket.on("disconnect", (reason) => {
      logger.debug({ socketId: socket.id, reason }, "Socket disconnected");
    });
  });

  return io;
};

// Throws if called before initSocket — prevents silent no-op emits in controllers
export const getIO = (): SocketIOServer<ClientToServerEvents, ServerToClientEvents> => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket() first.");
  }
  return io;
};
