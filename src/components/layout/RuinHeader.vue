<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { useDevStore } from '@/stores/devStore'
import { useSearch } from '@/composables/useSearch'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'

const { openSearch } = useSearch()
const devStore = useDevStore()
const themeStore = useThemeStore()
const auth = useAuthStore()

const showUserMenu = ref(false)
const isMobileMenuOpen = ref(false)

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function closeUserMenu() {
  showUserMenu.value = false
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
    document.body.classList.add('mobile-menu-open')
  } else {
    document.body.style.overflow = ''
    document.body.classList.remove('mobile-menu-open')
  }
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
  document.body.style.overflow = ''
  document.body.classList.remove('mobile-menu-open')
}

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu-container')) {
    closeUserMenu()
  }
  if (
    isMobileMenuOpen.value &&
    !target.closest('.ruins-nav') &&
    !target.closest('.hamburger-btn')
  ) {
    closeMobileMenu()
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
  <header class="ruins-header paper-panel" :class="{ 'is-mobile-open': isMobileMenuOpen }">
    <div class="brand">
      <RouterLink to="/" @click="closeMobileMenu">
        <strong class="brand__logo">Rui<span id="nabla">∇</span>abla</strong>
        <span class="brand__eyebrow">LOST ADDICTION.</span>
      </RouterLink>
    </div>
    <div class="header-actions-mobile">
      <button class="hamburger-btn" @click="toggleMobileMenu" aria-label="Toggle menu">
        <span class="hamburger-box">
          <span class="hamburger-inner" :class="{ 'is-active': isMobileMenuOpen }"></span>
        </span>
      </button>
    </div>

    <nav class="ruins-nav" :class="{ 'is-open': isMobileMenuOpen }">
      <div class="nav-links">
        <RouterLink to="/" @click="closeMobileMenu">{{ $t('nav.beacon') }}</RouterLink>
        <RouterLink to="/chronicle" @click="closeMobileMenu">{{ $t('nav.chronicle') }}</RouterLink>
        <RouterLink to="/lighthouse" @click="closeMobileMenu">{{
          $t('nav.lighthouse')
        }}</RouterLink>
        <RouterLink to="/about" @click="closeMobileMenu">{{ $t('nav.embers') }}</RouterLink>
        <RouterLink to="/experiment" v-if="devStore.isDev" @click="closeMobileMenu"
          >{{ $t('nav.experiment') }}
        </RouterLink>
      </div>

      <div class="nav-actions">
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
        <button class="theme-toggle" @click="openSearch" :title="$t('common.loading')">
          <span>🔍</span>
        </button>

        <LocaleSwitcher />

        <!-- User menu -->
        <div class="user-menu-container" v-if="auth.isAuthenticated">
          <button class="user-button" @click.stop="toggleUserMenu">
            {{ auth.user?.email?.split('@')[0] }}
          </button>

          <Transition name="dropdown">
            <div v-if="showUserMenu" class="user-dropdown">
              <RouterLink to="/settings" @click="closeUserMenu" class="dropdown-item">
                <span class="icon">⚙️</span>
                <span>{{ $t('common.settings') }}</span>
              </RouterLink>
              <RouterLink to="/editor" @click="closeUserMenu" class="dropdown-item">
                <span class="icon">✏️</span>
                <span>{{ $t('nav.editor') }}</span>
              </RouterLink>
            </div>
          </Transition>
        </div>

        <!-- Login button for unauthenticated users -->
        <RouterLink to="/login" v-else class="login-button"> {{ $t('common.login') }} </RouterLink>
      </div>
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
  gap: 20px;
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
  padding: 4px 12px;
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

.header-actions-mobile {
  display: none;
}

.hamburger-btn {
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  z-index: 1001;
}

.hamburger-box {
  width: 24px;
  height: 20px;
  display: flex;
  align-items: center;
  position: relative;
}

.hamburger-inner {
  width: 100%;
  height: 2px;
  background-color: var(--ruins-text);
  transition: all 0.3s ease;
}

.hamburger-inner::before,
.hamburger-inner::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  background-color: var(--ruins-text);
  transition: all 0.3s ease;
  left: 0;
}

.hamburger-inner::before {
  top: 0;
}

.hamburger-inner::after {
  bottom: 0;
}

.hamburger-inner.is-active {
  background-color: transparent;
}

.hamburger-inner.is-active::before {
  transform: translateY(9px) rotate(45deg);
}

.hamburger-inner.is-active::after {
  transform: translateY(-9px) rotate(-45deg);
}

.nav-links {
  display: flex;
  gap: 20px;
}

.nav-actions {
  display: flex;
  gap: 20px;
  align-items: center;
}

@media (max-width: 768px) {
  .ruins-header {
    flex-direction: row;
    align-items: center;
    margin-left: -20px;
    margin-right: -20px;
    padding: 16px 20px;
    position: relative;
    z-index: 1000;
    transition:
      background-color 0.3s ease,
      border-color 0.3s ease;
  }

  .ruins-header.is-mobile-open {
    background: var(--ruins-bg);
    border-bottom-color: transparent;
  }

  .brand__logo {
    font-size: 2rem;
  }

  #nabla {
    font-size: 2.5rem;
  }

  .brand__eyebrow {
    font-size: 0.65rem;
  }

  .header-actions-mobile {
    display: block;
  }

  .hamburger-btn {
    display: block;
  }

  .ruins-nav {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    background: var(--ruins-bg);
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: 2rem;
    gap: 2rem;
    transform: translateY(-10px);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    z-index: 1000;
  }

  .ruins-nav.is-open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .nav-links {
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    width: 100%;
  }

  .nav-links a {
    font-size: 1.5rem;
  }

  .nav-actions {
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 1rem;
    width: 100%;
  }

  .user-dropdown {
    position: static;
    box-shadow: none;
    border: none;
    background: transparent;
    padding: 0;
    margin-top: 1rem;
  }

  .user-menu-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .user-button {
    font-size: 1.1rem;
    padding: 8px 16px;
  }
}
</style>
