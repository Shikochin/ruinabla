<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useFancybox } from '@/composables/useFancybox'
import { renderMarkdown } from '@/utils/markdown'

import { usePostStore } from '@/stores/postStore'
import { useAuthStore } from '@/stores/authStore'
import GiscusComment from '@/components/GiscusComment.vue'

import { useHead } from '@unhead/vue'

import { useCodeCopy } from '@/composables/useCodeCopy'

import SkeletonPlaceholder from '@/components/ui/SkeletonPlaceholder.vue'

const route = useRoute()
const store = usePostStore()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.isAdmin)

const isLoading = ref(true)

const entry = computed(() => {
  const slug = route.params.slug
  if (typeof slug !== 'string') return null
  return store.findBySlug(slug) ?? null
})

const renderedContent = ref('')

// Watch for slug changes and fetch content
watch(
  () => route.params.slug,
  async (newSlug) => {
    if (typeof newSlug === 'string') {
      const cached = store.findBySlug(newSlug)
      if (cached?.content) {
        isLoading.value = false
        // Still fetch to ensure latest content if needed, but no blocking load
        store.fetchPostContent(newSlug)
      } else {
        isLoading.value = true
        try {
          await store.fetchPostContent(newSlug)
        } finally {
          isLoading.value = false
        }
      }
    }
  },
  { immediate: true },
)

// Watch for content changes and render markdown
watch(
  () => entry.value?.content,
  async (content) => {
    if (!content) {
      renderedContent.value = ''
      return
    }
    try {
      renderedContent.value = await renderMarkdown(content)
    } catch (error) {
      console.error('Failed to render markdown:', error)
      renderedContent.value = `<p>Error rendering content</p>`
    }
  },
  { immediate: true },
)

// -- Fancybox integration --

// 1. Call useFancybox hook
const { reinitialize } = useFancybox('[data-fancybox="markdown-gallery"]', {})
const { init: initCopy } = useCodeCopy('.entry__content')

// 2. Watch entry changes and rebind Fancybox
watch(
  renderedContent,
  (newContent) => {
    if (newContent) {
      nextTick(() => {
        reinitialize()
        initCopy()
      })
    }
  },
  { immediate: true },
) // ensures it triggers on first mount

// -- Fancybox integration end --

// SEO configuration
useHead({
  title: computed(() => entry.value?.title || 'Not Found'),
  meta: [
    {
      name: 'description',
      content: computed(() => entry.value?.summary || 'Entry not found'),
    },
    {
      property: 'og:title',
      content: computed(() => entry.value?.title || 'Not Found'),
    },
    {
      property: 'og:description',
      content: computed(() => entry.value?.summary || 'Entry not found'),
    },
    {
      property: 'og:type',
      content: 'article',
    },
    {
      property: 'article:published_time',
      content: computed(() => entry.value?.date),
    },
    {
      name: 'author',
      content: 'Shikochin',
    },
  ],
})
</script>

<template>
  <div>
    <!-- Skeleton Loading State -->
    <section v-if="isLoading" class="entry paper-panel">
      <SkeletonPlaceholder width="120px" height="1.2em" />
      <div class="eyebrow-skeleton">
        <SkeletonPlaceholder width="250px" height="1em" />
      </div>
      <h1 class="entry__title">
        <SkeletonPlaceholder width="60%" height="2rem" />
      </h1>

      <!-- Summary Skeleton -->
      <div class="entry__summary-wrapper skeleton-summary">
        <SkeletonPlaceholder width="100px" height="0.8rem" style="margin-bottom: 10px" />
        <SkeletonPlaceholder width="100%" height="1.1rem" style="margin-bottom: 8px" />
        <SkeletonPlaceholder width="90%" height="1.1rem" />
      </div>

      <!-- Content Skeleton -->
      <div class="entry__content">
        <SkeletonPlaceholder width="100%" height="1.2rem" style="margin-bottom: 16px" />
        <SkeletonPlaceholder width="95%" height="1.2rem" style="margin-bottom: 16px" />
        <SkeletonPlaceholder width="90%" height="1.2rem" style="margin-bottom: 16px" />
        <SkeletonPlaceholder width="98%" height="1.2rem" style="margin-bottom: 16px" />
        <br />
        <SkeletonPlaceholder width="80%" height="1.2rem" style="margin-bottom: 16px" />
        <SkeletonPlaceholder width="85%" height="1.2rem" style="margin-bottom: 16px" />
      </div>
    </section>

    <!-- Actual Content -->
    <section v-else-if="entry" class="entry paper-panel">
      <RouterLink to="/" class="entry__back">&larr; 返回废墟信标</RouterLink>
      <p class="eyebrow">
        {{ entry.date }} / {{ entry.readingMinutes }} min{{ entry.readingMinutes > 1 ? 's' : '' }}
        read /
        <RouterLink :to="`/categories/${entry.category}`">
          <strong>{{ entry.category }}</strong>
        </RouterLink>
        <br />
        <RouterLink v-if="entry && isAdmin" :to="{ path: '/editor', query: { slug: entry.slug } }">
          <span>✎</span> 编辑此文
        </RouterLink>
      </p>
      <h1 class="entry__title">
        <span>{{ entry.title }}</span>
      </h1>

      <div class="entry__summary-wrapper" v-if="entry.summary">
        <div class="entry__ai-label"><span>∇</span> AI Generated Summary</div>
        <div class="entry__excerpt">{{ entry.summary }}</div>
      </div>
      <div class="entry__content" v-html="renderedContent"></div>

      <hr class="entry__divider" />
      <div class="extra-info">
        <div v-if="entry.tags.length" class="entry__tags eyebrow">
          <RouterLink v-for="tag in entry.tags" :key="tag" :to="`/tags/${tag}`">
            #{{ tag }}
          </RouterLink>
        </div>
        <div class="entry__license">
          Licensed by
          <a target="_blank" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
        </div>
      </div>
    </section>

    <GiscusComment v-if="entry && !isLoading" />

    <!-- Not Found State -->
    <section v-if="!entry && !isLoading" class="entry paper-panel">
      <h1>未找到对应的信标</h1>
      <p>可能被风沙掩埋了。返回信标重新定位吧。</p>
      <RouterLink to="/" class="entry__back">&larr; 返回废墟信标</RouterLink>
    </section>
  </div>
</template>

<style scoped>
/* Styles section remains unchanged */
/* ... (original style scoped content) */

.extra-info {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

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
  display: inline-flex;
  flex-wrap: wrap;
  gap: 10px;
}

.entry__tags span {
  padding: 6px 12px;
}

.entry__content {
  padding: 10px 0;
  line-height: 1.9;
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

.entry__content :global(h1),
.entry__content :global(h2),
.entry__content :global(h3),
.entry__content :global(h4),
.entry__content :global(h5),
.entry__content :global(h6) {
  position: relative;
}

.entry__content :global(.anchor-link) {
  position: absolute;
  left: -1.2em;
  opacity: 0;
  text-decoration: none;
  color: var(--ruins-accent);
  transition: opacity 0.2s ease;
  user-select: none;
  width: 1em;
  text-align: right;
}

.entry__content :global(h1:hover .anchor-link),
.entry__content :global(h2:hover .anchor-link),
.entry__content :global(h3:hover .anchor-link),
.entry__content :global(h4:hover .anchor-link),
.entry__content :global(h5:hover .anchor-link),
.entry__content :global(h6:hover .anchor-link) {
  opacity: 1;
}

@media (max-width: 640px) {
  .entry {
    padding: 26px;
  }
}

.entry__summary-wrapper {
  border: 1px solid var(--ruins-border);
  padding: 16px;
}

.entry__ai-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--ruins-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 10px;
  gap: 8px;

  span {
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
  }
}

.entry__license {
  font-size: 0.8rem;
  color: var(--ruins-muted);
}

.eyebrow a {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease;
}

.eyebrow a:hover {
  color: var(--ruins-accent-strong);
}

.edit-btn:hover {
  border-color: var(--ruins-accent);
  color: var(--ruins-accent);
  background: rgba(255, 255, 255, 0.05);
}
</style>

<style scoped>
/* Append these styles */
.eyebrow-skeleton {
  margin: 10px 0 20px;
}

.skeleton-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--ruins-border);
  padding: 16px;
  margin-top: 32px;
  margin-bottom: 32px;
}
</style>
