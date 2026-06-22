# Fixed Menu Overlay and Three Models Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep menu controls stationary while videos swipe, prevent portrait clipping, rename the pairing action, and provide three distinct interactive 3D demo dishes.

**Architecture:** The horizontal `FlatList` will render only full-screen videos. A single absolute overlay will render category navigation, dish navigation, description, and actions for the active dish. A small static dish-to-model registry will expose only dishes that have bundled GLB assets.

**Tech Stack:** Expo Router, React Native, expo-video, Expo DOM, model-viewer, Three.js GLTF export, Node test runner.

---

### Task 1: Lock client behavior with source-level regression tests

**Files:**
- Create: `server/test/client-menu-ui.test.cjs`
- Modify: `package.json`

- [ ] Assert that the video list render function contains only `DishVideo`, that the overlay is outside the list, that the pairing label is `Гастрономические пары`, and that exactly three demo dish IDs are registered for 3D.
- [ ] Run `npm test` and confirm the new assertions fail against the current implementation.

### Task 2: Separate video paging from the fixed interface

**Files:**
- Modify: `src/components/tablet-video-menu.tsx`

- [ ] Derive `activeDish` from `activeDishId`.
- [ ] Change the horizontal `FlatList` so each page renders only `DishVideo`.
- [ ] Move rails, dish information, and action controls into one fixed sibling overlay.
- [ ] Keep button and rail interactions enabled while noninteractive overlay areas pass touches through to the video pager.
- [ ] Use shrinking single-line action labels and portrait-safe vertical layout.
- [ ] Rename `Подойдет` and the modal heading to `Гастрономические пары`.

### Task 3: Generate and register three distinct 3D dishes

**Files:**
- Create: `scripts/generate-demo-models.mjs`
- Create: `assets/models/Bruschetta.glb`
- Create: `assets/models/ShrimpPasta.glb`
- Create: `assets/models/ChocolateFondant.glb`
- Create: `src/data/dish-models.ts`
- Modify: `src/components/dish-model-viewer.tsx`
- Modify: `src/components/tablet-video-menu.tsx`
- Modify: `assets/models/ATTRIBUTION.md`

- [ ] Generate lightweight stylized GLB models for `bruschetta`, `shrimp-pasta`, and `fondant` using the existing transitive Three.js package.
- [ ] Register all model imports statically so Metro bundles them.
- [ ] Show the 3D action only when the active dish has a registered model.
- [ ] Pass the selected model key into the DOM viewer.

### Task 4: Verify behavior and release health

**Files:**
- Test: `server/test/client-menu-ui.test.cjs`
- Test: `server/test/menu-api.test.cjs`

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Verify portrait and landscape layouts in the local app browser, including video-only paging and all three 3D buttons.
