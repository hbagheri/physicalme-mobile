/**
 * Article cache — full Article payloads keyed by slug, persisted via
 * @capacitor/preferences for offline reading. Bounded LRU (oldest by
 * cachedAt is evicted when the cap is reached).
 *
 * Pattern used in ArticleView: try get() first for instant paint, then
 * revalidate from network, then set() the fresh copy. If the network call
 * fails but a cached copy was shown, the UI marks it as stale.
 */
import { defineStore } from 'pinia';
import { Preferences } from '@capacitor/preferences';
import type { Article } from '@shared/types';

const STORAGE_KEY = 'pm.articleCache';
const MAX_ENTRIES = 30;

interface CacheEntry {
  article: Article;
  cachedAt: string; // ISO-8601
}

interface State {
  entries: Record<string, CacheEntry>;
  hydrated: boolean;
}

export const useArticleCacheStore = defineStore('articleCache', {
  state: (): State => ({
    entries: {},
    hydrated: false,
  }),

  getters: {
    count: (s) => Object.keys(s.entries).length,
  },

  actions: {
    async hydrate() {
      if (this.hydrated) return;
      try {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        if (value) {
          const parsed = JSON.parse(value) as Record<string, CacheEntry>;
          if (parsed && typeof parsed === 'object') this.entries = parsed;
        }
      } catch (e) {
        console.warn('[articleCache] hydrate failed', e);
      } finally {
        this.hydrated = true;
      }
    },

    get(slug: string): Article | null {
      return this.entries[slug]?.article ?? null;
    },

    async set(slug: string, article: Article) {
      this.entries = {
        ...this.entries,
        [slug]: { article, cachedAt: new Date().toISOString() },
      };
      this.evictIfNeeded();
      await this.persist();
    },

    async remove(slug: string) {
      if (!(slug in this.entries)) return;
      const next = { ...this.entries };
      delete next[slug];
      this.entries = next;
      await this.persist();
    },

    async clear() {
      this.entries = {};
      await this.persist();
    },

    evictIfNeeded() {
      const slugs = Object.keys(this.entries);
      if (slugs.length <= MAX_ENTRIES) return;
      // Sort by cachedAt asc → oldest first
      slugs.sort((a, b) => this.entries[a].cachedAt.localeCompare(this.entries[b].cachedAt));
      const toEvict = slugs.slice(0, slugs.length - MAX_ENTRIES);
      const next = { ...this.entries };
      for (const s of toEvict) delete next[s];
      this.entries = next;
    },

    async persist() {
      try {
        await Preferences.set({
          key: STORAGE_KEY,
          value: JSON.stringify(this.entries),
        });
      } catch (e) {
        console.warn('[articleCache] persist failed', e);
      }
    },
  },
});
