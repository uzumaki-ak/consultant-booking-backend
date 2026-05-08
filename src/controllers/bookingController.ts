// Booking controller — the critical race-condition-safe path
// Uses three layers of defense:
//   1. Idempotency key short-circuit (catches client retries)
//   2. Atomic findOneAndUpdate on the slot (no read-modify-write window)
//   3. MongoDB transaction wrapping slot-update + booking-insert (rollback on failure)
//   4. Unique compound index on Booking { expertId, date, timeSlot } as final DB-level guarantee

import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Expert } from "../models/Expert.js";
import { Booking } from "../models/Booking.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { logger } from "../utils/logger.js";
import { getIO } from "../config/socket.js";
import type { ApiResponse } from "../types/index.js";

// Zod schema for POST /bookings — exported so route can use it via validate() middleware
export const createBookingSchema = z.object({
  expertId: z.string().refine(mongoose.isValidObjectId, "Invalid expertId"),
  idempotencyKey: z.string().uuid("idempotencyKey must be a valid UUID"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s\-()]{7,20}$/, "Invalid phone number"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  timeSlot: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM 24-hour"),
  notes: z.string().max(500).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed"]),
});

// POST /bookings — create a booking with race-condition-safe slot reservation
export const createBooking = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as z.infer<typeof createBookingSchema>;

  // Layer 1: idempotency short-circuit — if the same key was used before, return that booking
  // This catches client retries before we even touch the DB write path
  const existing = await Booking.findOne({ idempotencyKey: data.idempotencyKey }).lean();
  if (existing) {
    const response: ApiResponse = {
      success: true,
      data: existing,
      message: "Booking already exists (idempotent retry)",
    };
    res.status(200).json(response);
    return;
  }

  const session = await mongoose.startSession();
  try {
    let bookingDoc: Awaited<ReturnType<typeof Booking.create>>[number] | null = null;

    // Layer 3: transaction — slot update and booking insert succeed/fail as one unit
    await session.withTransaction(async () => {
      // Layer 2: atomic check + update on the slot subdocument
      // The filter requires isBooked: false, so two concurrent requests cannot both succeed.
      // The matched slot's isBooked is flipped in the same operation — no read/write window.
      const updatedExpert = await Expert.findOneAndUpdate(
        {
          _id: data.expertId,
          availableSlots: {
            $elemMatch: {
              date: data.date,
              time: data.timeSlot,
              isBooked: false,
            },
          },
        },
        { $set: { "availableSlots.$.isBooked": true } },
        { session, new: true }
      );

      if (!updatedExpert) {
        // Either expert doesn't exist, slot doesn't exist, or slot is already booked
        // We don't distinguish here — exposing existence of slots could enable enumeration
        throw ApiError.conflict("Slot is unavailable or already booked");
      }

      // Layer 4: unique index on { expertId, date, timeSlot } catches any race that slips through
      const created = await Booking.create(
        [
          {
            expertId: data.expertId,
            idempotencyKey: data.idempotencyKey,
            name: data.name,
            email: data.email,
            phone: data.phone,
            date: data.date,
            timeSlot: data.timeSlot,
            notes: data.notes,
            status: "pending",
          },
        ],
        { session }
      );
      bookingDoc = created[0] ?? null;
    });

    if (!bookingDoc) {
      throw ApiError.internal("Booking creation failed unexpectedly");
    }

    // Broadcast to everyone watching this expert's detail page in real time
    // Emit AFTER the transaction commits — never emit on uncommitted state
    try {
      const io = getIO();
      io.to(`expert:${data.expertId}`).emit("slot:booked", {
        expertId: data.expertId,
        date: data.date,
        timeSlot: data.timeSlot,
      });
    } catch (emitErr) {
      // Socket failure must not break the HTTP response — log and move on
      logger.warn({ emitErr }, "Failed to emit slot:booked event");
    }

    const response: ApiResponse = {
      success: true,
      data: bookingDoc,
      message: "Booking created successfully",
    };
    res.status(201).json(response);
  } finally {
    await session.endSession();
  }
});

// PATCH /bookings/:id/status — staff endpoint to advance booking lifecycle
export const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest("Invalid booking id");
  }

  const { status } = req.body as z.infer<typeof updateStatusSchema>;

  const updated = await Booking.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true, runValidators: true }
  );
  if (!updated) {
    throw ApiError.notFound("Booking not found");
  }

  const response: ApiResponse = {
    success: true,
    data: updated,
    message: "Booking status updated",
  };
  res.status(200).json(response);
});

// GET /bookings?email= — user-facing "my bookings" lookup
export const listBookingsByEmail = catchAsync(async (req: Request, res: Response) => {
  const email = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";
  if (!email) {
    throw ApiError.badRequest("email query parameter is required");
  }

  // Lean for read-only payload — no Mongoose document overhead
  const bookings = await Booking.find({ email })
    .populate("expertId", "name category avatar")
    .sort({ createdAt: -1 })
    .lean();

  const response: ApiResponse = { success: true, data: bookings };
  res.status(200).json(response);
});
