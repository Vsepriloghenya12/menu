# Owner Menu Management Design

## Goal

Turn the existing owner page into a working administration interface where one restaurant can create and edit its video menu, upload videos from a computer, and publish changes to tablets.

## Scope

This phase includes:

- an Express API deployed as one Railway service;
- PostgreSQL for menu and publication data;
- a Railway Volume for uploaded video files;
- owner controls for categories, dishes, nutrition, ingredients, add-ons, and pairings;
- draft saving and explicit menu publication;
- published menu delivery to the tablet application;
- video streaming with HTTP Range support.

Authentication is intentionally excluded at the user's request.

## System Architecture

The project remains one repository with:

- the existing Expo Router application for tablet and web pages;
- a new Express server under `server/`;
- PostgreSQL migrations under `server/migrations/`;
- uploaded video files stored beneath a configurable Railway Volume mount path.

The web owner page calls the Express API. The tablet menu calls only published-menu endpoints. The mobile orders page can continue using demo data until the orders backend is implemented separately.

## Railway Deployment

Railway runs one Node.js service for the API and static web output. The service connects to a Railway PostgreSQL database through `DATABASE_URL`.

The Railway Volume is mounted at the path configured by `VIDEO_STORAGE_PATH`, for example `/data/videos`. The server creates the directory if it does not exist.

Required environment variables:

```text
DATABASE_URL
VIDEO_STORAGE_PATH=/data/videos
PORT
PUBLIC_BASE_URL
```

Local development uses a local video directory when `VIDEO_STORAGE_PATH` is absent. Missing Railway configuration must not prevent local startup.

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
- `video_key`
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

### Publications

Each publication stores an immutable JSON snapshot of the complete menu:

- `id`
- `version`
- `menu_snapshot`
- `published_at`

Draft data remains in the category, dish, add-on, and pairing tables. The tablet reads only the latest publication snapshot.

## Owner Interface

The desktop owner page uses a three-column work layout:

1. Category navigation with add, rename, delete, and ordering controls.
2. Dish list for the selected category with add, select, delete, and ordering controls.
3. Dish editor with:
   - name;
   - price;
   - video upload from the computer;
   - upload progress and current video status;
   - short description;
   - composition;
   - calories, protein, fat, and carbohydrates;
   - story/about text;
   - editable add-ons and prices;
   - paired dish selection;
   - `Save draft`.

The top toolbar contains:

- draft state indicator;
- last publication time;
- `Publish menu`.

The interface remains compact and operational. It does not use nested cards or a marketing-style layout.

## Draft Workflow

Category and dish changes are saved as draft data through the API. Saving a dish validates required fields but does not change what tablets display.

Publishing:

1. The owner presses `Publish menu`.
2. The server validates all draft categories and dishes.
3. The server builds the complete menu response shape expected by the tablet.
4. The server writes an immutable publication snapshot in one database transaction.
5. Tablets receive the new version on their next menu refresh.

If validation fails, nothing is published and the owner receives field-specific errors.

## Video Upload And Delivery

The owner selects a video file from the computer. The browser uploads it as multipart form data to the API.

The server:

1. validates that the upload is a supported video type;
2. applies a configurable maximum size;
3. creates a generated file key rather than trusting the original filename;
4. writes the file to the Railway Volume;
5. stores the file key on the draft dish;
6. removes a replaced file only when it is no longer referenced.

Video responses support:

- `Content-Type`;
- `Content-Length`;
- `Accept-Ranges: bytes`;
- `206 Partial Content`;
- valid `Content-Range` handling.

The published menu exposes a server video URL derived from `PUBLIC_BASE_URL` and `video_key`.

## API

Draft administration:

```text
GET    /api/admin/menu
POST   /api/admin/categories
PATCH  /api/admin/categories/:id
DELETE /api/admin/categories/:id
POST   /api/admin/dishes
PATCH  /api/admin/dishes/:id
DELETE /api/admin/dishes/:id
POST   /api/admin/dishes/:id/video
POST   /api/admin/publish
```

Tablet:

```text
GET /api/menu/published
GET /api/videos/:videoKey
```

Responses preserve the existing frontend `MenuCategory` and `Dish` shapes where practical.

## Error Handling

- The API returns JSON errors with a stable `code`, human-readable `message`, and optional field errors.
- Database writes use transactions where multiple tables change together.
- Failed uploads remove partially written files.
- Missing videos return `404`.
- Invalid Range headers return `416`.
- The owner page keeps unsaved form values if an API request fails.
- The tablet falls back to existing local demo menu data if the API is unavailable.

## Verification

Automated checks will cover:

- draft category and dish CRUD;
- validation failures;
- publication snapshot creation;
- published menu response shape;
- upload validation;
- HTTP Range video responses;
- frontend TypeScript;
- production web export.

A local smoke test will create a category and dish, upload a small fixture video, publish the menu, and fetch the published response.
