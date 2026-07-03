import { ref } from 'vue';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { pmApi, type AppVersionInfo } from '@/api/client';

export type UpdateSeverity = 'none' | 'available' | 'required';

export const currentVersion = ref<string>('');
export const latestInfo     = ref<AppVersionInfo | null>(null);
export const updateSeverity = ref<UpdateSeverity>('none');
export const bannerDismissed = ref(false);

// Semver compare: returns -1 / 0 / 1. Non-numeric segments are treated as 0
// so unusual tags don't crash the check.
function cmpSemver(a: string, b: string): number {
  const pa = a.split('.').map(s => parseInt(s, 10) || 0);
  const pb = b.split('.').map(s => parseInt(s, 10) || 0);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av !== bv) return av < bv ? -1 : 1;
  }
  return 0;
}

export async function checkAppVersion(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // Web preview — nothing to update.
    return;
  }
  try {
    const info = await App.getInfo();
    currentVersion.value = info.version;
  } catch (e) {
    console.warn('[version] App.getInfo failed', e);
    return;
  }

  try {
    const latest = await pmApi.getAppVersion();
    latestInfo.value = latest;

    if (cmpSemver(currentVersion.value, latest.min_supported) < 0) {
      updateSeverity.value = 'required';
    } else if (cmpSemver(currentVersion.value, latest.latest) < 0) {
      updateSeverity.value = 'available';
    } else {
      updateSeverity.value = 'none';
    }
  } catch (e) {
    console.warn('[version] fetch /app-version failed', e);
  }
}

export function dismissUpdateBanner(): void {
  bannerDismissed.value = true;
}
