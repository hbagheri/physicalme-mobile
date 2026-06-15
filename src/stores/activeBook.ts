/**
 * Active-book store — keeps track of which book the student picked at onboarding.
 *
 * The app shows content for ONE book at a time; switching books is an explicit
 * action from Settings. The slug is persisted via @capacitor/preferences so the
 * choice survives app restarts.
 *
 * Persisted shape: { slug, manifestVersion } under key 'pm.activeBook'.
 */
import { defineStore } from 'pinia';
import { Preferences } from '@capacitor/preferences';
import type { Book, BookManifest } from '@shared/types';

const STORAGE_KEY = 'pm.activeBook';

interface PersistedShape {
  slug: string;
  manifestVersion?: string;
  /** Cached book metadata (label/emoji/colors), so we can paint shells without a network round-trip. */
  meta?: Book;
}

interface State {
  slug: string | null;
  manifestVersion: string | null;
  meta: Book | null;
  hydrated: boolean;
}

export const useActiveBookStore = defineStore('activeBook', {
  state: (): State => ({
    slug: null,
    manifestVersion: null,
    meta: null,
    hydrated: false,
  }),

  getters: {
    /** True after we've finished reading from Preferences — gate router redirects on this. */
    isReady: (s) => s.hydrated,
    /** True if the student has picked a book; false on a fresh install. */
    hasActiveBook: (s) => s.hydrated && s.slug !== null,
  },

  actions: {
    async hydrate() {
      if (this.hydrated) return;
      try {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        if (value) {
          const parsed = JSON.parse(value) as PersistedShape;
          if (parsed && typeof parsed.slug === 'string') {
            this.slug = parsed.slug;
            this.manifestVersion = parsed.manifestVersion ?? null;
            this.meta = parsed.meta ?? null;
          }
        }
      } catch (e) {
        console.warn('[activeBook] hydrate failed', e);
      } finally {
        this.hydrated = true;
      }
    },

    async setActiveBook(book: Book, manifest?: BookManifest) {
      this.slug = book.slug;
      this.meta = book;
      this.manifestVersion = manifest?.manifestVersion ?? null;
      await this.persist();
    },

    async clearActiveBook() {
      this.slug = null;
      this.meta = null;
      this.manifestVersion = null;
      try {
        await Preferences.remove({ key: STORAGE_KEY });
      } catch (e) {
        console.warn('[activeBook] clear failed', e);
      }
    },

    async persist() {
      const shape: PersistedShape = {
        slug: this.slug ?? '',
        manifestVersion: this.manifestVersion ?? undefined,
        meta: this.meta ?? undefined,
      };
      try {
        await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(shape) });
      } catch (e) {
        console.warn('[activeBook] persist failed', e);
      }
    },
  },
});
