<script setup lang="ts">
import { ref } from 'vue'
import { useDevStore } from '@/stores/devStore'
import RuinFooter from './RuinFooter.vue'
import RuinHeader from './RuinHeader.vue'

const devStore = useDevStore()

const clickCount = ref(0)
let clickTimer: number | null = null

function backToTop() {
  scroll({ top: 0, behavior: 'smooth' })
  switchDevMode()
}

function switchDevMode() {
  // Increment click count
  clickCount.value++

  // Clear previous timer
  if (clickTimer) {
    clearTimeout(clickTimer)
  }

  // Check if reached 5 clicks
  if (clickCount.value >= 5) {
    // Toggle dev mode
    devStore.setIsDev(!devStore.isDev)
    console.log(`Developer mode ${devStore.isDev ? 'enabled' : 'disabled'}`)
    // Reset counter
    clickCount.value = 0
  } else {
    // Reset counter after 500ms of no clicks
    clickTimer = setTimeout(() => {
      clickCount.value = 0
    }, 500)
  }
}
</script>

<template>
  <div class="ruins-layout">
    <div class="ruins-grid-bg" aria-hidden="true"></div>
    <div class="ruins-light" aria-hidden="true"></div>
    <div class="ruins-container">
      <RuinHeader />

      <main class="ruins-main">
        <Suspense>
          <slot />
          <template #fallback> Loading... </template>
        </Suspense>
      </main>

      <button id="delta" @click="backToTop"><a>Δ</a></button>

      <RuinFooter />
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

.ruins-main {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  gap: 60px;
}

@media (max-width: 768px) {
  .ruins-layout {
    padding: 20px 0 40px;
  }
}
</style>
