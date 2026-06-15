/**
 * Disk-backed book-content store.
 *
 * Layout under Directory.Data:
 *
 *   books/
 *     <bookSlug>/
 *       manifest.json
 *       articles/
 *         <articleSlug>.json
 *
 *   user_archives/
 *     <bookSlug>.json          ← user data (bookmarks etc.) preserved across book swaps
 *
 * Everything is utf-8 JSON. We DO NOT compress (Capacitor Filesystem doesn't
 * support binary writes well in the v7 line + content is small enough).
 *
 * On the web (`npm run dev`) Capacitor's Filesystem plugin transparently uses
 * IndexedDB, so the same code works in both targets.
 */
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import type { Article, BookManifest } from '@shared/types';

const BOOKS_ROOT = 'books';
const ARCHIVES_ROOT = 'user_archives';

const articlePath  = (book: string, slug: string) => `${BOOKS_ROOT}/${book}/articles/${slug}.json`;
const manifestPath = (book: string)               => `${BOOKS_ROOT}/${book}/manifest.json`;
const archivePath  = (book: string)               => `${ARCHIVES_ROOT}/${book}.json`;

/** Lazy mkdir -p. Capacitor throws if a parent doesn't exist; create them in order. */
async function ensureDir(path: string): Promise<void> {
  try {
    await Filesystem.mkdir({ path, directory: Directory.Data, recursive: true });
  } catch (e) {
    // Code 5 ("Directory exists") is fine on iOS; web doesn't throw.
    const msg = (e as Error).message || '';
    if (!/exist/i.test(msg)) {
      console.warn('[contentStore] mkdir failed', path, msg);
    }
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  // Make sure parent dir exists
  const parent = path.split('/').slice(0, -1).join('/');
  if (parent) await ensureDir(parent);
  await Filesystem.writeFile({
    path,
    directory: Directory.Data,
    encoding: Encoding.UTF8,
    data: JSON.stringify(value),
  });
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    const { data } = await Filesystem.readFile({
      path,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return JSON.parse(data as string) as T;
  } catch (e) {
    // File not found is the common case — return null without noise.
    const msg = (e as Error).message || '';
    if (/not exist|not found|no such/i.test(msg)) return null;
    console.warn('[contentStore] readFile failed', path, msg);
    return null;
  }
}

/* ─────────────────────────  manifest  ───────────────────────── */

export async function saveManifest(bookSlug: string, manifest: BookManifest): Promise<void> {
  await writeJson(manifestPath(bookSlug), manifest);
}

export async function loadManifest(bookSlug: string): Promise<BookManifest | null> {
  return readJson<BookManifest>(manifestPath(bookSlug));
}

/* ─────────────────────────  articles  ───────────────────────── */

export async function saveArticle(bookSlug: string, article: Article): Promise<void> {
  await writeJson(articlePath(bookSlug, article.slug), article);
}

export async function loadArticle(bookSlug: string, slug: string): Promise<Article | null> {
  return readJson<Article>(articlePath(bookSlug, slug));
}

export async function hasArticle(bookSlug: string, slug: string): Promise<boolean> {
  try {
    await Filesystem.stat({ path: articlePath(bookSlug, slug), directory: Directory.Data });
    return true;
  } catch {
    return false;
  }
}

export async function listDownloadedArticles(bookSlug: string): Promise<string[]> {
  try {
    const { files } = await Filesystem.readdir({
      path: `${BOOKS_ROOT}/${bookSlug}/articles`,
      directory: Directory.Data,
    });
    return files
      .map((f) => (typeof f === 'string' ? f : f.name))
      .filter((n) => n.endsWith('.json'))
      .map((n) => n.replace(/\.json$/, ''));
  } catch {
    return [];
  }
}

/* ─────────────────────────  book lifecycle  ───────────────────────── */

/** Delete *all* on-disk content for a book (manifest + articles). User
 *  archives are kept untouched — see archiveUserData(). */
export async function deleteBookContent(bookSlug: string): Promise<void> {
  try {
    await Filesystem.rmdir({
      path: `${BOOKS_ROOT}/${bookSlug}`,
      directory: Directory.Data,
      recursive: true,
    });
  } catch (e) {
    console.warn('[contentStore] deleteBookContent failed', bookSlug, (e as Error).message);
  }
}

/** Best-effort total size on disk for a book, in bytes. Sums article files. */
export async function getBookSizeBytes(bookSlug: string): Promise<number> {
  let total = 0;
  try {
    const { files } = await Filesystem.readdir({
      path: `${BOOKS_ROOT}/${bookSlug}/articles`,
      directory: Directory.Data,
    });
    for (const f of files) {
      const name = typeof f === 'string' ? f : f.name;
      // v7 of @capacitor/filesystem returns ReaddirResult with size on file entries —
      // but fall back to stat() if size is missing.
      if (typeof f !== 'string' && typeof (f as { size?: number }).size === 'number') {
        total += (f as { size: number }).size;
        continue;
      }
      try {
        const st = await Filesystem.stat({
          path: `${BOOKS_ROOT}/${bookSlug}/articles/${name}`,
          directory: Directory.Data,
        });
        total += st.size ?? 0;
      } catch { /* ignore */ }
    }
  } catch { /* directory doesn't exist yet */ }
  return total;
}

/* ─────────────────────────  user-data archive  ─────────────────────────
 * When the student switches books, we keep their *progress* (bookmarks +
 * future experiment results), keyed by the OLD book slug, so coming back
 * later restores their state. The book content itself gets deleted.
 */

export interface UserArchive {
  /** Persisted shape — keep it forward-compatible. */
  version: 1;
  savedAt: string;            // ISO-8601
  bookmarks: unknown[];       // BookmarkItem[] — opaque here to avoid circular deps
  experimentResults?: unknown[];
}

export async function archiveUserData(bookSlug: string, payload: UserArchive): Promise<void> {
  await writeJson(archivePath(bookSlug), payload);
}

export async function loadUserArchive(bookSlug: string): Promise<UserArchive | null> {
  return readJson<UserArchive>(archivePath(bookSlug));
}

export async function deleteUserArchive(bookSlug: string): Promise<void> {
  try {
    await Filesystem.deleteFile({ path: archivePath(bookSlug), directory: Directory.Data });
  } catch { /* archive may not exist */ }
}
