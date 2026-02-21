<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { usePostStore, type Post } from '@/stores/postStore'
import { useThemeStore } from '@/stores/themeStore'
import { useToastStore } from '@/stores/toastStore'
import { getCurrentDate } from '@/utils/temporal'
import { http } from '@/utils/http'
import EditorSidebar from '@/components/editor/EditorSidebar.vue'
import EditorForm from '@/components/editor/EditorForm.vue'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const themeStore = useThemeStore()
const store = usePostStore()
const toast = useToastStore()
const editingPost = ref<Post | null>(null)
const isNew = ref(false)
const sidebarCollapsed = ref(false)

// Form state
const form = ref({
  slug: '',
  title: '',
  date: getCurrentDate(),
  tags: [] as string[],
  category: '',
  summary: '',
  pinned: false,
  hide: false,
  license: 'CC BY-SA 4.0',
  content: '',
})

const route = useRoute()

onMounted(async () => {
  await store.fetchPosts()

  // Restore sidebar state
  const saved = localStorage.getItem('editor-sidebar-collapsed')
  if (saved === 'true') {
    sidebarCollapsed.value = true
  }

  // Check for deep link
  const slug = route.query.slug
  if (slug && typeof slug === 'string') {
    const post = store.posts.find((p) => p.slug === slug)
    if (post) {
      startEdit(post)
    } else {
      // If not in list (maybe new or not fetched yet), try fetching detail
      // This part depends on if store.posts contains all posts or just summaries.
      // Assuming store.posts is populated by fetchPosts above.
      // If still not found, we might want to try fetching specifically or show error.
      // For now, let's just toast if not found in list.
      toast.error(t('entry.notFound'))
    }
  }
})

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('editor-sidebar-collapsed', String(sidebarCollapsed.value))
}

const startEdit = async (post: Post) => {
  isNew.value = false
  // Fetch full content if missing
  if (!post.content) {
    await store.fetchPostContent(post.slug)
    const updated = store.posts.find((p) => p.slug === post.slug)
    if (updated) post = updated
  }

  editingPost.value = post
  form.value = {
    ...post,
    slug: post.slug,
    title: post.title,
    date: post.date,
    category: post.category,
    pinned: post.pinned || false,
    hide: post.hide || false,
    license: post.license || 'CC BY-SA 4.0',
    summary: post.summary || '',
    tags: [...post.tags], // Clone array
    content: post.content || '',
  }
}

const startNew = () => {
  isNew.value = true
  editingPost.value = { slug: 'new' } as Post // Dummy
  form.value = {
    slug: '',
    title: '',
    date: getCurrentDate(),
    tags: [],
    category: '',
    summary: '',
    pinned: false,
    hide: false,
    license: 'CC BY-SA 4.0',
    content: '',
  }
}

const cancelEdit = () => {
  editingPost.value = null
}

const savePost = async () => {
  toast.info(t('editor.messages.saving'))
  try {
    const payload = {
      ...form.value,
      tags: form.value.tags, // Already array
    }

    const res = await http('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to save')
    }

    toast.success(t('editor.messages.saved'))
    await store.fetchPosts() // Refresh list

    if (isNew.value) {
      isNew.value = false
      // In a real app we might update editingPost.value.slug if user changed slug
      // But keeping it simple for now
    }
  } catch (e) {
    toast.error(`Error: ${(e as Error).message}`)
  }
}

const deletePost = async () => {
  if (!editingPost.value) return
  const slug = editingPost.value.slug
  if (!confirm(t('editor.messages.deleting', { slug }))) return

  try {
    const res = await http(`/api/posts/${slug}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete')
    await store.fetchPosts()
    cancelEdit()
  } catch (e) {
    toast.error((e as Error).message)
  }
}
</script>

<template>
  <div class="fullscreen-editor">
    <!-- Minimal Top Navigation -->
    <nav class="editor-topnav">
      <div class="nav-left">
        <button
          class="sidebar-toggle"
          @click="toggleSidebar"
          :title="sidebarCollapsed ? $t('editor.sidebar.expand') : $t('editor.sidebar.collapse')"
        >
          <span v-if="sidebarCollapsed">☰</span>
          <span v-else>✕</span>
        </button>
        <RouterLink to="/" class="nav-logo">Rui∇abla</RouterLink>
        <RouterLink to="/chronicle" class="nav-link">{{ $t('chronicle.title') }}</RouterLink>
        <RouterLink to="/lighthouse" class="nav-link">{{ $t('lighthouse.title') }}</RouterLink>
        <RouterLink to="/about" class="nav-link">{{ $t('about.title') }}</RouterLink>
      </div>
      <div class="nav-right">
        <button @click="themeStore.toggleTheme" class="theme-toggle" :title="$t('common.settings')">
          <span v-if="themeStore.themeMode === 'auto'">⛅</span>
          <span v-else-if="themeStore.themeMode === 'light'">🌞</span>
          <span v-else>🌛</span>
        </button>

        <RouterLink to="/settings" class="nav-link">{{ $t('common.settings') }}</RouterLink>
      </div>
    </nav>

    <!-- Main Editor Container -->
    <div class="editor-container" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <EditorSidebar
        :posts="store.posts"
        :sidebar-collapsed="sidebarCollapsed"
        :editing-post="editingPost"
        @new="startNew"
        @edit="startEdit"
      />

      <EditorForm
        v-if="editingPost"
        v-model="form"
        :is-new="isNew"
        :title-label="isNew ? $t('editor.newPost') : editingPost.title"
        @save="savePost"
        @cancel="cancelEdit"
        @delete="deletePost"
      />

      <div class="empty-state" v-else>
        <p>{{ $t('editor.form.placeholder.selectPost') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Full-Screen Layout */
.fullscreen-editor {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Minimal Top Navigation */
.editor-topnav {
  height: 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  z-index: 100;
  flex-shrink: 0;
}

.nav-left,
.nav-right {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.nav-logo {
  font-family: var(--font-serif, serif);
  font-size: 1.2rem;
  font-weight: bold;
  background: none;
  border: none;
  color: var(--ruins-accent);
  cursor: pointer;
  padding: 6px 12px;
  transition: all 0.2s ease;
}

.nav-logo:hover {
  transform: scale(1.05);
}

.nav-link {
  background: none;
  border: none;
  color: var(--ruins-text);
  cursor: pointer;
  padding: 6px 12px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  border-radius: 4px;
}

.nav-link:hover {
  color: var(--ruins-accent);
}

.theme-toggle {
  color: var(--ruins-text);
  cursor: pointer;
  padding: 6px 12px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  border: 0;
  background-color: transparent;
}

.theme-toggle:hover {
  transform: translateY(-1px);
}

.theme-toggle {
  padding: 6px 10px;
  font-size: 1rem;
}

/* Editor Container */
.editor-container {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* Sidebar Toggle Button */
.sidebar-toggle {
  color: var(--ruins-text);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border: 0;
  width: 48px;
  background: transparent;
}

.sidebar-toggle:hover {
  transform: scale(1.1);
}

.editor-container.sidebar-collapsed .sidebar-toggle {
  left: 12px;
}

.empty-state {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--ruins-muted);
  font-size: 1.1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .editor-topnav {
    padding: 0 12px;
  }
}
</style>
