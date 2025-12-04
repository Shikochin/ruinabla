<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'

const auth = useAuthStore()
const router = useRouter()

useHead({
  title: '设置 - Rui∇abla',
})

// Redirect to security if on base settings page
if (router.currentRoute.value.path === '/settings') {
  router.replace('/settings/security')
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="settings-layout">
    <aside class="settings-sidebar">
      <div class="sidebar-header">
        <h2>设置</h2>
        <p class="user-email">{{ auth.user?.email }}</p>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <h3>账户</h3>
          <RouterLink to="/settings/security" class="nav-item">
            <span class="icon">🔒</span>
            <span>安全设置</span>
          </RouterLink>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button @click="logout()" class="logout-btn">
          <span class="icon">🚪</span>
          <span>退出登录</span>
        </button>
      </div>
    </aside>

    <main class="settings-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.settings-layout {
  display: flex;
  gap: 40px;
}

.settings-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-header {
  padding-bottom: 20px;
  border-bottom: 1px solid var(--ruins-border);
}

.sidebar-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.75rem;
  font-family: var(--font-serif);
  color: var(--ruins-accent-strong);
}

.user-email {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ruins-muted);
  font-family: var(--font-mono);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
}

.nav-section h3 {
  margin: 0 0 12px 0;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ruins-muted);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  color: var(--ruins-text);
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  border: 0;
}

.nav-item .icon {
  font-size: 1.1rem;
  opacity: 0.8;
}

.nav-item.router-link-active {
  background: rgba(255, 255, 255, 0.1);
  border-left: 3px solid var(--ruins-muted);
  padding-left: 13px;
}

.sidebar-footer {
  padding-top: 20px;
  border-top: 1px solid var(--ruins-border);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  cursor: pointer;
  border-radius: 6px;
  font-family: var(--font-sans);
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: rgba(255, 68, 68, 0.1);
  border-color: #ff4444;
  color: #ff4444;
}

.logout-btn .icon {
  font-size: 1.1rem;
}

.settings-content {
  flex: 1;
  min-width: 0;
}

@media (max-width: 968px) {
  .settings-layout {
    flex-direction: column;
    gap: 32px;
  }

  .settings-sidebar {
    width: 100%;
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
  }

  .nav-section {
    min-width: 200px;
  }
}
</style>
