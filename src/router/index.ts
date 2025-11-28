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
        title: 'Ruinabla',
      },
    },
    {
      path: '/chronicle',
      name: 'chronicle',
      component: () => import('@/views/ChronicleView.vue'),
      meta: { title: '年轮 - Ruinabla' },
    },
    {
      path: '/posts/:slug(.*)',
      name: 'posts',
      component: () => import('@/views/EntryView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: { title: '余烬 - Ruinabla' },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

// fallback to Ruinabla or meta.title if the next page is not a post
router.afterEach((to, _) => {
  let title = 'Ruinabla'
  if (to.meta.title) {
    title = to.meta.title as string
  }
  document.title = title
})

export default router
