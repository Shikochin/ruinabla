<script setup lang="ts">
import { useToastStore } from '@/stores/toastStore'
import { storeToRefs } from 'pinia'

const store = useToastStore()
const { toasts } = storeToRefs(store)
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="toast.type"
        @click="store.remove(toast.id)"
      >
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  width: 90%;
  max-width: 400px;
}

.toast {
  padding: 12px 20px;
  border-radius: 8px;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  backdrop-filter: blur(8px);
}

.toast.success {
  background: rgba(34, 197, 94, 0.9);
  border: 1px solid rgba(22, 163, 74, 0.5);
}

.toast.error {
  background: rgba(239, 68, 68, 0.9);
  border: 1px solid rgba(220, 38, 38, 0.5);
}

.toast.info {
  background: rgba(59, 130, 246, 0.9);
  border: 1px solid rgba(37, 99, 235, 0.5);
}

.toast.warning {
  background: rgba(245, 158, 11, 0.9);
  border: 1px solid rgba(217, 119, 6, 0.5);
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
