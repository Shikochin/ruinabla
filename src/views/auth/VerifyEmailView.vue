<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const token = route.params.token as string
const status = ref<'verifying' | 'success' | 'error' | 'expired'>('verifying')
const errorMessage = ref('')

useHead({
  title: '验证邮箱',
})

onMounted(async () => {
  if (!token) {
    status.value = 'error'
    errorMessage.value = '无效的验证链接'
    return
  }

  try {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    const data = await res.json()

    if (res.ok) {
      status.value = 'success'
      // Set auth session
      if (data.sessionId && data.user) {
        auth.sessionId = data.sessionId
        auth.user = data.user
        auth.isAuthenticated = true
        localStorage.setItem('sessionId', data.sessionId)
      }
      // Redirect to security settings after 2 seconds to encourage 2FA setup
      setTimeout(() => {
        router.push('/settings/security')
      }, 2000)
    } else {
      if (data.error?.includes('expired')) {
        status.value = 'expired'
      } else {
        status.value = 'error'
        errorMessage.value = data.error || '验证失败'
      }
    }
  } catch (error) {
    status.value = 'error'
    errorMessage.value = '网络错误，请稍后重试'
    console.error(error)
  }
})

async function resendVerification() {
  // You would need to get the email from somewhere
  // For now, just show a message
  alert('请返回注册页面重新发送验证邮件')
}
</script>

<template>
  <div class="verify-container">
    <div class="verify-panel paper-panel">
      <!-- Verifying -->
      <div v-if="status === 'verifying'" class="status-section">
        <div class="spinner"></div>
        <h1>正在验证...</h1>
        <p>请稍候，我们正在验证您的邮箱</p>
      </div>

      <!-- Success -->
      <div v-else-if="status === 'success'" class="status-section success">
        <div class="icon">✓</div>
        <h1>验证成功！</h1>
        <p>您的邮箱已成功验证</p>
        <p class="redirect-hint">正在跳转到安全设置，建议您设置两步验证...</p>
      </div>

      <!-- Expired -->
      <div v-else-if="status === 'expired'" class="status-section error">
        <div class="icon">⏱</div>
        <h1>验证链接已过期</h1>
        <p>此验证链接已超过有效期（1小时）</p>
        <button @click="resendVerification" class="action-btn">重新发送验证邮件</button>
      </div>

      <!-- Error -->
      <div v-else class="status-section error">
        <div class="icon">✗</div>
        <h1>验证失败</h1>
        <p>{{ errorMessage }}</p>
        <div class="actions">
          <button @click="router.push('/register')" class="action-btn">返回注册</button>
          <button @click="router.push('/login')" class="action-btn secondary">前往登录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.verify-container {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.verify-panel {
  max-width: 500px;
  width: 100%;
  padding: 60px 40px;
  text-align: center;
}

.status-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--ruins-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
}

.success .icon {
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  color: #0a0a0a;
}

.error .icon {
  background: linear-gradient(135deg, #ff4444 0%, #cc3333 100%);
  color: #ffffff;
}

h1 {
  margin: 0;
  color: var(--ruins-text);
  font-size: 2rem;
}

p {
  margin: 0;
  color: var(--ruins-muted);
  font-size: 1.1rem;
}

.redirect-hint {
  font-size: 0.9rem;
  color: var(--ruins-accent);
}

.actions {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.action-btn {
  padding: 12px 24px;
  background: var(--ruins-accent);
  color: #0a0a0a;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 255, 136, 0.3);
}

.action-btn.secondary {
  background: transparent;
  color: var(--ruins-text);
  border: 1px solid var(--ruins-border);
}

.action-btn.secondary:hover {
  border-color: var(--ruins-accent);
  box-shadow: none;
}

@media (max-width: 640px) {
  .verify-panel {
    padding: 40px 24px;
  }

  h1 {
    font-size: 1.5rem;
  }

  .actions {
    flex-direction: column;
    width: 100%;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
