<template>
  <MdEditor
    v-model="content"
    :theme="themeStore.isDark ? 'dark' : 'light'"
    :language="language"
    :toolbars="toolbars as any"
    :preview="showPreview"
    @onUploadImg="handleUploadImg"
    @onSave="handleSave"
    class="md-editor-container"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'

// Props
interface Props {
  modelValue: string
  showPreview?: boolean
  language?: 'en-US' | 'zh-CN'
}

const props = withDefaults(defineProps<Props>(), {
  showPreview: true,
  language: 'zh-CN',
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  save: [content: string]
}>()

// Stores
const themeStore = useThemeStore()
const authStore = useAuthStore()

// Internal state
const content = ref(props.modelValue)

// Sync with parent v-model
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== content.value) {
      content.value = newVal
    }
  },
)

watch(content, (newVal) => {
  emit('update:modelValue', newVal)
})

// Toolbar configuration
const toolbars = [
  'bold',
  'underline',
  'italic',
  'strikeThrough',
  '-',
  'title',
  'sub',
  'sup',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'mermaid',
  'katex',
  '-',
  'revoke',
  'next',
  'save',
  '=',
  'pageFullscreen',
  'fullscreen',
  'preview',
  'previewOnly',
  'htmlPreview',
  'catalog',
]

// Image upload handler
const handleUploadImg = async (files: File[], callback: (urls: string[]) => void) => {
  try {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/posts/upload', {
        method: 'POST',
        headers: {
          Authorization: authStore.getAuthHeader(),
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      if (data.success && data.url) {
        return data.url
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    })

    const urls = await Promise.all(uploadPromises)
    callback(urls.filter((url) => url !== null) as string[])
  } catch (error) {
    console.error('Image upload error:', error)
    alert(`图片上传失败: ${(error as Error).message}`)
    callback([])
  }
}

// Save handler
const handleSave = (value: string) => {
  emit('save', value)
}
</script>

<style scoped>
.md-editor-container {
  height: 100%;
  min-height: 400px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .md-editor-container :deep(.md-editor-toolbar) {
    flex-wrap: wrap;
  }

  .md-editor-container :deep(.md-editor-toolbar-item) {
    font-size: 14px;
  }
}

/* Theme-specific customizations */
:deep(.md-editor) {
  border: 1px solid var(--ruins-border);
  border-radius: 4px;
}

:deep(.md-editor-input-wrapper),
:deep(.md-editor-preview-wrapper) {
  padding: 12px;
}

/* Dark theme adjustments */
.dark :deep(.md-editor) {
  --md-bk-color: var(--ruins-bg);
  --md-color: var(--ruins-text);
}

/* Light theme adjustments */
.light :deep(.md-editor) {
  --md-bk-color: #ffffff;
  --md-color: #333333;
}
</style>
