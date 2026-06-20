/**
 * Typed client for the منِ فیزیکی REST API.
 * Endpoints live under /wp-json/pm/v1/ — implemented by server/api-plugin/.
 */
import type { Article, ArticleSummary, Book, Chapter } from '@shared/types';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)
                  ?? 'https://physicsme.ir/wp-json/pm/v1';

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string): Promise<T> {
  const url = API_BASE + path;
  console.log('[pmApi] fetch', url);
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    console.log('[pmApi] response', res.status, url);
    if (!res.ok) throw new ApiError(`API ${res.status}: ${path}`, res.status);
    return res.json() as Promise<T>;
  } catch (e) {
    console.error('[pmApi] fetch failed', url, (e as Error).message, (e as Error).stack);
    throw e;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = API_BASE + path;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(`API ${res.status}: ${path}`, res.status);
  return res.json() as Promise<T>;
}

export const pmApi = {
  getBooks(): Promise<Book[]> {
    return request<Book[]>('/books');
  },
  getChapters(bookSlug: string): Promise<Chapter[]> {
    return request<Chapter[]>(`/books/${encodeURIComponent(bookSlug)}/chapters`);
  },
  getArticles(chapterSlug: string): Promise<ArticleSummary[]> {
    return request<ArticleSummary[]>(`/chapters/${encodeURIComponent(chapterSlug)}/articles`);
  },
  getArticle(slug: string): Promise<Article> {
    return request<Article>(`/articles/${encodeURIComponent(slug)}`);
  },
  getRecent(limit = 12): Promise<ArticleSummary[]> {
    return request<ArticleSummary[]>(`/recent?limit=${limit}`);
  },
  subscribePush(token: string, platform: 'android' | 'ios' | 'web' = 'android', lang = 'fa'): Promise<{ ok: boolean }> {
    return postJson<{ ok: boolean }>('/push/subscribe', { token, platform, lang });
  },
  unsubscribePush(token: string): Promise<{ ok: boolean }> {
    return postJson<{ ok: boolean }>('/push/unsubscribe', { token });
  },
};

export { ApiError };
