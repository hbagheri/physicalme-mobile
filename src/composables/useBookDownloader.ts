/**
 * useBookDownloader — bulk-fetch every article in a book's manifest and
 * persist it to disk via contentStore.
 *
 * Idempotent: re-running on the same manifest skips articles already on disk.
 * Resumable: a partial run leaves a partial set of files; the next run
 * completes what's missing.
 *
 * Returns reactive progress state so the UI can show a progress bar.
 */
import { reactive } from 'vue';
import type { BookManifest } from '@shared/types';
import { pmApi } from '@/api/client';
import {
  saveManifest, saveArticle, hasArticle, getBookSizeBytes,
} from '@/services/contentStore';

export type DownloaderPhase = 'idle' | 'manifest' | 'articles' | 'done' | 'error';

interface DownloaderState {
  phase: DownloaderPhase;
  total: number;
  completed: number;
  failed: number;
  /** Latest error message, if any (per-article failures don't abort the run). */
  error: string | null;
  /** Total bytes on disk for the book — refreshed at the end. */
  sizeBytes: number;
}

const DEFAULT_CONCURRENCY = 3;

export function useBookDownloader() {
  const state = reactive<DownloaderState>({
    phase: 'idle',
    total: 0,
    completed: 0,
    failed: 0,
    error: null,
    sizeBytes: 0,
  });

  /** Run N async tasks in parallel from a queue. */
  async function runPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
    let cursor = 0;
    async function next(): Promise<void> {
      while (cursor < items.length) {
        const idx = cursor++;
        await worker(items[idx]);
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
  }

  async function download(
    manifest: BookManifest,
    opts: { concurrency?: number; force?: boolean } = {},
  ): Promise<void> {
    const bookSlug = manifest.book.slug;
    const concurrency = opts.concurrency ?? DEFAULT_CONCURRENCY;

    state.phase = 'manifest';
    state.error = null;
    state.failed = 0;
    state.completed = 0;

    // 1. Persist the manifest itself
    try {
      await saveManifest(bookSlug, manifest);
    } catch (e) {
      state.phase = 'error';
      state.error = (e as Error).message;
      throw e;
    }

    // 2. Flatten all article slugs
    const allSlugs: string[] = [];
    for (const ch of manifest.chapters) {
      for (const a of ch.articles) allSlugs.push(a.slug);
    }
    state.total = allSlugs.length;

    // Skip ones we already have unless force=true
    const todo: string[] = opts.force
      ? allSlugs
      : (await Promise.all(allSlugs.map(async (s) => ({ s, has: await hasArticle(bookSlug, s) }))))
          .filter((x) => !x.has)
          .map((x) => x.s);
    // The slugs we DON'T touch still count as completed for the progress bar.
    state.completed = allSlugs.length - todo.length;

    // 3. Fetch + save each article
    state.phase = 'articles';
    await runPool(todo, concurrency, async (slug) => {
      try {
        const article = await pmApi.getArticle(slug);
        await saveArticle(bookSlug, article);
        state.completed += 1;
      } catch (e) {
        state.failed += 1;
        state.error = (e as Error).message;
        console.warn('[downloader] article failed', slug, state.error);
      }
    });

    // 4. Compute final size on disk
    state.sizeBytes = await getBookSizeBytes(bookSlug);
    state.phase = 'done';
  }

  function reset() {
    state.phase = 'idle';
    state.total = 0;
    state.completed = 0;
    state.failed = 0;
    state.error = null;
    state.sizeBytes = 0;
  }

  return { state, download, reset };
}
