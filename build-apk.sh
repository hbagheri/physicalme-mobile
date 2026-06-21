#!/bin/bash
set -e

echo "🔨 PhysicsMe Mobile - APK Build Script"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build web assets
echo -e "${YELLOW}📦 Step 1: Building web assets...${NC}"
npm run build

# Step 2: Copy web assets to Capacitor
echo -e "${YELLOW}📦 Step 2: Syncing Capacitor...${NC}"
npx cap sync android

# Step 3: Build APK
echo -e "${YELLOW}🏗️  Step 3: Building Android APK...${NC}"
cd android
./gradlew assembleRelease

# Step 4: Locate the APK
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo -e "${GREEN}✓ APK built successfully!${NC}"
    echo -e "${GREEN}Location: $APK_PATH${NC}"
    echo -e "${GREEN}Size: $APK_SIZE${NC}"

    # Create versioned copy
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    VERSIONED_APK="../releases/physicalme-$TIMESTAMP.apk"
    mkdir -p ../releases
    cp "$APK_PATH" "$VERSIONED_APK"
    echo -e "${GREEN}Versioned copy: $VERSIONED_APK${NC}"
else
    echo -e "❌ APK build failed"
    exit 1
fi

cd ..
