<script setup lang="ts">
defineProps<{
  name: string
  url: string
  avatar: string
  desc: string
}>()
</script>

<template>
  <a :href="url" target="_blank" class="signal-card">
    <div class="signal-avatar">
      <img :src="avatar" :alt="name" loading="lazy" />
    </div>
    <div class="signal-info">
      <h3 class="signal-name">{{ name }}</h3>
      <p class="signal-desc">{{ desc }}</p>
    </div>
  </a>
</template>

<style scoped>
.signal-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--ruins-border);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  text-decoration: none;
}

.signal-card:hover {
  border-color: var(--ruins-accent);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px var(--ruins-light-color);
}

.signal-avatar {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--ruins-border);
  transition: border-color 0.3s ease;
}

.signal-card:hover .signal-avatar {
  border-color: var(--ruins-accent);
}

.signal-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.3s ease;
}

.signal-info {
  flex: 1;
  min-width: 0;
}

.signal-name {
  margin: 0 0 4px;
  font-family: var(--font-mono);
  font-size: 1.1rem;
  color: var(--ruins-accent-strong);
}

.signal-desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ruins-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
