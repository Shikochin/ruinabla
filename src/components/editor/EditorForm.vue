<script setup lang="ts">
import { ref } from 'vue'
import MDEditor from '@/components/MDEditor.vue'
import type { Post } from '@/stores/postStore'

const form = defineModel<{
  slug: string
  title: string
  date: string
  tags: string[]
  category: string
  summary: string
  pinned: boolean
  hide: boolean
  license: string
  content: string
}>({ required: true })

const props = defineProps<{
  isNew: boolean
  titleLabel: string
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'cancel'): void
  (e: 'delete'): void
}>()

// Tag management
const MAX_TAGS = 10
const newTagInput = ref('')
const tagInput = ref<HTMLInputElement | null>(null)

const addTag = () => {
  const val = newTagInput.value.trim()
  if (val && !form.value.tags.includes(val)) {
    if (form.value.tags.length >= MAX_TAGS) return
    form.value.tags.push(val)
  }
  newTagInput.value = ''
}

const removeTag = (index: number) => {
  form.value.tags.splice(index, 1)
}

const handleBackspace = () => {
  if (!newTagInput.value && form.value.tags.length > 0) {
    removeTag(form.value.tags.length - 1)
  }
}
</script>

<template>
  <div class="main-editor">
    <div class="editor-header">
      <h3>{{ titleLabel }}</h3>
      <div class="actions">
        <button @click="emit('save')" class="primary">保存</button>
        <button @click="emit('cancel')">关闭</button>
        <button v-if="!isNew" @click="emit('delete')" class="danger">删除</button>
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
        <div class="field-label-row">
          <label>标签</label>
        </div>
        <div class="tags-input-container" @click="tagInput?.focus()">
          <div class="tag-chip" v-for="(tag, index) in form.tags" :key="tag">
            {{ tag }}
            <span class="remove-tag" @click.stop="removeTag(index)">×</span>
          </div>
          <input
            ref="tagInput"
            v-model="newTagInput"
            @keydown.enter.prevent="addTag"
            @keydown.backspace="handleBackspace"
            placeholder="按 Enter 创建标签"
            class="tag-input-field"
            :disabled="form.tags.length >= MAX_TAGS"
          />
          <span class="tag-counter" v-if="form.tags.length < MAX_TAGS">
            {{ form.tags.length }} / {{ MAX_TAGS }}
          </span>
        </div>
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
      <MDEditor v-model="form.content" @save="emit('save')" language="zh-CN" />
    </div>
  </div>
</template>

<style scoped>
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

.tags-input-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--ruins-border);
  background: var(--ruins-bg);
  padding: 6px 10px;
  border-radius: 6px;
  min-height: 42px;
  cursor: text;
  transition: all 0.2s ease;
}

.tags-input-container:focus-within {
  border-color: var(--ruins-accent);
  box-shadow: 0 0 0 3px rgba(var(--ruins-accent-rgb, 255, 107, 53), 0.1);
}

.tag-chip {
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.remove-tag {
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 0.8;
  opacity: 0.8;
}

.remove-tag:hover {
  opacity: 1;
}

.tag-input-field {
  flex: 1;
  min-width: 150px;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  padding: 4px !important;
  margin: 0;
  color: var(--ruins-text);
}

.tag-counter {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--ruins-muted);
  white-space: nowrap;
}

.field-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
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

/* Responsive Design */
@media (max-width: 1024px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .field.full {
    grid-column: span 1;
  }
}
</style>
