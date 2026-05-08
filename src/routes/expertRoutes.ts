// Expert routes — list and detail endpoints
// Validation schemas for query strings live here (route-local concerns)

import { Router } from "express";
import { z } from "zod";
import { listExperts, getExpert } from "../controllers/expertController.js";
import { validate } from "../middleware/validate.js";

// Coerce-and-validate query params: page/limit come in as strings, Zod converts to numbers
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  category: z.enum(["Tech", "Finance", "Health", "Legal", "Marketing", "Other"]).optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

export const expertRoutes = Router();

expertRoutes.get("/", validate(listQuerySchema, "query"), listExperts);
expertRoutes.get("/:id", getExpert);
