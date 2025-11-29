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
      path: '/posts/:slug(.*)',
      name: 'posts',
      component: () => import('@/views/EntryView.vue'),
      meta: { index: 99 },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

// fallback to Ruinabla or meta.title if the next page is not a post
router.afterEach((to, _) => {
  let title = 'Rui∇abla'
  if (to.meta.title) {
    title = to.meta.title as string
  }
  document.title = title
})

export default router
