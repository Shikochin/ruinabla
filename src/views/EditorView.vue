<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePostStore, type Post } from '@/stores/postStore'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { getCurrentDate } from '@/utils/temporal'
import MDEditor from '@/components/MDEditor.vue'

const auth = useAuthStore()
const themeStore = useThemeStore()
const store = usePostStore()
const editingPost = ref<Post | null>(null)
const isNew = ref(false)
const message = ref('')
const sidebarCollapsed = ref(false)

// Form fields
const form = ref({
  slug: '',
  title: '',
  date: getCurrentDate(),
  tags: '',
  category: '',
  summary: '',
  pinned: false,
  hide: false,
  license: 'CC BY-SA 4.0',
  content: '',
})

onMounted(() => {
  store.fetchPosts()
  // Restore sidebar state
  const saved = localStorage.getItem('editor-sidebar-collapsed')
  if (saved === 'true') {
    sidebarCollapsed.value = true
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
    ...post,
    pinned: post.pinned || false,
    hide: post.hide || false,
    license: post.license || 'CC BY-SA 4.0',
    summary: post.summary || '',
    tags: post.tags.join(', '),
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
    tags: '',
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
  message.value = ''
}

const savePost = async () => {
  message.value = 'Saving...'
  try {
    const payload = {
      ...form.value,
      tags: form.value.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth.getAuthHeader(),
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to save')
    }

    message.value = 'Saved successfully!'
    await store.fetchPosts() // Refresh list

    // If it was new, switch to edit mode for the created post
    if (isNew.value) {
      isNew.value = false
      // Update editingPost to point to the new slug if it changed
      // But for simplicity, just stay in edit mode with current form
    }
  } catch (e) {
    message.value = `Error: ${(e as Error).message}`
  }
}

const handleEditorSave = () => {
  savePost()
}

const deletePost = async (slug: string) => {
  if (!confirm(`Delete post ${slug}?`)) return

  try {
    const res = await fetch(`/api/posts/${slug}`, {
      method: 'DELETE',
      headers: {
        Authorization: auth.getAuthHeader(),
      },
    })
    if (!res.ok) throw new Error('Failed to delete')
    await store.fetchPosts()
    if (editingPost.value?.slug === slug) {
      cancelEdit()
    }
  } catch (e) {
    alert((e as Error).message)
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
          :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        >
          <span v-if="sidebarCollapsed">☰</span>
          <span v-else>✕</span>
        </button>
        <RouterLink to="/" class="nav-logo">Rui∇abla</RouterLink>
        <RouterLink to="/chronicle" class="nav-link">年轮</RouterLink>
        <RouterLink to="/lighthouse" class="nav-link">灯塔</RouterLink>
        <RouterLink to="/about" class="nav-link">余烬</RouterLink>
      </div>
      <div class="nav-right">
        <button
          @click="themeStore.toggleTheme"
          class="theme-toggle"
          :title="`当前: ${themeStore.themeMode}`"
        >
          <span v-if="themeStore.themeMode === 'dark'">☀️</span>
          <span v-else-if="themeStore.themeMode === 'light'">🌙</span>
          <span v-else>🌓</span>
        </button>

        <RouterLink to="/settings" class="nav-link">设置</RouterLink>
      </div>
    </nav>

    <!-- Main Editor Container -->
    <div class="editor-container" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- Collapsible Sidebar -->
      <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-header">
          <h2>文章</h2>
          <button @click="startNew" class="btn-new">新建</button>
        </div>
        <ul class="post-list">
          <li
            v-for="post in store.posts"
            :key="post.slug"
            :class="{ active: editingPost?.slug === post.slug }"
            @click="startEdit(post)"
          >
            <div class="post-title">{{ post.title }}</div>
            <div class="post-meta">{{ post.date }}</div>
          </li>
        </ul>
      </div>

      <!-- Main Editor Area -->
      <div class="main-editor" v-if="editingPost">
        <div class="editor-header">
          <h3>{{ isNew ? '新文章' : editingPost.title }}</h3>
          <div class="actions">
            <span class="message">{{ message }}</span>
            <button @click="savePost" class="primary">保存</button>
            <button @click="cancelEdit">关闭</button>
            <button v-if="!isNew" @click="deletePost(editingPost.slug)" class="danger">删除</button>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Slug</label>
            <input v-model="form.slug" :disabled="!isNew" />
          </div>
          <div class="field">
            <label>标题</label>
            <input v-model="form.title" />
          </div>
          <div class="field">
            <label>日期</label>
            <input type="date" v-model="form.date" />
          </div>
          <div class="field">
            <label>分类</label>
            <input v-model="form.category" />
          </div>
          <div class="field full">
            <label>标签</label>
            <input v-model="form.tags" />
          </div>
          <div class="field full">
            <label>摘要</label>
            <textarea
              v-model="form.summary"
              class="summary-input"
              placeholder="文章摘要（留空则自动生成）"
            ></textarea>
          </div>
          <div class="field checkboxes">
            <label><input type="checkbox" v-model="form.pinned" /> 置顶</label>
            <label><input type="checkbox" v-model="form.hide" /> 隐藏</label>
          </div>
        </div>

        <div class="content-editor">
          <label>Content (Markdown)</label>
          <MDEditor v-model="form.content" @save="handleEditorSave" language="zh-CN" />
        </div>
      </div>

      <div class="empty-state" v-else>
        <p>Select a post to edit or create a new one.</p>
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
}

.sidebar-toggle:hover {
  transform: scale(1.1);
}

.editor-container.sidebar-collapsed .sidebar-toggle {
  left: 12px;
}

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

/* Main Editor Area */
.main-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 30px;
  overflow-y: auto;
  min-width: 0;
}

.main-editor::-webkit-scrollbar {
  width: 8px;
}

.main-editor::-webkit-scrollbar-track {
  background: var(--ruins-bg);
}

.main-editor::-webkit-scrollbar-thumb {
  background: var(--ruins-border);
  border-radius: 4px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 2px solid var(--ruins-border);
  flex-wrap: wrap;
  gap: 15px;
}

.editor-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: var(--ruins-text);
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.message {
  font-size: 0.85rem;
  color: var(--ruins-accent);
  font-weight: 500;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ruins-muted);
}

.field.full {
  grid-column: span 2;
}

.field.checkboxes {
  flex-direction: row;
  gap: 20px;
  align-items: center;
}

.field.checkboxes label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: normal;
  color: var(--ruins-text);
}

input,
textarea {
  border: 1px solid var(--ruins-border);
  background: var(--ruins-bg);
  color: var(--ruins-text);
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--ruins-accent);
  background: var(--ruins-bg);
  box-shadow: 0 0 0 3px rgba(var(--ruins-accent-rgb, 255, 107, 53), 0.1);
}

input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.content-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 500px;
}

.content-editor label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--ruins-muted);
}

.summary-input {
  min-height: 80px;
  resize: vertical;
  font-family: var(--font-sans);
  line-height: 1.5;
}

button {
  padding: 8px 16px;
  background: var(--ruins-bg);
  border: 1px solid var(--ruins-border);
  border-radius: 6px;
  color: var(--ruins-text);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;
}

button:hover {
  background: var(--ruins-bg);
  transform: translateY(-1px);
}

button.danger {
  background: #ff4444;
  border: none;
  color: white;
}

button.danger:hover {
  background: #ff2222;
  box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
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
@media (max-width: 1024px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .field.full {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .editor-topnav {
    padding: 0 12px;
  }

  .nav-link {
    display: none;
  }

  .sidebar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 40;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
  }

  .sidebar.collapsed {
    transform: translateX(-100%);
  }

  .main-editor {
    padding: 20px 15px;
    gap: 15px;
  }

  .editor-header {
    flex-direction: column;
    align-items: stretch;
  }

  .editor-header h3 {
    font-size: 1.1rem;
  }

  .actions {
    justify-content: stretch;
  }

  .actions button {
    flex: 1;
    padding: 12px;
    min-height: 44px;
  }

  .form-grid {
    gap: 12px;
  }

  input,
  textarea {
    font-size: 16px;
    padding: 12px;
  }

  .content-editor {
    min-height: 400px;
  }
}

@media (max-width: 480px) {
  .main-editor {
    padding: 15px 10px;
  }

  .field.checkboxes {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  button {
    width: 100%;
  }

  .nav-logo {
    font-size: 1rem;
  }

  .theme-toggle {
    padding: 6px 10px;
    font-size: 0.8rem;
  }
}
</style>
