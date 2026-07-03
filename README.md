# منِ فیزیکی — Mobile

Vue 3 + Capacitor 7 SPA bundled as an Android app. Consumes content from `physicsme.ir` via REST, so most content changes on the site propagate to the app without a rebuild.

Native shell:
- Android via `@capacitor/android` (target of Google Play submissions)
- iOS scaffolding present, not actively shipped

## Dev

```bash
npm install
npm run dev            # web preview at http://localhost:5173
```

## Build native

```bash
npm run cap:sync                   # build web + sync to native projects
npx cap open android               # open Android Studio
./build-apk.sh                     # standalone APK for side-load / physicsme.ir/downloads
```

## Configuration

- `VITE_API_BASE` env var points to the REST API root. Default: `https://physicsme.ir/wp-json/pm/v1`
- CORS on the site accepts both `physicsme.ir` and legacy `physicalme.ir` origins for older installed clients
- `android/app/google-services.json` is NOT in git — required for push notifications; drop it in place after downloading from Firebase console

## API contract with physicsme.ir

This app depends on these endpoints (implemented in `wp-content/mu-plugins/physicalme-api.php` on the site):

| Endpoint | Purpose |
|---|---|
| `GET /wp-json/pm/v1/articles` | Article list |
| `GET /wp-json/pm/v1/article/{slug}` | Full article |
| `GET /wp-json/pm/v1/lessons` | Uni_lesson list (chapters/sections) |
| `GET /wp-json/pm/v1/lesson/{slug}` | Full lesson |
| `GET /wp-json/pm/v1/books` | Homepage book cards (used by BooksMarquee) |
| `GET /wp-json/pm/v1/app-version` | Version-check endpoint; returns `{latest, apk_url, changelog, min_supported}` |
| `POST /wp-json/pm/v1/push/subscribe` | Register FCM token |
| `POST /wp-json/pm/v1/push/unsubscribe` | Drop FCM token |

## Release channels

1. **Google Play** — recommended, primary distribution
2. **Direct APK on `physicsme.ir/downloads/`** — side-load fallback; updated by the GitHub Actions pipeline on tag push

Every release bumps the `pm_app_version` WP option so the version-check endpoint returns the new version to existing installs.

## Constant identifiers — do NOT rename

- Android `applicationId = ir.physicalme.app` (breaks existing Play installs)
- npm package name = `physicalme-mobile`
- Persian brand = `منِ فیزیکی`

Historical: this app was renamed at the domain level from `physicalme.ir` to `physicsme.ir` (301 redirect kept), but internal identifiers still use `physicalme` for backwards compatibility.

## Native plugins used

- `@capacitor/push-notifications` — FCM
- `@capacitor/preferences` — typed key/value store
- `@capacitor/splash-screen` — branded launch
- `@capacitor/status-bar` — tinted status bar
- `@capacitor/app` — back button, deep links, current version query for version-check
