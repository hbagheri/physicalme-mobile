/**
 * Shared types — contract between WordPress API plugin and the mobile app.
 * Keep this file FLAT, no runtime imports, no Vue/React types.
 */

export interface Book {
  slug: string;
  label: string;
  emoji: string;
  color1: string;
  color2: string;
  accent: string;
  chapterCount: number;
  lessonCount: number;
  url: string;
}

export interface Chapter {
  slug: string;
  bookSlug: string;
  title: string;
  order: number;
  lessonCount: number;
}

export interface ArticleSummary {
  slug: string;
  title: string;
  chapterSlug: string;
  bookSlug: string;
  excerpt: string;
  readingTime?: string;
  publishedAt: string;     // ISO-8601
  thumbUrl?: string;
}

export interface Article extends ArticleSummary {
  html: string;            // rendered article body (MathJax markers preserved)
  references?: ArticleRef[];
  prev?:    { slug: string; title: string };
  next?:    { slug: string; title: string };
}

export interface ArticleRef {
  kind: 'wikipedia' | 'youtube' | 'aparat' | 'khan' | 'phet' | 'other';
  title: string;
  url: string;
  lang?: 'fa' | 'en';
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  topics?: string[];       // e.g. ['new-articles', 'updates']
}
