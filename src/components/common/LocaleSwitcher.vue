<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useLocaleStore } from '@/stores/locale'

const localeStore = useLocaleStore()
const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const locales = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en-US', label: 'English' },
  { code: 'ja-JP', label: '日本語' },
]

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectLocale = (code: string) => {
  localeStore.setLocale(code)
  isOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const currentLabelMap: Record<string, string> = {
  'zh-CN': '中文',
  'en-US': 'EN',
  'ja-JP': '日本語',
}
</script>

<template>
  <div class="locale-switcher" ref="containerRef">
    <button
      @click="toggleDropdown"
      class="lang-btn"
      :class="{ active: isOpen }"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
    >
      <span class="icon">🌐</span>
      <span class="label">{{ currentLabelMap[localeStore.currentLocale] }}</span>
      <span class="arrow" :class="{ up: isOpen }">▾</span>
    </button>

    <transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <button
          v-for="locale in locales"
          :key="locale.code"
          class="dropdown-item"
          :class="{ selected: localeStore.currentLocale === locale.code }"
          @click="selectLocale(locale.code)"
          role="option"
          :aria-selected="localeStore.currentLocale === locale.code"
        >
          {{ locale.label }}
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.locale-switcher {
  position: relative;
  display: inline-block;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 12px;
  border: 1px solid var(--ruins-border);
  border-radius: 20px;
  background: transparent;
  color: var(--ruins-text);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  outline: none;
}

.lang-btn:hover,
.lang-btn.active {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--ruins-accent);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
}

:root.light .lang-btn:hover,
:root.light .lang-btn.active {
  background: rgba(0, 0, 0, 0.03);
  border-color: var(--ruins-accent);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
}

.arrow {
  font-size: 0.7rem;
  transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  opacity: 0.5;
}

.arrow.up {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 120px;
  background: var(--ruins-panel);
  backdrop-filter: blur(12px);
  border: 1px solid var(--ruins-border);
  border-radius: 8px;
  padding: 6px;
  z-index: 1000;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dropdown-item {
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--ruins-text);
  text-align: left;
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--ruins-accent-strong);
}

:root.light .dropdown-item:hover {
  background: rgba(0, 0, 0, 0.03);
}

.dropdown-item.selected {
  color: var(--ruins-accent-strong);
  background: rgba(255, 255, 255, 0.08);
  font-weight: 600;
}

:root.light .dropdown-item.selected {
  background: rgba(0, 0, 0, 0.05);
}

/* Animations */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>
