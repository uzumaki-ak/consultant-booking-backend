// Expert controller — read endpoints for listing and viewing experts
// All write paths for slots happen via bookingController to keep the cache in sync

import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Expert } from "../models/Expert.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import type { ApiResponse, PaginationMeta } from "../types/index.js";

// GET /experts — paginated list with optional category filter and name search
export const listExperts = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;

  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  // Use case-insensitive regex for partial-match search; small dataset makes this acceptable
  if (search) filter.name = { $regex: search, $options: "i" };

  // Run count and find in parallel — single round trip latency instead of two
  const [total, experts] = await Promise.all([
    Expert.countDocuments(filter),
    Expert.find(filter)
      .select("-availableSlots") // listing doesn't need slots — keeps payload small
      .sort({ rating: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pagination: PaginationMeta = {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  const response: ApiResponse = { success: true, data: experts, pagination };
  res.status(200).json(response);
});

// GET /experts/:id — full expert document including all slots
export const getExpert = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest("Invalid expert id");
  }

  const expert = await Expert.findById(id).lean();
  if (!expert) {
    throw ApiError.notFound("Expert not found");
  }

  const response: ApiResponse = { success: true, data: expert };
  res.status(200).json(response);
});
