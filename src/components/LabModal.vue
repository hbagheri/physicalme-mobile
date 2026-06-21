<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { LabSummary } from '@shared/types';
import { useLabStore } from '@/stores/lab';
import { typeset } from '@/composables/useMathJax';

interface Props {
  articleSlug: string;
  open: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const store = useLabStore();
const experiments = ref<LabSummary[]>([]);
const loading = ref(false);
const selectedId = ref<number | null>(null);
const selectedExperiment = ref<any>(null);
const detailsLoading = ref(false);
const descBody = ref<HTMLElement | null>(null);
const resultBody = ref<HTMLElement | null>(null);

async function loadLab() {
  loading.value = true;
  try {
    experiments.value = await store.loadLab(props.articleSlug);
  } finally {
    loading.value = false;
  }
}

async function selectExperiment(id: number) {
  selectedId.value = id;
  selectedExperiment.value = null;
  detailsLoading.value = true;
  try {
    selectedExperiment.value = await store.getExperiment(id);
    await nextTick();
    if (descBody.value) await typeset(descBody.value);
    if (resultBody.value) await typeset(resultBody.value);
  } finally {
    detailsLoading.value = false;
  }
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await loadLab();
  }
});
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center sm:justify-center">
    <div class="bg-white w-full sm:max-w-2xl sm:rounded-xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 class="text-lg font-bold">آزمایشگاه</h2>
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
        <!-- List of experiments -->
        <div v-if="!selectedId" class="space-y-3">
          <div v-if="loading" class="text-center py-8 text-gray-500">در حال بارگذاری…</div>
          <div v-else-if="experiments.length === 0" class="text-center py-8 text-gray-500">
            آزمایشی برای این فصل یافت نشد.
          </div>
          <ul v-else class="space-y-2">
            <li
              v-for="exp in experiments"
              :key="exp.id"
              @click="selectExperiment(exp.id)"
              class="p-3 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition border border-amber-200"
            >
              <div class="font-bold text-sm">🧪 {{ exp.title }}</div>
            </li>
          </ul>
        </div>

        <!-- Experiment details -->
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
          <div v-else-if="selectedExperiment">
            <h3 class="text-lg font-bold mb-3">{{ selectedExperiment.title }}</h3>

            <!-- Description -->
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div class="text-xs font-semibold text-amber-700 mb-2">توضیح:</div>
              <div ref="descBody" class="pm-lab-body" v-html="selectedExperiment.description"></div>
            </div>

            <!-- Materials -->
            <div v-if="selectedExperiment.materials?.length" class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div class="text-xs font-semibold text-blue-700 mb-2">مواد لازم:</div>
              <ul class="list-disc list-inside space-y-1 text-sm">
                <li v-for="(mat, i) in selectedExperiment.materials" :key="i" class="text-blue-900">
                  {{ mat }}
                </li>
              </ul>
            </div>

            <!-- Steps -->
            <div v-if="selectedExperiment.steps?.length" class="space-y-2 mb-4">
              <div class="text-xs font-semibold text-gray-700">مراحل:</div>
              <ol class="space-y-2">
                <li
                  v-for="(step, i) in selectedExperiment.steps"
                  :key="i"
                  class="flex gap-3 text-sm"
                >
                  <span class="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                    {{ i + 1 }}
                  </span>
                  <span class="flex-1 pt-0.5">{{ step }}</span>
                </li>
              </ol>
            </div>

            <!-- Expected Result -->
            <div v-if="selectedExperiment.expectedResult" class="bg-green-50 border border-green-200 rounded-lg p-3">
              <div class="text-xs font-semibold text-green-700 mb-2">نتیجه مورد انتظار:</div>
              <div ref="resultBody" class="pm-lab-body" v-html="selectedExperiment.expectedResult"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pm-lab-body {
  color: #1f2421;
  line-height: 1.8;
  font-size: 0.95rem;
}

.pm-lab-body :deep(p) {
  margin: 0.5em 0;
}

.pm-lab-body :deep(strong) {
  font-weight: 700;
}

.pm-lab-body :deep(em) {
  font-style: italic;
}

.pm-lab-body :deep(code) {
  background: #f1ecdb;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

mjx-container {
  padding: 0.4em 0;
}
</style>
