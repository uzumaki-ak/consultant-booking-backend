# Expert Booking — Mobile App Plan (React Native / Expo)

> Self-contained plan. Companion to `backend-plan.md` and `web-app.md`.
> Anyone with this file + the backend running can build the entire app with no further input.

---

## Overview

A native iOS + Android app for the Expert Session Booking system. Same backend, same design DNA as the web app, but with native-platform features the web cannot do:

- **iOS 26 Liquid Glass** UI (real GPU-rendered glass) with graceful fallback on Android / older iOS
- **Reanimated 3 worklets** running on the UI thread — never drops below 60 FPS
- **React Native Skia** shaders for the slot-booking flash and hero photo overlays
- **Bottom sheet** modal for the booking form (gesture-driven, native feel)
- **Haptics** on every important state change (slot booked, status changed, error)
- **Shared element transitions** between expert card → expert detail
- **Pull-to-refresh + infinite scroll** on listings — native gestures only the platform can do
- **Push-style toasts** (notifee-style) instead of web toasts

---

## Design System (Mirrors Web App)

The visual system is the **same BMW M industrial-editorial** as the web — black canvas, white UPPERCASE display, 0px corners, M tricolor stripe accents, full-bleed expert photography. Mobile-specific adaptations:

- Display sizes scale down: `display-xl` 80→48px on mobile
- Bottom tab bar uses **iOS 26 Liquid Glass** (`@callstack/liquid-glass`) — falls back to solid black `#0d0d0d` with hairline top border on Android / iOS < 26
- Status bar: dark content over light backgrounds is impossible (we have no light backgrounds) — always light content over black
- Haptics: `Haptics.selectionAsync()` on every category/tab change, `Haptics.notificationAsync(Success)` on booking confirm, `Haptics.notificationAsync(Error)` on 409 conflict
- Edge-to-edge layout — `expo-system-ui` sets the nav-bar/status-bar transparent, content draws under

The full color/type/spacing token list lives in `web-app.md` — mobile reads the **same** tokens via NativeWind + CSS variables.

---

## Tech Stack (Latest as of May 2026)

### Core
| Package | Version | Purpose |
|---|---|---|
| Expo SDK | 54.x | Managed workflow — XCFrameworks ship precompiled (10s clean builds vs 120s) |
| React Native | 0.81.x | Latest with full New Architecture default |
| React | 19.x | Same as web |
| TypeScript | 5.7.x | Type safety |
| Expo Router | 6.x | File-based routing, **iOS 26 bottom tabs UI** built-in |

> Note: Expo SDK 54 is the **last** version where New Architecture can be disabled. We enable it from day one — every animation library we use already supports it.

### Animation & Graphics
| Package | Version | Purpose |
|---|---|---|
| react-native-reanimated | 3.16.x | UI-thread animations via worklets |
| react-native-gesture-handler | 2.20.x | Native gesture system (pan, pinch, swipe) |
| react-native-skia | 1.7.x | GPU shaders, canvas, blur, displacement |
| moti | 0.29.x | Declarative API on top of Reanimated — fast for simple transitions |
| @callstack/liquid-glass | 1.x | iOS 26 GlassView with auto-fallback |
| react-native-screens | 4.x | Native screen primitives (faster transitions) |
| @gorhom/bottom-sheet | 5.x | Gesture-driven bottom sheet for booking modal |

### Styling
| Package | Version | Purpose |
|---|---|---|
| nativewind | 4.x | Tailwind for RN — compiles to StyleSheet at build time, zero runtime overhead |
| tailwindcss | 3.4.x | (NativeWind v4 targets Tailwind v3 — v5 preview not yet default) |

### Data & State
| Package | Version | Purpose |
|---|---|---|
| @tanstack/react-query | 5.x | Server state — same hooks/queries as web |
| axios | 1.x | HTTP client |
| zustand | 5.x | Client state (filters, persisted user email) |
| @react-native-async-storage/async-storage | 2.x | Persistent storage for last-used email |

### Forms & Validation
| Package | Version | Purpose |
|---|---|---|
| react-hook-form | 7.x | Form state |
| @hookform/resolvers | 3.x | Zod adapter |
| zod | 3.x | Same schemas as backend / web |

### Real-time
| Package | Version | Purpose |
|---|---|---|
| socket.io-client | 4.x | Matches backend; works on RN with no polyfills |

### Native Modules (Expo)
| Package | Purpose |
|---|---|
| expo-haptics | Tactile feedback |
| expo-image | Fast WebP-aware image loader (replaces `<Image>`) |
| expo-blur | Software blur fallback for non-iOS-26 |
| expo-linear-gradient | Gradients (used sparingly per design) |
| expo-status-bar | Status bar control |
| expo-system-ui | Edge-to-edge config |
| expo-font | BMW Type Next Latin (or Inter Variable) loader |
| expo-secure-store | (optional) for any auth tokens later |

### Dev / Tooling
| Package | Purpose |
|---|---|
| eslint + eslint-config-expo | Linting |
| prettier | Formatting |
| @types/react | Types |
| metro-react-native-babel-preset | Bundler |

---

## Folder Structure (Expo Router v6 file-based)

```
expert-booking-mobile/
├── app/                              # Expo Router file-based routes
│   ├── _layout.tsx                   # Root: providers (QueryClient, GestureHandler, BottomSheet, Theme)
│   ├── +not-found.tsx                # 404 screen
│   ├── (tabs)/
│   │   ├── _layout.tsx               # Tab bar with Liquid Glass on iOS 26
│   │   ├── index.tsx                 # Experts listing (home tab)
│   │   └── bookings.tsx              # My Bookings tab
│   ├── expert/
│   │   └── [id].tsx                  # Expert detail (stack screen)
│   └── book/
│       └── [id].tsx                  # Booking form (modal-presented)
├── src/
│   ├── api/
│   │   ├── client.ts                 # Axios instance
│   │   ├── experts.ts                # Query functions
│   │   └── bookings.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx            # Primary / outline / icon variants
│   │   │   ├── Input.tsx
│   │   │   ├── Skeleton.tsx          # Reanimated shimmer
│   │   │   ├── MStripe.tsx           # 4px tricolor divider
│   │   │   ├── Pressable.tsx         # Haptic-enabled tap wrapper
│   │   │   └── GlassNav.tsx          # Liquid Glass tab background
│   │   ├── animation/
│   │   │   ├── FadeIn.tsx            # Moti wrapper for entry animations
│   │   │   ├── SlideUp.tsx
│   │   │   ├── Stagger.tsx           # Stagger children on mount
│   │   │   ├── ScrollFadeImage.tsx   # Parallax + scale via Reanimated scroll handler
│   │   │   └── SkiaSlotFlash.tsx     # Skia shader for slot-booked flash
│   │   ├── booking/
│   │   │   ├── ExpertCard.tsx
│   │   │   ├── ExpertHero.tsx
│   │   │   ├── SlotGrid.tsx          # Live-updated slot grid
│   │   │   ├── SlotTile.tsx          # Animated tile with skia flash on book
│   │   │   ├── BookingForm.tsx       # Inside bottom sheet
│   │   │   └── BookingStatusBadge.tsx
│   │   └── layout/
│   │       ├── ScreenHeader.tsx
│   │       └── EmailGate.tsx         # Email prompt for My Bookings
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   ├── useExpertSlots.ts         # Combines query + socket invalidation
│   │   ├── useHaptics.ts             # Wrapped expo-haptics with semantic names
│   │   └── usePersistedEmail.ts      # AsyncStorage-backed email
│   ├── lib/
│   │   ├── env.ts
│   │   ├── socket.ts                 # io() singleton
│   │   ├── queryClient.ts
│   │   ├── cn.ts
│   │   └── tokens.ts                 # Design tokens (colors, spacing) as TS consts
│   ├── store/
│   │   └── filters.ts                # Zustand store for category/search
│   └── types/
│       └── index.ts                  # Mirror of backend types
├── assets/
│   ├── fonts/                        # BMW Type Next Latin / Inter
│   └── images/
├── .env
├── .env.example
├── .gitignore
├── app.json                          # Expo config: iOS 26 features, splash, icons
├── babel.config.js
├── metro.config.js
├── nativewind-env.d.ts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## Routes & Navigation

### Tab Layout `(tabs)/_layout.tsx`
- Liquid Glass tab bar on iOS 26 (`@callstack/liquid-glass` → `GlassView`)
- Solid `surface-soft` (#0d0d0d) with 1px hairline top on Android / iOS < 26
- Two tabs:
  - **Discover** (Compass icon) → `/`
  - **My Bookings** (CalendarCheck icon) → `/bookings`
- Tab height 84px on iOS, 64px on Android (accounting for safe area)
- M tricolor stripe (4px) sits at the very top edge of the tab bar — the only decorative element

### Stack Screens (over tabs)
- `expert/[id].tsx` — pushed from a card tap, uses native iOS slide-from-right / Android shared-axis-X
- `book/[id].tsx` — `presentation: "modal"` — slides up from bottom, edge-aware
  - Inside, a `@gorhom/bottom-sheet` snaps to 90% screen height with the form

### Page Transitions

| Route → Route | Transition | Implementation |
|---|---|---|
| Tab → Tab | Cross-fade | Expo Router default |
| Card → Detail | Shared element + native push | `react-native-screens` shared transitions |
| Detail → Booking | Modal slide-up | `presentation: "modal"` |
| Booking → Confirmation | In-place fade swap | Moti `AnimatePresence` |

Avoid platform-jarring transitions. Native feel > web-style fancy.

---

## Screens (Detailed)

### 1. `(tabs)/index.tsx` — Experts Listing

**Layout:**
- Edge-to-edge `FlatList` (or `FlashList` from Shopify for perf)
- Sticky search header — translucent dark with `expo-blur` (radius 30) on scroll
- Category chips horizontally scrollable below search
- Cards stack with 24px gap

**Card structure (`ExpertCard.tsx`):**
- Hero photo 16:9 with `expo-image` (transition fade)
- Category label (uppercase, letter-spaced)
- Name (uppercase, 24px / 700)
- Rating · Years XP row in body Light
- Tap → navigate with shared element id `expert-${id}-photo`

**Animations:**
- `FlatList` cards animated in with **Moti stagger** (each card: opacity 0→1, translateY 30→0, delay = index × 60)
- Search input focus → border GSAP tween via Reanimated `withTiming`
- Category chip tap → haptic `selectionAsync` + scale pulse 1 → 0.96 → 1
- Pull-to-refresh — native iOS spinner / Android Material spinner

**Loading state:**
- 6 skeleton cards with **Reanimated shimmer** (`useDerivedValue` + linear-gradient sweep)

**Empty state:**
- "NO EXPERTS FOUND" in display-md, helpful sub-line, M-stripe below

### 2. `expert/[id].tsx` — Expert Detail

**Sections (vertical scroll):**
1. **Hero photo (50% screen height)** — full-bleed expert photo, **scroll-scrubbed parallax** (translateY = scrollY × 0.4) and scale (1 + scrollY × 0.001)
2. **Name + category card** — overlaid at bottom of hero with `expo-blur` (intensity 80)
3. **Bio band** — 24px padding, body Light text
4. **Slot picker** — horizontal `FlatList` of 7 day tabs at top, then a 2-column grid of slot tiles below
5. **CTA button** — sticky at bottom, `BOOK A SESSION →`

**Slot Grid behavior (the critical real-time piece):**
- Hook `useExpertSlots(expertId)` joins the `expert:{id}` socket room
- On `slot:booked` event matching this expert:
  - Find the matching `SlotTile` by date+time
  - Trigger **Skia flash shader**: 300ms M-red border pulse + slot tile fades to `surface-elevated` background, slashes through the time
  - Haptic: `Haptics.notificationAsync(Warning)` if it was the slot the user was about to tap
  - TanStack Query cache patched optimistically (no refetch)

**SlotTile.tsx animations:**
- Available state: hairline border, time in display-sm, white text
- Press state: Reanimated `withSpring` scale 0.94, haptic `selectionAsync`
- Booked state: animated transition from available — `withTiming(borderColor)` to M-red for 300ms, then to `surface-elevated`. Time gets strikethrough.
- Selected state: M-blue-light border (briefly, before navigating to booking)

**Hero scroll-parallax (Reanimated 3 worklet):**
```tsx
const scrollY = useSharedValue(0);
const heroStyle = useAnimatedStyle(() => ({
  transform: [
    { translateY: scrollY.value * 0.4 },
    { scale: 1 + Math.max(-scrollY.value, 0) * 0.001 }, // pull-to-zoom
  ],
}));
```

### 3. `book/[id].tsx` — Booking Form (Modal Bottom Sheet)

Presented as **modal** route. Inside, a `@gorhom/bottom-sheet` with:
- Snap points: `["50%", "90%"]`
- Initial: 90%
- Backdrop: 70% black opacity, taps dismiss

**Form (RHF + Zod):**
- Summary card at top: expert name, date, time
- Fields stacked: Name, Email, Phone, Notes (multi-line, 4 rows)
- Each field 56px tall, 0px corners, hairline border, focus thickens border to 2px white
- Submit button at bottom: `CONFIRM BOOKING` — sticky inside the sheet
- Loading: thin M-blue-light progress bar across button bottom edge
- `idempotencyKey` generated via `expo-crypto` `randomUUID()` on mount, held in ref

**Success flow:**
- 409 conflict → haptic Error + sheet stays + toast "THIS SLOT WAS JUST BOOKED" → user picks new slot
- 201 success → haptic Success + sheet morphs into a confirmation card (Moti `AnimatePresence`) — large checkmark, booking ID, "DONE" button → dismisses to detail page with cache invalidated

### 4. `(tabs)/bookings.tsx` — My Bookings

**Empty state (no email yet):**
- Centered card: input for email + `LOAD MY BOOKINGS` button
- Email persisted via AsyncStorage on submit

**Loaded state:**
- Vertical list of booking cards
- Each card:
  - Expert name + category at top
  - Date · Time · Status badge (color-coded: pending = white outline, confirmed = M-blue-light, completed = muted gray)
  - Notes (if any) below
  - Long-press → action sheet: "Cancel" (calls PATCH status, optional)
- Pull-to-refresh
- Email change action: small "CHANGE EMAIL" link in top-right

**Animations:**
- Cards stagger-in via Moti
- Status badge change: scale 1 → 1.1 → 1 + color tween via Reanimated

---

## Wiring to Backend

### Environment Variables (`.env` + `app.config.ts`)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
```
(Use `EXPO_PUBLIC_*` prefix so values are bundled.)

> **Important:** When testing on a physical device, replace `localhost` with your machine's LAN IP (e.g., `http://192.168.1.10:5000`). On Android emulator, use `http://10.0.2.2:5000`. iOS simulator handles `localhost` natively.

### API Client (`src/api/client.ts`)
- Axios instance — same setup as web
- Adds `User-Agent: ExpertBookingMobile/1.0` header for backend logs
- Same response/error interceptors

### TanStack Query Setup (`src/lib/queryClient.ts`)
Same defaults as web:
- `staleTime: 30_000`
- `retry: 1` for queries, `0` for mutations
- `refetchOnReconnect: true` — important on mobile (network drops common)

### Socket.io (`src/lib/socket.ts`)
```ts
import { io } from "socket.io-client";
import { Platform } from "react-native";

export const socket = io(process.env.EXPO_PUBLIC_SOCKET_URL!, {
  transports: ["websocket"], // skip polling on mobile — websocket is reliable here
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: Infinity,
});
```

### Real-time Slot Updates (`src/hooks/useExpertSlots.ts`)
Identical pattern to web — optimistic cache patch on `slot:booked` event. Adds:
- Haptic feedback when a slot the user is currently viewing gets booked
- Toast notification ("ANOTHER USER JUST BOOKED THIS SLOT") if the user was about to tap it

### Idempotency
- `expo-crypto` `randomUUID()` for the key (RN's `crypto.randomUUID` isn't reliably polyfilled)
- Generated on `BookingForm` mount, stored in `useRef`

---

## Animation Strategy

### Reanimated 3 (worklets, UI thread)
All performance-critical animations:
- Slot tile state transitions (border color tween)
- Hero parallax + scroll-scrubbed scale
- Card press feedback (spring scale)
- Tab bar hide-on-scroll (translateY based on scroll velocity)
- Skeleton shimmer
- Pull-to-refresh custom indicator

### Moti (declarative)
Simple fades, slides, staggers — `<MotiView from to>`:
- Card list stagger
- Empty state appearance
- AnimatePresence form → confirmation swap
- Status badge changes

### React Native Skia (GPU shaders)
- **Slot booked flash** — fragment shader with brief M-red border glow + radial dissolve
- (Optional) Liquid lens effect on hero photo when user pinch-zooms
- (Optional) Custom pull-to-refresh that draws an M-stripe ribbon

### Liquid Glass (iOS 26)
- Tab bar background
- Sticky search header on listing
- Booking form sheet handle area

```tsx
import { GlassView } from "@callstack/liquid-glass";
// Falls back to View on Android / iOS < 26 automatically
<GlassView style={{ ... }}>
  <TabBar />
</GlassView>
```

### Gesture Handler
- Slot tile press w/ haptics
- Bottom sheet drag
- Swipe-to-dismiss on stack screens (native default but tuned)
- (Optional) Pinch-zoom on hero photo

---

## Loading & Error States

### Loading
- Skeleton list w/ Reanimated shimmer (5-6 cards)
- Hero detail: skeleton hero photo + skeleton title bars
- Submit button: thin M-blue progress bar at bottom edge

### Error
- Network errors → haptic Error + toast (`burnt` library or custom Reanimated toast)
- 404 → full-screen centered "EXPERT NOT FOUND" + back button
- 409 conflict → haptic Error + bottom sheet keeps open + toast → user picks another slot
- Validation → inline field errors in red text

---

## Accessibility

- All `Pressable` components ≥ 44×44pt
- `accessibilityLabel` on every interactive element
- `accessibilityRole` set correctly (button, link, header)
- VoiceOver / TalkBack tested on hero, slot tiles, form
- `Reduce Motion` (iOS) / `Remove Animations` (Android) detected via `AccessibilityInfo.isReduceMotionEnabled()` — disables all non-essential animations
- Dynamic type respected — display text uses `allowFontScaling` only on body, fixed scale on display headlines (BMW M doesn't scale headlines on web either)

---

## Performance Targets

- Cold start: < 2s on iPhone 14, < 3s on Pixel 6
- 60+ FPS during scroll, 120 FPS on ProMotion devices
- Images preloaded via `expo-image` `prefetch()` after listing fetch
- `FlashList` (or `FlatList` w/ `removeClippedSubviews`) for the listing
- Reanimated worklets for any scroll-driven animation — JS thread never participates
- Bundle size: < 6 MB JS bundle (Hermes engine compresses well)

---

## Build Order (~9-12 hours)

1. `npx create-expo-app@latest expert-booking-mobile --template blank-typescript`
2. Install all deps (Expo SDK 54, Reanimated, Skia, NativeWind, etc.)
3. Configure NativeWind v4 + tailwind.config.js with design tokens
4. `app.json` — iOS 26 features enabled, edge-to-edge, splash screen
5. `lib/tokens.ts` + `lib/cn.ts` + `lib/env.ts` + `lib/queryClient.ts` + `lib/socket.ts`
6. `types/index.ts` mirroring backend
7. `api/client.ts` + `api/experts.ts` + `api/bookings.ts`
8. `hooks/useSocket.ts` + `hooks/useExpertSlots.ts` + `hooks/useHaptics.ts` + `hooks/usePersistedEmail.ts`
9. `components/ui/*` — Button, Input, Skeleton, MStripe, Pressable, GlassNav
10. `components/animation/*` — FadeIn, SlideUp, Stagger, ScrollFadeImage, SkiaSlotFlash
11. `components/booking/*` — ExpertCard, ExpertHero, SlotGrid, SlotTile, BookingForm, BookingStatusBadge
12. `app/_layout.tsx` — providers + theme + fonts
13. `app/(tabs)/_layout.tsx` — Liquid Glass tab bar
14. `app/(tabs)/index.tsx` — Experts list with FlashList + search + categories
15. `app/(tabs)/bookings.tsx` — My Bookings + email gate
16. `app/expert/[id].tsx` — Detail with parallax hero + slot grid
17. `app/book/[id].tsx` — Modal w/ bottom sheet form
18. `app/+not-found.tsx`
19. Test on iOS simulator + Android emulator
20. Test on physical device (LAN IP) end-to-end against backend
21. EAS Build for development APK / TestFlight if needed

---

## Things That Could Go Wrong

| Risk | Mitigation |
|---|---|
| Liquid Glass not rendering on Android | `@callstack/liquid-glass` auto-falls-back to View; we use `expo-blur` underneath as visible-blur fallback |
| Socket disconnects on app backgrounding | `socket.io-client` auto-reconnect on resume; query refetches on `AppState` change to active |
| `crypto.randomUUID` undefined on RN | Use `expo-crypto` `randomUUID()` instead — works everywhere |
| Reanimated 4 vs 3 conflict | Pin Reanimated 3.16.x — Reanimated 4 is in beta as of May 2026, only use if Expo SDK 54 docs explicitly require |
| New Architecture breaking older libs | All libs in this stack support New Arch as of May 2026; verify `app.json` has `"newArchEnabled": true` |
| Network on physical device | Document in README: replace `localhost` with LAN IP, ensure backend listens on `0.0.0.0:5000` |
| `FlashList` v2 API differences | If using FlashList, follow v2 migration; otherwise use `FlatList` with `removeClippedSubviews` |
| iOS 26 features on iOS 25 simulator | Detect `Platform.OS === "ios" && Platform.Version >= "26"` before using GlassView features |
| Font loading flicker | `expo-font` with `useFonts` hook; render splash screen until fonts loaded |

---

## Pre-Build Setup the User Must Do

Before I start coding tomorrow with no further input, the user needs to:

1. **Have the backend running and accessible:**
   - Start with `npm run dev` in `expert-booking-backend`
   - Confirm the port (default 5000) is reachable
   - Note your machine's LAN IP for physical device testing (e.g., `ipconfig` on Windows → IPv4 Address)

2. **Have at least one of:**
   - **Option A:** Expo Go installed on your phone (scan QR code, easiest)
   - **Option B:** iOS Simulator (Xcode required — Mac only)
   - **Option C:** Android Studio + Emulator
   - **Option D:** Physical device w/ USB debugging

3. **Have MongoDB Atlas URI in backend `.env`** (or local replica set), seed run.

4. **Optional:** Fonts — if you want BMW Type Next Latin, drop the `.otf` files in `assets/fonts/`. Otherwise we use Inter Variable from Google Fonts (free).

---

## What I (Claude) Will Need You to Decide Tomorrow (Or Pick Defaults)

If you're not around to clarify, I'll use these defaults:

| Question | Default |
|---|---|
| Bare Expo Go vs Expo Dev Build? | Expo Dev Build (Skia + Reanimated 3 require it; Expo Go won't work for our animations) |
| iOS-only or both platforms? | Both — same codebase, only Liquid Glass differs |
| Font choice? | Inter Variable from Google Fonts (free, no licensing) |
| Toast library? | Sonner Native (`sonner-native`) — same API as web |
| Image source? | Pravatar URLs from backend seed (already set up) |
| Real-time strategy if Socket fails? | Fall back to TanStack Query `refetchInterval: 10_000` only on the detail screen |
| Booking confirmation behavior? | Sheet morphs into confirmation, then auto-dismisses after 2s back to detail |

---

## File-Level Implementation Order I Will Follow

I will start at `app.json` → `tailwind.config.js` → `lib/` → `types/` → `api/` → `hooks/` → `components/ui/` → `components/animation/` → `components/booking/` → `app/_layout.tsx` → tabs layout → screens. Each layer is fully working before the next.

After every major group (lib, components/ui, components/booking, screens), I'll commit with simple messages and verify the type-check passes.

---

## API Contract Reference (from `backend-plan.md`)

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/api/v1/experts` | `?page=&limit=&category=&search=` | `{ success, data: Expert[], pagination }` |
| GET | `/api/v1/experts/:id` | — | `{ success, data: Expert }` |
| POST | `/api/v1/bookings` | `{ expertId, idempotencyKey, name, email, phone, date, timeSlot, notes? }` | `{ success, data: Booking }` 201 / `{ success: false, message }` 409 |
| PATCH | `/api/v1/bookings/:id/status` | `{ status: "pending" \| "confirmed" \| "completed" }` | `{ success, data: Booking }` |
| GET | `/api/v1/bookings?email=` | — | `{ success, data: Booking[] }` |

### Socket.io Events
| Event | Direction | Payload |
|---|---|---|
| `join:expert` | Client → Server | `expertId: string` |
| `leave:expert` | Client → Server | `expertId: string` |
| `slot:booked` | Server → Client | `{ expertId, date, timeSlot }` |

### TypeScript types (mirror in `src/types/index.ts`)
Same as `backend-plan.md` data models — Expert, Booking, ISlot, ApiResponse.

---

## Final Note

This document is the complete brief. With the backend running and Expo dev environment ready, I can build the entire app end-to-end without further questions. If something comes up that I genuinely can't decide (e.g., a new design preference), I will pick the most BMW-M-aligned default and note it in commit messages.

The motion language target: **physical, premium, industrial, controlled** — never decorative, never bouncy, never AI-template-feeling.
