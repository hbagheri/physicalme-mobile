<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Comment } from '@shared/types';
import { useCommentsStore } from '@/stores/comments';

interface Props {
  articleSlug: string;
  open: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const store = useCommentsStore();
const comments = ref<Comment[]>([]);
const loading = ref(false);

// Form state
const showForm = ref(false);
const formAuthor = ref('');
const formEmail = ref('');
const formContent = ref('');
const formError = ref('');

async function loadComments() {
  loading.value = true;
  try {
    comments.value = await store.loadComments(props.articleSlug);
  } finally {
    loading.value = false;
  }
}

async function submitComment() {
  formError.value = '';

  if (!formAuthor.value.trim()) {
    formError.value = 'نام ضروری است';
    return;
  }

  if (!formContent.value.trim()) {
    formError.value = 'متن نظر ضروری است';
    return;
  }

  try {
    const result = await store.postComment(
      props.articleSlug,
      formAuthor.value,
      formEmail.value,
      formContent.value
    );

    if (result.success) {
      formAuthor.value = '';
      formEmail.value = '';
      formContent.value = '';
      showForm.value = false;
      await loadComments();
    }
  } catch (e) {
    formError.value = (e as Error).message || 'خطا در ارسال نظر';
  }
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await loadComments();
    showForm.value = false;
  }
});
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center sm:justify-center">
    <div class="bg-white w-full sm:max-w-2xl sm:rounded-xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 class="text-lg font-bold">نظرات و سوالات</h2>
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
        <!-- Comments List -->
        <div v-if="!showForm" class="space-y-4">
          <!-- Add Comment Button -->
          <button
            type="button"
            @click="showForm = true"
            class="w-full py-2 px-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
          >
            ➕ نظر جدید
          </button>

          <!-- Loading -->
          <div v-if="loading" class="text-center py-8 text-gray-500">در حال بارگذاری…</div>

          <!-- No Comments -->
          <div v-else-if="comments.length === 0" class="text-center py-8 text-gray-500">
            هیچ نظری هنوز ثبت نشده.
          </div>

          <!-- Comments -->
          <div v-else class="space-y-3">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="border border-gray-200 rounded-lg p-3 bg-gray-50"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <div class="font-bold text-sm">{{ comment.author }}</div>
                  <div class="text-xs text-gray-500">
                    {{ new Date(comment.createdAt).toLocaleDateString('fa-IR') }}
                  </div>
                </div>
                <div
                  v-if="!comment.approved"
                  class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
                >
                  منتظر تایید
                </div>
              </div>
              <div class="text-sm text-gray-700 leading-relaxed">{{ comment.content }}</div>
            </div>
          </div>
        </div>

        <!-- Comment Form -->
        <div v-else class="space-y-4">
          <button
            type="button"
            @click="showForm = false"
            class="text-olive text-sm font-medium mb-4"
          >
            ← بازگشت
          </button>

          <h3 class="text-lg font-bold">ثبت نظر جدید</h3>

          <!-- Error -->
          <div v-if="formError" class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {{ formError }}
          </div>

          <!-- Name Field -->
          <div>
            <label class="block text-sm font-medium mb-1">نام:</label>
            <input
              v-model="formAuthor"
              type="text"
              placeholder="نام شما"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Email Field -->
          <div>
            <label class="block text-sm font-medium mb-1">ایمیل (اختیاری):</label>
            <input
              v-model="formEmail"
              type="email"
              placeholder="ایمیل شما"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Content Field -->
          <div>
            <label class="block text-sm font-medium mb-1">نظر یا سوال:</label>
            <textarea
              v-model="formContent"
              placeholder="نظر یا سوال خود را بنویسید..."
              rows="5"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            ></textarea>
          </div>

          <!-- Submit Button -->
          <button
            type="button"
            @click="submitComment"
            :disabled="store.posting"
            class="w-full py-2 px-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {{ store.posting ? 'در حال ارسال...' : '✓ ارسال نظر' }}
          </button>

          <p class="text-xs text-gray-500">
            نظر شما پس از تایید مدیر نمایش داده خواهد شد.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input,
textarea {
  font-family: 'Vazirmatn', Tahoma, sans-serif;
}
</style>
