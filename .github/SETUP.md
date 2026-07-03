# CI Setup

Steps you (the maintainer) need to do once to enable the `Build APK` workflow.

## 1. Add the keystore secret

The signing keystore lives outside git (gitignored). CI needs a base64 copy uploaded as an Actions secret.

```bash
# From your local machine, with the keystore in the current directory:
gh secret set ANDROID_KEYSTORE_BASE64 \
  --repo hbagheri/physicsme-mobile \
  --body "$(base64 -w0 android/app/release.keystore)"
```

If the command fails with a 403 about scopes, refresh gh auth first:

```bash
gh auth refresh -h github.com -s admin:repo_hook,workflow
```

## 2. Trigger a release

```bash
git tag v0.1.1
git push origin v0.1.1
```

That fires the workflow. Watch it here:
https://github.com/hbagheri/physicsme-mobile/actions

On success, the APK is attached to the GitHub Release page:
https://github.com/hbagheri/physicsme-mobile/releases

## 3. Mirror to physicsme.ir/downloads/

After the release is published, run this on the host serving physicsme.ir (currently the dev machine):

```bash
./scripts/mirror-to-site.sh
```

It pulls the latest release, drops the APK into `wordpress/physicalme/downloads/`, and bumps the `pm_app_version` WP option so existing installs learn about the new version on next cold start.

Verify:

```bash
curl -s https://physicsme.ir/wp-json/pm/v1/app-version | jq
```

You should see the new `latest` version.

---

## Enabling push notifications (Firebase / FCM)

Push notifications need Firebase Cloud Messaging. Without this, the app's Settings toggle silently fails (defensive guards in `usePushNotifications.ts` catch the crash but the toggle stays off).

### Step 1 — Create the Firebase project

1. Go to https://console.firebase.google.com and click **Add project**.
2. Name it whatever (e.g. `physicalme-mobile`).
3. Google Analytics can be disabled — not used by FCM.

### Step 2 — Add an Android app to the project

1. In the project overview, click the **Android** icon (`Add app`).
2. Fill in:
   - **Android package name**: `ir.physicalme.app`
   - **App nickname** (optional): `منِ فیزیکی`
   - **Debug signing certificate SHA-1**: paste the value below.

**SHA-1 of the release keystore** (physicsme-mobile signing key):

```
4E:5C:CE:60:5A:5B:3D:19:73:E5:E7:59:AB:90:01:B6:48:D2:B6:89
```

**SHA-256 of the release keystore** (add this too if Firebase asks):

```
D7:62:AB:36:D6:FF:5B:01:2B:F2:77:AD:C2:23:91:5A:36:B7:98:73:7D:69:B4:52:DD:2F:2B:16:64:5C:12:7E
```

3. Click **Register app**.

### Step 3 — Download `google-services.json`

Firebase gives you a `google-services.json` file. Save it to:

```
android/app/google-services.json
```

That file is **gitignored** — don't commit it. It contains project IDs and API keys scoped to your Firebase project.

### Step 4 — Also add it as a CI secret

So CI-built APKs have FCM enabled too:

```bash
gh secret set GOOGLE_SERVICES_JSON \
  --repo hbagheri/physicsme-mobile \
  --body "$(cat android/app/google-services.json)"
```

The workflow already knows to restore it (`Restore google-services.json (optional)` step); if the secret is missing, the build proceeds without FCM.

### Step 5 — Test locally

```bash
npm run build && npx cap sync android
cd android && ./gradlew assembleRelease --no-daemon
```

Build should succeed with the `com.google.gms.google-services` plugin now applying (the log line "google-services.json not found..." disappears).

Install the APK on a phone, open Settings, toggle push notifications on — it should register a token (visible in `adb logcat | grep '\[push\]'`) and POST it to `https://physicsme.ir/wp-json/pm/v1/push/subscribe`.

### Step 6 (optional) — sending a notification

The tokens are stored in the `pm_push_tokens` WP option. To actually send a notification, you'll need a server-side sender that talks to Firebase HTTP v1 API (needs a service-account JSON from Firebase → Project Settings → Service accounts). That's not built yet — see the follow-ups section in the memory.
