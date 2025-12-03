<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePostStore } from '@/stores/postStore'
import PostList from '@/components/post/PostList.vue'
import { useHead } from '@unhead/vue'

const route = useRoute()
const store = usePostStore()

onMounted(() => {
  store.fetchPosts()
})

const category = computed(() => route.params.category as string)
const posts = computed(() => store.getEntriesByCategory(category.value))

useHead({
  title: computed(() => `Category: ${category.value} - Rui∇abla`),
})
</script>

<template>
  <div class="category-view">
    <header class="page-header paper-panel">
      <p class="eyebrow">分类</p>
      <h1>{{ category }}</h1>
      <p class="meta">共 {{ posts.length }} 篇文章</p>
    </header>

    <PostList :entries="posts" />
  </div>
</template>

<style scoped>
.category-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.page-header {
  padding: 48px;
  background: var(--ruins-panel);
  border: 1px solid var(--ruins-border);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.eyebrow {
  font-family: var(--font-mono);
}

h1 {
  margin: 0;
  font-size: 3rem;
  font-family: var(--font-serif);
  color: var(--ruins-accent-strong);
}

.meta {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--ruins-muted);
}

@media (max-width: 640px) {
  .page-header {
    padding: 32px;
  }

  h1 {
    font-size: 2rem;
  }
}
</style>
