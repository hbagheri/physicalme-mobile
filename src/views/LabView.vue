<script setup lang="ts">
/**
 * آزمایشگاه — Lab view.
 *
 * Reads the active book's manifest from disk, lists chapters, expands each
 * chapter to its widgets (extracted from downloaded articles). Tapping a
 * widget opens it full-screen in an iframe; while open, the page listens
 * for window.postMessage({pmEvent:'experiment-result', ...}) and records
 * results to the experimentResults store.
 *
 * NOTE: existing widgets don't post 'experiment-result' yet — the protocol
 * is the new surface they need to adopt. Until they do, the lab still
 * works as a "run experiments" launcher; results section just stays empty.
 */
import { onMounted, ref, computed, onBeforeUnmount } from 'vue';
import { RouterLink } from 'vue-router';
import type { ChapterWithArticles } from '@shared/types';
import { loadManifest } from '@/services/contentStore';
import { loadWidgetsForBook, type ExperimentWidget } from '@/composables/useChapterWidgets';
import { useActiveBookStore } from '@/stores/activeBook';
import { useExperimentResultsStore, type ExperimentRun } from '@/stores/experimentResults';

const activeBook = useActiveBookStore();
const results = useExperimentResultsStore();

const chapters = ref<ChapterWithArticles[]>([]);
const widgetsByChapter = ref<Record<string, ExperimentWidget[]>>({});
const loading = ref(true);
const error = ref<string | null>(null);

const open = ref<ExperimentWidget | null>(null);
const justRecorded = ref(false);  // green-checkmark flash after a successful record

const totalWidgets = computed(() =>
  Object.values(widgetsByChapter.value).reduce((n, ws) => n + ws.length, 0),
);

onMounted(async () => {
  await results.hydrate();
  if (!activeBook.slug) {
    error.value = 'هیچ کتاب فعالی انتخاب نشده.';
    loading.value = false;
    return;
  }
  try {
    const m = await loadManifest(activeBook.slug);
    if (!m) {
      error.value = 'منیفست کتاب روی موبایل پیدا نشد. لطفاً از صفحه‌ی خانه دوباره کتاب رو دانلود کن.';
      return;
    }
    chapters.value = m.chapters;
    widgetsByChapter.value = await loadWidgetsForBook(activeBook.slug, m.chapters);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }

  window.addEventListener('message', onWidgetMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener('message', onWidgetMessage);
});

function onWidgetMessage(ev: MessageEvent) {
  // Only act on messages while a widget is open; ignore arbitrary postMessage.
  if (!open.value) return;
  const d = ev.data as { pmEvent?: string; data?: Record<string, unknown>; summary?: string } | null;
  if (!d || typeof d !== 'object') return;
  if (d.pmEvent !== 'experiment-result') return;
  results.record(open.value.url, {
    data: d.data ?? {},
    summary: typeof d.summary === 'string' ? d.summary : undefined,
  });
  justRecorded.value = true;
  setTimeout(() => { justRecorded.value = false; }, 1600);
}

function openWidget(w: ExperimentWidget) {
  justRecorded.value = false;
  open.value = w;
}

function closeWidget() {
  open.value = null;
}

function formatRun(run: ExperimentRun): string {
  if (run.summary) return run.summary;
  // Pretty-print a few keys/values from data
  const keys = Object.keys(run.data);
  if (!keys.length) return '—';
  return keys.slice(0, 3).map((k) => `${k}: ${run.data[k]}`).join(' · ');
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}
</script>

<template>
  <main class="px-4 pt-6 pb-16">
    <RouterLink to="/" class="text-olive text-sm">← خانه</RouterLink>
    <h1 class="font-fancy text-3xl mt-3 mb-1">آزمایشگاه</h1>
    <p class="text-sm text-gray-600 mb-5">
      ویجت‌های تعاملی هر فصل — می‌تونی پارامترها رو دست بزنی، آزمایش کنی،
      و نتیجه‌ها رو همین‌جا ببینی.
    </p>

    <div v-if="loading" class="text-center py-16 text-gray-500">در حال بارگذاری…</div>
    <div v-else-if="error" class="text-center py-16 text-amber-700 text-sm">{{ error }}</div>
    <div v-else-if="!totalWidgets" class="text-center py-16 text-gray-500 text-sm">
      تو این کتاب آزمایشی تعریف نشده.
    </div>

    <ul v-else class="space-y-5">
      <li v-for="ch in chapters" :key="ch.slug">
        <div v-if="widgetsByChapter[ch.slug]?.length" class="space-y-2">
          <h2 class="font-bold text-base text-ink">{{ ch.title }}</h2>
          <ul class="space-y-2">
            <li v-for="w in widgetsByChapter[ch.slug]" :key="w.url">
              <button
                type="button"
                class="w-full text-right bg-white rounded-xl shadow-sm border border-gray-200
                       px-4 py-3 hover:border-olive transition-colors flex items-center justify-between"
                @click="openWidget(w)"
              >
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-sm leading-snug">🧪 {{ w.title }}</div>
                  <div class="text-[11px] text-gray-500 mt-1">
                    {{ results.runsFor(w.url).length || 0 }} اجرا
                    <span v-if="results.latestFor(w.url)">
                      · آخرین: {{ formatRun(results.latestFor(w.url)!) }}
                    </span>
                  </div>
                </div>
                <span class="text-olive text-xl ms-3">▶</span>
              </button>
            </li>
          </ul>
        </div>
      </li>
    </ul>

    <!-- ─── Full-screen widget runner ─── -->
    <div
      v-if="open"
      class="fixed inset-0 z-50 bg-white flex flex-col"
      role="dialog"
      aria-modal="true"
    >
      <header
        class="flex items-center justify-between px-4 border-b border-gray-200 bg-cream"
        style="padding-top: calc(env(safe-area-inset-top, 0px) + 10px); padding-bottom: 10px;"
      >
        <button type="button" class="text-olive text-sm" @click="closeWidget">← بازگشت</button>
        <div class="font-bold text-sm truncate">🧪 {{ open.title }}</div>
        <div class="w-16 text-xs text-end">
          <span v-if="justRecorded" class="text-olive">✓ ثبت شد</span>
        </div>
      </header>

      <div class="flex-1 min-h-0 bg-gray-50">
        <iframe
          :src="open.url"
          class="w-full h-full border-none"
          allow="fullscreen"
        ></iframe>
      </div>

      <!-- Run history strip -->
      <section
        v-if="results.runsFor(open.url).length"
        class="border-t border-gray-200 bg-white max-h-40 overflow-y-auto px-4 py-2"
      >
        <h3 class="text-[11px] uppercase tracking-wider text-gray-500 mb-2">
          اجراهای قبلی ({{ results.runsFor(open.url).length }})
        </h3>
        <ul class="space-y-1 text-xs">
          <li
            v-for="(run, idx) in results.runsFor(open.url)"
            :key="run.recordedAt + idx"
            class="flex justify-between items-baseline border-b border-gray-100 py-1 last:border-0"
          >
            <span class="font-mono text-gray-700 truncate">{{ formatRun(run) }}</span>
            <span class="text-gray-400 text-[10px] shrink-0 ms-2">{{ formatDate(run.recordedAt) }}</span>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>
