<script setup lang="ts">
import { computed } from 'vue'
import { useGravityStore } from '@/stores/gravityStore'
import RuinFooter from './RuinFooter.vue'
import RuinHeader from './RuinHeader.vue'

const gravity = useGravityStore()

const gridStyle = computed(() => {
  if (!gravity.enabled) return {}
  const x = gravity.offsetX * 0.3
  const y = gravity.offsetY * 0.3
  return {
    transform: `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`,
    willChange: 'transform',
  }
})

const lightStyle = computed(() => {
  if (!gravity.enabled) return {}
  const x = gravity.offsetX * 0.5
  const y = gravity.offsetY * 0.4
  return {
    transform: `translateX(-50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`,
    willChange: 'transform',
  }
})

const containerStyle = computed(() => {
  if (!gravity.enabled) return {}
  return {
    willChange: 'transform',
  }
})

function backToTop() {
  scroll({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="ruins-layout">
    <div class="ruins-grid-bg" aria-hidden="true" :style="gridStyle"></div>
    <div class="ruins-light" aria-hidden="true" :style="lightStyle"></div>
    <div class="ruins-container" :style="containerStyle">
      <RuinHeader />

      <main class="ruins-main">
        <Suspense>
          <slot />
          <template #fallback> Loading... </template>
        </Suspense>
      </main>

      <button id="delta" @click="backToTop"><a>Δ</a></button>

      <Suspense>
        <RuinFooter />
        <template #fallback> Loading... </template>
      </Suspense>
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
