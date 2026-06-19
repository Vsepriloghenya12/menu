# Video Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Expo/React Native MVP for a video restaurant menu with Android tablet, owner desktop web, and mobile orders web surfaces.

**Architecture:** Use one Expo Router codebase with route-level separation for `/`, `/owner`, and `/orders`. Shared modules hold demo menu data, cart/order reducer behavior, and formatting helpers so a backend can replace local state later.

**Tech Stack:** Expo, React Native, TypeScript, Expo Router, expo-video, React hooks/reducer state.

---

### Task 1: Scaffold App

**Files:**
- Create: `package.json`
- Create: `app.json`
- Create: `tsconfig.json`
- Create: `app/_layout.tsx`
- Create: `app/index.tsx`

- [ ] Create a minimal Expo Router TypeScript app.
- [ ] Install dependencies with `npm install`.
- [ ] Confirm `npm run typecheck` is available.

### Task 2: Shared Data And State

**Files:**
- Create: `src/data/menu.ts`
- Create: `src/state/cart.ts`
- Create: `src/utils/money.ts`
- Create: `src/types/menu.ts`

- [ ] Define dish, category, add-on, cart item, and order interfaces.
- [ ] Add demo dishes with video URLs, prices, details, add-ons, and pairings.
- [ ] Add reducer helpers for adding items, add-ons, quantity changes, totals, and order submission.

### Task 3: Tablet Video Menu

**Files:**
- Modify: `app/index.tsx`
- Create: `src/components/tablet-video-menu.tsx`

- [ ] Render a full-screen swipeable vertical menu.
- [ ] Overlay price badge, category controls, cart button, details button, pairing button, and add-to-cart button.
- [ ] Show add-ons after adding a dish.
- [ ] Show cart contents and submit order action.

### Task 4: Owner Web Page

**Files:**
- Create: `app/owner.tsx`
- Create: `src/components/owner-dashboard.tsx`

- [ ] Render a desktop dashboard for categories and dishes.
- [ ] Show video URL, price, composition, macros, add-ons, and pairings.
- [ ] Keep edits as local mock controls in this MVP.

### Task 5: Orders Mobile Web Page

**Files:**
- Create: `app/orders.tsx`
- Create: `src/components/orders-screen.tsx`

- [ ] Render mobile-first incoming order cards.
- [ ] Show order status, item quantities, add-ons, and totals.
- [ ] Include demo/local submitted order fallback when no backend is connected.

### Task 6: Verification And APK Notes

**Files:**
- Create: `README.md`

- [ ] Run `npm run typecheck`.
- [ ] Run an Expo web export or equivalent build check.
- [ ] Document local run commands and APK build command using EAS.
