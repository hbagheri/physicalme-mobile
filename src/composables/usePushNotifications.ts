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

// Build-time gate — the workflow sets VITE_HAS_FCM=true only when
// google-services.json was restored before the vite build. Without FCM,
// PushNotificationsPlugin.register() throws a synchronous
// java.lang.IllegalStateException on the CapacitorPlugins handler thread —
// which JS try/catch cannot intercept (the throw happens before the bridge
// creates a Promise resolver). The only safe way to prevent the crash is
// to never call register() when FCM isn't compiled in.
const HAS_FCM = import.meta.env.VITE_HAS_FCM === 'true';

export function isPushSupportedByBuild(): boolean {
  return HAS_FCM;
}

let initialized = false;

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
 */
export async function initPushNotifications(router: Router): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (!Capacitor.isNativePlatform()) {
    pushStatus.value = 'unsupported';
    return;
  }

  if (!HAS_FCM) {
    // Build without google-services.json — any PushNotifications call risks
    // a native crash. Report unsupported and stop; the Settings toggle will
    // render disabled.
    pushStatus.value = 'unsupported';
    // Also clear any legacy enabled=true from a prior build that had FCM,
    // so an update pushed to a device without a fresh FCM setup can't
    // trigger the old crash path on cold start.
    await Preferences.set({ key: ENABLED_KEY, value: 'false' });
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
    await forceDisableOnFailure('listener attach failed', e);
    return;
  }

  const stored = await Preferences.get({ key: ENABLED_KEY });
  pushEnabled.value = stored.value === 'true';
  if (pushEnabled.value) {
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
    await forceDisableOnFailure('register() threw despite HAS_FCM=true', e);
    return false;
  }
}

export async function enablePushNotifications(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !HAS_FCM) return false;
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
