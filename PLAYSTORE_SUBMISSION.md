# منِ فیزیکی - Google Play Store Submission Guide

## 📋 Submission Checklist

### 1. Developer Account Setup
- [ ] Create Google Play Developer Account (one-time $25 fee)
- [ ] Accept Developer Agreement & Policies
- [ ] Setup Google Play Billing (payment method)
- [ ] Verify identity (ID verification may be required)

**Link**: https://play.google.com/console/developers

### 2. Create App on Play Console

**App Details**:
- **App Name (English)**: PhysicsMe
- **App Name (Persian)**: منِ فیزیکی
- **Default Language**: English
- **App Category**: Education
- **App Type**: Free

**Contact Details**:
- **Developer Email**: hbagheri@glenar.com
- **Developer Phone**: [Add your phone]
- **Developer Address**: [Add your address]
- **Privacy Policy URL**: https://physicsme.ir/privacy (create if needed)

### 3. Build Configuration

**Release APK**:
```
Location: android/app/build/outputs/apk/release/app-release.apk
Size: 6.6 MB
Signed: ✅ Yes (with release keystore)
Min SDK: 23 (Android 5.3)
Target SDK: 35 (Android 15)
Version Code: 1
Version Name: 1.0
```

### 4. App Signing & Security

**Upload Key**:
- Use the release.keystore we created
- Password: PhysicsMe@2024
- Alias: physicalme
- Validity: 10,000 days (until 2053)

> **Important**: Google Play will manage the signing key. Save your keystore in a secure location.

### 5. Store Listing Preparation

#### Short Description (80 characters max)
**English**:
```
Read physics educational content with interactive Q&A and experiments
```

**Persian** (فارسی):
```
خواندن محتوای آموزشی فیزیک با سوالات و آزمایشات تعاملی
```

#### Full Description (4000 characters max)
**English**:
```
منِ فیزیکی (PhysicsMe) is a comprehensive mobile app designed for high school 
physics students to:

📚 Read Articles
- Full-text physics articles with beautiful formatting
- Mathematical equations rendered with MathJax
- High-quality images and diagrams
- Organized by books and chapters

❓ Practice Questions
- Multiple-choice and conceptual questions
- Difficulty levels (easy, medium, hard)
- Instant answer verification
- Detailed explanations

📐 Solve Problems
- Comprehensive problem sets
- Step-by-step solutions
- Variable difficulty levels
- Real-world physics problems

🧪 Conduct Lab Experiments
- Virtual physics experiments
- Interactive demonstrations
- Materials and expected results
- Safe learning environment

💬 Collaborate with Community
- Post questions and comments
- Get help from peers
- Curated community discussions
- Moderated for quality

📥 Download & Share
- Export articles as PDF
- Offline reading support
- Bookmark favorite articles
- Study anytime, anywhere

Features:
✅ Offline Support - Read cached articles without internet
✅ Push Notifications - Stay updated on new content
✅ RTL Support - Full Persian language interface
✅ Responsive Design - Works on all screen sizes
✅ Fast Performance - Optimized for mobile devices
✅ No Ads - Clean, distraction-free learning

Perfect for:
- High school students (Grades 10-12)
- Physics teachers and tutors
- Self-learners and test preparation
- Education in Persian-speaking regions

Content is available in Persian and aligned with Iranian high school curriculum.

Privacy:
- No account required
- No personal data collection
- Offline-first architecture
- Open and transparent

Download now and master physics!
```

**Persian** (فارسی):
```
منِ فیزیکی یک اپلیکیشن موبایلی جامع برای دانش‌آموزان فیزیک دبیرستان است که شامل:

📚 مقالات تعلیمی
- مقالات کامل درس فیزیک با قالب زیبا
- معادلات ریاضی با MathJax
- تصاویر و نمودارهای با کیفیت بالا
- سازماندهی شده بر اساس کتاب‌ها و فصل‌ها

❓ سوالات تمرینی
- سوالات چندگزینه‌ای و مفهومی
- سطح‌های سختی مختلف
- بررسی فوری پاسخ‌ها
- توضیحات تفصیلی

📐 مسائل فیزیک
- مجموعه‌های جامع مسائل
- حل‌های مرحله‌به‌مرحله
- سطح‌های سختی متغیر
- مسائل فیزیک دنیای واقعی

🧪 آزمایشات عملی
- آزمایشات فیزیک مجازی
- نمایش‌های تعاملی
- مواد مورد نیاز و نتایج مورد انتظار
- محیط یادگیری امن

💬 همکاری با جامعه
- پرسش و سوال با دانش‌آموزان دیگر
- دریافت کمک از همتایان
- بحث‌های داخل جامعه
- نظارت شده برای کیفیت

📥 دانلود و اشتراک
- صادر کردن مقالات به PDF
- خواندن آفلاین
- ذخیره مقالات مورد علاقه
- مطالعه هر زمان و هر جا

ویژگی‌ها:
✅ پشتیبانی آفلاین - خواندن مقالات ذخیره شده بدون اینترنت
✅ اطلاع‌رسانی - بروزرسانی درباره محتوای جدید
✅ پشتیبانی RTL - رابط کاربری کامل به فارسی
✅ طراحی واکنش‌پذیر - در تمام اندازه‌های صفحه کار می‌کند
✅ عملکرد سریع - بهینه‌سازی شده برای دستگاه‌های موبایل
✅ بدون تبلیغات - محیط یادگیری تمیز و بدون حواس‌پرتی

مناسب برای:
- دانش‌آموزان دبیرستانی (دهم تا دوازدهم)
- معلمان و مربیان فیزیک
- خودآموزان و آمادگی برای امتحانات
- تحصیل در مناطق فارسی‌زبان

محتوا به‌زبان فارسی است و با برنامه درسی دبیرستان ایران هماهنگ است.

حریم خصوصی:
- نیاز به حساب کاربری نیست
- جمع‌آوری داده شخصی نیست
- معماری آفلاین‌اول
- باز و شفاف

همین الآن دانلود کنید و فیزیک را بیاموزید!
```

#### App Icon
- **Size**: 512 x 512 pixels
- **Format**: PNG
- **Features**: Circle logo with "منِ فیزیکی" or physics symbol
- **Color**: Use olive green (#5B6E32) as primary color

#### Screenshots (6-8 required)
Create screenshots showing:
1. **Home Screen** - Books and recent articles
2. **Article View** - Full article with MathJax
3. **Questions** - Q&A modal with answers
4. **Problems** - Problem sets and solutions
5. **Lab** - Virtual experiments
6. **Comments** - Community Q&A
7. **PDF Download** - Export functionality
8. **Bookmarks** - Saved articles

**Screenshot Specifications**:
- **Size**: 1080 x 1920 pixels (9:16 ratio)
- **Format**: PNG or JPG
- **Include**: Feature callouts and Persian text
- **Top Text**: Feature title (e.g., "Read Physics Articles")
- **Bottom Text**: Brief description

#### Feature Graphic
- **Size**: 1024 x 500 pixels
- **Format**: PNG or JPG
- **Shows**: App hero image with book/physics theme

#### Privacy Policy
Create and host at: `https://physicsme.ir/privacy`

**Key Sections**:
- What data is collected (none, or basic analytics)
- How data is used
- User rights
- Contact information
- Compliance with laws

#### Content Rating Questionnaire
**Category**: Education
**Ratings**:
- Violence: None
- Sexual Content: None
- Profanity: None
- Alcohol/Drugs: None
- Overall Rating: 4+ (All audiences)

### 6. APK Upload Process

1. **Go to Play Console**
   - https://play.google.com/console
   - Select your app
   - Navigate to "Release" → "Testing" → "Internal Testing"

2. **Upload Release APK**
   ```
   File: android/app/build/outputs/apk/release/app-release.apk
   Size: 6.6 MB
   Version Code: 1
   Version Name: 1.0
   ```

3. **Add Release Notes**
   ```
   English:
   "Initial release with articles, Q&A, problems, lab experiments, and offline support"
   
   Persian (فارسی):
   "انتشار نسخه اول با مقالات، سوالات، مسائل، آزمایشات و پشتیبانی آفلاین"
   ```

### 7. Testing

**Internal Testing** (Week 1):
- Invite 5-10 trusted testers
- Gather feedback on:
  - App stability
  - UI/UX experience
  - Content loading
  - Offline functionality
  - Device compatibility
- Fix any critical issues

**Closed Testing** (Week 2):
- Expand to 50-100 beta testers
- Test on various devices:
  - Low-end Android (SDK 23-28)
  - Mid-range Android (SDK 29-31)
  - High-end Android (SDK 32+)
- Monitor crash reports

### 8. Production Release

**Preparation**:
- [ ] All screenshots in place
- [ ] App icon uploaded
- [ ] Privacy policy published
- [ ] Content rating completed
- [ ] No critical bugs reported
- [ ] Performance acceptable
- [ ] Store listing finalized

**Submission**:
1. Go to "Release" → "Production"
2. Upload APK
3. Review all store listing information
4. Accept Declaration
5. Submit for Review

**Review Process**:
- Google typically reviews within 1-3 days
- May request changes
- Once approved, app goes live

### 9. Post-Launch Monitoring

**First Week**:
- Monitor crash reports
- Check user reviews
- Respond to feedback
- Fix critical issues

**Ongoing**:
- Monthly update cycles
- Add new features based on user feedback
- Fix reported bugs
- Maintain app rating

### 10. Version Updates

**Future Updates**:
```bash
# When ready to release v1.1:
1. Update version in package.json:
   "version": "1.1.0"

2. Update Android version code:
   versionCode = 2  (in android/app/build.gradle)
   versionName = "1.1"

3. Build new release:
   ./build-apk.sh

4. Upload to Play Console
5. Add release notes
6. Submit for review
```

---

## 📞 Support & Resources

**Google Play Console Help**:
- https://support.google.com/googleplay/android-developer

**App Store Listing Best Practices**:
- https://developer.android.com/distribute

**Persian Content Considerations**:
- Ensure RTL text renders correctly
- Use appropriate Persian fonts (Vazirmatn)
- Test on both Persian and English devices

---

## ✅ Final Checklist Before Submission

- [ ] APK built and signed
- [ ] App tested on multiple devices
- [ ] No crashes or critical bugs
- [ ] MathJax equations render correctly
- [ ] Offline support works
- [ ] All 6 features functional
- [ ] Store screenshots prepared
- [ ] Store description localized
- [ ] Privacy policy published
- [ ] Content rating selected
- [ ] Minimum SDK meets requirements
- [ ] Target SDK current (35+)

---

## 🚀 Ready to Submit!

Once all items above are complete, your app is ready for Google Play Store submission. Expected timeline:

- **Weeks 1-2**: Internal testing & fixes
- **Weeks 3-4**: Closed beta testing
- **Week 5**: Production submission & review
- **Week 6**: Live on Play Store!

Good luck! 🎉
