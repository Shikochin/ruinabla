<script setup lang="ts">
import { onMounted } from 'vue'
import { useDevStore } from '@/stores/devStore'
import { useGravityStore } from '@/stores/gravityStore'

const devStore = useDevStore()
const gravity = useGravityStore()

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
        <div class="list-header">
          <span class="marker"></span>
          <span class="label">设备运行日志</span>
        </div>
        <ul class="link-list">
          <li>
            <RouterLink to="/tools/image" class="tool-link">
              <div class="card-bg-decor"></div>
              <div class="scanline"></div>

              <div class="tool-meta-top">
                <span class="uid">UID: IMG_PROC_01</span>
                <span class="status">状态: 不稳定</span>
              </div>

              <div class="tool-content">
                <div class="icon-box">
                  <span class="icon">🖼️</span>
                </div>
                <div class="text">
                  <strong class="title">图像处理器</strong>
                  <span class="desc">宽体普京</span>
                </div>
              </div>

              <div class="card-decor top-left"></div>
              <div class="card-decor top-right"></div>
              <div class="card-decor bottom-left"></div>
              <div class="card-decor bottom-right"></div>
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
      <button class="btn" @click="devStore.setIsDev(false)">禁用开发模式</button>
    </div>

    <div v-else>
      <p>你是怎么找到这里的？</p>
      <p>如果你是开发者，点击下方按钮以开启实验功能。</p>
      <button class="btn" @click="devStore.setIsDev(true)">启用开发模式</button>
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
  margin-top: 48px;
}

.list-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--ruins-border);
  padding-bottom: 8px;
}

.list-header .marker {
  width: 4px;
  height: 16px;
  background: var(--ruins-accent);
}

.list-header .label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  color: var(--ruins-muted);
}

.link-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.tool-link {
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: rgba(var(--ruins-accent-rgb, 255, 255, 255), 0.02);
  border: 1px solid var(--ruins-border);
  position: relative;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;
  text-decoration: none;
}

.card-bg-decor {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 2px 2px, var(--ruins-border) 1px, transparent 0);
  background-size: 24px 24px;
  opacity: 0.1;
  pointer-events: none;
}

.scanline {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: rgba(var(--ruins-accent-rgb, 255, 255, 255), 0.1);
  opacity: 0;
  pointer-events: none;
  z-index: 2;
}

.tool-link:hover .scanline {
  animation: scanline 2s linear infinite;
  opacity: 1;
}

@keyframes scanline {
  0% {
    transform: translateY(-100%);
  }

  100% {
    transform: translateY(100vh);
  }
}

.tool-meta-top {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  margin-bottom: 20px;
  color: var(--ruins-muted);
  letter-spacing: 0.1em;
}

.tool-content {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  z-index: 1;
}

.icon-box {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ruins-border);
  background: rgba(var(--ruins-accent-rgb, 255, 255, 255), 0.03);
  font-size: 1.5rem;
  transition: all 0.3s ease;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-family: var(--font-serif);
  font-size: 1.2rem;
  color: var(--ruins-accent-strong);
  transition: all 0.3s ease;
}

.desc {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ruins-muted);
  letter-spacing: 0.05em;
}

.tool-link:hover {
  border-color: var(--ruins-accent);
  background: rgba(var(--ruins-accent-rgb, 255, 255, 255), 0.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.tool-link:hover .icon-box {
  border-color: var(--ruins-accent);
  background: rgba(var(--ruins-accent-rgb, 255, 255, 255), 0.08);
}

.card-decor {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 1px solid var(--ruins-accent);
  opacity: 0.3;
  transition: all 0.3s ease;
}

.card-decor.top-left {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
}

.card-decor.top-right {
  top: -1px;
  right: -1px;
  border-left: none;
  border-bottom: none;
}

.card-decor.bottom-left {
  bottom: -1px;
  left: -1px;
  border-right: none;
  border-top: none;
}

.card-decor.bottom-right {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
}

.tool-link:hover .card-decor {
  opacity: 1;
  width: 15px;
  height: 15px;
}
</style>
