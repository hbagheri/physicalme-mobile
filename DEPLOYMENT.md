# PhysicsMe Mobile App - Deployment Guide

## Overview

PhysicsMe is a mobile educational app that allows students to read physics articles, solve problems, conduct virtual labs, and ask questions. Built with Vue 3, TypeScript, and Capacitor, it works on both Android and iOS with offline support.

## Features

### ✅ Completed Features

1. **Articles** - Full-text articles with MathJax rendering
2. **Questions** - Interactive Q&A with difficulty levels
3. **Problems** - Problem sets with solutions
4. **Lab Experiments** - Virtual lab simulations with steps
5. **Comments & Q&A** - Community discussion with moderation
6. **PDF Export** - Download articles as PDF
7. **Offline Support** - Service Worker + IndexedDB caching
8. **Bookmarks** - Save articles for later
9. **Push Notifications** - Get notified of new content
10. **RTL Support** - Full Persian language support

## Tech Stack

- **Frontend**: Vue 3, TypeScript, Tailwind CSS
- **Build**: Vite with optimized chunking
- **State Management**: Pinia
- **Mobile**: Capacitor (Android + iOS)
- **API**: REST (WordPress wp-json API)
- **Offline**: Service Worker + IndexedDB

## Project Structure

```
mobile/
├── src/
│   ├── views/              # Page components (ArticleView, BookView, etc)
│   ├── components/         # Reusable components (modals, buttons)
│   ├── stores/             # Pinia state management
│   ├── composables/        # Composition API utilities
│   ├── api/                # API client
│   ├── shared/             # Types and constants
│   └── main.ts
├── android/                # Capacitor Android project
├── dist/                   # Built web assets
├── capacitor.config.ts     # Capacitor configuration
└── vite.config.ts          # Vite build configuration
```

## Development

### Prerequisites

```bash
# Node.js 18+
node --version

# Android SDK (for APK builds)
which sdkmanager
```

### Setup

```bash
cd mobile

# Install dependencies
npm install

# Start dev server
npm run dev
# Opens http://localhost:5173

# Type check
npm run type-check

# Build for production
npm run build
```

## Building APK for Android

### One-Command Build

```bash
./build-apk.sh
```

This script:
1. Builds web assets with Vite
2. Syncs files to Capacitor
3. Builds signed APK using Gradle
4. Outputs to `android/app/build/outputs/apk/release/app-release.apk`

### Manual Build Steps

```bash
# 1. Build web assets
npm run build

# 2. Sync to Capacitor
npx cap sync android

# 3. Build signed APK
cd android
./gradlew assembleRelease
cd ..

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

### Signing Configuration

The release keystore is located at `android/app/release.keystore`
- **Password**: PhysicsMe@2024
- **Alias**: physicalme
- **Valid for**: 10,000 days (expires 2053)

## Deployment to Google Play Store

1. **Create Google Play Developer Account**
   - https://play.google.com/console/developers
   - Setup Google Play projects

2. **Create Release APK**
   ```bash
   ./build-apk.sh
   ```

3. **Upload to Google Play**
   - Go to Play Console > Internal testing / Closed testing
   - Upload APK in `android/app/build/outputs/apk/release/app-release.apk`
   - Add release notes in Persian and English
   - Test on devices
   - Promote to production

4. **App Metadata**
   - **App Name**: منِ فیزیکی
   - **Package ID**: ir.physicalme.app
   - **Min SDK**: 21 (Android 5.0)
   - **Target SDK**: 34 (Android 14)

## iOS Build

Requires macOS with Xcode installed.

```bash
# Sync to Capacitor
npx cap sync ios

# Build with Xcode
npx cap open ios

# In Xcode:
# 1. Select "PhysicsMe App" target
# 2. Select "Generic iOS Device" or your device
# 3. Product > Build
# 4. Product > Archive (for App Store)
```

## Performance Optimizations

- **Bundle Splitting**: PDF libraries loaded on-demand (~594KB separate chunk)
- **Lazy Loading**: Modal components only load when opened
- **Compression**: gzip enabled, minimal runtime overhead
- **Caching**: Aggressive caching with Service Worker

### Bundle Stats

```
Initial load: ~160KB (gzipped)
PDF library: ~594KB (loaded on demand)
Total: ~900KB (typical user won't load all at once)
```

## Environment Variables

Create `.env.local` for development (not committed):

```env
# WordPress API endpoint (default: https://physicsme.ir)
VITE_API_BASE=https://physicsme.ir/wp-json/pm/v1

# For local development:
VITE_API_BASE=http://localhost:8000/wp-json/pm/v1
```

## API Endpoints

Base: `/wp-json/pm/v1`

### Books
- `GET /books` - All books

### Chapters
- `GET /books/{bookSlug}/chapters` - Chapters in a book

### Articles
- `GET /chapters/{chapterSlug}/articles` - Articles in chapter
- `GET /articles/{slug}` - Single article with HTML
- `GET /recent?limit=12` - Recent articles

### Questions
- `GET /articles/{slug}/questions` - Questions for article
- `GET /questions/{id}` - Single question with answer

### Problems
- `GET /articles/{slug}/problems` - Problems for article
- `GET /problems/{id}` - Single problem with solution

### Lab
- `GET /articles/{slug}/lab` - Lab experiments for article
- `GET /lab/{id}` - Single lab with description & steps

### Comments
- `GET /articles/{slug}/comments` - Approved comments
- `POST /articles/{slug}/comments` - Submit comment (pending moderation)

### Push Notifications
- `POST /push/subscribe` - Subscribe to push notifications
- `POST /push/unsubscribe` - Unsubscribe from push

## Testing Checklist

### Functionality
- [ ] Load articles with MathJax rendering
- [ ] Open questions modal and view answers
- [ ] Open problems modal and view solutions
- [ ] Open lab modal and view experiments
- [ ] Post comments (must be approved to show)
- [ ] Download article as PDF
- [ ] Bookmark articles
- [ ] Navigate between articles (prev/next)
- [ ] Search functionality

### Offline
- [ ] Load previously cached articles offline
- [ ] Show "offline" indicator when network unavailable
- [ ] Service Worker installed and active

### Performance
- [ ] App starts in <2 seconds
- [ ] Article images load quickly
- [ ] Smooth scrolling
- [ ] No memory leaks after opening many articles

### Mobile-Specific
- [ ] Status bar styling (dark background)
- [ ] Splash screen appears on startup
- [ ] Notches/safe areas handled correctly
- [ ] Portrait and landscape orientations work
- [ ] Touch interactions responsive

## Troubleshooting

### Build Fails
```bash
# Clean and rebuild
rm -rf node_modules dist android/app/build
npm install
npm run build
npx cap sync android
```

### App Crashes on Startup
1. Check browser console for errors: `npm run dev`
2. Verify API endpoint is correct
3. Check network tab for failed requests

### MathJax Not Rendering
- Clear browser cache (Service Worker)
- Verify article HTML contains MathJax markers
- Check browser console for errors

### PDF Export Too Large
- Images in articles may be high resolution
- Consider optimizing image sizes in WordPress

## Support

For issues or questions:
1. Check browser console (F12)
2. Check network requests
3. Review error messages
4. Check API responses

## Version History

**v1.0** - Initial release with all core features
- Articles, Q&A, Problems, Lab, Comments
- PDF export, Bookmarks, Offline support
- Push notifications, RTL support
