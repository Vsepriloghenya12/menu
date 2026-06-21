# Video Menu

Expo MVP for a video-first restaurant menu.

## Screens

- `/` - Android tablet menu with full-screen videos, categories, cart, details, add-ons, and pairings.
- `/owner` - desktop web owner view for menu data.
- `/orders` - mobile web view for incoming orders.

## Run

```bash
npm install
npm run server
```

In a second terminal:

```bash
npm run web
```

The local API runs on `http://127.0.0.1:3001`. Without `DATABASE_URL`, changes are stored in the ignored local file `server/data/local-menu.json`.
Without Railway Bucket credentials, uploaded videos are stored in the ignored directory `server/data/local-videos/`.

## Railway

Add a PostgreSQL service and expose its `DATABASE_URL` to the application service. Railway runs:

```bash
npm run build
npm start
```

The Node server serves both the exported web application and the menu API.

When a Railway Bucket is connected through **Add to Service**, the application automatically uses:

```text
AWS_ACCESS_KEY_ID
AWS_DEFAULT_REGION
AWS_ENDPOINT_URL
AWS_S3_BUCKET_NAME
AWS_SECRET_ACCESS_KEY
```

The owner can upload or replace a dish video from `/owner`. Bucket files stay private and are played through temporary presigned URLs.

## Checks

```bash
npm run typecheck
npm run export:web
```

## Android APK

Install and configure EAS, then run:

```bash
npx eas build -p android --profile preview
```

The MVP uses local demo data, so it works without external API keys or backend credentials.
