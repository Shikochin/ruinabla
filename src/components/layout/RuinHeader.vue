<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore'
import { onMounted } from 'vue'

const themeStore = useThemeStore()
onMounted(() => {
  themeStore.initTheme()
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
        <span v-if="themeStore.themeMode === 'auto'">⛅︎</span>
        <span v-else-if="themeStore.themeMode === 'light'">☀</span>
        <span v-else>☾</span>
      </button>
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

.brand a {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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
