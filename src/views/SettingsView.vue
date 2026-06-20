<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useBookmarksStore } from '@/stores/bookmarks';
import { useArticleCacheStore } from '@/stores/articleCache';
import {
  pushEnabled, pushStatus,
  enablePushNotifications, disablePushNotifications,
} from '@/composables/usePushNotifications';

const bookmarks = useBookmarksStore();
const cache = useArticleCacheStore();

const clearing = ref(false);
const cleared = ref(false);

async function clearCache() {
  if (cache.count === 0) return;
  if (!confirm(`${cache.count} مقاله‌ی کش‌شده پاک بشه؟`)) return;
  clearing.value = true;
  try {
    await cache.clear();
    cleared.value = true;
    setTimeout(() => { cleared.value = false; }, 2000);
  } finally {
    clearing.value = false;
  }
}

const pushBusy = ref(false);
async function togglePush() {
  if (pushBusy.value) return;
  pushBusy.value = true;
  try {
    if (pushEnabled.value) {
      await disablePushNotifications();
    } else {
      await enablePushNotifications();
    }
  } finally {
    pushBusy.value = false;
  }
}

const pushStatusLabel = (): string => {
  switch (pushStatus.value) {
    case 'requesting':  return 'در حال درخواست…';
    case 'denied':      return 'مجوز رد شد — از تنظیمات دستگاه فعال کن';
    case 'registered':  return '✓ ثبت شد — اعلان مقاله‌های جدید را می‌گیری';
    case 'error':       return 'خطا در ثبت — دوباره امتحان کن';
    case 'unsupported': return 'فقط روی اپ موبایل در دسترس است';
    default:            return pushEnabled.value ? 'فعال' : 'برای مقاله‌های جدید notif بگیر';
  }
};

const APP_VERSION = '0.1.0';
</script>

<template>
  <main class="px-4 pt-6 pb-16">
    <RouterLink to="/" class="text-olive text-sm">← خانه</RouterLink>
    <h1 class="font-fancy text-3xl mt-3 mb-6">تنظیمات</h1>

    <!-- Section: Push notifications -->
    <section class="mb-6">
      <h2 class="text-xs uppercase tracking-wider text-gray-500 mb-2">اعلان‌ها</h2>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <button
          type="button"
          @click="togglePush"
          :disabled="pushBusy || pushStatus === 'unsupported'"
          class="w-full px-4 py-3 flex items-center justify-between text-right"
          :class="pushStatus === 'unsupported' ? 'cursor-not-allowed opacity-60' : ''"
        >
          <div>
            <div class="font-bold text-base">اعلان مقاله‌های جدید</div>
            <div class="text-xs text-gray-500 mt-0.5">{{ pushStatusLabel() }}</div>
          </div>
          <span
            class="inline-flex w-12 h-7 rounded-full p-0.5 transition-colors"
            :class="pushEnabled ? 'bg-olive' : 'bg-gray-300'"
          >
            <span
              class="bg-white w-6 h-6 rounded-full shadow transition-transform"
              :class="pushEnabled ? '-translate-x-5' : ''"
            ></span>
          </span>
        </button>
      </div>
    </section>

    <!-- Section: Bookmarks -->
    <section class="mb-6">
      <h2 class="text-xs uppercase tracking-wider text-gray-500 mb-2">نشان‌شده‌ها</h2>
      <RouterLink
        to="/bookmarks"
        class="block bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 flex items-center justify-between"
      >
        <div>
          <div class="font-bold text-base">مقاله‌های ذخیره‌شده</div>
          <div class="text-xs text-gray-500 mt-0.5">{{ bookmarks.count }} مقاله</div>
        </div>
        <span class="text-olive text-lg">←</span>
      </RouterLink>
    </section>

    <!-- Section: Offline cache -->
    <section class="mb-6">
      <h2 class="text-xs uppercase tracking-wider text-gray-500 mb-2">کش آفلاین</h2>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <div>
            <div class="font-bold text-base">مقاله‌های کش‌شده</div>
            <div class="text-xs text-gray-500 mt-0.5">
              {{ cache.count }} مقاله — برای خواندنِ آفلاین
            </div>
          </div>
        </div>
        <button
          type="button"
          @click="clearCache"
          :disabled="clearing || cache.count === 0"
          class="w-full text-right px-4 py-3 text-sm transition-colors"
          :class="cache.count === 0
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-red-600 hover:bg-red-50'"
        >
          {{ cleared ? '✓ پاک شد' : clearing ? 'در حال پاک کردن…' : 'پاک کردنِ کش' }}
        </button>
      </div>
      <p class="text-[11px] text-gray-500 mt-2 leading-relaxed">
        مقاله‌ها وقتی بازشون می‌کنی به‌طور خودکار کش می‌شن (تا ۳۰ مقاله‌ی اخیر).
        نشان‌شده‌ها از این پاک‌سازی تأثیر نمی‌گیرن.
      </p>
    </section>

    <!-- Section: About -->
    <section>
      <h2 class="text-xs uppercase tracking-wider text-gray-500 mb-2">درباره</h2>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        <div class="px-4 py-3 flex items-center justify-between">
          <span class="text-sm text-gray-600">نسخه</span>
          <span class="text-sm font-mono text-gray-500">{{ APP_VERSION }}</span>
        </div>
        <a
          href="https://physicsme.ir"
          target="_blank"
          rel="noopener"
          class="px-4 py-3 flex items-center justify-between hover:bg-cream transition-colors"
        >
          <span class="text-sm text-gray-600">سایتِ منِ فیزیکی</span>
          <span class="text-sm text-olive">physicsme.ir ↗</span>
        </a>
        <div class="px-4 py-3 text-sm text-gray-500">
          ساخته‌ی <span class="text-gray-700">حسن باقری</span>
        </div>
      </div>
    </section>
  </main>
</template>
