<script setup lang="ts">
/**
 * Onboarding — first-launch (or after "تغییر کتاب") book picker.
 *
 * Flow:
 *   1) Show the 6 books (from /books endpoint).
 *   2) Tap a card → fetch /books/{slug}/manifest.
 *   3) Bulk-download every article in the manifest to disk (with progress bar).
 *   4) Set activeBook → route home.
 *
 * If a previous user_archive exists for the picked book, we'll restore it
 * in a follow-up phase (Settings handles archiving on book-switch).
 */
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Book, BookManifest } from '@shared/types';
import { pmApi } from '@/api/client';
import { useActiveBookStore } from '@/stores/activeBook';
import { useBookmarksStore, type BookmarkItem } from '@/stores/bookmarks';
import { useBookDownloader } from '@/composables/useBookDownloader';
import { loadUserArchive, deleteUserArchive } from '@/services/contentStore';

const router = useRouter();
const activeBook = useActiveBookStore();
const bookmarks = useBookmarksStore();
const downloader = useBookDownloader();

const books = ref<Book[]>([]);
const loading = ref(true);
const loadError = ref<string | null>(null);

/** Slug we're currently picking — when set, the picker hides and the progress UI shows. */
const pickingSlug = ref<string | null>(null);
const pickingBook = computed<Book | null>(() =>
  books.value.find((b) => b.slug === pickingSlug.value) ?? null,
);

const progressPct = computed(() => {
  if (!downloader.state.total) return 0;
  return Math.round((downloader.state.completed / downloader.state.total) * 100);
});
const sizeMB = computed(() => (downloader.state.sizeBytes / (1024 * 1024)).toFixed(1));

onMounted(async () => {
  try {
    books.value = await pmApi.getBooks();
  } catch (e) {
    loadError.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
});

async function pick(book: Book) {
  if (pickingSlug.value) return;
  pickingSlug.value = book.slug;
  downloader.reset();

  let manifest: BookManifest;
  try {
    manifest = await pmApi.getBookManifest(book.slug);
  } catch (e) {
    downloader.state.phase = 'error';
    downloader.state.error = `دسترسی به اطلاعات کتاب نشد — اتصال اینترنت رو چک کن.\n(${(e as Error).message})`;
    return;
  }

  try {
    await downloader.download(manifest);
  } catch (e) {
    // download() only throws on fatal errors (manifest save); per-article
    // failures are counted in state.failed but don't abort.
    console.error('[onboarding] downloader threw', e);
  }

  // Restore any user_archive (from a previous switch-away from this book) —
  // currently bookmarks only; experiment results will join this in the Lab phase.
  try {
    const archive = await loadUserArchive(book.slug);
    if (archive && Array.isArray(archive.bookmarks) && archive.bookmarks.length) {
      await bookmarks.hydrate();
      const existing = new Set(bookmarks.items.map((b) => b.slug));
      const merged: BookmarkItem[] = [
        ...bookmarks.items,
        ...(archive.bookmarks as BookmarkItem[]).filter((b) => !existing.has(b.slug)),
      ];
      bookmarks.items = merged;
      await bookmarks.persist();
      // Archive consumed — drop it so we don't double-restore on the next switch.
      await deleteUserArchive(book.slug);
    }
  } catch (e) {
    console.warn('[onboarding] archive restore failed', e);
  }

  // Even with some failures, commit the choice so the student can use what
  // we DID manage to download (offline-first cache will fill in the rest
  // when they open a missing article online).
  await activeBook.setActiveBook(book, manifest);
  router.replace('/');
}

function retry() {
  if (!pickingBook.value) return;
  const b = pickingBook.value;
  pickingSlug.value = null;
  pick(b);
}

function cancelToPicker() {
  pickingSlug.value = null;
  downloader.reset();
}
</script>

<template>
  <main class="min-h-screen px-5 pt-10 pb-12 bg-cream">
    <!-- ─── Book picker ─── -->
    <template v-if="!pickingSlug">
      <header class="text-center mb-8">
        <img src="/logo.jpg" alt="منِ فیزیکی" class="pm-brand-logo mx-auto mb-4" />
        <h1 class="font-fancy text-3xl text-ink mb-2">خوش اومدی به منِ فیزیکی</h1>
        <p class="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
          برای شروع، کتابی که داری روش کار می‌کنی رو انتخاب کن.
          <br />
          هر وقت بخوای می‌تونی از تنظیمات کتاب دیگه‌ای انتخاب کنی.
        </p>
      </header>

      <div v-if="loading" class="text-center py-12 text-gray-500">در حال بارگذاری کتاب‌ها…</div>
      <div v-else-if="loadError" class="text-center py-12 text-red-600">{{ loadError }}</div>

      <ul v-else class="grid grid-cols-2 gap-3 max-w-xl mx-auto">
        <li v-for="book in books" :key="book.slug">
          <button
            type="button"
            class="w-full aspect-[3/4] rounded-2xl p-4 text-white shadow-lg
                   transition-transform active:scale-95
                   flex flex-col items-end justify-between text-right hover:scale-[1.02]"
            :style="{ background: `linear-gradient(160deg, ${book.color1} 0%, ${book.color2} 100%)` }"
            @click="pick(book)"
          >
            <div class="text-4xl">{{ book.emoji }}</div>
            <div class="w-full">
              <div class="font-bold text-base leading-tight mb-1">{{ book.label }}</div>
              <div class="text-xs opacity-80">{{ book.chapterCount }} فصل · {{ book.lessonCount }} درس</div>
              <div class="text-xs font-bold mt-2">انتخاب کن ←</div>
            </div>
          </button>
        </li>
      </ul>

      <p class="text-center text-xs text-gray-500 mt-8 max-w-sm mx-auto">
        💡 برای شروع، نیاز به اینترنت داری تا کتاب دانلود بشه.
        بعد از اون تو حالت آفلاین هم می‌تونی درس‌ها رو ببینی.
      </p>
    </template>

    <!-- ─── Download progress ─── -->
    <section
      v-else
      class="max-w-md mx-auto mt-12 bg-white rounded-2xl shadow-md p-6 text-center"
    >
      <div class="text-5xl mb-3">{{ pickingBook?.emoji }}</div>
      <h2 class="font-fancy text-2xl text-ink mb-1">{{ pickingBook?.label }}</h2>

      <!-- ⓘ phases -->
      <template v-if="downloader.state.phase === 'manifest'">
        <p class="text-sm text-gray-600 mb-4">در حال گرفتن اطلاعات کتاب…</p>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-olive animate-pulse" style="width: 30%"></div>
        </div>
      </template>

      <template v-else-if="downloader.state.phase === 'articles'">
        <p class="text-sm text-gray-600 mb-4">
          در حال دانلود درس‌ها…
          <span class="font-mono">{{ downloader.state.completed }}/{{ downloader.state.total }}</span>
        </p>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-olive transition-all" :style="{ width: `${progressPct}%` }"></div>
        </div>
        <p v-if="downloader.state.failed" class="text-xs text-red-500 mt-3">
          {{ downloader.state.failed }} درس رد شد (می‌تونی بعداً از سرور بگیری)
        </p>
      </template>

      <template v-else-if="downloader.state.phase === 'done'">
        <p class="text-sm text-olive mb-2">✓ آماده‌ست!</p>
        <p class="text-xs text-gray-500">
          {{ downloader.state.completed }} درس روی موبایلت ذخیره شد
          ({{ sizeMB }} مگابایت)
        </p>
      </template>

      <template v-else-if="downloader.state.phase === 'error'">
        <p class="text-sm text-red-600 whitespace-pre-line mb-4">{{ downloader.state.error }}</p>
        <div class="flex gap-2 justify-center">
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-olive text-white text-sm"
            @click="retry"
          >تلاش دوباره</button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg border border-gray-300 text-sm"
            @click="cancelToPicker"
          >کتاب دیگری انتخاب کن</button>
        </div>
      </template>
    </section>
  </main>
</template>
