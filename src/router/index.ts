import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Rui∇abla',
        index: 0,
      },
    },
    {
      path: '/chronicle',
      name: 'chronicle',
      component: () => import('@/views/ChronicleView.vue'),
      meta: { title: '年轮 - Rui∇abla', index: 1 },
    },

    {
      path: '/lighthouse',
      name: 'lighthouse',
      component: () => import('@/views/LighthouseView.vue'),
      meta: { title: '灯塔 - Rui∇abla', index: 2 },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: { title: '余烬 - Rui∇abla', index: 3 },
    },
    {
      path: '/experiment',
      name: 'experiment',
      component: () => import('@/views/ExperimentView.vue'),
      meta: { title: '实验 - Rui∇abla', index: 4 },
    },
    {
      path: '/posts/:slug(.*)',
      name: 'posts',
      component: () => import('@/views/EntryView.vue'),
      meta: { index: 99 },
    },
    {
      path: '/tags/:tag',
      name: 'tag',
      component: () => import('@/views/TagView.vue'),
      meta: { index: 99 },
    },
    {
      path: '/categories/:category',
      name: 'category',
      component: () => import('@/views/CategoryView.vue'),
      meta: { index: 99 },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
