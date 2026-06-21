import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Question, QuestionSummary } from '@shared/types';
import { pmApi } from '@/api/client';

export const useQuestionsStore = defineStore('questions', () => {
  const questions = ref<Map<string, QuestionSummary[]>>(new Map());
  const details = ref<Map<number, Question>>(new Map());
  const loading = ref<string | null>(null);

  async function loadQuestions(articleSlug: string) {
    if (questions.value.has(articleSlug)) {
      return questions.value.get(articleSlug) || [];
    }

    loading.value = articleSlug;
    try {
      const list = await pmApi.getArticleQuestions(articleSlug);
      questions.value.set(articleSlug, list);
      return list;
    } finally {
      loading.value = null;
    }
  }

  async function loadQuestion(id: number) {
    if (details.value.has(id)) {
      return details.value.get(id)!;
    }

    try {
      const q = await pmApi.getQuestion(id);
      details.value.set(id, q);
      return q;
    } catch (e) {
      console.error('Failed to load question', id, e);
      throw e;
    }
  }

  async function getQuestion(id: number) {
    return details.value.get(id) || loadQuestion(id);
  }

  return {
    questions: questions as Readonly<typeof questions>,
    details: details as Readonly<typeof details>,
    loading: loading as Readonly<typeof loading>,
    loadQuestions,
    getQuestion,
  };
});
