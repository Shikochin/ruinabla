<script setup lang="ts">
import { toRef } from 'vue'
import type { PostEntry } from '@/data/post'

const props = defineProps<{ entry: PostEntry; vol: number }>()
const entry = toRef(props, 'entry')
</script>

<template>
  <article class="post-card paper-panel">
    <div class="post-card__header">
      <span class="post-card__date">{{ entry.date }}</span>
      <div class="post-card__divider"></div>
      <RouterLink
        v-if="entry.category"
        :to="`/categories/${entry.category}`"
        class="post-card__tag"
      >
        {{ entry.category }}
      </RouterLink>
    </div>

    <RouterLink :to="`/posts/${entry.slug}`" class="post-card__title">
      <h3>{{ entry.title }}</h3>
    </RouterLink>

    <div class="post-card__body">
      <p class="post-card__excerpt">{{ entry.summary }}</p>
    </div>

    <div class="post-card__footer">
      <span>Vol. {{ props.vol }}</span>
      <span>{{ entry.readingMinutes }} MIN{{ entry.readingMinutes > 1 ? 'S' : '' }} READ</span>
    </div>
  </article>
</template>

<style scoped>
.post-card {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: transparent;
  /* 移除背景色，突出线条 */
  border: 1px solid var(--ruins-border);
  transition: all 0.3s ease;
  position: relative;
}

/* 悬停时增加微光边框 */
.post-card:hover {
  border-color: var(--ruins-accent);
  box-shadow: 0 0 20px var(--ruins-light-color);
}

.post-card__header {
  display: flex;
  align-items: center;
  gap: 16px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ruins-muted);
  border-bottom: 1px solid var(--ruins-border);
  padding-bottom: 16px;
}

.post-card__divider {
  flex: 1;
  height: 1px;
  background: var(--ruins-border);
  opacity: 0.3;
}

.post-card__tag {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.7rem;
  padding: 2px 6px;
  border: 1px solid var(--ruins-border);
}

.post-card__title {
  width: fit-content;
}

.post-card__title a {
  border: none;
}

.post-card__title h3 {
  margin: 0;
  font-size: 2rem;
  line-height: 1.1;
  font-family: var(--font-serif);
  color: var(--ruins-text);
  transition: color 0.2s ease;
}

.post-card:hover .post-card__title h3 {
  color: var(--ruins-accent-strong);
}

.post-card__excerpt {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--ruins-muted);
  text-align: justify;
}

.drop-cap {
  float: left;
  font-size: 3.8rem;
  line-height: 0.75;
  padding-top: 8px;
  padding-right: 12px;
  padding-left: 0;
  font-family: var(--font-serif);
  font-weight: 700;
  color: var(--ruins-accent-strong);
}

.post-card__footer {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--ruins-border);
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--ruins-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

@media (max-width: 640px) {
  .post-card {
    padding: 24px;
  }

  .post-card__title h3 {
    font-size: 1.6rem;
  }
}

.post-card__tag {
  color: inherit;
  text-decoration: none;
  transition: all 0.2s ease;
}

.post-card__tag:hover {
  border-color: var(--ruins-accent);
  color: var(--ruins-accent-strong);
}
</style>
