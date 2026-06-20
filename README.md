# منِ فیزیکی — Mobile

Capacitor 7 + Vue 3 + TypeScript + Tailwind + Pinia.

## Dev

```bash
npm install            # from repo root (workspaces)
npm run dev            # web preview at http://localhost:5173
```

## Build native

```bash
npm run cap:sync                   # build web + sync to native projects
npx cap add android                # first time only
npx cap open android               # open Android Studio
npx cap add ios                    # iOS (needs macOS)
```

## Configuration

`VITE_API_BASE` env var points to the REST API root.
Default: `https://physicsme.ir/wp-json/pm/v1`

## Architecture

```
src/
├── main.ts                 ← bootstrap
├── App.vue                 ← root with RouterView
├── router.ts               ← Vue Router config
├── api/client.ts           ← typed REST client
├── views/                  ← page-level components
└── components/             ← shared components
```

Shared types live in `../../shared/src/types.ts` (aliased as `@shared`).

## Native plugins used

- `@capacitor/push-notifications` — FCM/APNs
- `@capacitor/preferences` — typed key/value store (replaces localStorage)
- `@capacitor/splash-screen` — branded launch
- `@capacitor/status-bar` — tinted status bar
- `@capacitor/app` — back button, deep links
