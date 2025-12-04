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
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/views/EditorView.vue'),
      meta: { title: '编辑器 - Rui∇abla', index: 100, requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { index: 101 },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { index: 102 },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/components/layout/SettingsLayout.vue'),
      meta: { title: '设置 - Rui∇abla', index: 103, requiresAuth: true },
      children: [
        {
          path: 'security',
          name: 'settings-security',
          component: () => import('@/views/auth/SecurityView.vue'),
          meta: { title: '安全设置 - Rui∇abla' },
        },
      ],
    },
  ],
  scrollBehavior(to, _, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }
    return { top: 0 }
  },
})

// Navigation guards
router.beforeEach((to, _, next) => {
  // Lazy import to avoid circular dependency
  import('@/stores/authStore').then(({ useAuthStore }) => {
    const auth = useAuthStore()

    // Check if route requires authentication
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }

    // Check if route requires admin role
    if (to.meta.requiresAdmin && !auth.isAdmin) {
      next({ name: 'home' })
      return
    }

    next()
  })
})

export default router
