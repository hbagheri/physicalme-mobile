import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Problem, ProblemSummary } from '@shared/types';
import { pmApi } from '@/api/client';

export const useProblemsStore = defineStore('problems', () => {
  const problems = ref<Map<string, ProblemSummary[]>>(new Map());
  const details = ref<Map<number, Problem>>(new Map());
  const loading = ref<string | null>(null);

  async function loadProblems(articleSlug: string) {
    if (problems.value.has(articleSlug)) {
      return problems.value.get(articleSlug) || [];
    }

    loading.value = articleSlug;
    try {
      const list = await pmApi.getArticleProblems(articleSlug);
      problems.value.set(articleSlug, list);
      return list;
    } finally {
      loading.value = null;
    }
  }

  async function loadProblem(id: number) {
    if (details.value.has(id)) {
      return details.value.get(id)!;
    }

    try {
      const p = await pmApi.getProblem(id);
      details.value.set(id, p);
      return p;
    } catch (e) {
      console.error('Failed to load problem', id, e);
      throw e;
    }
  }

  async function getProblem(id: number) {
    return details.value.get(id) || loadProblem(id);
  }

  return {
    problems: problems as Readonly<typeof problems>,
    details: details as Readonly<typeof details>,
    loading: loading as Readonly<typeof loading>,
    loadProblems,
    getProblem,
  };
});
