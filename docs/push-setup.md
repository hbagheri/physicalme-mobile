# Push notifications — راه‌اندازی FCM

Backend (mu-plugin) و client (Capacitor composable) آماده‌اند، اما برای ارسالِ
واقعی notif به دستگاه‌ها نیاز به یک پروژه Firebase داری.

## ۱. پروژه Firebase بساز

1. برو به <https://console.firebase.google.com>، **Add project**.
2. اسم: مثلاً `physicalme`. Google Analytics لازم نیست.
3. وقتی پروژه ساخته شد، **Project settings → General** را باز کن، **Project ID**
   را یادداشت کن (مثلاً `physicalme-abc12`).

## ۲. Android app را در Firebase ثبت کن

1. در Project settings → **Your apps** → آیکن Android را بزن.
2. **Android package name**: `ir.physicalme.app` (همین `appId` در
   `apps/mobile/capacitor.config.ts`).
3. SHA-1 لازم نیست برای FCM (فقط برای Google Sign-In).
4. دکمه **Register app** → **Download google-services.json**.

فایل را اینجا کپی کن:

```
apps/mobile/android/app/google-services.json
```

این فایل **secret است** — قبلاً در `.gitignore` نیست. مطمئن شو commit نشه.

## ۳. Service account برای backend بساز

1. Project settings → **Service accounts** → **Generate new private key**.
2. فایل JSON دانلود می‌شه.
3. در سرور (داخل کانتینر WordPress) یک‌جای امن کپی کن، مثلاً:
   ```
   physicalme/wp-content/uploads/.pm-fcm-sa.json
   ```
   (مسیر `wp-content/uploads/` با dot-prefix بیرونِ index public قرار نمی‌گیرد —
   Nginx معمولاً dotfile را serve نمی‌کند، ولی برای امنیت بیشتر در یک پوشهٔ
   غیرpublic بگذار).
4. permissions: فقط user که PHP اجرا می‌کند بتواند بخواند (`chmod 600`).

## ۴. سراغ wp-config.php

به `physicalme/wp-config.php` این دو خط را اضافه کن (قبل از `/* That's all */`):

```php
define('PM_FCM_PROJECT_ID',            'physicalme-abc12');
define('PM_FCM_SERVICE_ACCOUNT_JSON',  '/var/www/html/wp-content/uploads/.pm-fcm-sa.json');
```

(مسیر را با مسیر داخل کانتینر تطبیق بده. اگر بیرون container هستی،
bind-mount را در نظر بگیر.)

## ۵. Gradle Android را برای google-services آماده کن

Capacitor's push-notifications plugin به Firebase نیاز دارد، که توسط
`google-services` Gradle plugin اعمال می‌شود.

در `apps/mobile/android/build.gradle` (project-level)، داخل `buildscript.dependencies`:

```gradle
classpath 'com.google.gms:google-services:4.4.2'
```

در `apps/mobile/android/app/build.gradle`، در آخرین خط:

```gradle
apply plugin: 'com.google.gms.google-services'
```

سپس rebuild:

```bash
cd apps/mobile
npm run cap:sync
cd android && ./gradlew assembleDebug
```

## ۶. تست end-to-end

1. اپ را روی device نصب کن.
2. برو به تنظیمات → **اعلان‌ها** → toggle را روشن کن.
   - اولین بار permission می‌خواهد.
   - بعد از grant، تو logcat (`adb logcat | grep Capacitor/Console`)
     باید `[push] subscribed XXXXX…` ببینی.
3. روی wp-admin از endpoint تست استفاده کن:
   ```bash
   curl -X POST https://physicsme.ir/wp-json/pm/v1/push/test \
     -u 'admin:APP_PASSWORD' \
     -H 'Content-Type: application/json' \
     -d '{"title":"سلام","body":"تست notif","slug":""}'
   ```
   (با Application Password از پروفایلِ wp-admin).
4. روی device notification باید بیاد.
5. tap → اپ باز شود روی همان مقاله (اگر `slug` پاس داده باشی).

## ۷. تستِ گردش publish-trigger

یک مقالهٔ جدید با CPT `article` publish کن (مثلاً از CLI markdown importer).
~30 ثانیه بعد cron تیک می‌خورَد و notif به همهٔ subscribers می‌رود. در
`debug.log` این خط ظاهر می‌شود:

```
[pm_push] article=my-slug sent=N removed=M
```

## Troubleshooting

- **No notification arriving** → `wp_pm_push_subs` خالی است یا
  `_pm_push_sent` متادیتای قبلی مانع شده. می‌توانی meta را پاک کنی:
  ```sql
  DELETE FROM wp_postmeta WHERE meta_key='_pm_push_sent' AND post_id=NNN;
  ```
- **`UNREGISTERED` در debug.log** → token دیگه valid نیست؛ کد به‌طور خودکار از
  DB حذف می‌کند.
- **`Token exchange failed`** → service account JSON path اشتباه است یا
  permissions ندارد.

## Database

جدول خودش وقتی plugin اولین بار لود می‌شود ساخته می‌شود:

```sql
SELECT * FROM wp_pm_push_subs;
```

Schema:

```
id          BIGINT       primary key
token       VARCHAR(512) unique
platform    VARCHAR(16)  android | ios | web
lang        VARCHAR(8)   default 'fa'
created_at  DATETIME
last_seen   DATETIME
```
