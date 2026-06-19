# Owner Menu Management Design

## Goal

Turn the existing owner page into a working administration interface where one restaurant can edit and delete dishes. Saved changes immediately update the menu shown to guests.

## Scope

This phase includes:

- an Express API deployed as one Railway service;
- PostgreSQL for menu data;
- owner controls for editing and deleting dishes;
- immediate menu delivery to the tablet application after every successful change.

Adding dishes, category management, and uploading video files are outside this first implementation.

Authentication is intentionally excluded at the user's request.

## System Architecture

The project remains one repository with:

- the existing Expo Router application for tablet and web pages;
- a new Express server under `server/`;
- PostgreSQL migrations under `server/migrations/`.

The web owner page and tablet menu call the same Express API. The mobile orders page can continue using demo data until the orders backend is implemented separately.

## Railway Deployment

Railway runs one Node.js service for the API and static web output. The service connects to a Railway PostgreSQL database through `DATABASE_URL`.

Required environment variables:

```text
DATABASE_URL
PORT
```

When `DATABASE_URL` is absent in local development, the server uses a safe local JSON storage file so the application remains usable without external credentials.

## Data Model

### Categories

- `id`
- `title`
- `position`
- `created_at`
- `updated_at`

### Dishes

- `id`
- `category_id`
- `title`
- `price`
- `video_url`
- `short_description`
- `composition`
- `calories`
- `protein`
- `fat`
- `carbs`
- `story`
- `position`
- `created_at`
- `updated_at`

Composition is stored as a PostgreSQL text array. Prices are stored as integer rubles for compatibility with the current application.

### Add-ons

- `id`
- `dish_id`
- `title`
- `price`
- `position`

### Pairings

Pairings are dish-to-dish relationships:

- `dish_id`
- `paired_dish_id`
- `position`

## Owner Interface

The existing compact owner list remains recognizable. Each dish row receives:

- `Редактировать`;
- `Удалить`.

Editing opens a focused form with:

- name;
- price;
- video URL;
- short description;
- composition;
- calories, protein, fat, and carbohydrates;
- story/about text;
- editable add-ons and prices;
- paired dish selection;
- `Сохранить`.

The interface remains compact and operational. It does not use nested cards or a marketing-style layout.

Deletion always requires a confirmation dialog naming the dish. The row remains visible if deletion fails.

## Update Workflow

1. The owner edits a dish and presses `Сохранить`.
2. The server validates and persists the complete dish.
3. The owner page refreshes its menu state.
4. The guest menu fetches the latest saved menu when opened or refreshed.

There is no draft or publication layer in this phase.

## API

```text
GET    /api/menu
PATCH  /api/admin/dishes/:id
DELETE /api/admin/dishes/:id
```

Responses preserve the existing frontend `MenuCategory` and `Dish` shapes where practical.

## Error Handling

- The API returns JSON errors with a stable `code`, human-readable `message`, and optional field errors.
- Database writes use transactions where multiple tables change together.
- The owner page keeps unsaved form values if an API request fails.
- The tablet falls back to existing local demo menu data if the API is unavailable.
- A failed deletion leaves the dish visible and shows a clear error.

## Verification

Automated checks will cover:

- dish editing and deletion;
- validation failures;
- persisted menu response shape;
- local JSON fallback storage;
- frontend TypeScript;
- production web export.

A local smoke test will edit a dish, fetch the updated menu, delete the dish, and confirm that it is absent from the next menu response.
