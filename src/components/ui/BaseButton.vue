<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
})

const buttonClasses = computed(() => {
  return [
    'base-button',
    `base-button--${props.variant}`,
    `base-button--${props.size}`,
    {
      'base-button--disabled': props.disabled || props.loading,
      'base-button--loading': props.loading,
    },
  ]
})
</script>

<template>
  <button :class="buttonClasses" :type="type" :disabled="disabled || loading">
    <span v-if="loading" class="button-spinner"></span>
    <span :class="{ 'button-content--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.base-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-sans);
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  text-decoration: none;
  border: none;
}

/* Sizes */
.base-button--sm {
  padding: 6px 12px;
  font-size: 0.85rem;
}

.base-button--md {
  padding: 10px 20px;
  font-size: 0.95rem;
}

.base-button--lg {
  padding: 14px 28px;
  font-size: 1.05rem;
}

/* Variants */
.base-button--primary {
  background: var(--ruins-accent-strong);
  color: var(--ruins-bg);
}

.base-button--primary:hover:not(.base-button--disabled) {
  background: var(--ruins-accent);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(184, 187, 38, 0.3);
}

.base-button--secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
}

.base-button--secondary:hover:not(.base-button--disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--ruins-accent);
}

.base-button--danger {
  background: transparent;
  border: 1px solid #ff4444;
  color: #ff4444;
}

.base-button--danger:hover:not(.base-button--disabled) {
  background: rgba(255, 68, 68, 0.1);
  border-color: #ff6666;
}

.base-button--ghost {
  background: transparent;
  color: var(--ruins-text);
  padding-left: 8px;
  padding-right: 8px;
}

.base-button--ghost:hover:not(.base-button--disabled) {
  background: rgba(255, 255, 255, 0.05);
  color: var(--ruins-accent);
}

/* States */
.base-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.base-button--loading {
  cursor: wait;
}

/* Loading spinner */
.button-spinner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.button-content--hidden {
  visibility: hidden;
}

/* Focus styles for accessibility */
.base-button:focus-visible {
  outline: 2px solid var(--ruins-accent);
  outline-offset: 2px;
}
</style>
