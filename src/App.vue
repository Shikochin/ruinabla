<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import RuinLayout from '@/components/layout/RuinLayout.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import GlobalSearch from '@/components/GlobalSearch.vue'

const route = useRoute()
const transitionName = ref('')

// determine transition direction by meta.index
watch(
  () => route.meta.index,
  (toIndex, fromIndex) => {
    const to = (toIndex as number) || 0
    const from = (fromIndex as number) || 0

    // if target index > source index (e.g. 0 -> 1), means going right -> page slides left (slide-left)
    // if target index < source index (e.g. 1 -> 0), means going left -> page slides right (slide-right)
    transitionName.value = to > from ? 'slide-left' : 'slide-right'
  },
)

import { useHead } from '@unhead/vue'

useHead({
  titleTemplate: (title) => (title ? `${title} - Rui∇abla` : 'Rui∇abla'),
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Records of Light and Dust. A personal blog by Shikochin.' },
  ],
  link: [
    {
      rel: 'alternate',
      type: 'application/rss+xml',
      title: 'Rui∇abla RSS Feed',
      href: '/rss.xml',
    },
  ],
})
</script>

<template>
  <GlobalSearch />
  <ToastContainer />
  <!-- Conditionally render layout: editor gets no wrapper -->
  <template v-if="route.name === 'editor'">
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" :key="route.path" />
    </RouterView>
  </template>

  <!-- All other routes use RuinLayout -->
  <RuinLayout v-else>
    <RouterView v-slot="{ Component, route }">
      <!-- make sure components have only one root element -->
      <!-- otherwise transition will not work -->
      <Transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </RuinLayout>
</template>

<style>
/* 基础动画时间配置 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

/* --- 向右前进 (Slide Left) --- */
/* 例如：信标 -> 年轮 */

/* 1. 旧页面向左移出 */
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
  /* 向左消失 */
}

/* 2. 新页面从右边移入 */
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(20px);
  /* 从右边出现 */
}

/* 3. 最终状态 */
.slide-left-enter-to,
.slide-left-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* --- 向左返回 (Slide Right) --- */
/* 例如：年轮 -> 信标 */

/* 1. 旧页面向右移出 */
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
  /* 向右消失 */
}

/* 2. 新页面从左边移入 */
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-20px);
  /* 从左边出现 */
}

/* 3. 最终状态 */
.slide-right-enter-to,
.slide-right-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
