<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import PostList from '@/components/post/PostList.vue'
import { usePostStore } from '@/stores/postStore'

const store = usePostStore()
const { timelineEntries } = storeToRefs(store)

const totalPosts = computed(() => timelineEntries.value.length)
const averageReading = computed(() => {
  const list = timelineEntries.value
  if (!list.length) return 0
  const total = list.reduce((sum, entry) => sum + entry.readingMinutes, 0)
  return Math.round(total / list.length)
})
const firstDate = computed(() => {
  const list = timelineEntries.value
  return list.length ? (list[list.length - 1]?.date ?? '') : ''
})
const lastDate = computed(() => timelineEntries.value[0]?.date ?? '')
const distinctTags = computed(
  () => new Set(timelineEntries.value.flatMap((entry) => entry.tags)).size,
)

import { useHead } from '@unhead/vue'

useHead({
  title: '年轮',
  meta: [
    {
      name: 'description',
      content: '废墟的时间坐标 - Archive of posts',
    },
  ],
})
</script>

<template>
  <div>
    <section class="chronicle paper-panel">
      <p class="eyebrow">年轮记录</p>
      <h1>废墟的时间坐标</h1>
      <p class="hero-copy">从 {{ firstDate }} 到 {{ lastDate }}</p>

      <div class="metrics">
        <article class="metric-card">
          <div class="metric-icon">📝</div>
          <div class="metric-content">
            <span class="metric-label">文章篇数</span>
            <strong class="metric-value">{{ totalPosts }}</strong>
          </div>
        </article>
        <article class="metric-card">
          <div class="metric-icon">⏱️</div>
          <div class="metric-content">
            <span class="metric-label">平均阅读</span>
            <div class="metric-with-unit">
              <strong class="metric-value">{{ averageReading }}</strong>
              <span class="metric-unit">分钟</span>
            </div>
          </div>
        </article>
        <article class="metric-card">
          <div class="metric-icon">🏷️</div>
          <div class="metric-content">
            <span class="metric-label">标签数</span>
            <strong class="metric-value">{{ distinctTags }}</strong>
          </div>
        </article>
      </div>
    </section>

    <PostList :entries="timelineEntries" />
  </div>
</template>

<style scoped>
.chronicle {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.chronicle h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.6rem);
}

.hero-copy {
  margin: 0;
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

.eyebrow {
  margin: 0;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.8rem;
  color: var(--ruins-muted);
}

@media (max-width: 640px) {
  .chronicle {
    padding: 26px;
  }
}
</style>
