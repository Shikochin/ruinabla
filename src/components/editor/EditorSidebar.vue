<script setup lang="ts">
import type { Post } from '@/stores/postStore'

defineProps<{
  posts: Post[]
  sidebarCollapsed: boolean
  editingPost: Post | null
}>()

const emit = defineEmits<{
  (e: 'new'): void
  (e: 'edit', post: Post): void
}>()
</script>

<template>
  <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
    <div class="sidebar-header">
      <h2>文章</h2>
      <button @click="emit('new')" class="btn-new">新建</button>
    </div>
    <ul class="post-list">
      <li
        v-for="post in posts"
        :key="post.slug"
        :class="{ active: editingPost?.slug === post.slug }"
        @click="emit('edit', post)"
      >
        <div class="post-title">{{ post.title }}</div>
        <div class="post-meta">{{ post.date }}</div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* Collapsible Sidebar */
.sidebar {
  width: 280px;
  border-right: 1px solid var(--ruins-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 0;
  border-right: none;
  opacity: 0;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--ruins-border);
}

.sidebar-header h2 {
  font-size: 1.2rem;
  margin: 0;
  color: var(--ruins-text);
}

.btn-new {
  padding: 6px 12px;
  background: var(--ruins-accent);
  background-color: var(--ruins-bg);
  color: var(--ruins-text);
  border: 1px solid var(--ruins-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-new:hover {
  transform: translateY(-2px);
}

.post-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.post-list::-webkit-scrollbar {
  width: 6px;
}

.post-list::-webkit-scrollbar-track {
  background: var(--ruins-bg);
}

.post-list::-webkit-scrollbar-thumb {
  background: var(--ruins-border);
  border-radius: 3px;
}

.post-list::-webkit-scrollbar-thumb:hover {
  background: var(--ruins-border);
}

.post-list li {
  padding: 16px 20px;
  cursor: pointer;
  border-bottom: 1px solid var(--ruins-border);
  transition: all 0.2s ease;
  position: relative;
}

.post-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--ruins-accent);
  transform: scaleY(0);
  transition: transform 0.2s ease;
}

.post-list li:hover,
.post-list li.active {
  background: var(--ruins-bg);
  transform: translateX(4px);
}

.post-list li.active::before {
  transform: scaleY(1);
}

.post-title {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 4px;
  color: var(--ruins-text);
}

.post-list li.active .post-title {
  color: var(--ruins-accent);
}

.post-meta {
  font-size: 0.75rem;
  color: var(--ruins-muted);
}
</style>
