/**
 * useChapterWidgets — discover the widget URLs embedded inside a chapter's
 * downloaded articles, dedup them, and return a small Widget[] suitable for
 * a "lab list" UI.
 *
 * Source of truth: <iframe src="…/widgets/<name>.html"> tags in article.html.
 * We don't hit the server — everything comes from the disk-cached articles
 * the downloader already saved, so this works offline.
 */
import type { ChapterWithArticles } from '@shared/types';
import { loadArticle } from '@/services/contentStore';

export interface ExperimentWidget {
  /** Full URL of the widget HTML (absolute or relative). */
  url: string;
  /** Slug derived from the filename, e.g. "resonance-driver". */
  slug: string;
  /** Human title (best-effort, derived from the slug). */
  title: string;
  /** Chapter the widget came from. */
  chapterSlug: string;
  /** Articles in this chapter that embed the widget. */
  articleSlugs: string[];
}

const IFRAME_RE = /<iframe[^>]*\bsrc=["']([^"']+\/widgets\/[\w-]+\.html[^"']*)["']/gi;

/** Convert "resonance-driver" → "Resonance Driver" (cosmetic). */
function prettifyTitle(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b(\w)/g, (m) => m.toUpperCase())
    .trim();
}

/** Pull "<name>" out of "…/widgets/<name>.html". */
function widgetSlug(url: string): string {
  const m = url.match(/\/widgets\/([\w-]+)\.html/);
  return m ? m[1] : url;
}

/** Discover widgets across an entire book by walking on-disk articles. */
export async function loadWidgetsForBook(
  bookSlug: string,
  chapters: ChapterWithArticles[],
): Promise<Record<string, ExperimentWidget[]>> {
  const out: Record<string, ExperimentWidget[]> = {};
  for (const ch of chapters) {
    out[ch.slug] = await loadWidgetsForChapter(bookSlug, ch);
  }
  return out;
}

export async function loadWidgetsForChapter(
  bookSlug: string,
  chapter: ChapterWithArticles,
): Promise<ExperimentWidget[]> {
  // url → ExperimentWidget (so we dedup across multiple articles)
  const byUrl = new Map<string, ExperimentWidget>();
  for (const summary of chapter.articles) {
    const article = await loadArticle(bookSlug, summary.slug);
    if (!article?.html) continue;
    let match: RegExpExecArray | null;
    IFRAME_RE.lastIndex = 0;
    while ((match = IFRAME_RE.exec(article.html))) {
      const rawUrl = match[1];
      const slug = widgetSlug(rawUrl);
      const existing = byUrl.get(rawUrl);
      if (existing) {
        if (!existing.articleSlugs.includes(summary.slug)) {
          existing.articleSlugs.push(summary.slug);
        }
      } else {
        byUrl.set(rawUrl, {
          url: rawUrl,
          slug,
          title: prettifyTitle(slug),
          chapterSlug: chapter.slug,
          articleSlugs: [summary.slug],
        });
      }
    }
  }
  return Array.from(byUrl.values());
}
