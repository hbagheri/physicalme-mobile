# CI Setup

Steps you (the maintainer) need to do once to enable the `Build APK` workflow.

## 1. Add the keystore secret

The signing keystore lives outside git (gitignored). CI needs a base64 copy uploaded as an Actions secret.

```bash
# From your local machine, with the keystore in the current directory:
gh secret set ANDROID_KEYSTORE_BASE64 \
  --repo hbagheri/physicalme-mobile \
  --body "$(base64 -w0 android/app/release.keystore)"
```

If the command fails with a 403 about scopes, refresh gh auth first:

```bash
gh auth refresh -h github.com -s repo,workflow
```

## 2. Trigger a release

```bash
git tag v0.1.1
git push origin v0.1.1
```

That fires the workflow. Watch it here:
https://github.com/hbagheri/physicalme-mobile/actions

On success, the APK is attached to the GitHub Release page:
https://github.com/hbagheri/physicalme-mobile/releases

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

## Optional: FCM (push notifications)

Push notifications need Firebase Cloud Messaging. Until you set this up, the app's Settings toggle will silently fail (defensive guards keep it from crashing — see `usePushNotifications.ts`).

1. Create a Firebase project → https://console.firebase.google.com
2. Add an Android app with package `ir.physicalme.app`
3. Download `google-services.json` → place in `android/app/` (gitignored)
4. Also add it as a CI secret if you want CI builds to have push:
   ```bash
   gh secret set GOOGLE_SERVICES_JSON --body "$(cat android/app/google-services.json)"
   ```
   Then update the workflow to restore it before build.
