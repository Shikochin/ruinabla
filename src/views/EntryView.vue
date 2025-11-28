<script setup lang="ts">
import { computed, markRaw, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

import { usePostStore } from '@/stores/postStore'

const route = useRoute()
const store = usePostStore()

const entry = computed(() => {
  const slug = route.params.slug
  if (typeof slug !== 'string') return null
  const result = store.findBySlug(slug) ?? null
  if (!result) return null
  return {
    ...result,
    component: markRaw(result.component),
  }
})

// change title
onMounted(() => {
  document.title = `${entry.value?.title} - Ruinabla`
})
</script>

<template>
  <section v-if="entry" class="entry paper-panel">
    <RouterLink to="/" class="entry__back">← 返回废墟信标</RouterLink>
    <p class="eyebrow">{{ entry.date }}</p>
    <h1 class="entry__title">
      <span>{{ entry.title }}</span>
      <span class="eyebrow">
        {{ entry.readingMinutes }} min{{ entry.readingMinutes > 1 ? 's' : '' }} read</span>
    </h1>
    <blockquote class="entry__excerpt">{{ entry.summary }}</blockquote>

    <component v-if="entry.component" class="entry__content" :is="entry.component" />
    <hr class="entry__divider" />
    <div v-if="entry.tags.length" class="entry__tags eyebrow">
      <span v-for="tag in entry.tags" :key="tag">#{{ tag }}</span>
    </div>
  </section>

  <section v-else class="entry paper-panel">
    <h1>未找到对应的信标</h1>
    <p>可能被风沙掩埋了。返回信标重新定位吧。</p>
    <RouterLink to="/" class="entry__back">← 返回废墟信标</RouterLink>
  </section>
</template>

<style scoped>
.entry {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.entry__divider {
  border: 1px solid var(--ruins-border);
  margin: 18px 0;
}

.entry__title {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.entry__back {
  width: fit-content;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ruins-accent);
}

.entry__excerpt {
  max-width: 720px;
  border-left: 4px solid var(--ruins-border);
  padding-left: 16px;
  font-style: italic;
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--ruins-muted);
  text-align: justify;
}

.entry__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.entry__meta article {
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: var(--ruins-muted);
}

.entry__meta strong {
  display: block;
  margin-top: 6px;
  font-size: 1.3rem;
  color: var(--ruins-text);
  letter-spacing: normal;
  text-transform: none;
}

.entry__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.entry__tags span {
  padding: 6px 12px;
  /* border-radius: 12px;
  background: rgba(255, 255, 255, 0.07); */
}

.entry__content {
  padding: 10px 0;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.9);
}

.entry__content :global(h2),
.entry__content :global(h3) {
  margin-top: 32px;
  margin-bottom: 12px;
  font-size: 1.4rem;
}

.entry__content :global(p) {
  margin: 0 0 16px;
}

.entry__content :global(code) {
  font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
  background: rgba(255, 255, 255, 0.08);
  padding: 0 6px;
  border-radius: 4px;
}

.eyebrow {
  margin: 0;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.8rem;
  color: var(--ruins-muted);
}

@media (max-width: 640px) {
  .entry {
    padding: 26px;
  }
}
</style>
