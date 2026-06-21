<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { QuestionSummary } from '@shared/types';
import { useQuestionsStore } from '@/stores/questions';
import { typeset } from '@/composables/useMathJax';

interface Props {
  articleSlug: string;
  open: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const store = useQuestionsStore();
const questions = ref<QuestionSummary[]>([]);
const loading = ref(false);
const selectedId = ref<number | null>(null);
const selectedQuestion = ref<any>(null);
const detailsLoading = ref(false);
const answerBody = ref<HTMLElement | null>(null);

async function loadQuestions() {
  loading.value = true;
  try {
    questions.value = await store.loadQuestions(props.articleSlug);
  } finally {
    loading.value = false;
  }
}

async function selectQuestion(id: number) {
  selectedId.value = id;
  selectedQuestion.value = null;
  detailsLoading.value = true;
  try {
    selectedQuestion.value = await store.getQuestion(id);
    await nextTick();
    if (answerBody.value) {
      await typeset(answerBody.value);
    }
  } finally {
    detailsLoading.value = false;
  }
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await loadQuestions();
  }
});
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center sm:justify-center">
    <div class="bg-white w-full sm:max-w-2xl sm:rounded-xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 class="text-lg font-bold">سوالات این فصل</h2>
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
        <!-- List of questions -->
        <div v-if="!selectedId" class="space-y-3">
          <div v-if="loading" class="text-center py-8 text-gray-500">در حال بارگذاری…</div>
          <div v-else-if="questions.length === 0" class="text-center py-8 text-gray-500">
            سوالی برای این فصل یافت نشد.
          </div>
          <ul v-else class="space-y-2">
            <li
              v-for="q in questions"
              :key="q.id"
              @click="selectQuestion(q.id)"
              class="p-3 bg-cream rounded-lg cursor-pointer hover:bg-amber-100 transition"
            >
              <div class="font-bold text-sm">{{ q.title }}</div>
              <div v-if="q.difficulty" class="text-xs text-gray-600 mt-1">
                سختی: <span class="font-medium">{{ difficultyLabel(q.difficulty) }}</span>
              </div>
            </li>
          </ul>
        </div>

        <!-- Question details -->
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
          <div v-else-if="selectedQuestion">
            <h3 class="text-lg font-bold mb-3">{{ selectedQuestion.title }}</h3>

            <!-- Question -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div class="text-xs font-semibold text-blue-700 mb-2">سوال:</div>
              <div class="pm-question-body" v-html="selectedQuestion.question"></div>
            </div>

            <!-- Answer -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-3">
              <div class="text-xs font-semibold text-green-700 mb-2">جواب:</div>
              <div ref="answerBody" class="pm-answer-body" v-html="selectedQuestion.answer"></div>
            </div>

            <div v-if="selectedQuestion.difficulty" class="text-xs text-gray-600 mt-4">
              سطح سختی: <span class="font-medium">{{ difficultyLabel(selectedQuestion.difficulty) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pm-question-body,
.pm-answer-body {
  color: #1f2421;
  line-height: 1.8;
  font-size: 0.95rem;
}

.pm-question-body :deep(p),
.pm-answer-body :deep(p) {
  margin: 0.5em 0;
}

.pm-question-body :deep(ul),
.pm-question-body :deep(ol),
.pm-answer-body :deep(ul),
.pm-answer-body :deep(ol) {
  margin: 0.5em 0 0.5em 1.4em;
  padding: 0;
}

.pm-question-body :deep(li),
.pm-answer-body :deep(li) {
  margin-bottom: 0.3em;
}

.pm-question-body :deep(strong),
.pm-answer-body :deep(strong) {
  font-weight: 700;
}

.pm-question-body :deep(em),
.pm-answer-body :deep(em) {
  font-style: italic;
}

.pm-question-body :deep(code),
.pm-answer-body :deep(code) {
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
