// Booking model — source of truth for booking state
// The unique compound index { expertId, date, timeSlot } is the final defense against double bookings:
// even if two requests slip past application-level checks, the second insert hits E11000 and fails.

import { Schema, model } from "mongoose";
import type { IBookingDocument } from "../types/index.js";

const BookingSchema = new Schema<IBookingDocument>(
  {
    expertId: {
      type: Schema.Types.ObjectId,
      ref: "Expert",
      required: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      // Client-generated UUID — protects against duplicate bookings from request retries
    },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"],
    },
    phone: { type: String, required: true, trim: true },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    timeSlot: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM 24-hour format"],
    },
    notes: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Database-level double-booking prevention — the last line of defense
BookingSchema.index({ expertId: 1, date: 1, timeSlot: 1 }, { unique: true });
// Idempotency — same key can never create two bookings
BookingSchema.index({ idempotencyKey: 1 }, { unique: true });
// Fast lookup for "my bookings" by email
BookingSchema.index({ email: 1 });
// Fast filter when staff queries pending/confirmed/completed
BookingSchema.index({ status: 1 });
// Recent-bookings sort for admin dashboards
BookingSchema.index({ createdAt: -1 });

export const Booking = model<IBookingDocument>("Booking", BookingSchema);
