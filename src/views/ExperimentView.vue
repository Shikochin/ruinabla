<script setup lang="ts">
import { useDevStore } from '@/stores/devStore'
const devStore = useDevStore()
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
}
</style>
