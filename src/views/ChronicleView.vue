<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import PostTimeline from '@/components/post/PostTimeline.vue'
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
</script>

<template>
  <section class="chronicle paper-panel">
    <p class="eyebrow">年轮记录</p>
    <h1>废墟的时间坐标</h1>
    <p class="hero-copy">
      这些时间节点标记的是一次次设计迭代：从 {{ firstDate }} 到 {{ lastDate }}，我把废墟感受拆
      成可测试的版式、音景和组件，像给自己做一张可用的情绪地图。
    </p>

    <div class="metrics">
      <article>
        <span>文章篇数</span>
        <strong>{{ totalPosts }}</strong>
      </article>
      <article>
        <span>平均阅读(分)</span>
        <strong>{{ averageReading }}</strong>
      </article>
      <article>
        <span>标签数</span>
        <strong>{{ distinctTags }}</strong>
      </article>
    </div>
  </section>

  <PostTimeline :entries="timelineEntries" />
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
  color: rgba(255, 255, 255, 0.85);
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.metrics article {
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  gap: 6px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.85rem;
  color: var(--ruins-muted);
}

.metrics strong {
  font-size: 2rem;
  color: var(--ruins-accent-strong);
  letter-spacing: normal;
  text-transform: none;
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
