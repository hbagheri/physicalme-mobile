/**
 * Bookmarks store — persisted via @capacitor/preferences (uses native secure
 * storage on Android/iOS, falls back to localStorage in the browser).
 *
 * Persisted shape is BookmarkItem[] under key 'pm.bookmarks'.
 */
import { defineStore } from 'pinia';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'pm.bookmarks';

export interface BookmarkItem {
  slug: string;
  title: string;
  chapterSlug: string;
  bookSlug: string;
  thumbUrl?: string | null;
  excerpt?: string;
  savedAt: string; // ISO-8601
}

interface State {
  items: BookmarkItem[];
  hydrated: boolean;
}

export const useBookmarksStore = defineStore('bookmarks', {
  state: (): State => ({
    items: [],
    hydrated: false,
  }),

  getters: {
    count: (s) => s.items.length,
    bySlug: (s) => {
      const map = new Map<string, BookmarkItem>();
      for (const it of s.items) map.set(it.slug, it);
      return map;
    },
  },

  actions: {
    async hydrate() {
      if (this.hydrated) return;
      try {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        if (value) {
          const parsed = JSON.parse(value) as BookmarkItem[];
          if (Array.isArray(parsed)) this.items = parsed;
        }
      } catch (e) {
        console.warn('[bookmarks] hydrate failed', e);
      } finally {
        this.hydrated = true;
      }
    },

    has(slug: string): boolean {
      return this.bySlug.has(slug);
    },

    async add(item: Omit<BookmarkItem, 'savedAt'>) {
      if (this.has(item.slug)) return;
      this.items = [{ ...item, savedAt: new Date().toISOString() }, ...this.items];
      await this.persist();
    },

    async remove(slug: string) {
      const next = this.items.filter((b) => b.slug !== slug);
      if (next.length === this.items.length) return;
      this.items = next;
      await this.persist();
    },

    async toggle(item: Omit<BookmarkItem, 'savedAt'>) {
      if (this.has(item.slug)) await this.remove(item.slug);
      else await this.add(item);
    },

    async persist() {
      try {
        await Preferences.set({
          key: STORAGE_KEY,
          value: JSON.stringify(this.items),
        });
      } catch (e) {
        console.warn('[bookmarks] persist failed', e);
      }
    },
  },
});
