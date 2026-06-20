<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useBookmarksStore } from '@/stores/bookmarks';

const bookmarks = useBookmarksStore();

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return '';
  }
}
</script>

<template>
  <main class="px-4 pt-6 pb-16">
    <RouterLink to="/" class="text-olive text-sm">← خانه</RouterLink>

    <h1 class="font-fancy text-3xl mt-3 mb-2">نشان‌شده‌ها</h1>
    <p class="text-sm text-gray-500 mb-6">
      {{ bookmarks.count }} مقاله‌ی ذخیره‌شده
    </p>

    <div
      v-if="bookmarks.count === 0"
      class="text-center py-16 text-gray-500"
    >
      <div class="text-5xl mb-3">☆</div>
      <p>هنوز چیزی نشان نکرده‌ای.</p>
      <p class="text-xs mt-2">روی هر مقاله ⭐ بالای صفحه رو بزن تا اینجا ذخیره بشه.</p>
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="b in bookmarks.items"
        :key="b.slug"
        class="bg-white rounded-xl shadow-sm border border-gray-200 flex items-stretch"
      >
        <RouterLink
          :to="`/article/${b.slug}`"
          class="flex-1 block px-4 py-3"
        >
          <div class="font-bold text-base leading-tight mb-1">{{ b.title }}</div>
          <div v-if="b.excerpt" class="text-xs text-gray-500 line-clamp-2">{{ b.excerpt }}</div>
          <div class="text-[10px] text-gray-400 mt-2">{{ fmtDate(b.savedAt) }}</div>
        </RouterLink>
        <button
          type="button"
          @click="bookmarks.remove(b.slug)"
          aria-label="حذف"
          class="px-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-l-xl transition-colors text-xl leading-none"
        >×</button>
      </li>
    </ul>
  </main>
</template>
