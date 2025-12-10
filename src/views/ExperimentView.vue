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
      <p>这是我的玩具们</p>
      <ul>
        <li>
          <RouterLink to="posts/typescript-syntax-showcase">TypeScript Syntax Showcase</RouterLink>
        </li>
      </ul>
      <div v-if="gravity.isMobile && gravity.hasMotionSupport" class="gravity-toggle">
        <label>
          <input type="checkbox" :checked="gravity.enabled" @change="handleGravityToggle" />
          <span>重力模式（仅移动端）</span>
        </label>
        <p v-if="gravity.permissionError" class="gravity-error">
          {{ gravity.permissionError }}
        </p>
      </div>
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
</style>
