#!/usr/bin/env bash
# Pull the latest GitHub Release APK, drop it into physicsme.ir/downloads/,
# and bump the pm_app_version WP option so existing installs learn about
# the new version on next cold start.
#
# Run this on the host that serves physicsme.ir (currently the local dev
# machine — WP is mounted from /home/hassan/.../wordpress/physicalme/).
# Can also be wrapped in a systemd timer for full automation.

set -euo pipefail

REPO="${REPO:-hbagheri/physicsme-mobile}"
SITE_ROOT="${SITE_ROOT:-/home/hassan/projects/personal/localWebHosting/wordpress/physicalme}"
DOWNLOADS_DIR="${SITE_ROOT}/downloads"
DB_CONTAINER="${DB_CONTAINER:-wp-db}"
DB_USER="${DB_USER:-physics_user}"
DB_PASS="${DB_PASS:-physics_secure_2026}"
DB_NAME="${DB_NAME:-physicalme}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing: $1"; exit 1; }; }
need gh
need curl
need jq
need docker

mkdir -p "${DOWNLOADS_DIR}"

echo "→ querying latest release from ${REPO}"
LATEST_JSON=$(gh release view --repo "${REPO}" --json tagName,assets,body,publishedAt)
TAG=$(echo "${LATEST_JSON}" | jq -r .tagName)
VERSION="${TAG#v}"
CHANGELOG=$(echo "${LATEST_JSON}" | jq -r .body | head -c 500)
RELEASED_AT=$(echo "${LATEST_JSON}" | jq -r .publishedAt)
LATEST_ASSET=$(echo "${LATEST_JSON}" | jq -r ".assets[] | select(.name==\"physicalme-latest.apk\") | .name" | head -1)

if [ -z "${LATEST_ASSET}" ]; then
  echo "!! no physicalme-latest.apk asset in ${TAG}; skipping"
  exit 1
fi

echo "→ downloading ${TAG} assets"
gh release download "${TAG}" --repo "${REPO}" --pattern 'physicalme-*.apk' --dir "${DOWNLOADS_DIR}" --clobber

APK_URL="https://physicsme.ir/downloads/physicalme-latest.apk"
WP_CONTAINER="${WP_CONTAINER:-wp-physicalme}"

echo "→ updating pm_app_version option (version=${VERSION})"

# Delegate the update to WP itself so it handles serialization, byte-length
# accounting for multi-byte strings (Persian changelog), autoload, and cache
# invalidation correctly. Hand-rolled PHP-serialized strings had off-by-one
# bugs on URL/changelog lengths.
docker exec -e PM_VERSION="${VERSION}" \
            -e PM_APK_URL="${APK_URL}" \
            -e PM_CHANGELOG="${CHANGELOG}" \
            -e PM_RELEASED_AT="${RELEASED_AT}" \
            "${WP_CONTAINER}" php -r '
define("WP_USE_THEMES", false);
$_SERVER["HTTP_HOST"] = "physicsme.ir";
$_SERVER["REQUEST_URI"] = "/";
require "/var/www/html/wp-load.php";
$ok = update_option("pm_app_version", [
    "latest"        => getenv("PM_VERSION"),
    "apk_url"       => getenv("PM_APK_URL"),
    "play_url"      => "https://play.google.com/store/apps/details?id=ir.physicalme.app",
    "changelog"     => getenv("PM_CHANGELOG"),
    "min_supported" => "0.1.0",
    "released_at"   => getenv("PM_RELEASED_AT"),
], true);
delete_transient("pm_api_books_v1");
echo $ok ? "wp update_option OK\n" : "wp update_option no-op (same value)\n";
' 2>&1 | tail -5

echo "✓ mirrored ${TAG} → ${DOWNLOADS_DIR}"
echo "✓ pm_app_version bumped to ${VERSION}"
echo
echo "verify: curl -s https://physicsme.ir/wp-json/pm/v1/app-version | jq"
