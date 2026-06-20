<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import type { ArticleSummary, Chapter } from '@shared/types';
import { pmApi } from '@/api/client';

const route = useRoute();
const bookSlug = ref<string>(route.params.slug as string);

const chapters = ref<Chapter[]>([]);
const expanded = ref<Record<string, ArticleSummary[]>>({});
const loadingChapter = ref<string | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    chapters.value = await pmApi.getChapters(bookSlug.value);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

async function toggle(slug: string) {
  if (expanded.value[slug]) {
    // collapse
    const next = { ...expanded.value };
    delete next[slug];
    expanded.value = next;
    return;
  }
  loadingChapter.value = slug;
  try {
    const list = await pmApi.getArticles(slug);
    expanded.value = { ...expanded.value, [slug]: list };
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loadingChapter.value = null;
  }
}

onMounted(load);
watch(() => route.params.slug, (s) => { bookSlug.value = s as string; load(); });
</script>

<template>
  <main class="px-4 pt-4 pb-16">
    <RouterLink to="/" class="text-olive text-sm">← خانه</RouterLink>

    <h1 class="font-fancy text-3xl mt-3 mb-4 leading-tight">
      فصل‌های این کتاب
    </h1>

    <div v-if="loading" class="text-center py-12 text-gray-500">در حال بارگذاری…</div>
    <div v-else-if="error" class="text-center py-12 text-red-600">{{ error }}</div>
    <div v-else-if="chapters.length === 0" class="text-center py-12 text-gray-500">
      فصلی پیدا نشد.
    </div>

    <ul v-else class="space-y-2">
      <li v-for="ch in chapters" :key="ch.slug" class="bg-white rounded-xl shadow-sm border border-gray-200">
        <button
          type="button"
          @click="toggle(ch.slug)"
          class="w-full flex items-center justify-between px-4 py-3 text-right"
        >
          <span class="text-sm text-gray-500">{{ ch.lessonCount }} درس</span>
          <span class="flex items-center gap-2">
            <span class="font-bold text-base">{{ ch.title }}</span>
            <span class="text-olive text-lg" :class="{ 'rotate-180': expanded[ch.slug] }">▾</span>
          </span>
        </button>

        <div v-if="expanded[ch.slug]" class="border-t border-gray-100 px-2 pb-2">
          <ul class="divide-y divide-gray-100">
            <li v-for="art in expanded[ch.slug]" :key="art.slug">
              <RouterLink
                :to="`/article/${art.slug}`"
                class="block py-3 px-2 hover:bg-cream rounded text-sm"
              >
                {{ art.title }}
              </RouterLink>
            </li>
          </ul>
        </div>
        <div v-else-if="loadingChapter === ch.slug" class="px-4 py-2 text-xs text-gray-500">
          در حال بارگذاری…
        </div>
      </li>
    </ul>
  </main>
</template>
