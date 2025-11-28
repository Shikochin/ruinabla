<script setup lang="ts">
import { RouterView } from 'vue-router'

import RuinsLayout from '@/components/layout/RuinsLayout.vue'
</script>

<template>
    <RuinsLayout>
        <RouterView v-slot="{ Component, route }">
            <Transition name="page" mode="out-in">
                <component :is="Component" :key="route.path" />
            </Transition>
        </RouterView>
    </RuinsLayout>
</template>

<style>
/* 页面切换动画 */
.page-enter-active,
.page-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-enter-from {
    opacity: 0;
    transform: translateY(20px);
}

.page-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

.page-enter-to,
.page-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>
