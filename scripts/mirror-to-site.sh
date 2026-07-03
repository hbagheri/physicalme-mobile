#!/usr/bin/env bash
# Pull the latest GitHub Release APK, drop it into physicsme.ir/downloads/,
# and bump the pm_app_version WP option so existing installs learn about
# the new version on next cold start.
#
# Run this on the host that serves physicsme.ir (currently the local dev
# machine — WP is mounted from /home/hassan/.../wordpress/physicalme/).
# Can also be wrapped in a systemd timer for full automation.

set -euo pipefail

REPO="${REPO:-hbagheri/physicalme-mobile}"
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

echo "→ updating pm_app_version option (version=${VERSION})"

# Serialize the option as PHP array via a small heredoc; MariaDB stores as text.
# WP will unserialize on read.
PHP_SERIALIZED=$(cat <<EOF
a:6:{s:6:"latest";s:${#VERSION}:"${VERSION}";s:7:"apk_url";s:${#APK_URL}:"${APK_URL}";s:8:"play_url";s:64:"https://play.google.com/store/apps/details?id=ir.physicalme.app";s:9:"changelog";s:${#CHANGELOG}:"${CHANGELOG}";s:13:"min_supported";s:5:"0.1.0";s:11:"released_at";s:${#RELEASED_AT}:"${RELEASED_AT}";}
EOF
)

docker exec -i "${DB_CONTAINER}" mariadb -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" <<SQL
INSERT INTO wp_options (option_name, option_value, autoload)
VALUES ('pm_app_version', '${PHP_SERIALIZED//\'/\'\'}', 'yes')
ON DUPLICATE KEY UPDATE option_value = VALUES(option_value);
DELETE FROM wp_options WHERE option_name LIKE '_transient%pm_api%';
SQL

echo "✓ mirrored ${TAG} → ${DOWNLOADS_DIR}"
echo "✓ pm_app_version bumped to ${VERSION}"
echo
echo "verify: curl -s https://physicsme.ir/wp-json/pm/v1/app-version | jq"
