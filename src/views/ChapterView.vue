<script setup lang="ts">
/**
 * ChapterView — list of articles in a single chapter.
 *
 * Reached from HomeView when the student taps a chapter card. Reads the
 * active-book manifest from disk first (so the list works offline) and
 * falls back to the /chapters/{slug}/articles API if the manifest isn't
 * cached (or the chapter doesn't belong to the active book).
 */
import { onMounted, ref, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import type { ArticleSummary } from '@shared/types';
import { pmApi } from '@/api/client';
import { useActiveBookStore } from '@/stores/activeBook';
import { loadManifest } from '@/services/contentStore';

const route = useRoute();
const activeBook = useActiveBookStore();

const chapterSlug = ref<string>(route.params.slug as string);
const chapterTitle = ref<string>('');
const articles = ref<ArticleSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  articles.value = [];

  // 1) Offline-first: try to satisfy from the active book's disk manifest
  if (activeBook.slug) {
    try {
      const manifest = await loadManifest(activeBook.slug);
      const chap = manifest?.chapters.find((c) => c.slug === chapterSlug.value);
      if (chap) {
        chapterTitle.value = chap.title;
        articles.value = chap.articles;
        loading.value = false;
        return;
      }
    } catch (e) {
      console.warn('[chapter] manifest read failed', e);
    }
  }

  // 2) Fallback: hit the API
  try {
    articles.value = await pmApi.getArticles(chapterSlug.value);
    if (articles.value[0]) chapterTitle.value = '';   // unknown without manifest; that's fine
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.slug, (s) => { chapterSlug.value = s as string; load(); });
</script>

<template>
  <main class="px-4 pt-4 pb-16">
    <RouterLink to="/" class="text-olive text-sm">← خانه</RouterLink>

    <h1 class="font-fancy text-2xl mt-3 mb-4 leading-tight">
      {{ chapterTitle || 'فصل' }}
    </h1>

    <div v-if="loading" class="text-center py-12 text-gray-500">در حال بارگذاری…</div>
    <div v-else-if="error" class="text-center py-12 text-red-600">{{ error }}</div>
    <div v-else-if="articles.length === 0" class="text-center py-12 text-gray-500">
      درسی پیدا نشد.
    </div>

    <ul v-else class="space-y-2">
      <li v-for="art in articles" :key="art.slug">
        <RouterLink
          :to="`/article/${art.slug}`"
          class="flex items-start gap-3 bg-white rounded-xl shadow-sm border border-gray-200
                 px-4 py-3 hover:border-olive transition-colors"
        >
          <img
            v-if="art.thumbUrl"
            :src="art.thumbUrl"
            :alt="art.title"
            loading="lazy"
            class="w-16 h-16 object-cover rounded-md bg-cream shrink-0"
          />
          <div class="min-w-0 flex-1">
            <div class="font-bold text-sm leading-snug line-clamp-2">{{ art.title }}</div>
            <div class="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3">
              <span v-if="art.readingTime">⏱ {{ art.readingTime }}</span>
            </div>
          </div>
          <span class="text-olive text-xl self-center">←</span>
        </RouterLink>
      </li>
    </ul>
  </main>
</template>
