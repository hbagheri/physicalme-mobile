import { ref } from 'vue';
import type { Router } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';
import { pmApi } from '@/api/client';

const ENABLED_KEY = 'pm.push.enabled';
const TOKEN_KEY   = 'pm.push.token';

export type PushStatus = 'idle' | 'requesting' | 'denied' | 'registered' | 'error' | 'unsupported';

export const pushEnabled = ref(false);
export const pushToken   = ref<string | null>(null);
export const pushStatus  = ref<PushStatus>('idle');

let initialized = false;

// FCM init throws synchronously in the native layer if google-services.json is
// missing or malformed. Any call into PushNotifications must be wrapped so a
// failed init cannot crash the app or leave `pm.push.enabled=true` on disk,
// which would re-trigger the crash on every launch.
async function forceDisableOnFailure(reason: string, err: unknown): Promise<void> {
  console.error(`[push] ${reason}`, err);
  pushStatus.value = 'error';
  try {
    await Preferences.set({ key: ENABLED_KEY, value: 'false' });
    await Preferences.remove({ key: TOKEN_KEY });
  } catch { /* preferences failing here shouldn't cascade */ }
  pushEnabled.value = false;
  pushToken.value = null;
}

/**
 * Wire FCM listeners and restore prior opt-in. Called once from App.vue.
 * Listeners must be attached on every cold start — including taps that
 * launched the app from a killed state.
 */
export async function initPushNotifications(router: Router): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (!Capacitor.isNativePlatform()) {
    pushStatus.value = 'unsupported';
    return;
  }

  try {
    await PushNotifications.addListener('registration', async (t) => {
      pushToken.value = t.value;
      try {
        await Preferences.set({ key: TOKEN_KEY, value: t.value });
        await pmApi.subscribePush(t.value, 'android');
        pushStatus.value = 'registered';
        console.log('[push] subscribed', t.value.slice(0, 12) + '…');
      } catch (e) {
        console.error('[push] subscribe failed', e);
        pushStatus.value = 'error';
      }
    });

    await PushNotifications.addListener('registrationError', (e) => {
      forceDisableOnFailure('native registration error', e);
    });

    await PushNotifications.addListener('pushNotificationReceived', (n) => {
      console.log('[push] foreground notification', n);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action.notification.data || {};
      const slug = typeof data.slug === 'string' ? data.slug : '';
      if (slug) router.push(`/article/${slug}`);
    });
  } catch (e) {
    await forceDisableOnFailure('listener attach failed — FCM not initialized', e);
    return;
  }

  const stored = await Preferences.get({ key: ENABLED_KEY });
  pushEnabled.value = stored.value === 'true';
  if (pushEnabled.value) {
    // Re-register on every launch so token refreshes are caught.
    // If it fails, forceDisableOnFailure clears the enabled flag so we
    // don't retry (and crash) forever.
    await registerForPush();
  }
}

async function registerForPush(): Promise<boolean> {
  pushStatus.value = 'requesting';
  try {
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') {
      pushStatus.value = 'denied';
      return false;
    }
    await PushNotifications.register();
    return true;
  } catch (e) {
    await forceDisableOnFailure('register() threw — likely missing google-services.json', e);
    return false;
  }
}

export async function enablePushNotifications(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const ok = await registerForPush();
  if (ok) {
    pushEnabled.value = true;
    await Preferences.set({ key: ENABLED_KEY, value: 'true' });
  }
  return ok;
}

export async function disablePushNotifications(): Promise<void> {
  const stored = await Preferences.get({ key: TOKEN_KEY });
  if (stored.value) {
    try {
      await pmApi.unsubscribePush(stored.value);
    } catch (e) {
      console.warn('[push] backend unsubscribe failed', e);
    }
  }
  await Preferences.remove({ key: TOKEN_KEY });
  await Preferences.set({ key: ENABLED_KEY, value: 'false' });
  pushEnabled.value = false;
  pushToken.value = null;
  pushStatus.value = 'idle';
}
