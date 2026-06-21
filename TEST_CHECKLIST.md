# PhysicsMe Mobile - Pre-Release Testing Checklist

## ✅ Feature Testing

### Home View
- [ ] Books display correctly with covers and emoji icons
- [ ] Recent articles loaded and displayed
- [ ] Can navigate to book view
- [ ] Albert background image loads (parallax-free)
- [ ] Tab bar visible and functional at bottom

### Book View
- [ ] Book info displays (title, color scheme)
- [ ] Chapters list shows with correct order
- [ ] Chapter click navigates to articles list
- [ ] Back button returns to home

### Article View
- [ ] Article title displays
- [ ] Article content loads with proper formatting
- [ ] MathJax equations render correctly
- [ ] Reading time shows if available
- [ ] Images render properly and are responsive
- [ ] Tables display correctly with RTL text alignment
- [ ] Code blocks display with dark background
- [ ] Links are underlined and clickable
- [ ] Sticky header visible at top
- [ ] Back button/navigation link works

### Button Actions (in sticky header)
- [ ] ❓ Questions button opens modal
- [ ] 📐 Problems button opens modal
- [ ] 🧪 Lab button opens modal
- [ ] 💬 Comments button opens modal
- [ ] 📥 Download button (show ⏳ while loading, then save PDF)
- [ ] ★ Bookmark button (fills star when bookmarked, empties when not)

### Questions Modal
- [ ] List of questions displays with difficulty badges
- [ ] Click question to view full content
- [ ] Answer HTML renders correctly
- [ ] MathJax renders in answers
- [ ] Back button returns to list
- [ ] Close button (×) closes modal

### Problems Modal
- [ ] List of problems displays
- [ ] Click problem to view statement and solution
- [ ] Problem and solution HTML render correctly
- [ ] MathJax renders in problems/solutions
- [ ] Back button returns to list
- [ ] Close button works

### Lab Modal
- [ ] Lab description displays
- [ ] Materials list shows (if available)
- [ ] Steps display with numbering
- [ ] Expected result shows (if available)
- [ ] HTML content renders properly
- [ ] Close button works

### Comments Modal
#### Viewing Comments
- [ ] Comments list displays
- [ ] Author name shows
- [ ] Date displays in Persian calendar
- [ ] "منتظر تایید" badge shows for unapproved comments
- [ ] Comment content displays
- [ ] "➕ نظر جدید" button visible

#### Posting Comment
- [ ] Click "➕ نظر جدید" button opens form
- [ ] Name field required (shows error if empty)
- [ ] Email field optional
- [ ] Content field required (shows error if empty)
- [ ] Submit button shows "✓ ارسال نظر"
- [ ] Disabled state shown while posting (shows "در حال ارسال...")
- [ ] Success: Form clears and returns to list
- [ ] Message shows "نظر شما پس از تایید مدیر نمایش داده خواهد شد"

### PDF Export
- [ ] Download button responsive
- [ ] Shows ⏳ while generating PDF
- [ ] PDF downloads with correct filename (slug.pdf)
- [ ] PDF contains article title
- [ ] PDF contains article metadata (date, chapter)
- [ ] PDF contains article content
- [ ] PDF contains source URL
- [ ] Multi-page articles handled correctly

### Bookmarks View
- [ ] Bookmarked articles display
- [ ] Star icon filled for all items
- [ ] Click article to navigate to article view
- [ ] Can unbookmark from article view

### Navigation
- [ ] Previous/Next article navigation works
- [ ] Back button navigates correctly
- [ ] Browser back button works
- [ ] Route parameters preserved when navigating

---

## ✅ Offline Testing

### Setup
- [ ] Start dev server: `npm run dev`
- [ ] Open DevTools (F12)
- [ ] Go to Application > Service Workers
- [ ] Check that Service Worker is registered and active

### Testing
- [ ] Load an article while online
- [ ] Check IndexedDB (Application > Storage > IndexedDB) - should have article cache
- [ ] Go offline (DevTools Network > Offline)
- [ ] Navigate to cached article - should load from cache
- [ ] Show offline indicator (amber warning) at top
- [ ] Try to load new article offline - should show error or loading spinner
- [ ] Go online and verify network request succeeds
- [ ] Offline indicator disappears

---

## ✅ Performance Testing

### Load Time
- [ ] First load (home): < 2 seconds
- [ ] Article load (cached): < 1 second
- [ ] Article load (network): < 3 seconds
- [ ] Modal open: < 500ms
- [ ] PDF generation: < 10 seconds

### Memory
- [ ] No memory leaks after 10+ article views
- [ ] DevTools Memory profiler shows stable usage
- [ ] No continuous growth during extended use

### Bundle Size
```
Check: npm run build

Expected:
- Initial load: ~160KB gzipped
- PDF libs: ~594KB (on-demand)
- Total: ~900KB effective
```

---

## ✅ Mobile-Specific Testing

### Device Testing (Android)
```bash
# Connect phone via USB with developer mode
adb devices  # should show device

# Run on phone:
npx cap run android
```

- [ ] Splash screen appears (1.2s, cream background)
- [ ] Status bar shows with dark text
- [ ] App logo/name visible during startup
- [ ] No crashes on startup
- [ ] Notch/safe areas handled correctly (no cutoff)
- [ ] Statusbar color matches app theme

### Orientation
- [ ] Portrait mode works
- [ ] Landscape mode works
- [ ] Rotation smooth and no flicker
- [ ] Content reflows correctly
- [ ] Modals responsive to rotation

### Touch
- [ ] Buttons responsive to tap
- [ ] Scrolling smooth
- [ ] No double-tap zoom issues
- [ ] Long-press not interfering with functionality

### Network
- [ ] App works on mobile data (4G/5G)
- [ ] App works on WiFi
- [ ] Switching networks mid-session handled gracefully
- [ ] No network errors shown to user (cached or loading state)

---

## ✅ Browser Compatibility

### Desktop Browsers (for QA)
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Responsive Design
- [ ] Mobile (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1024px+ width)

---

## ✅ Accessibility

- [ ] All buttons have proper labels/titles
- [ ] Color contrast meets WCAG standards
- [ ] Text sizes readable (16px minimum)
- [ ] Touch targets adequate (48px+ recommended)
- [ ] No focus trap (keyboard navigation works)
- [ ] RTL text direction correct throughout

---

## ✅ API Testing

### Books Endpoint
```bash
curl https://physicsme.ir/wp-json/pm/v1/books | jq length
# Should return array of books
```

### Article Endpoint
```bash
# Replace {slug} with actual article slug
curl https://physicsme.ir/wp-json/pm/v1/articles/{slug} | jq .title
# Should return article with HTML, prev, next
```

### Questions Endpoint
```bash
curl https://physicsme.ir/wp-json/pm/v1/articles/{slug}/questions | jq length
# Should return array of questions
```

### Comments Endpoint
```bash
# GET comments
curl https://physicsme.ir/wp-json/pm/v1/articles/{slug}/comments

# POST comment (requires moderation)
curl -X POST https://physicsme.ir/wp-json/pm/v1/articles/{slug}/comments \
  -H "Content-Type: application/json" \
  -d '{"author":"Test User","email":"test@example.com","content":"Test comment"}'
```

---

## ✅ Error Handling

- [ ] Network error shows user-friendly message
- [ ] 404 article shows "مقاله پیدا نشد" message
- [ ] Invalid route goes to 404 page
- [ ] API errors don't crash app
- [ ] Graceful fallbacks for missing data

---

## ✅ Security

- [ ] No sensitive data in localStorage (besides auth tokens)
- [ ] API calls use HTTPS
- [ ] No hardcoded credentials in code
- [ ] XSS prevention: HTML content sanitized (using DOMPurify)
- [ ] CSRF tokens handled by API
- [ ] No console errors about blocked resources

---

## ✅ Content Verification

### Persian Language
- [ ] All UI text is in Persian
- [ ] Dates in Persian calendar format
- [ ] Numbers in Persian digits where appropriate
- [ ] RTL text alignment correct (right-aligned)
- [ ] Directional text (عربی, انگلیسی) handled correctly

### Content Display
- [ ] Typography looks correct (Vazirmatn font loads)
- [ ] Colors match design (olive, cream, etc.)
- [ ] Spacing and padding correct
- [ ] Borders and dividers visible
- [ ] Badges and icons display properly

---

## ✅ Final Checklist

- [ ] All tests above pass
- [ ] No console errors (F12)
- [ ] No console warnings (excluding vendor libraries)
- [ ] No TypeScript compilation errors
- [ ] Production build succeeds: `npm run build`
- [ ] APK builds successfully: `./build-apk.sh`
- [ ] APK installs on Android device without errors
- [ ] App runs without crashes on device
- [ ] All features work as documented
- [ ] Performance meets requirements
- [ ] Ready for Google Play Store submission

---

## Sign-Off

- **Tester Name**: _________________
- **Date**: _________________
- **Status**: ☐ PASS ☐ FAIL

**Notes**:
```
[Space for notes on any issues found]
```

---

## Issue Tracking

For any failures above, create an issue with:
1. **Feature**: Which feature failed
2. **Environment**: Device/browser/OS
3. **Steps to Reproduce**: How to trigger the issue
4. **Expected**: What should happen
5. **Actual**: What actually happened
6. **Screenshot/Video**: If applicable
