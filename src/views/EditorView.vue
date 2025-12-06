<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePostStore, type Post } from '@/stores/postStore'
import { useAuthStore } from '@/stores/authStore'
import { getCurrentDate } from '@/utils/temporal'

const auth = useAuthStore()
const store = usePostStore()
const editingPost = ref<Post | null>(null)
const isNew = ref(false)
const message = ref('')

// Form fields
const form = ref({
  slug: '',
  title: '',
  date: getCurrentDate(),
  tags: '',
  category: '',
  pinned: false,
  hide: false,
  license: 'CC BY-SA 4.0',
  content: '',
})

onMounted(() => {
  store.fetchPosts()
})

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
  <div class="editor-container paper-panel">
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>Posts</h2>
        <button @click="startNew">+ New</button>
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

    <div class="main-editor" v-if="editingPost">
      <div class="editor-header">
        <h3>{{ isNew ? 'New Post' : 'Editing: ' + editingPost.slug }}</h3>
        <div class="actions">
          <span class="message">{{ message }}</span>
          <button @click="savePost" class="primary">Save</button>
          <button @click="cancelEdit">Close</button>
          <button v-if="!isNew" @click="deletePost(editingPost.slug)" class="danger">Delete</button>
        </div>
      </div>

      <div class="form-grid">
        <div class="field">
          <label>Slug</label>
          <input v-model="form.slug" :disabled="!isNew" />
        </div>
        <div class="field">
          <label>Title</label>
          <input v-model="form.title" />
        </div>
        <div class="field">
          <label>Date</label>
          <input type="date" v-model="form.date" />
        </div>
        <div class="field">
          <label>Category</label>
          <input v-model="form.category" />
        </div>
        <div class="field full">
          <label>Tags (comma separated)</label>
          <input v-model="form.tags" />
        </div>
        <div class="field checkboxes">
          <label><input type="checkbox" v-model="form.pinned" /> Pinned</label>
          <label><input type="checkbox" v-model="form.hide" /> Hide</label>
        </div>
      </div>

      <div class="content-editor">
        <label>Content (Markdown)</label>
        <textarea v-model="form.content" class="markdown-input"></textarea>
      </div>
    </div>

    <div class="empty-state" v-else>
      <p>Select a post to edit or create a new one.</p>
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  display: flex;
  height: calc(100vh - 100px);
  gap: 20px;
  padding: 20px;
}

.sidebar {
  width: 250px;
  border-right: 1px solid var(--ruins-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--ruins-border);
}

.post-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.post-list li {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.post-list li:hover,
.post-list li.active {
  background: rgba(255, 255, 255, 0.05);
}

.post-title {
  font-weight: bold;
  font-size: 0.9rem;
}

.post-meta {
  font-size: 0.75rem;
  color: var(--ruins-muted);
}

.main-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--ruins-border);
  padding-bottom: 10px;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.message {
  font-size: 0.8rem;
  color: var(--ruins-accent);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field.full {
  grid-column: span 2;
}

.field.checkboxes {
  flex-direction: row;
  gap: 20px;
  align-items: center;
}

input,
textarea {
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  padding: 8px;
  border-radius: 4px;
}

.markdown-input {
  width: 100%;
  height: 400px;
  font-family: monospace;
  line-height: 1.5;
}

button {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  cursor: pointer;
  border-radius: 4px;
}

button:hover {
  background: rgba(255, 255, 255, 0.2);
}

button.primary {
  background: var(--ruins-accent);
  color: var(--ruins-bg);
  border: none;
}

button.danger {
  background: #ff4444;
  border: none;
}

.empty-state {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--ruins-muted);
}
</style>
