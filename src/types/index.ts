// Shared interfaces and types — used across models, controllers, and socket handlers
// Centralizing here prevents type duplication and keeps Mongoose schemas in sync with API contracts

import type { Document, Types } from "mongoose";

export type ExpertCategory =
  | "Tech"
  | "Finance"
  | "Health"
  | "Legal"
  | "Marketing"
  | "Other";

export type BookingStatus = "pending" | "confirmed" | "completed";

// Slot subdocument — denormalized cache; Booking document is source of truth
export interface ISlot {
  date: string; // YYYY-MM-DD UTC
  time: string; // HH:MM UTC (24-hour)
  isBooked: boolean;
}

export interface IExpert {
  name: string;
  category: ExpertCategory;
  experience: number;
  rating: number;
  bio?: string;
  avatar?: string;
  availableSlots: ISlot[];
}

export interface IExpertDocument extends IExpert, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBooking {
  expertId: Types.ObjectId;
  idempotencyKey: string;
  name: string;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD UTC
  timeSlot: string; // HH:MM UTC
  notes?: string;
  status: BookingStatus;
}

export interface IBookingDocument extends IBooking, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Standard API response envelope — every endpoint returns this shape
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Socket.io event payloads — typed both ends (server emits, client listens)
export interface ServerToClientEvents {
  "slot:booked": (payload: { expertId: string; date: string; timeSlot: string }) => void;
}

export interface ClientToServerEvents {
  "join:expert": (expertId: string) => void;
  "leave:expert": (expertId: string) => void;
}
