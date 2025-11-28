<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'

import PostCard from '@/components/post/PostCard.vue'
import PostTimeline from '@/components/post/PostTimeline.vue'
import { usePostStore } from '@/stores/postStore'

const store = usePostStore()
const { featuredEntry, recentlyRecovered, timelineEntries, beaconSignals, tagCloud } =
  storeToRefs(store)

const tagPairs = computed(() =>
  Object.entries(tagCloud.value)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8),
)
</script>

<template>
  <section class="hero paper-panel">
    <div class="hero__eyebrow">近日信标 · {{ featuredEntry.date }}</div>
    <RouterLink :to="`/posts/${featuredEntry.slug}`">
      <h1>{{ featuredEntry.title }}</h1>
    </RouterLink>
    <p>{{ featuredEntry.summary }}</p>
    <div class="hero__meta">
      <span>{{ featuredEntry.readingMinutes }} MIN{{ featuredEntry.readingMinutes > 1 ? 'S' : '' }} READ</span>
      <span v-if="featuredEntry.tags.length">#{{ featuredEntry.tags[0] }}</span>
    </div>
    <RouterLink :to="`/posts/${featuredEntry.slug}`" class="hero__cta">
      前往阅读全文 &rarr;
    </RouterLink>
  </section>

  <section class="grid">
    <PostCard v-for="entry in recentlyRecovered" :key="entry.id" :entry="entry"
      :vol="recentlyRecovered.indexOf(entry) + 2" />
  </section>

  <section class="signals">
    <div class="signals__list paper-panel">
      <header>
        <div>
          <p class="eyebrow">最新</p>
          <h3>刚刚完成的笔记</h3>
        </div>
        <RouterLink to="/chronicle">查看年轮 &rarr;</RouterLink>
      </header>
      <ul>
        <li v-for="entry in beaconSignals" :key="entry.id">
          <div>
            <p class="eyebrow">{{ entry.date }}</p>
            <RouterLink :to="`/posts/${entry.slug}`">{{ entry.title }}</RouterLink>
            <p class="signals__summary">
              {{ entry.summary }}
            </p>
          </div>
          <span class="signals__read-time">{{ entry.readingMinutes }}m</span>
        </li>
      </ul>
    </div>

    <div class="tag-cloud paper-panel">
      <p class="eyebrow">常现词</p>
      <h3>废墟里的高频词</h3>
      <div class="tag-cloud__items">
        <span v-for="[tag, count] in tagPairs" :key="tag">
          {{ tag }} <small>×{{ count }}</small>
        </span>
      </div>
    </div>
  </section>

  <section class="timeline-section">
    <header class="timeline-section__header">
      <div>
        <p class="eyebrow">年轮</p>
        <h3>踏过的路径</h3>
      </div>
      <RouterLink to="/chronicle">展开全部 &rarr;</RouterLink>
    </header>
    <PostTimeline :entries="timelineEntries.slice(0, 4)" />
  </section>
</template>

<style scoped>
.hero {
  padding: 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  /* 移除渐变，改为纯粹的黑色背景与边框 */
  background-color: var(--ruins-panel);
  border: 1px solid var(--ruins-border);
  position: relative;
}

.hero::after {
  /* 装饰性角标 */
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  border-width: 0 32px 32px 0;
  border-style: solid;
  border-color: transparent var(--ruins-bg) transparent transparent;
  box-shadow: -1px 1px 1px rgba(255, 255, 255, 0.05);
}

.hero__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ruins-muted);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ruins-border);
  align-self: flex-start;
}

.hero h1 {
  margin: 8px 0;
  font-size: clamp(2.8rem, 5vw, 4rem);
  line-height: 1.1;
  font-family: var(--font-serif);
  color: var(--ruins-accent-strong);
}

.hero p {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  line-height: 1.7;
  max-width: 60ch;
  color: var(--ruins-text);
  opacity: 0.9;
}

.hero__meta {
  display: flex;
  gap: 24px;
  font-size: 0.85rem;
  font-family: var(--font-mono);
  color: var(--ruins-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 8px;
}

.hero__cta {
  margin-top: 16px;
  align-self: flex-start;
  padding: 12px 24px;
  border: 1px solid var(--ruins-text);
  background: transparent;
  color: var(--ruins-text);
  font-family: var(--font-mono);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero__cta:hover {
  background: var(--ruins-accent-strong);
  color: var(--ruins-bg);
  border-color: var(--ruins-accent-strong);
}

.grid {
  display: flex;
  /* grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); */
  flex-direction: column;
  gap: 32px;
}

.signals {
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  gap: 32px;
  align-items: start;
}

.signals__list,
.tag-cloud {
  padding: 32px;
  background: transparent;
  border: 1px solid var(--ruins-border);
}

.signals__list header,
.tag-cloud header {
  margin-bottom: 24px;
}

.signals__list header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid var(--ruins-border);
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.signals__list header h3,
.tag-cloud h3 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.5rem;
}

.signals__list a,
.tag-cloud a,
.timeline-section__header a {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ruins-muted);
}

.signals__list ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.signals__list li {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.signals__list li a {
  font-family: var(--font-serif);
  font-size: 1.2rem;
  color: var(--ruins-text);
  display: block;
  margin-bottom: 4px;
  text-transform: none;
}

.signals__summary {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ruins-muted);
  font-family: var(--font-serif);
  line-height: 1.5;
}

.signals__read-time {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ruins-muted);
  white-space: nowrap;
}

.tag-cloud {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tag-cloud h3 {
  margin: 0 0 8px;
}

.tag-cloud__items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-cloud__items span {
  padding: 6px 10px;
  border: 1px solid var(--ruins-border);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ruins-muted);
  cursor: default;
  transition: all 0.2s ease;
}

.tag-cloud__items span:hover {
  border-color: var(--ruins-accent);
  color: var(--ruins-accent-strong);
}

.timeline-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px double var(--ruins-border);
  border-width: 4px 0 0 0;
}

.timeline-section__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.timeline-section__header h3 {
  margin: 0;
  font-size: 1.8rem;
  font-family: var(--font-serif);
}

.eyebrow {
  margin: 0 0 4px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: var(--ruins-muted);
  font-family: var(--font-mono);
}

@media (max-width: 900px) {
  .hero {
    padding: 32px;
  }

  .signals {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero__meta {
    flex-direction: column;
    gap: 6px;
  }

  .hero h1 {
    font-size: 2.2rem;
  }
}
</style>
