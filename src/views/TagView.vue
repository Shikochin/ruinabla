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

const tag = computed(() => route.params.tag as string)
const posts = computed(() => store.getEntriesByTag(tag.value))

useHead({
  title: computed(() => `${t('tag.title', { name: tag.value })} - Rui∇abla`),
})
</script>

<template>
  <div class="tag-view">
    <PageHeader :eyebrow="$t('chronicle.metrics.tags')">
      <template #title> #{{ tag }} </template>
      <template #meta> {{ $t('chronicle.metrics.posts') }}: {{ posts.length }} </template>
    </PageHeader>

    <PostList :entries="posts" />
  </div>
</template>

<style scoped>
.tag-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
</style>
