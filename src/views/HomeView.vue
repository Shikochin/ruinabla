<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import PostCard from '@/components/post/PostCard.vue'
import PostList from '@/components/post/PostList.vue'
import RecentComments from '@/components/RecentComments.vue'
import { usePostStore } from '@/stores/postStore'
import { useHead } from '@unhead/vue'

const store = usePostStore()

useHead({
  title: '', // Will result in just "Rui∇abla" due to template
  meta: [
    {
      name: 'description',
      content: 'Records of Light and Dust. A personal blog by Shikochin.',
    },
  ],
})

const { featuredEntry, recentlyRecovered, pickedUpPostsEntries, tagCloud } = storeToRefs(store)

const tagPairs = computed(() =>
  Object.entries(tagCloud.value)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8),
)
</script>

<template>
  <div>
    <section class="hero paper-panel">
      <div class="hero__eyebrow">近日信标 · {{ featuredEntry.date }}</div>
      <RouterLink :to="`/posts/${featuredEntry.slug}`" class="title">
        <h1>{{ featuredEntry.title }}</h1>
      </RouterLink>
      <p>{{ featuredEntry.summary }}</p>
      <div class="hero__meta">
        <span
          >{{ featuredEntry.readingMinutes }} MIN{{
            featuredEntry.readingMinutes > 1 ? 'S' : ''
          }}
          READ</span
        >
        <RouterLink v-if="featuredEntry.tags.length" :to="`/tags/${featuredEntry.tags[0]}`"
          >#{{ featuredEntry.tags[0] }}
        </RouterLink>
      </div>
      <RouterLink :to="`/posts/${featuredEntry.slug}`" class="hero__cta">
        前往阅读全文 &rarr;
      </RouterLink>
    </section>

    <section class="grid">
      <PostCard
        v-for="entry in recentlyRecovered"
        :key="entry.id"
        :entry="entry"
        :vol="recentlyRecovered.indexOf(entry) + 2"
      />
    </section>

    <section class="signals">
      <RecentComments />

      <div class="tag-cloud paper-panel">
        <p class="eyebrow">常现词</p>
        <h3>废墟里的高频词</h3>
        <div class="tag-cloud__items">
          <RouterLink
            v-for="[tag, count] in tagPairs"
            :key="tag"
            :to="`/tags/${tag}`"
            class="tag-item"
          >
            {{ tag }} <small>×{{ count }}</small>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="timeline-section">
      <header class="timeline-section__header">
        <div>
          <p class="eyebrow">CRISPR-Cas9</p>
          <h3>重组信标</h3>
        </div>
        <RouterLink to="/chronicle">展开全部 &rarr;</RouterLink>
      </header>
      <PostList style="border: 0" :entries="pickedUpPostsEntries" />
    </section>
  </div>
</template>

<style scoped>
.title {
  width: fit-content;
}

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
  margin-top: 32px;
  margin-bottom: 32px;
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

.tag-cloud__items .tag-item {
  padding: 6px 10px;
  border: 1px solid var(--ruins-border);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ruins-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
}

.tag-cloud__items .tag-item:hover {
  border-color: var(--ruins-accent);
  color: var(--ruins-accent-strong);
}

.timeline-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  border: 1px solid var(--ruins-border);
  margin-top: 32px;
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
