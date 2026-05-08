// Expert model — represents a bookable expert with their available time slots
// availableSlots.isBooked is a denormalized cache; the Booking document is the source of truth.
// They stay in sync only via the transaction in bookingController.createBooking.

import mongoose, { Schema, model } from "mongoose";
import type { IExpertDocument, ISlot } from "../types/index.js";

const SlotSchema = new Schema<ISlot>(
  {
    date: {
      type: String,
      required: true,
      // YYYY-MM-DD UTC — stored as string to avoid timezone parsing surprises
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    time: {
      type: String,
      required: true,
      // HH:MM 24-hour UTC
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM 24-hour format"],
    },
    isBooked: { type: Boolean, default: false },
  },
  { _id: true }
);

const ExpertSchema = new Schema<IExpertDocument>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Tech", "Finance", "Health", "Legal", "Marketing", "Other"],
    },
    experience: { type: Number, required: true, min: 0 },
    rating: { type: Number, required: true, min: 0, max: 5, default: 0 },
    bio: { type: String },
    avatar: { type: String },
    availableSlots: { type: [SlotSchema], default: [] },
  },
  { timestamps: true }
);

// Speeds up slot-availability queries when filtering by date+time
ExpertSchema.index({ "availableSlots.date": 1, "availableSlots.time": 1 });
// Speeds up category filter on listing endpoint
ExpertSchema.index({ category: 1 });
// Text index supports the search-by-name query without a regex full-collection scan
ExpertSchema.index({ name: "text" });

export const Expert = model<IExpertDocument>("Expert", ExpertSchema);
