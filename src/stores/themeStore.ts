import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark' | 'auto'

export const useThemeStore = defineStore('theme', () => {
  const themeMode = ref<ThemeMode>('auto')
  const isDark = ref(false)

  // Get system theme preference
  const getSystemTheme = (): boolean => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  }

  // Initialize from localStorage or default to auto
  const initTheme = () => {
    let stored: ThemeMode | null = null
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      const storedValue = localStorage.getItem('ruinabla-theme-mode')
      if (storedValue === 'light' || storedValue === 'dark' || storedValue === 'auto') {
        stored = storedValue
      }
    }

    themeMode.value = stored || 'auto'
    updateIsDark()
    applyTheme()

    // Listen to system theme changes when in auto mode
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', () => {
        if (themeMode.value === 'auto') {
          updateIsDark()
          applyTheme()
        }
      })
    }
  }

  // Update isDark based on current mode
  const updateIsDark = () => {
    if (themeMode.value === 'auto') {
      isDark.value = getSystemTheme()
    } else {
      isDark.value = themeMode.value === 'dark'
    }
  }

  // Toggle theme: auto -> light -> dark -> auto
  const toggleTheme = () => {
    if (themeMode.value === 'auto') {
      themeMode.value = 'light'
    } else if (themeMode.value === 'light') {
      themeMode.value = 'dark'
    } else {
      themeMode.value = 'auto'
    }

    updateIsDark()
    applyTheme()
  }

  const applyTheme = () => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    if (isDark.value) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }

    // Save theme mode to localStorage
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem('ruinabla-theme-mode', themeMode.value)
    }
  }

  return {
    themeMode,
    isDark,
    initTheme,
    toggleTheme,
  }
})
