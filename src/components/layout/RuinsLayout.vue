<script setup lang="ts">
import { onMounted, Suspense } from 'vue'
import { RouterLink } from 'vue-router'
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()

function backToTop() {
  scroll({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  themeStore.initTheme()
})
</script>

<template>
  <div class="ruins-layout">
    <div class="ruins-grid-bg" aria-hidden="true"></div>
    <div class="ruins-light" aria-hidden="true"></div>
    <div class="ruins-container">
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
            :title="themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <span v-if="themeStore.isDark">☼</span>
            <span v-else>☾</span>
          </button>
        </nav>
      </header>

      <main class="ruins-main">
        <Suspense>
          <slot />
        </Suspense>
      </main>

      <button id="delta" @click="backToTop"><a>Δ</a></button>

      <footer class="ruins-footer paper-panel">
        <p>
          2021-present by <a href="https://github.com/Shikochin">Shikochin</a> · Records of Light
          and Dust
        </p>
        <p>Constructed with <a href="https://vuejs.org">Vue 3</a> & Persistence</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.ruins-layout {
  position: relative;
  padding: 40px 0 64px;
  overflow: hidden;
  min-height: 100vh;
}

#nabla {
  font-family: var(--font-serif);
  font-size: 3.7rem;
  vertical-align: middle;
}

#delta {
  font-family: var(--font-serif);
  font-size: 2rem;
  width: 1.2em;
  position: fixed;
  right: 20px;
  bottom: 20px;
  background-color: var(--ruins-grid-color);
  border-width: 1px;

  a {
    border: 0;
  }

  cursor: pointer;
}

/* 纯线条网格背景 */
.ruins-grid-bg {
  position: absolute;
  inset: 0;
  opacity: 0.4;
  pointer-events: none;
  z-index: 0;
  background-image:
    linear-gradient(var(--ruins-grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--ruins-grid-color) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(circle at 50% 50%, black 40%, transparent 100%);
}

/* 顶部微光 */
.ruins-light {
  position: absolute;
  top: -20vh;
  left: 50%;
  transform: translateX(-50%);
  width: 100vw;
  height: 60vh;
  background: radial-gradient(50% 50% at 50% 50%, var(--ruins-light-color) 0%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

.ruins-container {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  flex-direction: column;
  gap: 60px;
  z-index: 1;
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

.ruins-main {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  gap: 60px;
}

.ruins-footer {
  border-top: 1px solid var(--ruins-border);
  padding-top: 20px;
  padding-bottom: 20px;
  margin-top: 40px;

  p {
    margin: 0;
  }

  background: transparent;
  box-shadow: none;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ruins-muted);
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0.6;
}

@media (max-width: 768px) {
  .ruins-header {
    flex-direction: column;
    align-items: center;
    gap: 24px;
    text-align: center;
    padding-bottom: 24px;
  }

  .brand a {
    align-items: center;
  }

  .brand__logo {
    font-size: 2.5rem;
  }

  .ruins-layout {
    padding: 20px 0 40px;
  }

  .ruins-nav {
    font-size: 1rem;
    gap: 24px;
  }
}
</style>
