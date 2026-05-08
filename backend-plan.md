# Expert Session Booking System — Backend Plan

## Overview

A real-time expert session booking backend built with Node.js + Express + MongoDB.
Core challenges: double-booking prevention with race condition handling + real-time slot updates via Socket.io.

---

## Tech Stack (Latest as of May 2026)

| Package | Version | Purpose |
|---|---|---|
| Node.js | v22 LTS | Runtime |
| Express | v5.x | Web framework |
| Mongoose | v8.x | MongoDB ODM |
| Socket.io | v4.x | Real-time communication |
| Zod | v3.x | Schema validation (modern, type-safe) |
| helmet | v8.x | HTTP security headers (15+ headers) |
| cors | v2.x | Cross-origin resource sharing |
| express-rate-limit | v8.x | IP-based API rate limiting |
| dotenv | v16.x | Environment variable management |
| pino | v9.x | Fast structured logging (preferred over winston in 2026) |
| pino-pretty | v13.x | Dev-friendly log formatting |
| http-status-codes | v2.x | Semantic HTTP status constants |
| morgan | v1.x | HTTP request logger middleware |
| typescript | v5.x | TypeScript compiler |
| tsx | v4.x | Run `.ts` files directly (replaces ts-node — faster, no config needed) |
| @types/node | v22.x | Node.js type definitions |
| @types/express | v5.x | Express type definitions |
| @types/cors | v2.x | CORS type definitions |
| @types/morgan | v1.x | Morgan type definitions |
| nodemon | v3.x | Dev auto-restart (used with tsx) |

> Why Zod over Joi? Zod is TypeScript-first — schemas double as types, zero duplication, full inference.
> Why Pino over Winston? Pino is 5x faster, JSON-structured by default — better for production observability.
> Why tsx over ts-node? tsx uses esbuild under the hood — starts instantly, no tsconfig path issues, just works.
> Socket.io v4 ships with its own types — no `@types/socket.io` needed.

---

## Folder Structure

```
expert-booking-backend/
├── src/
│   ├── config/
│   │   ├── db.ts              # MongoDB connection
│   │   └── socket.ts          # Socket.io initialization & event handlers
│   ├── controllers/
│   │   ├── expertController.ts
│   │   └── bookingController.ts
│   ├── models/
│   │   ├── Expert.ts
│   │   └── Booking.ts
│   ├── routes/
│   │   ├── expertRoutes.ts
│   │   └── bookingRoutes.ts
│   ├── middleware/
│   │   ├── errorHandler.ts    # Global error handler
│   │   ├── validate.ts        # Zod validation middleware factory
│   │   └── rateLimiter.ts     # Per-route rate limiters
│   ├── utils/
│   │   ├── ApiError.ts        # Custom error class
│   │   └── logger.ts          # Pino logger instance
│   ├── types/
│   │   └── index.ts           # Shared TypeScript interfaces & types
│   └── app.ts                 # Express app setup (no listen here)
├── .env
├── .env.example
├── .gitignore
├── tsconfig.json
├── package.json
└── server.ts                  # Entry point (http server + socket.io attach)
```

---

## Data Models

### Expert Model (`src/models/Expert.ts`)

```
Expert {
  name:        String (required, trimmed)
  category:    String (required, enum: ["Tech", "Finance", "Health", "Legal", "Marketing", "Other"])
  experience:  Number (years, required, min: 0)
  rating:      Number (required, min: 0, max: 5, default: 0)
  bio:         String
  avatar:      String (URL)
  availableSlots: [
    {
      date:     String (YYYY-MM-DD, UTC, required)
      time:     String (HH:MM, UTC, required)
      isBooked: Boolean (default: false)
    }
  ]
  createdAt, updatedAt (timestamps: true)
}
```

> ⚠ `availableSlots.isBooked` is a **denormalized cache** — the Booking document is the source of truth.
> These two must stay in sync via the MongoDB transaction in Layer 3. If a transaction aborts, `isBooked`
> remains `false` and no Booking document exists — consistent. Never update `isBooked` outside the transaction.

**Indexes:**
- Compound on `{ "availableSlots.date": 1, "availableSlots.time": 1 }` — fast slot queries

### Booking Model (`src/models/Booking.ts`)

```
Booking {
  expertId:        ObjectId (ref: Expert, required)
  idempotencyKey:  String (required, unique) — client-generated UUID, prevents duplicate retries
  name:            String (required, trimmed)
  email:           String (required, lowercase, trimmed)
  phone:           String (required)
  date:            String (YYYY-MM-DD, UTC, required)
  timeSlot:        String (HH:MM, UTC, required)
  notes:           String (optional, max 500 chars)
  status:          String (enum: ["pending", "confirmed", "completed"], default: "pending")
  createdAt, updatedAt (timestamps: true)
}
```

> All date/time values stored as UTC strings. Clients must send UTC. This prevents timezone comparison bugs.

**Indexes:**
- Unique compound on `{ expertId, date, timeSlot }` — DB-level double booking prevention (last line of defense)
- Unique on `{ idempotencyKey }` — prevents duplicate bookings from client retries
- On `{ email: 1 }` — fast lookup for GET /bookings?email=
- On `{ status: 1 }` — fast filtering by status
- On `{ createdAt: -1 }` — fast sorting for recent bookings

---

## API Endpoints

### Experts

| Method | Route | Description |
|---|---|---|
| GET | `/api/v1/experts` | List experts (pagination + filter) |
| GET | `/api/v1/experts/:id` | Get single expert with slots |

**GET /experts query params:**
- `page` (default: 1)
- `limit` (default: 10, max: 50)
- `category` (filter by category)
- `search` (search by name, uses regex or text index)

**Response format (paginated):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Bookings

| Method | Route | Description |
|---|---|---|
| POST | `/api/v1/bookings` | Create booking (requires `idempotencyKey` in body) |
| PATCH | `/api/v1/bookings/:id/status` | Update booking status |
| GET | `/api/v1/bookings?email=` | Get bookings by email |

> **Idempotency:** Client generates a UUID before sending POST /bookings. If the request times out and is retried with the same UUID, the server returns the existing booking instead of creating a duplicate. Stored as a unique index — second insert with same key hits E11000 → return existing booking with 200.

---

## Double Booking Prevention (Race Condition Strategy)

This is the critical requirement. We use a **layered defense**:

### Layer 1 — Unique Index (Database Level)
```ts
BookingSchema.index({ expertId: 1, date: 1, timeSlot: 1 }, { unique: true })
```
Even if two requests slip through application logic simultaneously, MongoDB will reject the second insert with a duplicate key error (E11000). This is the final guarantee.

### Layer 2 — Atomic findOneAndUpdate (Application Level)
When booking, we atomically check + update the slot in ONE operation:
```
findOneAndUpdate(
  filter: { _id: expertId, "availableSlots.date": date, "availableSlots.time": timeSlot, "availableSlots.isBooked": false },
  update: { $set: { "availableSlots.$.isBooked": true } },
  options: { new: true }
)
```
If `isBooked` is already `true`, the filter won't match → update returns `null` → we throw a 409 Conflict error. The check and update happen as a **single atomic operation** — no window for a race condition.

### Layer 3 — MongoDB Session Transaction (For cross-document safety)
Wrap the slot update + booking insert in a MongoDB session transaction so both succeed or both fail together. This prevents orphaned slot locks.

### Flow:
```
Request comes in
  → Validate with Zod
  → Open MongoDB session
  → Atomic findOneAndUpdate on Expert (mark slot booked)
    → null returned? → throw 409 "Slot already booked"
  → Insert Booking document
  → Commit transaction
  → Emit Socket.io event: "slot:booked" with { expertId, date, timeSlot }
  → Return 201 success
```

---

## Real-Time Slot Updates (Socket.io)

### Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join:expert` | Client → Server | `{ expertId }` | Subscribe to an expert's slot updates |
| `leave:expert` | Client → Server | `{ expertId }` | Unsubscribe |
| `slot:booked` | Server → Client | `{ expertId, date, timeSlot }` | A slot was just booked |

### Room Strategy
Each expert has their own Socket.io room: `expert:{expertId}`.
When a booking is created, emit to that room so all connected clients (anyone viewing that expert's detail page) instantly see the slot become unavailable.

```
io.to(`expert:${expertId}`).emit("slot:booked", { expertId, date, timeSlot })
```

---

## Security Practices

| Practice | Implementation |
|---|---|
| HTTP Headers | `helmet()` — sets CSP, HSTS, X-Frame-Options, etc. |
| CORS | `cors({ origin: process.env.ALLOWED_ORIGINS })` |
| Rate Limiting | General: 100 req/15min per IP. Booking endpoint: 10 req/15min per IP |
| Input Validation | Zod schemas on every POST/PATCH route |
| NoSQL Injection | Mongoose sanitizes by default; avoid `req.body` directly in queries |
| Error Leakage | Never expose stack traces or internal messages in production |
| Environment Vars | All secrets in `.env`, never hardcoded |

---

## Error Handling Strategy

### Custom ApiError class
```
ApiError extends Error {
  statusCode: number
  message: string
  isOperational: boolean  // true = known error, false = unexpected/crash
}
```

### Global error handler middleware
- Catches all errors thrown from controllers via `next(error)`
- Distinguishes operational errors (validation, not found, conflict) vs programmer errors (crashes)
- In production: returns clean JSON `{ success: false, message: "..." }`
- In development: also returns `stack` trace
- Handles Mongoose errors: `CastError` → 400, `ValidationError` → 400, duplicate key `E11000` → 409

### HTTP Status Codes used
| Code | When |
|---|---|
| 200 | Success (GET, PATCH) |
| 201 | Created (POST booking) |
| 400 | Validation error |
| 404 | Expert/booking not found |
| 409 | Slot already booked (conflict) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Rate Limiting Plan

```
General limiter:    100 requests / 15 minutes / IP  → applied globally
Booking limiter:    10  requests / 15 minutes / IP  → POST /bookings only
Status limiter:     30  requests / 15 minutes / IP  → PATCH /bookings/:id/status
```

---

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/expert-booking
# or MongoDB Atlas URI

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## Seed Data Plan

Create a `src/config/seed.ts` script to populate MongoDB with:
- 15-20 expert documents across all categories
- Each expert has 20-30 time slots across the next 7 days
- Run with `npx tsx src/config/seed.ts`

---

## Code Style / Dev Practices

- Every function has a one-line comment explaining WHY (not what)
- Controllers use `async/await` wrapped in a `catchAsync` utility (avoids try/catch repetition)
- All routes versioned under `/api/v1/`
- No business logic in routes — only in controllers
- Models have no methods — pure schema definitions
- Consistent response shape: `{ success, data, message, pagination? }`

---

## Build Order

1. `package.json` + install all deps
2. `tsconfig.json`
3. `.env` + `.env.example` + `.gitignore`
4. `src/types/index.ts` — shared interfaces (IExpert, IBooking, ISlot, ApiResponse)
5. `src/utils/ApiError.ts` + `src/utils/logger.ts`
6. `src/config/db.ts`
7. `src/models/Expert.ts` + `src/models/Booking.ts`
8. `src/middleware/validate.ts` + `src/middleware/errorHandler.ts` + `src/middleware/rateLimiter.ts`
9. `src/controllers/expertController.ts`
10. `src/controllers/bookingController.ts` (with race condition logic)
11. `src/routes/expertRoutes.ts` + `src/routes/bookingRoutes.ts`
12. `src/config/socket.ts`
13. `src/app.ts`
14. `server.ts`
15. `src/config/seed.ts`
16. Test all endpoints manually

---

## TypeScript Config Notes

```json
// tsconfig.json key settings
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**Dev script:** `nodemon --exec tsx src/server.ts`  
**Build script:** `tsc` → outputs to `/dist`  
**Start script:** `node dist/server.js`

---

## Other Notes

- Express v5 has native async error handling — no need for `express-async-errors` package
- **Transactions require a replica set** — a plain standalone local MongoDB will NOT work for Layer 3. Use MongoDB Atlas free tier (M0 is a replica set by default). Do not use `mongodb://localhost` without setting up a local replica set first.
- Socket.io v4 ships its own types — no `@types/socket.io` needed
- Socket.io CORS must match Express CORS config exactly
- `src/types/index.ts` keeps interfaces in one place — Mongoose documents extend these
- All date/time stored and compared in **UTC** — document this in `.env.example` for the frontend team
- `idempotencyKey` should be a UUID generated client-side (frontend uses `crypto.randomUUID()`) and sent in the POST /bookings body — server never generates it

