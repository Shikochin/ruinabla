<script setup lang="ts">
import { toRef } from 'vue'
import type { PostEntry } from '@/data/post'
import { RouterLink } from 'vue-router'

const props = defineProps<{
  entries: PostEntry[]
}>()

const entries = toRef(props, 'entries')
</script>

<template>
  <div class="timeline-container paper-panel">
    <ol class="timeline">
      <li v-for="entry in entries" :key="entry.id" class="timeline__item">
        <div class="timeline__meta">
          <span class="timeline__date">{{ entry.date }}</span>
          <br />
          <strong v-if="entry.pinned" class="timeline__date">Pinned</strong>
        </div>
        <div class="timeline__divider">
          <span class="timeline__dot"></span>
        </div>
        <div class="timeline__content">
          <RouterLink :to="`/posts/${entry.slug}`">
            <h4>
              {{ entry.title }}
            </h4>
          </RouterLink>
          <p class="timeline__summary">
            {{ entry.summary }}
          </p>
          <div v-if="entry.tags.length" class="timeline__tags">
            <RouterLink v-for="tag in entry.tags" :key="tag" :to="`/tags/${tag}`"
              >#{{ tag }}</RouterLink
            >
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.timeline-container {
  /*
    Timeline 容器处理：
    透明背景，左侧突出强调线
  */
  background: transparent;
  border: none;
  border-left: 1px solid var(--ruins-border);
  box-shadow: none;
  padding: 20px 0;
}

.timeline {
  list-style: none;
  margin: 0;
  padding: 0 0 0 40px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.timeline__item {
  display: grid;
  grid-template-columns: 100px 24px 1fr;
  gap: 32px;
}

.timeline__meta {
  text-align: right;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ruins-muted);
  padding-top: 6px;
  opacity: 0.7;
}

.timeline__divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* 贯穿线: 虚线 */
.timeline__divider::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: -48px;
  width: 1px;
  background-image: linear-gradient(to bottom, var(--ruins-border) 50%, transparent 50%);
  background-size: 1px 8px;
  opacity: 0.5;
}

.timeline__item:last-child .timeline__divider::before {
  display: none;
}

.timeline__dot {
  width: 7px;
  height: 7px;
  background-color: var(--ruins-bg);
  border: 1px solid var(--ruins-text);
  transform: rotate(45deg);
  /* 菱形节点 */
  z-index: 1;
  margin-top: 8px;
  box-shadow: 0 0 0 4px var(--ruins-bg);
  /* 增加间距感 */
}

.timeline__content {
  padding-bottom: 8px;
}

.timeline__content h4 {
  margin: 0 0 12px;
  font-size: 1.5rem;
  font-family: var(--font-serif);
  line-height: 1.2;
  font-weight: 400;
  /* 稍微轻一点的字重 */
}

.timeline__content a {
  border: none;
}

.timeline__content a:hover h4 {
  color: var(--ruins-accent-strong);
  text-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
}

.timeline__summary {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--ruins-muted);
  font-family: var(--font-serif);
  opacity: 0.8;
}

.timeline__tags {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--ruins-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pinned-badge {
  display: inline-block;
  margin-left: 12px;
  padding: 2px 8px;
  font-size: 0.65rem;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--ruins-accent-strong);
  border: 1px solid var(--ruins-accent);
  background: rgba(177, 98, 134, 0.1);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  vertical-align: middle;
  transition: all 0.2s ease;
}

.timeline__content a:hover .pinned-badge {
  background: rgba(177, 98, 134, 0.2);
  box-shadow: 0 0 8px rgba(177, 98, 134, 0.3);
}

@media (max-width: 640px) {
  .timeline-container {
    border-left: none;
    padding: 0;
  }

  .timeline {
    padding: 20px;
  }

  .timeline__item {
    grid-template-columns: 1fr;
    gap: 12px;
    padding-left: 24px;
    border-left: 1px dashed var(--ruins-border);
    position: relative;
  }

  .timeline__divider {
    display: none;
  }

  .timeline__meta {
    text-align: left;
    padding: 0;
    font-size: 0.75rem;
  }

  .timeline__item::before {
    content: '';
    position: absolute;
    left: -4px;
    top: 6px;
    width: 7px;
    height: 7px;
    background-color: var(--ruins-bg);
    border: 1px solid var(--ruins-text);
    transform: rotate(45deg);
  }
}
</style>
