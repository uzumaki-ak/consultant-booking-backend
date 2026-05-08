// Rate limiters — IP-based throttling per route
// Booking is most sensitive (race condition target) so it gets the strictest limit

import rateLimit from "express-rate-limit";

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);

// 100 req / 15 min — generous default for read-heavy traffic on listing & detail endpoints
export const generalLimiter = rateLimit({
  windowMs,
  max: Number(process.env.RATE_LIMIT_MAX ?? 100),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});

// 10 req / 15 min — tight to make brute-force booking attacks expensive
export const bookingLimiter = rateLimit({
  windowMs,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many booking attempts, please try again later" },
});

// 30 req / 15 min — for status updates, mostly admin/staff use
export const statusLimiter = rateLimit({
  windowMs,
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many status update requests" },
});
