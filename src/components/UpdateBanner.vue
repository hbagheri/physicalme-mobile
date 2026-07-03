<script setup lang="ts">
import { computed } from 'vue';
import { latestInfo, updateSeverity, bannerDismissed, dismissUpdateBanner, currentVersion } from '@/composables/useAppVersion';

const show = computed(() => {
  if (!latestInfo.value) return false;
  if (updateSeverity.value === 'none') return false;
  if (updateSeverity.value === 'available' && bannerDismissed.value) return false;
  return true;
});

const isBlocking = computed(() => updateSeverity.value === 'required');

function download() {
  const url = latestInfo.value?.apk_url;
  if (url) window.open(url, '_blank');
}
function openPlay() {
  const url = latestInfo.value?.play_url;
  if (url) window.open(url, '_blank');
}
</script>

<template>
  <div v-if="show" class="pm-update-shell" :class="{ 'pm-update-blocking': isBlocking }">
    <div class="pm-update-card">
      <div class="pm-update-title">
        {{ isBlocking ? 'به‌روزرسانی الزامی' : 'نسخه‌ی جدید در دسترسه' }}
      </div>
      <div class="pm-update-body">
        <div class="pm-update-versions">
          نسخه‌ی فعلی: <b>{{ currentVersion || '—' }}</b>
          &nbsp;•&nbsp;
          آخرین: <b>{{ latestInfo?.latest }}</b>
        </div>
        <div v-if="latestInfo?.changelog" class="pm-update-changelog">
          {{ latestInfo.changelog }}
        </div>
        <div v-if="isBlocking" class="pm-update-blocking-msg">
          این نسخه دیگه پشتیبانی نمیشه. برای ادامه، لطفاً به‌روزرسانی کن.
        </div>
      </div>
      <div class="pm-update-actions">
        <button class="pm-btn-primary" @click="download">دانلود APK</button>
        <button class="pm-btn-secondary" @click="openPlay">Play Store</button>
        <button v-if="!isBlocking" class="pm-btn-ghost" @click="dismissUpdateBanner">بعداً</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pm-update-shell {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 60px;
  z-index: 50;
  padding: 8px 12px;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
}
.pm-update-blocking {
  top: 0;
  bottom: 0;
  padding: 24px;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}
.pm-update-card {
  background: #FBF6E3;
  border: 1px solid #D4A847;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 420px;
  margin: 0 auto;
}
.pm-update-title {
  font-weight: bold;
  color: #5B6E32;
  margin-bottom: 6px;
}
.pm-update-body { font-size: 13px; color: #1F2421; }
.pm-update-versions { color: #4B5563; }
.pm-update-changelog { margin-top: 6px; }
.pm-update-blocking-msg { margin-top: 8px; color: #8C3A3A; }
.pm-update-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.pm-btn-primary,
.pm-btn-secondary,
.pm-btn-ghost {
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
}
.pm-btn-primary   { background: #5B6E32; color: #FBF6E3; }
.pm-btn-secondary { background: #D4A847; color: #1F2421; }
.pm-btn-ghost     { background: transparent; color: #6B7280; }
</style>
