<script setup lang="ts">
import { computed } from 'vue'
import Giscus from '@giscus/vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()

// When theme is auto, default to light for Giscus
const giscusTheme = computed(() => {
  if (themeStore.themeMode === 'auto') {
    return themeStore.getSystemTheme() ? 'dark' : 'light'
  }
  return themeStore.themeMode
})
</script>

<template>
  <section id="comments" class="paper-panel">
    <SectionHeader eyebrow="评论" />
    <Giscus
      repo="Shikochin/ruin"
      repo-id="R_kgDOL7BWOw"
      category="Comment"
      category-id="DIC_kwDOL7BWO84CfWhY"
      mapping="pathname"
      strict="0"
      reactions-enabled="1"
      emit-metadata="0"
      input-position="top"
      lang="zh-CN"
      loading="lazy"
      :theme="giscusTheme"
    />
  </section>
</template>

<style scoped>
#comments {
  padding: 40px;
}

.giscus-container :deep(.giscus) {
  /* Override giscus default styles to match ruins theme */
  font-family: var(--font-sans);
}

.giscus-container :deep(.giscus-frame) {
  border: 1px solid var(--ruins-border);
  border-radius: 0;
}

@media (max-width: 640px) {
  #comments {
    padding: 24px;
  }
}
</style>
