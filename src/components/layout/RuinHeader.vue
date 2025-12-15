<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { useDevStore } from '@/stores/devStore'
import { useSearch } from '@/composables/useSearch'

const { openSearch } = useSearch()
const devStore = useDevStore()
const themeStore = useThemeStore()
const auth = useAuthStore()

const showUserMenu = ref(false)

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function closeUserMenu() {
  showUserMenu.value = false
}

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu-container')) {
    closeUserMenu()
  }
}

onMounted(() => {
  themeStore.initTheme()
  if (typeof window !== 'undefined') {
    document.addEventListener('click', handleClickOutside)
  }
})
</script>

<template>
  <header class="ruins-header paper-panel">
    <div class="brand">
      <RouterLink to="/">
        <strong class="brand__logo">Rui<span id="nabla">∇</span>abla</strong>
        <span class="brand__eyebrow">LOST ADDICTION.</span>
      </RouterLink>
    </div>
    <nav class="ruins-nav">
      <RouterLink to="/">信标</RouterLink>
      <RouterLink to="/chronicle">年轮</RouterLink>
      <RouterLink to="/lighthouse">灯塔</RouterLink>
      <RouterLink to="/about">余烬</RouterLink>
      <RouterLink to="/experiment" v-if="devStore.isDev">实验</RouterLink>

      <button
        class="theme-toggle"
        @click="themeStore.toggleTheme"
        :title="
          themeStore.themeMode === 'auto'
            ? 'Auto'
            : themeStore.themeMode === 'light'
              ? 'Light'
              : 'Dark'
        "
      >
        <span v-if="themeStore.themeMode === 'auto'">⛅</span>
        <span v-else-if="themeStore.themeMode === 'light'">🌞</span>
        <span v-else>🌛</span>
      </button>
      <button class="theme-toggle" @click="openSearch" title="Search">
        <span>🔍</span>
      </button>

      <!-- User menu -->
      <div class="user-menu-container" v-if="auth.isAuthenticated">
        <button class="user-button" @click.stop="toggleUserMenu">
          {{ auth.user?.email?.split('@')[0] }}
        </button>

        <Transition name="dropdown">
          <div v-if="showUserMenu" class="user-dropdown">
            <RouterLink to="/settings" @click="closeUserMenu" class="dropdown-item">
              <span class="icon">⚙️</span>
              <span>设置</span>
            </RouterLink>
            <RouterLink to="/editor" @click="closeUserMenu" class="dropdown-item">
              <span class="icon">✏️</span>
              <span>编辑器</span>
            </RouterLink>
          </div>
        </Transition>
      </div>

      <!-- Login button for unauthenticated users -->
      <RouterLink to="/login" v-else class="login-button"> 登录 </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
#nabla {
  font-family: var(--font-serif);
  font-size: 3.7rem;
  vertical-align: middle;
}

.ruins-header {
  padding: 32px 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.ruins-header.paper-panel {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--ruins-border);
  box-shadow: none;
  border-radius: 0;
}

.ruins-nav {
  display: flex;
  gap: 32px;
  align-items: center;
  /* Align toggle button vertically */
  font-family: var(--font-serif);
  font-size: 1.1rem;
  padding-bottom: 8px;
}

.ruins-nav a {
  padding: 4px 0;
  color: var(--ruins-muted);
  position: relative;
  border: none;
  transition: color 0.3s ease;
}

.ruins-nav a:hover,
.ruins-nav a.router-link-active {
  color: var(--ruins-accent-strong);
}

.ruins-nav a.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: var(--ruins-accent-strong);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.theme-toggle {
  background: transparent;
  border: none;
  color: var(--ruins-muted);
  cursor: pointer;
  font-family: var(--font-serif);
  font-size: 1.2rem;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.theme-toggle:hover {
  color: var(--ruins-accent-strong);
}

/* User menu */
.user-menu-container {
  position: relative;
}

.user-button,
.login-button {
  background: transparent;
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  padding: 6px 14px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.user-button:hover,
.login-button:hover {
  border-color: var(--ruins-accent);
  color: var(--ruins-accent-strong);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: var(--ruins-bg);
  border: 1px solid var(--ruins-border);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  padding: 8px;
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--ruins-text);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 0.95rem;
  border-radius: 4px;
  transition: background 0.2s ease;
  text-decoration: none;
}

.dropdown-item .icon {
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.dropdown-item.logout:hover {
  background: rgba(255, 68, 68, 0.1);
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.brand a {
  display: flex;
  flex-direction: column;
  color: inherit;
  border: none;
}

.brand__logo {
  font-family: var(--font-serif);
  font-size: 3rem;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--ruins-accent-strong);
  text-transform: uppercase;
  position: relative;
}

.brand__logo span {
  color: var(--ruins-text);
  font-weight: normal;
}

.brand__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  margin-top: 8px;
  color: var(--ruins-muted);
  text-transform: uppercase;
  padding-left: 2px;
}

@media (max-width: 768px) {
  .ruins-header {
    flex-direction: column;
    align-items: center;
    gap: 24px;
    text-align: center;
    padding-bottom: 24px;
  }

  .ruins-nav {
    font-size: 1rem;
    gap: 24px;
  }

  .brand a {
    align-items: center;
  }

  .brand__logo {
    font-size: 2.5rem;
  }
}
</style>
