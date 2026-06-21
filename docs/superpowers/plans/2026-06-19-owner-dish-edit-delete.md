# Owner Dish Edit And Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the owner edit or delete dishes persistently, with successful changes immediately visible in the guest menu.

**Architecture:** Add a small Express server that serves the exported Expo web app and a menu API. The server uses PostgreSQL when `DATABASE_URL` exists and a JSON file locally; both implement the same storage interface. The owner and tablet screens load menu data through a shared frontend API client while retaining the current static menu as an availability fallback.

**Tech Stack:** Expo Router, React Native Web, TypeScript, Express, PostgreSQL, Node test runner.

---

## File Structure

- `server/menu-validation.cjs`: validates complete dish payloads.
- `server/json-menu-store.cjs`: persistent local JSON implementation.
- `server/postgres-menu-store.cjs`: Railway PostgreSQL implementation and schema initialization.
- `server/create-menu-store.cjs`: selects PostgreSQL or JSON storage.
- `server/app.cjs`: Express API and static SPA server.
- `server/index.cjs`: production entrypoint.
- `server/data/seed-menu.json`: initial data matching the current frontend menu.
- `server/test/menu-api.test.cjs`: API regression coverage.
- `src/services/menu-api.ts`: frontend API URL resolution and menu mutations.
- `src/hooks/use-menu.ts`: guest menu loading with static fallback.
- `src/components/owner-dashboard.tsx`: owner list, edit form, delete confirmation, and request states.
- `src/components/tablet-video-menu.tsx`: consume live menu data.
- `package.json`: production server, local API, and test scripts.

### Task 1: Persistent Menu API

**Files:**
- Create: `server/menu-validation.cjs`
- Create: `server/json-menu-store.cjs`
- Create: `server/create-menu-store.cjs`
- Create: `server/app.cjs`
- Create: `server/data/seed-menu.json`
- Test: `server/test/menu-api.test.cjs`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Write failing API tests**

Cover:

```js
test("PATCH /api/admin/dishes/:id persists a complete valid dish", async () => {});
test("PATCH rejects an empty title without changing storage", async () => {});
test("DELETE /api/admin/dishes/:id removes the dish", async () => {});
test("GET /api/menu returns categories and dishes", async () => {});
```

Use a temporary JSON path for every test and start the Express app on an ephemeral port.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test`

Expected: FAIL because the server modules and test script do not exist yet.

- [ ] **Step 3: Implement the minimum JSON-backed API**

Add:

```text
GET    /api/menu
PATCH  /api/admin/dishes/:id
DELETE /api/admin/dishes/:id
```

Return errors as:

```json
{ "code": "VALIDATION_ERROR", "message": "Проверьте данные блюда", "fields": { "title": "Укажите название" } }
```

Persist writes atomically by writing a temporary file and renaming it.

- [ ] **Step 4: Install only required server dependencies**

Run: `npm install express pg`

Add scripts:

```json
"start": "node server/index.cjs",
"server": "node server/index.cjs",
"test": "node --test server/test/*.test.cjs"
```

- [ ] **Step 5: Run API tests**

Run: `npm test`

Expected: all API tests PASS.

### Task 2: Railway PostgreSQL And Static Hosting

**Files:**
- Create: `server/postgres-menu-store.cjs`
- Create: `server/index.cjs`
- Modify: `server/create-menu-store.cjs`
- Modify: `server/app.cjs`
- Test: `server/test/menu-api.test.cjs`

- [ ] **Step 1: Add a failing storage-selection test**

Assert that no `DATABASE_URL` selects JSON storage and that a supplied PostgreSQL connection factory selects PostgreSQL storage.

- [ ] **Step 2: Run the focused tests**

Run: `npm test`

Expected: the new selection test FAILS.

- [ ] **Step 3: Implement PostgreSQL storage**

Initialize:

```sql
CREATE TABLE IF NOT EXISTS menu_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  categories JSONB NOT NULL,
  dishes JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Seed row `id = 1` from `server/data/seed-menu.json` only when absent. Use a transaction and `SELECT ... FOR UPDATE` for PATCH and DELETE.

- [ ] **Step 4: Serve the web export**

Serve `dist/` statically and route non-API GET requests to `dist/index.html`. Listen on `0.0.0.0` using `PORT`.

- [ ] **Step 5: Verify tests and production startup**

Run:

```text
npm test
npm run build
npm start
```

Expected: tests pass, export creates `dist`, and `/owner` plus `/api/menu` return HTTP 200.

### Task 3: Shared Frontend Menu Client

**Files:**
- Create: `src/services/menu-api.ts`
- Create: `src/hooks/use-menu.ts`
- Modify: `src/components/tablet-video-menu.tsx`

- [ ] **Step 1: Add the menu client contract**

Define:

```ts
export interface MenuPayload {
  categories: MenuCategory[];
  dishes: Dish[];
}

export function getMenu(): Promise<MenuPayload>;
export function updateDish(dish: Dish): Promise<Dish>;
export function deleteDish(id: string): Promise<void>;
```

Use `EXPO_PUBLIC_API_URL` when set. On local web development, default to `http://127.0.0.1:3001`; in production web, use the current origin.

- [ ] **Step 2: Add the guest fallback hook**

`useMenu()` starts with static `categories` and `dishes`, fetches `/api/menu`, and keeps fallback data if the request fails.

- [ ] **Step 3: Convert the tablet screen**

Replace direct static imports in `TabletVideoMenu` with `useMenu()`. Guard empty categories/dishes so deleting the last item cannot crash the screen.

- [ ] **Step 4: Verify TypeScript**

Run: `npm run typecheck`

Expected: PASS.

### Task 4: Owner Editing And Deletion UI

**Files:**
- Modify: `src/components/owner-dashboard.tsx`

- [ ] **Step 1: Load persisted menu state**

Load `GET /api/menu` on mount, display a compact loading/error state, and keep the existing visual hierarchy.

- [ ] **Step 2: Add row actions**

Add semantic `Редактировать` and `Удалить` buttons to every dish row. Keep them together at the bottom/right of the row without redesigning the page.

- [ ] **Step 3: Add the edit modal**

Use a React Native `Modal` containing controlled fields for the complete `Dish` shape. Represent composition and pairings as comma-separated text; represent add-ons as one `Название | Цена` entry per line.

- [ ] **Step 4: Save and preserve errors**

On `Сохранить`, call `updateDish`. Disable duplicate submission, update the row from the returned dish, and keep entered values visible if the API rejects the request.

- [ ] **Step 5: Confirm deletion**

Show a confirmation modal naming the dish. Delete only after the explicit `Удалить блюдо` action; leave the row intact and show the API error if deletion fails.

- [ ] **Step 6: Verify frontend and API**

Run:

```text
npm run typecheck
npm test
npm run build
```

Expected: all commands exit 0.

### Task 5: End-To-End Smoke Check

**Files:**
- Modify if needed: `README.md`

- [ ] **Step 1: Start production-like local server**

Run: `npm start`

- [ ] **Step 2: Verify owner edit**

Open `/owner`, change a dish title, save, refresh, and confirm the changed title remains.

- [ ] **Step 3: Verify guest synchronization**

Open `/`, refresh, and confirm the changed title is visible.

- [ ] **Step 4: Verify deletion**

Delete a dish on `/owner`, refresh both `/owner` and `/`, and confirm it remains absent.

- [ ] **Step 5: Restore local seed data after smoke testing**

Delete only the generated local store file and restart the server so repository seed data is not changed by verification.

