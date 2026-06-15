/**
 * Experiment results — keyed by widget URL. Each widget can emit one or
 * more "experiment-result" messages while the student plays with it; we keep
 * a small history (latest N) so they can see what they measured before.
 *
 * Persisted via @capacitor/preferences. Also dumped into UserArchive when
 * the student switches books, so coming back later restores their lab log.
 */
import { defineStore } from 'pinia';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'pm.experimentResults';
const MAX_RUNS_PER_WIDGET = 20;

export interface ExperimentRun {
  /** Free-form payload emitted by the widget. */
  data: Record<string, unknown>;
  /** Optional human label the widget supplies (e.g. "T = 1.4s"). */
  summary?: string;
  recordedAt: string;          // ISO-8601
}

interface State {
  /** widgetUrl → ordered list of runs (newest first). */
  byWidget: Record<string, ExperimentRun[]>;
  hydrated: boolean;
}

export const useExperimentResultsStore = defineStore('experimentResults', {
  state: (): State => ({ byWidget: {}, hydrated: false }),

  getters: {
    runsFor: (s) => (widgetUrl: string): ExperimentRun[] => s.byWidget[widgetUrl] ?? [],
    latestFor: (s) => (widgetUrl: string): ExperimentRun | null =>
      s.byWidget[widgetUrl]?.[0] ?? null,
    totalCount: (s) => Object.values(s.byWidget).reduce((acc, arr) => acc + arr.length, 0),
  },

  actions: {
    async hydrate() {
      if (this.hydrated) return;
      try {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        if (value) {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object') this.byWidget = parsed;
        }
      } catch (e) {
        console.warn('[experimentResults] hydrate failed', e);
      } finally {
        this.hydrated = true;
      }
    },

    async record(widgetUrl: string, run: Omit<ExperimentRun, 'recordedAt'>) {
      const entry: ExperimentRun = { ...run, recordedAt: new Date().toISOString() };
      const existing = this.byWidget[widgetUrl] ?? [];
      const next = [entry, ...existing].slice(0, MAX_RUNS_PER_WIDGET);
      this.byWidget = { ...this.byWidget, [widgetUrl]: next };
      await this.persist();
    },

    async clearWidget(widgetUrl: string) {
      if (!(widgetUrl in this.byWidget)) return;
      const next = { ...this.byWidget };
      delete next[widgetUrl];
      this.byWidget = next;
      await this.persist();
    },

    async clearAll() {
      this.byWidget = {};
      await this.persist();
    },

    async persist() {
      try {
        await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(this.byWidget) });
      } catch (e) {
        console.warn('[experimentResults] persist failed', e);
      }
    },
  },
});
