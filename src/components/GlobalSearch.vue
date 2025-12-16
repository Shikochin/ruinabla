<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Fuse, { type FuseResult } from 'fuse.js'
import { usePostStore, type Post } from '@/stores/postStore'

import { useSearch } from '@/composables/useSearch'

const router = useRouter()
const store = usePostStore()
const { isOpen, openSearch: openSearchState, closeSearch: closeSearchState } = useSearch()
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const searchResultItems = ref<HTMLElement[]>([])
const selectedIndex = ref(0)
const results = ref<FuseResult<Post>[]>([])

// Fuse.js options
const fuseOptions = {
  keys: [
    { name: 'title', weight: 0.7 },
    { name: 'slug', weight: 0.5 },
    { name: 'tags', weight: 0.3 },
    { name: 'category', weight: 0.3 },
    { name: 'summary', weight: 0.4 },
  ],
  threshold: 0.4, // Lower = stricter
  includeMatches: true,
}

let fuse: Fuse<Post> | null = null

// Initialize or update Fuse index when posts change
watch(
  () => store.posts,
  (posts) => {
    if (posts.length > 0) {
      fuse = new Fuse(posts, fuseOptions)
    }
  },
  { immediate: true },
)

// Watch search query
watch(searchQuery, (query) => {
  if (!query.trim() || !fuse) {
    results.value = []
    return
  }
  const searchResults = fuse.search(query)
  // Limit results
  results.value = searchResults.slice(0, 10)
  selectedIndex.value = 0
})

const openSearch = () => {
  openSearchState()
  searchQuery.value = ''
  results.value = []
  selectedIndex.value = 0

  // Lock scroll
  const scrollY = window.scrollY
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollY}px`
  document.body.style.width = '100%'

  nextTick(() => {
    searchInput.value?.focus()
  })
}

const closeSearch = () => {
  // Unlock scroll
  const scrollY = document.body.style.top
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
  window.scrollTo(0, parseInt(scrollY || '0') * -1)

  closeSearchState()
}

const navigateToResult = (result: FuseResult<Post>) => {
  router.push(`/posts/${result.item.slug}`)
  closeSearch()
}

const scrollToSelected = () => {
  nextTick(() => {
    const el = searchResultItems.value[selectedIndex.value]
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  })
}

// Keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    if (isOpen.value) {
      closeSearch()
    } else {
      openSearch()
    }
  } else if (e.key === 'Escape' && isOpen.value) {
    e.preventDefault()
    closeSearch()
  } else if (isOpen.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedIndex.value = (selectedIndex.value + 1) % results.value.length
      scrollToSelected()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedIndex.value = (selectedIndex.value - 1 + results.value.length) % results.value.length
      scrollToSelected()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results.value.length > 0) {
        navigateToResult(results.value[selectedIndex.value])
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
})

// Watch global state to handle external opening
watch(isOpen, (val) => {
  if (val) {
    // If opened externally (e.g. header button), ensure we run setup
    if (!document.body.style.position) {
      openSearch()
    }
  } else {
    // If closed externally
    if (document.body.style.position) {
      closeSearch()
    }
  }
})

// Expose open method for external buttons
defineExpose({ openSearch })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="search-overlay" @click.self="closeSearch">
        <div class="search-modal">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input
              ref="searchInput"
              v-model="searchQuery"
              placeholder="Search posts, tags, categories..."
              type="text"
              class="search-input"
            />
            <button class="close-btn" @click="closeSearch">ESC</button>
          </div>

          <div class="search-results" v-if="results.length > 0">
            <TransitionGroup name="list">
              <div
                v-for="(result, index) in results"
                :key="result.item.slug"
                ref="searchResultItems"
                class="search-item"
                :class="{ active: index === selectedIndex }"
                @click="navigateToResult(result)"
                @mouseenter="selectedIndex = index"
              >
                <div class="item-content">
                  <span class="item-title">{{ result.item.title }}</span>
                  <span class="item-meta">
                    {{ result.item.date }} · {{ result.item.category }}
                  </span>
                  <span class="item-summary" v-if="result.item.summary">
                    {{ result.item.summary.slice(0, 80) }}...
                  </span>
                  <div class="item-tags" v-if="result.item.tags.length">
                    <span v-for="tag in result.item.tags.slice(0, 3)" :key="tag" class="tag"
                      >#{{ tag }}</span
                    >
                  </div>
                </div>
                <div class="item-arrow">↩</div>
              </div>
            </TransitionGroup>
          </div>

          <div class="no-results" v-if="searchQuery && results.length === 0">
            <p>No results found for "{{ searchQuery }}"</p>
          </div>

          <div class="search-footer">
            <span class="key-hint"><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
            <span class="key-hint"><kbd>↵</kbd> to select</span>
            <span class="key-hint"><kbd>esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 15vh;
}

.search-modal {
  width: 100%;
  max-width: 600px;
  background: var(--ruins-bg);
  border: 1px solid var(--ruins-accent);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--ruins-border);
  gap: 12px;
}

.search-icon {
  font-size: 1.2rem;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: var(--ruins-text);
  font-family: var(--font-sans);
  outline: none;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--ruins-border);
  color: var(--ruins-muted);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: var(--font-mono);
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
}

.search-item {
  padding: 12px 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 3px solid transparent;
  transition: all 0.1s;
}

.search-item.active {
  background: rgba(255, 255, 255, 0.05);
  border-left-color: var(--ruins-accent);
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-title {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  color: var(--ruins-text);
}

.item-meta {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ruins-muted);
}

.item-summary {
  font-size: 0.85rem;
  color: var(--ruins-muted);
  opacity: 0.8;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-tags {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.tag {
  font-size: 0.75rem;
  color: var(--ruins-accent);
  font-family: var(--font-mono);
}

.item-arrow {
  color: var(--ruins-muted);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.2s;
  font-family: var(--font-mono);
}

.search-item.active .item-arrow {
  opacity: 1;
  transform: translateX(0);
}

.no-results {
  padding: 30px;
  text-align: center;
  color: var(--ruins-muted);
  font-family: var(--font-mono);
}

.search-footer {
  padding: 10px 20px;
  border-top: 1px solid var(--ruins-border);
  display: flex;
  gap: 16px;
  font-size: 0.75rem;
  color: var(--ruins-muted);
  font-family: var(--font-mono);
}

.key-hint kbd {
  background: light-dark(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.1));
  padding: 2px 4px;
  border-radius: 3px;
  font-family: inherit;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

/* List Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
