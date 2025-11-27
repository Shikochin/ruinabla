import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(true)

  // Initialize from localStorage or system preference
  const initTheme = () => {
    let stored = null
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      stored = localStorage.getItem('ruinabla-theme')
    }

    if (stored) {
      isDark.value = stored === 'dark'
    } else if (typeof window !== 'undefined' && window.matchMedia) {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    applyTheme()
  }

  const toggleTheme = () => {
    isDark.value = !isDark.value
    applyTheme()
  }

  const applyTheme = () => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    if (isDark.value) {
      root.classList.add('dark')
      root.classList.remove('light')
      if (typeof localStorage !== 'undefined' && localStorage.setItem) {
        localStorage.setItem('ruinabla-theme', 'dark')
      }
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
      if (typeof localStorage !== 'undefined' && localStorage.setItem) {
        localStorage.setItem('ruinabla-theme', 'light')
      }
    }
  }

  return {
    isDark,
    initTheme,
    toggleTheme,
  }
})
