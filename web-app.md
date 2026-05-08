# Expert Booking — Web App Plan (React Frontend)

> Companion to `backend-plan.md`. This document defines the React web frontend that consumes the backend APIs and Socket.io events.

---

## Design Philosophy

A **BMW M-inspired industrial-editorial system** translated to a booking product. The cars are replaced by experts; the motorsport gravity is preserved through:

- Pure black canvas (`#000`) with white type — no light mode
- UPPERCASE display headlines, weight 700, BMW Type Next Latin (or **Inter** as fallback)
- Light body type (300) — the heavy/light contrast is the editorial signature
- M tricolor stripe (`#0066b1` → `#1c69d4` → `#e22718`) as 4px dividers and brand accents only — never as buttons or fills
- Border radius 0px everywhere except circular icon buttons
- Full-bleed expert photography on hero/detail screens
- 1px hairline borders (`#3c3c3c`) for cards and dividers
- 96px between major bands
- Cinematic GSAP scroll-scrubbed animations + Framer Motion for component-level state transitions

The reference design folder at `C:\Users\asnoi\Downloads\design` shapes the motion language: dark industrial, masked text reveals, scroll-scrubbed images, pinned horizontal tracks, restrained 3D tilt — never decorative sparkle, never cheap glitch.

---

## Tech Stack (Latest as of May 2026)

### Core
| Package | Version | Purpose |
|---|---|---|
| React | 19.x | UI library — concurrent rendering, automatic batching, new `use` hook |
| Vite | 6.x | Build tool — instant HMR, fast TS compilation via SWC |
| TypeScript | 5.7.x | Type safety |
| React Router | 7.x | Routing — declarative, data router APIs |

### Styling
| Package | Version | Purpose |
|---|---|---|
| Tailwind CSS | 4.x | Utility-first CSS — Vite plugin (no PostCSS config), theme via CSS vars |
| @tailwindcss/vite | 4.x | Official Vite integration |
| tailwind-merge | 2.x | Safely merge conflicting Tailwind classes |
| class-variance-authority (cva) | 0.7.x | Type-safe component variants |
| clsx | 2.x | Conditional class strings |

### Data & State
| Package | Version | Purpose |
|---|---|---|
| @tanstack/react-query | 5.x | Server state — caching, background refetch, optimistic updates |
| axios | 1.x | HTTP client — interceptors for auth/error |
| zustand | 5.x | Tiny client state store — for UI state only (filters, modal open) |

### Forms & Validation
| Package | Version | Purpose |
|---|---|---|
| react-hook-form | 7.x | Form state — uncontrolled, performant |
| @hookform/resolvers | 3.x | Zod adapter for react-hook-form |
| zod | 3.x | Schema validation — same package as backend, schemas can be shared |

### Animation
| Package | Version | Purpose |
|---|---|---|
| gsap | 3.x | Timeline-based animation, ScrollTrigger, SplitText |
| @gsap/react | 2.x | `useGSAP` hook — automatic cleanup, scoped contexts |
| motion | 12.x | Framer Motion (now `motion/react`) — declarative React animations, layout animations, AnimatePresence |
| lenis | 1.x | Smooth scroll — syncs with GSAP ticker |

### Real-time
| Package | Version | Purpose |
|---|---|---|
| socket.io-client | 4.x | Socket.io client — matches backend version |

### UI Primitives & UX
| Package | Version | Purpose |
|---|---|---|
| @radix-ui/react-dialog | 1.x | Accessible modal primitives |
| @radix-ui/react-tabs | 1.x | Accessible tab primitives |
| @radix-ui/react-select | 2.x | Accessible select primitives |
| sonner | 1.x | Toast notifications |
| lucide-react | 0.4xx | Icon set — clean, lightweight SVG icons |

### Dev
| Package | Version | Purpose |
|---|---|---|
| eslint | 9.x | Linting |
| eslint-config-react | latest | React rules |
| prettier | 3.x | Formatting |

> **Key rationale:**
> - **Tailwind v4** has zero config — content auto-detected, dedicated Vite plugin replaces PostCSS
> - **React 19 + React Router 7** is the 2026 baseline; data router APIs simplify loaders
> - **TanStack Query** is mandatory for the real-time slot pattern — invalidate cache on socket event
> - **GSAP for scroll storytelling, Motion for component UI** — they layer cleanly because GSAP is DOM-level imperative and Motion is React-declarative
> - **Zod is shared between BE and FE** — define schemas once, infer types both sides

---

## Folder Structure

```
expert-booking-frontend/
├── public/
│   ├── fonts/                   # BMW Type Next Latin (or Inter variable)
│   └── images/
│       └── experts/             # expert avatars (or use pravatar URLs from seed)
├── src/
│   ├── api/
│   │   ├── client.ts            # Axios instance + interceptors
│   │   ├── experts.ts           # listExperts, getExpert query fns
│   │   └── bookings.ts          # createBooking, listBookings, updateStatus
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx       # button-primary / outline / icon variants (cva)
│   │   │   ├── Input.tsx        # 0px radius, 48px tall, hairline border
│   │   │   ├── Select.tsx       # Radix primitive styled
│   │   │   ├── Tabs.tsx         # category-tab / category-tab-active
│   │   │   ├── Dialog.tsx       # modal primitive
│   │   │   ├── Skeleton.tsx     # shimmer loading
│   │   │   └── MStripe.tsx      # 4px tricolor divider — signature element
│   │   ├── layout/
│   │   │   ├── Nav.tsx          # 64px black nav bar
│   │   │   ├── Footer.tsx       # 4-column black footer
│   │   │   ├── PageWrapper.tsx  # Framer page-transition wrapper
│   │   │   └── SmoothScroll.tsx # Lenis + GSAP ticker sync
│   │   ├── animation/
│   │   │   ├── SplitText.tsx    # masked word reveal helper
│   │   │   ├── FadeLine.tsx     # y/opacity reveal helper
│   │   │   ├── HeroPhoto.tsx    # full-bleed scroll-scrubbed photo
│   │   │   └── PageTransition.tsx # iris / mask transition between routes
│   │   └── booking/
│   │       ├── ExpertCard.tsx       # listing card
│   │       ├── ExpertHero.tsx       # detail-page hero
│   │       ├── SlotGrid.tsx         # date-grouped slot picker (live updated)
│   │       ├── BookingForm.tsx      # RHF + Zod, idempotency UUID
│   │       └── BookingStatusBadge.tsx
│   ├── features/                # feature-level orchestration (composes components)
│   │   ├── experts/
│   │   │   ├── ExpertList.tsx
│   │   │   └── ExpertDetail.tsx
│   │   └── bookings/
│   │       ├── CreateBookingFlow.tsx
│   │       └── MyBookings.tsx
│   ├── hooks/
│   │   ├── useSocket.ts         # connect, join:expert, listen slot:booked
│   │   ├── useExpertSlots.ts    # combines query + socket invalidation
│   │   ├── useDebounced.ts      # search debounce
│   │   └── useGsapReveal.ts     # reusable ScrollTrigger reveal
│   ├── lib/
│   │   ├── socket.ts            # socket.io-client singleton
│   │   ├── queryClient.ts       # TanStack QueryClient factory
│   │   ├── env.ts               # type-safe env access
│   │   ├── cn.ts                # clsx + tailwind-merge wrapper
│   │   └── tokens.ts            # design tokens (colors, spacing) as TS consts
│   ├── pages/
│   │   ├── HomePage.tsx         # / → list of experts
│   │   ├── ExpertDetailPage.tsx # /experts/:id
│   │   ├── BookingPage.tsx      # /experts/:id/book
│   │   ├── MyBookingsPage.tsx   # /my-bookings
│   │   └── NotFoundPage.tsx
│   ├── styles/
│   │   ├── globals.css          # Tailwind v4 directives + base + design tokens
│   │   └── animations.css       # .split-word, .fade-line, .reveal hooks
│   ├── types/
│   │   └── index.ts             # mirror of backend types/index.ts
│   ├── App.tsx                  # Router + QueryClient + Toaster + SmoothScroll
│   ├── router.tsx               # createBrowserRouter config
│   └── main.tsx                 # ReactDOM.createRoot
├── .env
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js            # (not needed in v4 — only if extra plugins)
├── tailwind.config.ts           # (optional in v4 — theme via CSS vars)
├── tsconfig.json
├── vite.config.ts
└── eslint.config.js
```

---

## Design Tokens (Tailwind v4 CSS Variables)

```css
/* src/styles/globals.css */
@import "tailwindcss";

@theme {
  /* Brand */
  --color-canvas: #000000;
  --color-surface-soft: #0d0d0d;
  --color-surface-card: #1a1a1a;
  --color-surface-elevated: #262626;
  --color-carbon-gray: #2b2b2b;

  /* Tricolor — accents only, never buttons */
  --color-m-blue-light: #0066b1;
  --color-m-blue-dark: #1c69d4;
  --color-m-red: #e22718;

  /* Text */
  --color-on-dark: #ffffff;
  --color-body: #bbbbbb;
  --color-body-strong: #e6e6e6;
  --color-muted: #7e7e7e;

  /* Hairlines */
  --color-hairline: #3c3c3c;
  --color-hairline-strong: #262626;

  /* Semantic */
  --color-warning: #f4b400;
  --color-success: #0fa336;

  /* Type */
  --font-display: "BMW Type Next Latin", "Inter Variable", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-body: var(--font-display);

  /* Radius */
  --radius-none: 0px;
  --radius-full: 9999px;

  /* Spacing — base 4 */
  --spacing-section: 96px;
}

/* All-caps button label tracking */
.label-uppercase { letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700; }

/* Animation hooks */
.split-word { display: inline-block; overflow: hidden; }
.split-word > span { display: inline-block; transform: translateY(100%); }
.fade-line { opacity: 0; transform: translateY(40px); }
.reveal { opacity: 0; transform: translateY(54px); }
.reveal-image { clip-path: inset(0 0 100% 0); transform: scale(1.1); }
```

---

## Pages — Wireframe + Animation Spec

### 1. HomePage `/` — Expert Listing

**Sections (top to bottom):**

1. **Top Nav** — 64px black bar, M tricolor + "BOOKR" or similar wordmark, links: `EXPERTS · MY BOOKINGS · ABOUT`. Right cluster: search icon, no auth required.

2. **Hero band (50vh)** — Full-bleed black with full-width photography of an expert at a desk. Headline `BOOK THE PEOPLE WHO BUILT IT.` in `display-xl` (80px / 700) — masked word reveal via GSAP SplitText. Sub-line in body Light. M-stripe divider at the bottom.

3. **Filter bar** — Sticky, hairline-bordered. Search input (debounced 300ms), category tabs (`ALL · TECH · FINANCE · HEALTH · LEGAL · MARKETING · OTHER`). Active tab gets 2px white underline.

4. **Expert grid (3-up at desktop)** — `feature-photo-card` layout. Each card:
   - 16:9 expert photo (top), `clipPath` mask reveal as it enters viewport
   - Category label in `label-uppercase`
   - Name in `title-lg` UPPERCASE
   - Rating · Years XP in body Light
   - Hover: 4px M-tricolor stripe slides in at the bottom of the card (NOT a fill — accent only)
   - Click → navigate with shared-element `layoutId` to detail page

5. **Pagination** — bottom-centered, sharp rectangle buttons.

6. **Footer** — 4-column links, M-stripe at top edge.

**Animations:**
- Hero h1 — masked word reveal on mount (GSAP SplitText, stagger 0.04, duration 0.9, expo.out)
- Filter bar — sticky, fades in from above
- Cards — stagger-in via Framer Motion `whileInView` (y: 60 → 0, opacity: 0 → 1, stagger 0.08)
- Hover M-stripe on card — Framer `motion.div` with `scaleX: 0 → 1, transformOrigin: left`

### 2. ExpertDetailPage `/experts/:id`

1. **Hero band (90vh)** — Full-bleed expert photo. Name in `display-xl`, category + experience in `body-strong`. M-stripe divider.
2. **Bio band** — Sentence-case body Light, max-width 720px.
3. **Slot picker section** — `BOOK A SESSION` heading. Horizontal tabs across 7 days. Below the tabs, a grid of slot tiles (8 per day) — each tile is 0px-radius, hairline border, time in `display-sm`. **Booked slots** render disabled with a strikethrough and `surface-elevated` fill. **Live updates** via Socket.io — when `slot:booked` fires for this expert, the matching tile transitions from available → booked with a Framer Motion layout animation + brief M-red flash on the border.
4. **CTA band-photo** — `BOOK A SESSION →` button below.

**Animations:**
- Hero photo — scroll-scrubbed scale (1.08 → 1) + parallax y
- Slot tile state change — Framer `motion.div` with layout animation, border color tween via GSAP for the brief red flash
- Day tabs — pinned horizontal track on mobile

### 3. BookingPage `/experts/:id/book?date=&slot=`

Modal-style overlay or full page. The form:

- **Header** — `CONFIRM YOUR BOOKING` + summary card (expert name, date, time)
- **Form fields** (RHF + Zod): Name, Email, Phone, Notes (textarea)
  - `idempotencyKey` is auto-generated via `crypto.randomUUID()` on form mount and held in a ref — same key reused on retry
  - All inputs: 48px tall, 0px radius, hairline border, focus → border thickens to white
  - Validation errors below each field in body Light, red text
- **Submit button** — `CONFIRM BOOKING` in primary outline style. Loading state shows a thin progress bar in M-blue-light at the bottom edge of the button
- **On success** — confetti? No — a slow fade-out into a `BOOKING CONFIRMED` full-screen card with the booking ID. Toast also fires via `sonner`.
- **On 409 conflict** — toast: `THIS SLOT WAS JUST BOOKED. PICK ANOTHER.` and navigate back to the detail page

**Animations:**
- Page enter — clip-path iris reveal (GSAP, circle from 0% at click point → 150%)
- Field focus — border GSAP tween 1px → 2px white
- Success state — Framer `AnimatePresence` swap from form → confirmation card

### 4. MyBookingsPage `/my-bookings`

1. **Email lookup** — single email input + `LOAD MY BOOKINGS` button. The email is persisted to `localStorage` so subsequent visits skip the prompt.
2. **Booking list** — Cards stacked vertically. Each card:
   - Expert name in `title-lg` UPPERCASE
   - Date · Time · Status badge (status: `pending` = white, `confirmed` = M-blue-light, `completed` = muted)
   - Notes (if any) in body Light
   - 1px hairline divider between cards

**Animations:**
- Card list — Framer stagger entry on email submit
- Status badge — subtle scale pop on status change (if user revisits and status updated)

---

## Wiring to Backend

### Environment Variables (`.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### API Client (`src/api/client.ts`)
- Axios instance with `baseURL: VITE_API_BASE_URL`
- Response interceptor: unwrap `response.data`
- Error interceptor: extract `data.message` → throw with that message → caught by TanStack Query → displayed via `sonner`

### TanStack Query Setup (`src/lib/queryClient.ts`)
```
defaultOptions: {
  queries: {
    staleTime: 30_000,           // 30s — slot data goes stale fast
    retry: 1,
    refetchOnWindowFocus: true,  // re-check slots when user returns
  },
  mutations: {
    retry: 0,                    // never retry POST /bookings — idempotency key handles it
  },
}
```

### Query Keys
```
["experts", { page, limit, category, search }]
["expert", id]
["bookings", { email }]
```

### Mutations
```
useCreateBooking() → POST /bookings → on success: invalidate ["expert", id] + ["bookings", email] + emit toast
useUpdateBookingStatus() → PATCH /bookings/:id/status → invalidate ["bookings", email]
```

### Socket.io Integration (`src/hooks/useSocket.ts`)

```
const useSocket = () => {
  const socket = useRef<Socket | null>(null);
  useEffect(() => {
    socket.current = io(VITE_SOCKET_URL, { withCredentials: true });
    return () => socket.current?.disconnect();
  }, []);
  return socket.current;
};
```

### Real-time Slot Updates (`src/hooks/useExpertSlots.ts`)
This is the critical hook — combines TanStack Query with Socket.io:

```
useEffect(() => {
  socket.emit("join:expert", expertId);
  socket.on("slot:booked", (payload) => {
    if (payload.expertId !== expertId) return;
    // Option A: invalidate query → refetch
    queryClient.invalidateQueries({ queryKey: ["expert", expertId] });
    // Option B (faster): optimistically patch the cache
    queryClient.setQueryData(["expert", expertId], (old) => ({
      ...old,
      availableSlots: old.availableSlots.map((s) =>
        s.date === payload.date && s.time === payload.timeSlot
          ? { ...s, isBooked: true }
          : s
      ),
    }));
  });
  return () => {
    socket.emit("leave:expert", expertId);
    socket.off("slot:booked");
  };
}, [expertId]);
```

Use **Option B** — instant UI update, no network round-trip. The query stays in sync because the next refetch will return the same state.

### Idempotency (in BookingForm)

```
const idempotencyKeyRef = useRef(crypto.randomUUID());
// reused on retries — same UUID submitted on re-attempts
```

---

## Animation Layer Strategy

### GSAP (DOM-level, imperative)
- Hero h1 masked word reveal (SplitText)
- Scroll-scrubbed photo scale + parallax (ScrollTrigger)
- Page enter iris reveal (clip-path circle)
- Slot tile booked-flash border tween
- Pinned horizontal day tabs on mobile

### Framer Motion / `motion/react` (React-declarative)
- AnimatePresence for route transitions (`PageTransition.tsx`)
- Card grid stagger on `whileInView`
- Modal/Dialog open/close
- Form field focus animations (border)
- Slot tile layout transition (available → booked)
- Status badge state changes
- Shared layout (`layoutId`) for card → detail hero

### Lenis Smooth Scroll
- Wraps the entire app
- Synced with GSAP ticker so ScrollTrigger reads correct progress
- Disabled on `prefers-reduced-motion: reduce`

---

## Loading & Error States

### Loading
- **Skeleton cards** with shimmer for expert grid
- **Skeleton hero** for expert detail
- **Inline spinner** in submit buttons (a thin M-blue-light progress bar)

### Errors
- **Network errors** → toast (`sonner`) with retry CTA
- **404 expert** → full-page `EXPERT NOT FOUND` with link back home
- **409 booking conflict** → toast + navigate back to detail page; UI already updated via socket
- **Validation errors** → inline below fields

---

## Accessibility

- All interactive elements ≥ 44×44px (buttons are 48×48 by spec)
- Focus rings on every interactive element — 2px white offset
- `prefers-reduced-motion` disables Lenis + reduces all GSAP/Framer to instant
- Radix primitives for Dialog, Tabs, Select — keyboard nav + ARIA out of the box
- Form errors associated to inputs via `aria-describedby`
- Color contrast — body `#bbbbbb` on `#000` passes WCAG AA at 14px+

---

## Responsive Breakpoints

| Breakpoint | Tailwind | Behavior |
|---|---|---|
| Mobile | `< 768px` | Hamburger nav; hero h1 80→48px; cards 1-up; horizontal day tabs become scroll-snap |
| Tablet | `768–1024px` | Cards 2-up; nav stays horizontal but compresses |
| Desktop | `1024–1440px` | Cards 3-up; full nav |
| Wide | `> 1440px` | Same as desktop, max content 1440px |

---

## Build Order

1. `npm create vite@latest expert-booking-frontend -- --template react-ts`
2. Install all deps (Tailwind v4, GSAP, Motion, TanStack Query, RHF, Zod, Radix, etc.)
3. `tailwind.config.ts` (optional in v4) + `globals.css` with design tokens
4. `lib/env.ts` + `lib/cn.ts` + `lib/queryClient.ts` + `lib/socket.ts` + `lib/tokens.ts`
5. `types/index.ts` — mirror backend types
6. `api/client.ts` + `api/experts.ts` + `api/bookings.ts`
7. `hooks/useSocket.ts` + `hooks/useExpertSlots.ts` + `hooks/useDebounced.ts`
8. `components/ui/*` — Button, Input, Select, Tabs, Dialog, Skeleton, MStripe
9. `components/animation/*` — SplitText, FadeLine, HeroPhoto, PageTransition
10. `components/layout/Nav.tsx` + `Footer.tsx` + `SmoothScroll.tsx`
11. `components/booking/*` — ExpertCard, ExpertHero, SlotGrid, BookingForm, BookingStatusBadge
12. `pages/HomePage.tsx`
13. `pages/ExpertDetailPage.tsx`
14. `pages/BookingPage.tsx`
15. `pages/MyBookingsPage.tsx`
16. `pages/NotFoundPage.tsx`
17. `router.tsx` + `App.tsx` + `main.tsx`
18. Manual end-to-end test against running backend
19. Build + deploy preview

---

## Performance Budget

- Initial JS bundle target: < 250KB gzipped
- Tailwind v4 produces ~5-10KB CSS gzipped (auto-detected utilities only)
- GSAP core + ScrollTrigger: ~30KB gzipped
- Motion: ~20KB gzipped (tree-shakable)
- Code-split routes: each page is a `lazy()` import, suspense boundary in router
- Image optimization: `loading="lazy"`, srcset for retina, WebP where possible

---

## Things That Could Go Wrong

| Risk | Mitigation |
|---|---|
| Socket.io disconnects | Reconnect logic baked into `socket.io-client`; on reconnect re-emit `join:expert`; query refetches on focus anyway |
| Stale slot data on first paint | TanStack Query's `staleTime: 30s` ensures fresh fetch when component mounts |
| Idempotency key not refreshed between bookings | New `idempotencyKey` ref generated on every `BookingForm` mount |
| Server returns 409 mid-form-submit | Toast + navigate back; cache already updated via socket from the user who won the race |
| Tailwind v4 + React 19 edge case | Pin to Tailwind v4 latest stable; have v3 fallback config ready |
| GSAP plugins (SplitText, ScrollTrigger) free vs Club GSAP | All required plugins are now in the free tier as of GSAP 3.13 |

---

## What's Out of Scope (For This Version)

- Authentication (assignment doesn't require it)
- Admin dashboard (only the staff `PATCH /:id/status` endpoint exists; we'll add a hidden `/admin/bookings` page if time permits)
- Multi-language i18n
- Dark/light mode toggle (the brand IS dark)
- Payment integration

---

## Inspirations Referenced

- BMW M marketing surface (provided in user theme prompt)
- `C:\Users\asnoi\Downloads\design\design.md` — Aadishakti dark industrial motion system
- `C:\Users\asnoi\Downloads\design\page-trasniton.md` — high-end transition catalog
- `C:\Users\asnoi\Downloads\design\desigin-text.md` — text-mask + masked reveal techniques
