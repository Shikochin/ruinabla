<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePostStore } from '@/stores/postStore'
import PostList from '@/components/post/PostList.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const store = usePostStore()
const { t } = useI18n()

onMounted(() => {
  store.fetchPosts()
})

const category = computed(() => route.params.category as string)
const posts = computed(() => store.getEntriesByCategory(category.value))

useHead({
  title: computed(() => `${t('category.title', { name: category.value })} - Rui∇abla`),
})
</script>

<template>
  <div class="category-view">
    <PageHeader :eyebrow="$t('common.settings')">
      <template #title>
        {{ $t('category.title', { name: category }) }}
      </template>
      <template #meta> {{ $t('chronicle.metrics.posts') }}: {{ posts.length }} </template>
    </PageHeader>

    <PostList :entries="posts" />
  </div>
</template>

<style scoped>
.category-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
</style>
