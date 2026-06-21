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

export interface Question {
  id: number;
  slug: string;
  title: string;
  question: string;            // HTML content of question
  answer: string;              // HTML content of answer
  articleSlug: string;          // parent article
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  publishedAt: string;          // ISO-8601
}

export interface QuestionSummary {
  id: number;
  slug: string;
  title: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  articleSlug: string;
}

export interface Problem {
  id: number;
  slug: string;
  title: string;
  problem: string;            // HTML problem statement
  solution: string;           // HTML solution
  articleSlug: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  publishedAt: string;
}

export interface ProblemSummary {
  id: number;
  slug: string;
  title: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  articleSlug: string;
}

export interface LabExperiment {
  id: number;
  slug: string;
  title: string;
  description: string;           // HTML description
  steps: string[];               // Array of step descriptions
  materials?: string[];          // List of materials needed
  expectedResult?: string;       // HTML expected result
  articleSlug: string;
  publishedAt: string;
}

export interface LabSummary {
  id: number;
  slug: string;
  title: string;
  articleSlug: string;
}

export interface Comment {
  id: number;
  author: string;
  email?: string;
  content: string;
  createdAt: string;
  approved: boolean;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  topics?: string[];       // e.g. ['new-articles', 'updates']
}
