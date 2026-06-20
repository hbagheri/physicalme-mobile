<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { ArticleSummary, Book } from '@shared/types';
import { pmApi } from '@/api/client';

const books = ref<Book[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const recent = ref<ArticleSummary[]>([]);

onMounted(async () => {
  // Books grid is the primary content; load it with error surfacing
  try {
    books.value = await pmApi.getBooks();
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }

  // Recent strip is secondary — if it fails (offline, etc.), just hide it
  try {
    recent.value = await pmApi.getRecent(8);
  } catch {
    recent.value = [];
  }
});
</script>

<template>
  <main class="px-4 pt-8 pb-16">
    <header class="text-center mb-8">
      <h1 class="font-fancy text-5xl text-ink mb-1">منِ فیزیکی</h1>
      <div class="font-script text-2xl text-olive -mt-2">Physical me</div>
      <p class="text-sm text-gray-600 mt-3">آموزش فیزیک به زبان ساده</p>
    </header>

    <!-- Recent strip — silent if empty / failed -->
    <section v-if="recent.length" class="mb-8">
      <h2 class="font-fancy text-2xl mb-3">تازه‌ها</h2>
      <div class="-mx-4 overflow-x-auto scrollbar-thin">
        <ul class="flex gap-3 px-4 snap-x snap-mandatory">
          <li
            v-for="a in recent"
            :key="a.slug"
            class="snap-start shrink-0 w-48"
          >
            <RouterLink
              :to="`/article/${a.slug}`"
              class="block h-full bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:border-olive transition-colors"
            >
              <img
                v-if="a.thumbUrl"
                :src="a.thumbUrl"
                :alt="a.title"
                loading="lazy"
                class="w-full h-24 object-cover rounded-md mb-2 bg-cream"
              />
              <div class="font-bold text-sm leading-snug line-clamp-2">{{ a.title }}</div>
              <div v-if="a.readingTime" class="text-[10px] text-gray-500 mt-2">⏱ {{ a.readingTime }}</div>
            </RouterLink>
          </li>
        </ul>
      </div>
    </section>

    <h2 class="font-fancy text-3xl mb-4">کتاب‌های ما</h2>

    <div v-if="loading" class="text-center py-12 text-gray-500">در حال بارگذاری…</div>
    <div v-else-if="error" class="text-center py-12 text-red-600">{{ error }}</div>
    <div v-else class="grid grid-cols-2 gap-3">
      <RouterLink
        v-for="book in books"
        :key="book.slug"
        :to="`/book/${book.slug}`"
        class="block aspect-[2/3] rounded-xl p-4 text-white shadow-lg
               bg-gradient-to-br from-olive to-oliveDk hover:scale-[1.02] transition-transform"
        :style="{ background: `linear-gradient(160deg, ${book.color1} 0%, ${book.color2} 100%)` }"
      >
        <div class="text-4xl mb-2">{{ book.emoji }}</div>
        <div class="font-bold text-base leading-tight">{{ book.label }}</div>
        <div class="text-xs opacity-80 mt-2">{{ book.chapterCount }} فصل · {{ book.lessonCount }} درس</div>
      </RouterLink>
    </div>
  </main>
</template>
