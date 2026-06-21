<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { ProblemSummary } from '@shared/types';
import { useProblemsStore } from '@/stores/problems';
import { typeset } from '@/composables/useMathJax';

interface Props {
  articleSlug: string;
  open: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const store = useProblemsStore();
const problems = ref<ProblemSummary[]>([]);
const loading = ref(false);
const selectedId = ref<number | null>(null);
const selectedProblem = ref<any>(null);
const detailsLoading = ref(false);
const solutionBody = ref<HTMLElement | null>(null);

async function loadProblems() {
  loading.value = true;
  try {
    problems.value = await store.loadProblems(props.articleSlug);
  } finally {
    loading.value = false;
  }
}

async function selectProblem(id: number) {
  selectedId.value = id;
  selectedProblem.value = null;
  detailsLoading.value = true;
  try {
    selectedProblem.value = await store.getProblem(id);
    await nextTick();
    if (solutionBody.value) {
      await typeset(solutionBody.value);
    }
  } finally {
    detailsLoading.value = false;
  }
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await loadProblems();
  }
});
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center sm:justify-center">
    <div class="bg-white w-full sm:max-w-2xl sm:rounded-xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 class="text-lg font-bold">مسائل این فصل</h2>
        <button
          type="button"
          @click="emit('close')"
          class="text-2xl leading-none px-2 py-1"
          aria-label="بستن"
        >
          ×
        </button>
      </div>

      <!-- Content -->
      <div class="p-4">
        <!-- List of problems -->
        <div v-if="!selectedId" class="space-y-3">
          <div v-if="loading" class="text-center py-8 text-gray-500">در حال بارگذاری…</div>
          <div v-else-if="problems.length === 0" class="text-center py-8 text-gray-500">
            مسئله‌ای برای این فصل یافت نشد.
          </div>
          <ul v-else class="space-y-2">
            <li
              v-for="p in problems"
              :key="p.id"
              @click="selectProblem(p.id)"
              class="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition border border-blue-200"
            >
              <div class="font-bold text-sm">{{ p.title }}</div>
              <div v-if="p.difficulty" class="text-xs text-gray-600 mt-1">
                سطح: <span class="font-medium">{{ difficultyLabel(p.difficulty) }}</span>
              </div>
            </li>
          </ul>
        </div>

        <!-- Problem details -->
        <div v-else class="space-y-4">
          <button
            type="button"
            @click="selectedId = null"
            class="text-olive text-sm font-medium mb-4"
          >
            ← بازگشت
          </button>

          <div v-if="detailsLoading" class="text-center py-8 text-gray-500">
            در حال بارگذاری…
          </div>
          <div v-else-if="selectedProblem">
            <h3 class="text-lg font-bold mb-3">{{ selectedProblem.title }}</h3>

            <!-- Problem -->
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <div class="text-xs font-semibold text-purple-700 mb-2">مسئله:</div>
              <div class="pm-problem-body" v-html="selectedProblem.problem"></div>
            </div>

            <!-- Solution -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-3">
              <div class="text-xs font-semibold text-green-700 mb-2">حل:</div>
              <div ref="solutionBody" class="pm-solution-body" v-html="selectedProblem.solution"></div>
            </div>

            <div v-if="selectedProblem.difficulty" class="text-xs text-gray-600 mt-4">
              سطح سختی: <span class="font-medium">{{ difficultyLabel(selectedProblem.difficulty) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pm-problem-body,
.pm-solution-body {
  color: #1f2421;
  line-height: 1.8;
  font-size: 0.95rem;
}

.pm-problem-body :deep(p),
.pm-solution-body :deep(p) {
  margin: 0.5em 0;
}

.pm-problem-body :deep(ul),
.pm-problem-body :deep(ol),
.pm-solution-body :deep(ul),
.pm-solution-body :deep(ol) {
  margin: 0.5em 0 0.5em 1.4em;
  padding: 0;
}

.pm-problem-body :deep(li),
.pm-solution-body :deep(li) {
  margin-bottom: 0.3em;
}

.pm-problem-body :deep(strong),
.pm-solution-body :deep(strong) {
  font-weight: 700;
}

.pm-problem-body :deep(em),
.pm-solution-body :deep(em) {
  font-style: italic;
}

.pm-problem-body :deep(code),
.pm-solution-body :deep(code) {
  background: #f1ecdb;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
  direction: ltr;
}

mjx-container {
  padding: 0.4em 0;
}
</style>

<script lang="ts">
function difficultyLabel(level?: string) {
  const map: Record<string, string> = {
    easy: 'آسان',
    medium: 'متوسط',
    hard: 'دشوار',
  };
  return map[level || ''] || level || '-';
}
</script>
