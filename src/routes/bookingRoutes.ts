// Booking routes — write-heavy endpoints get stricter rate limits
// Schemas come from the controller because they describe the request payload contract

import { Router } from "express";
import {
  createBooking,
  createBookingSchema,
  updateBookingStatus,
  updateStatusSchema,
  listBookingsByEmail,
} from "../controllers/bookingController.js";
import { validate } from "../middleware/validate.js";
import { bookingLimiter, statusLimiter } from "../middleware/rateLimiter.js";
import { z } from "zod";

const listByEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
});

export const bookingRoutes = Router();

bookingRoutes.post("/", bookingLimiter, validate(createBookingSchema), createBooking);
bookingRoutes.patch(
  "/:id/status",
  statusLimiter,
  validate(updateStatusSchema),
  updateBookingStatus
);
bookingRoutes.get("/", validate(listByEmailSchema, "query"), listBookingsByEmail);
