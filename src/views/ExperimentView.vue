<script setup lang="ts">
import { onMounted } from 'vue'
import { useDevStore } from '@/stores/devStore'
import { useGravityStore } from '@/stores/gravityStore'

const devStore = useDevStore()
const gravity = useGravityStore()

function handleGravityToggle(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    gravity.enable()
  } else {
    gravity.disable()
  }
}

onMounted(() => {
  gravity.initEnvironment()
})
</script>
<template>
  <div class="paper-panel experiment">
    <div v-if="devStore.isDev">
      <p class="eyebrow">实验</p>
      <h1>临摹尖碑</h1>
      <!-- <p>这是我的玩具们</p> -->
      <!-- <ul>
        <li>
          <RouterLink to="posts/typescript-syntax-showcase">TypeScript Syntax Showcase</RouterLink>
        </li>
      </ul> -->
      <div class="tool-list">
        <h2>Utilities</h2>
        <ul class="link-list">
          <li>
            <RouterLink to="/tools/image" class="tool-link">
              <span class="icon">🖼️</span>
              <span class="text">
                <strong>Image Processor</strong>
                <small>Resize, Stretch, Convert</small>
              </span>
            </RouterLink>
          </li>
        </ul>
      </div>

      <!-- <div v-if="gravity.isMobile && gravity.hasMotionSupport" class="gravity-toggle">
        <label>
          <input type="checkbox" :checked="gravity.enabled" @change="handleGravityToggle" />
          <span>重力模式（仅移动端）</span>
        </label>
        <p v-if="gravity.permissionError" class="gravity-error">
          {{ gravity.permissionError }}
        </p>
      </div> -->
      <button class="btn" @click="devStore.setIsDev(false)">Disable Dev Mode</button>
    </div>

    <div v-else>
      <p>How did you get here?</p>
      <p>
        If you are a developer, you can enable the experiment mode by clicking the button below.
      </p>
      <button class="btn" @click="devStore.setIsDev(true)">Enable Dev Mode</button>
    </div>
  </div>
</template>

<style scoped>
.experiment {
  padding: 40px;
  transform-origin: center center;
  will-change: transform;
}

.gravity-toggle {
  margin-top: 16px;
  font-size: 0.9rem;
}

.gravity-toggle label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.gravity-error {
  margin-top: 8px;
  color: #d9534f;
  font-size: 0.8rem;
}

.tool-list {
  margin-top: 32px;
}

.tool-list h2 {
  font-size: 1.2rem;
  margin-bottom: 16px;
  color: var(--ruins-text);
  border-bottom: 1px solid var(--ruins-border);
  padding-bottom: 8px;
}

.link-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.tool-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--ruins-border);
  transition: all 0.3s ease;
}

.tool-link:hover {
  border-color: var(--ruins-accent);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.tool-link .icon {
  font-size: 2rem;
}

.tool-link .text {
  display: flex;
  flex-direction: column;
}

.tool-link strong {
  color: var(--ruins-accent-strong);
  font-family: var(--font-serif);
}

.tool-link small {
  color: var(--ruins-muted);
  font-size: 0.8rem;
}
</style>
