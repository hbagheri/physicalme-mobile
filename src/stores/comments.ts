import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Comment } from '@shared/types';
import { pmApi } from '@/api/client';

export const useCommentsStore = defineStore('comments', () => {
  const comments = ref<Map<string, Comment[]>>(new Map());
  const loading = ref<string | null>(null);
  const posting = ref(false);

  async function loadComments(articleSlug: string) {
    if (comments.value.has(articleSlug)) {
      return comments.value.get(articleSlug) || [];
    }

    loading.value = articleSlug;
    try {
      const list = await pmApi.getArticleComments(articleSlug);
      comments.value.set(articleSlug, list);
      return list;
    } finally {
      loading.value = null;
    }
  }

  async function postComment(articleSlug: string, author: string, email: string, content: string) {
    posting.value = true;
    try {
      const result = await pmApi.postComment(articleSlug, author, email, content);

      // Reload comments to refresh list
      await loadComments(articleSlug);

      return result;
    } finally {
      posting.value = false;
    }
  }

  return {
    comments: comments as Readonly<typeof comments>,
    loading: loading as Readonly<typeof loading>,
    posting: posting as Readonly<typeof posting>,
    loadComments,
    postComment,
  };
});
