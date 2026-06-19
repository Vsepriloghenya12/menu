# Video Menu Design

## Goal

Build a first working version of a video-first restaurant menu for Android tablets, plus web views for the owner on desktop and incoming orders on mobile.

## Scope

The MVP uses local demo data and client-side state so it works without API keys, backend credentials, or network services. It keeps a clear path for adding a backend later by isolating menu data and order state in small modules.

## User Surfaces

- Tablet menu: full-screen vertical video feed, category selector, price badge, cart button, details button, pairing suggestions, add-ons after adding an item, and a cart panel.
- Owner web page: desktop-friendly page for reviewing current categories, dishes, prices, video URLs, add-ons, and pairings.
- Orders web page: mobile-friendly page showing incoming orders from the current browser session.

## Architecture

Use one Expo Router app that can run on Android and web. Routes separate the three surfaces: `/` for the tablet menu, `/owner` for owner management, and `/orders` for the mobile orders view. Shared TypeScript modules provide menu data, cart/order reducer logic, and formatting helpers.

## Data Model

Each dish has an id, category id, title, description, price, composition, calories/macros, video URL, add-ons, and pairing suggestions. Orders contain line items with selected add-ons, quantities, totals, status, and timestamps.

## Visual Direction

Keep the tablet UI compact, functional, and immersive: video fills the screen, controls float over the video, and category/cart surfaces stay readable without redesign-heavy decoration. The owner and orders pages are practical dashboards rather than marketing pages.

## Verification

After implementation, run the available project checks: TypeScript check and Expo export/build check where available. If an APK cannot be produced locally because EAS credentials are not configured, keep Android project configuration ready and document the command for APK generation.
