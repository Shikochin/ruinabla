<script setup lang="ts">
import { ref } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
  show: boolean
  title: string
  description?: string
  actionText?: string
}>()

const emit = defineEmits<{
  confirm: [password: string]
  cancel: []
}>()

const password = ref('')
const loading = ref(false)

function handleConfirm() {
  if (!password.value) return
  loading.value = true
  emit('confirm', password.value)
}

function handleCancel() {
  password.value = ''
  loading.value = false
  emit('cancel')
}

// Reset when modal closes
function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    handleCancel()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-backdrop" @click="handleBackdropClick">
        <div class="modal-content paper-panel">
          <div class="modal-header">
            <h3>{{ title }}</h3>
            <button class="close-btn" @click="handleCancel" :disabled="loading">×</button>
          </div>

          <div class="modal-body">
            <p v-if="description" class="description">{{ description }}</p>

            <div class="field">
              <label for="confirm-password">密码</label>
              <input
                id="confirm-password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="输入您的密码"
                @keyup.enter="handleConfirm"
                :disabled="loading"
                autofocus
              />
            </div>
          </div>

          <div class="modal-footer">
            <button @click="handleCancel" :disabled="loading">取消</button>
            <button class="primary" @click="handleConfirm" :disabled="!password || loading">
              {{ loading ? '处理中...' : actionText || '确认' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  max-width: 500px;
  width: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--ruins-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-family: var(--font-serif);
  color: var(--ruins-text);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--ruins-muted);
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--ruins-text);
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.description {
  margin: 0 0 20px 0;
  color: var(--ruins-muted);
  font-size: 0.95rem;
  line-height: 1.6;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ruins-muted);
}

.field input {
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  padding: 12px;
  font-size: 1rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
  transition: border-color 0.2s ease;
}

.field input:focus {
  outline: none;
  border-color: var(--ruins-accent);
}

.field input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 24px;
  border-top: 1px solid var(--ruins-border);
}

.modal-footer button {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  cursor: pointer;
  border-radius: 6px;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  transition: all 0.2s ease;
  min-width: 100px;
}

.modal-footer button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.modal-footer button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-footer button.primary {
  background: var(--ruins-accent-strong);
  color: var(--ruins-bg);
  border: none;
}

.modal-footer button.primary:hover:not(:disabled) {
  background: var(--ruins-accent);
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(-20px);
}
</style>
