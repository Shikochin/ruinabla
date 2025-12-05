<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'

const router = useRouter()
const email = ref('')
const loading = ref(false)
const success = ref(false)
const errorMessage = ref('')

useHead({
  title: '忘记密码',
})

async function handleSubmit() {
  errorMessage.value = ''
  loading.value = true

  try {
    const res = await fetch('/api/auth/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })

    const data = await res.json()

    if (res.ok) {
      success.value = true
    } else {
      errorMessage.value = data.error || '发送重置邮件失败'
    }
  } catch (error) {
    errorMessage.value = '网络错误，请稍后重试'
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="forgot-container">
    <div class="forgot-panel paper-panel">
      <div v-if="!success">
        <h1>忘记密码</h1>
        <p class="subtitle">输入您的邮箱地址，我们将发送密码重置链接</p>

        <form @submit.prevent="handleSubmit" class="forgot-form">
          <div class="field">
            <label for="email">邮箱</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="your@email.com"
              :disabled="loading"
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="primary" :disabled="loading">
            {{ loading ? '发送中...' : '发送重置链接' }}
          </button>
        </form>

        <div class="links">
          <RouterLink to="/login">返回登录</RouterLink>
          <RouterLink to="/register">没有账号？注册</RouterLink>
        </div>
      </div>

      <div v-else class="success-section">
        <div class="icon">✓</div>
        <h1>邮件已发送</h1>
        <p>
          如果该邮箱已注册，您将收到密码重置链接。<br />
          请检查您的收件箱（包括垃圾邮件文件夹）
        </p>
        <button @click="router.push('/login')" class="action-btn">返回登录</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forgot-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.forgot-panel {
  width: 100%;
  padding: 48px 40px;
}

h1 {
  margin: 0 0 12px 0;
  color: var(--ruins-text);
  font-size: 2rem;
}

.subtitle {
  margin: 0 0 32px 0;
  color: var(--ruins-muted);
  line-height: 1.6;
}

.forgot-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  color: var(--ruins-text);
  font-weight: 500;
}

input {
  padding: 12px 16px;
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

input:focus {
  outline: none;
  border-color: var(--ruins-accent);
  box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
}

input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid #ff4444;
  border-radius: 8px;
  color: #ff4444;
  font-size: 0.9rem;
}

button.primary {
  padding: 14px 24px;
  background: var(--ruins-accent);
  color: #0a0a0a;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 12px;
}

button.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.links {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--ruins-border);
}

.links a {
  color: var(--ruins-accent);
  text-decoration: none;
  font-size: 0.9rem;
}

.links a:hover {
  text-decoration: underline;
}

/* Success Section */
.success-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  color: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
}

.success-section p {
  color: var(--ruins-muted);
  line-height: 1.6;
}

.action-btn {
  margin-top: 16px;
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

@media (max-width: 640px) {
  .forgot-panel {
    padding: 32px 24px;
  }

  h1 {
    font-size: 1.75rem;
  }

  .links {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
</style>
