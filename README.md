# Video Menu

Expo MVP for a video-first restaurant menu.

## Screens

- `/` - Android tablet menu with full-screen videos, categories, cart, details, add-ons, and pairings.
- `/owner` - desktop web owner view for menu data.
- `/orders` - mobile web view for incoming orders.

## Run

```bash
npm install
npm run web
```

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
