<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import PageHeader from '@/components/layout/PageHeader.vue'
import SkeletonPlaceholder from '@/components/ui/SkeletonPlaceholder.vue'
import PostList from '@/components/post/PostList.vue'
import { usePostStore } from '@/stores/postStore'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'

const store = usePostStore()
const { t } = useI18n()

onMounted(() => {
  store.fetchPosts()
})

const { postEntries, loaded } = storeToRefs(store)

const totalPosts = computed(() => postEntries.value.length)
const averageReading = computed(() => {
  const list = postEntries.value
  if (!list.length) return 0
  const total = list.reduce((sum, entry) => sum + entry.readingMinutes, 0)
  return Math.round(total / list.length)
})
const firstDate = computed(() => {
  const list = postEntries.value
  return list.length ? (list[list.length - 1]?.date ?? '') : ''
})
const lastDate = computed(() => postEntries.value[0]?.date ?? '')
const distinctTags = computed(() => new Set(postEntries.value.flatMap((entry) => entry.tags)).size)

useHead({
  title: t('chronicle.title'),
  meta: [
    {
      name: 'description',
      content: t('chronicle.description'),
    },
  ],
})
</script>

<template>
  <div class="chronicle-view">
    <PageHeader :eyebrow="$t('chronicle.eyebrow')" :title="$t('chronicle.subtitle')">
      <template #meta>
        <template v-if="!loaded">
          {{ $t('chronicle.range', { first: '...', last: '...' }).split('...')[0] }}
          <SkeletonPlaceholder width="100px" height="1em" style="display: inline-block" />
          {{ $t('chronicle.range', { first: '...', last: '...' }).split('...')[1] }}
          <SkeletonPlaceholder width="100px" height="1em" style="display: inline-block" />
          {{ $t('chronicle.range', { first: '...', last: '...' }).split('...')[2] }}
        </template>
        <template v-else>{{
          $t('chronicle.range', { first: firstDate, last: lastDate })
        }}</template>
      </template>

      <div class="metrics">
        <article class="metric-card">
          <div class="metric-icon">📝</div>
          <div class="metric-content">
            <span class="metric-label">{{ $t('chronicle.metrics.posts') }}</span>
            <strong class="metric-value" v-if="!loaded">
              <SkeletonPlaceholder width="40px" height="2rem" />
            </strong>
            <strong class="metric-value" v-else>{{ totalPosts }}</strong>
          </div>
        </article>
        <article class="metric-card">
          <div class="metric-icon">⏱️</div>
          <div class="metric-content">
            <span class="metric-label">{{ $t('chronicle.metrics.avgReading') }}</span>
            <div class="metric-with-unit">
              <strong class="metric-value" v-if="!loaded">
                <SkeletonPlaceholder width="40px" height="2rem" />
              </strong>
              <strong class="metric-value" v-else>{{ averageReading }}</strong>
              <span class="metric-unit">{{ $t('common.minutes') }}</span>
            </div>
          </div>
        </article>
        <article class="metric-card">
          <div class="metric-icon">🏷️</div>
          <div class="metric-content">
            <span class="metric-label">{{ $t('chronicle.metrics.tags') }}</span>
            <strong class="metric-value" v-if="!loaded">
              <SkeletonPlaceholder width="40px" height="2rem" />
            </strong>
            <strong class="metric-value" v-else>{{ distinctTags }}</strong>
          </div>
        </article>
      </div>
    </PageHeader>

    <PostList :entries="postEntries" :loading="!loaded" />
  </div>
</template>

<style scoped>
.chronicle-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.metric-card {
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01));
  display: flex;
  gap: 16px;
  align-items: flex-start;
  transition: all 0.3s ease;
  cursor: default;
}

.metric-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  font-size: 2rem;
  line-height: 1;
  opacity: 0.8;
  filter: grayscale(0.3);
  transition: all 0.3s ease;
}

.metric-card:hover .metric-icon {
  opacity: 1;
  filter: grayscale(0);
  transform: scale(1.1);
}

.metric-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-label {
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: var(--ruins-muted);
  opacity: 0.8;
}

.metric-with-unit {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.metric-value {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--ruins-accent-strong);
  letter-spacing: -0.02em;
  line-height: 1;
}

.metric-unit {
  font-size: 0.9rem;
  color: var(--ruins-muted);
  opacity: 0.7;
}

.metric-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ruins-accent-strong), var(--ruins-accent));
  border-radius: 2px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(var(--ruins-accent-rgb, 177, 98, 134), 0.5);
}

.metric-card:hover .metric-fill {
  box-shadow: 0 0 12px rgba(var(--ruins-accent-rgb, 177, 98, 134), 0.8);
}
</style>
