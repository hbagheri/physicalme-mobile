import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { LabExperiment, LabSummary } from '@shared/types';
import { pmApi } from '@/api/client';

export const useLabStore = defineStore('lab', () => {
  const experiments = ref<Map<string, LabSummary[]>>(new Map());
  const details = ref<Map<number, LabExperiment>>(new Map());
  const loading = ref<string | null>(null);

  async function loadLab(articleSlug: string) {
    if (experiments.value.has(articleSlug)) {
      return experiments.value.get(articleSlug) || [];
    }

    loading.value = articleSlug;
    try {
      const list = await pmApi.getArticleLab(articleSlug);
      experiments.value.set(articleSlug, list);
      return list;
    } finally {
      loading.value = null;
    }
  }

  async function loadExperiment(id: number) {
    if (details.value.has(id)) {
      return details.value.get(id)!;
    }

    try {
      const exp = await pmApi.getLab(id);
      details.value.set(id, exp);
      return exp;
    } catch (e) {
      console.error('Failed to load lab experiment', id, e);
      throw e;
    }
  }

  async function getExperiment(id: number) {
    return details.value.get(id) || loadExperiment(id);
  }

  return {
    experiments: experiments as Readonly<typeof experiments>,
    details: details as Readonly<typeof details>,
    loading: loading as Readonly<typeof loading>,
    loadLab,
    getExperiment,
  };
});
