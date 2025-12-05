<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useHead } from '@unhead/vue'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const registrationComplete = ref(false)
const registeredEmail = ref('')

useHead({
  title: '注册',
})

onMounted(() => {
  if (auth.isAuthenticated) {
    router.push('/')
  }
})

function validatePassword() {
  if (password.value.length < 8) {
    passwordError.value = '密码必须至少包含8个字符'
    return false
  }
  if (password.value !== confirmPassword.value) {
    passwordError.value = '密码不匹配'
    return false
  }
  passwordError.value = ''
  return true
}

async function handleRegister() {
  if (!validatePassword()) return

  const result = await auth.register(email.value, password.value)
  if (result.success) {
    registrationComplete.value = true
    registeredEmail.value = email.value
  }
}

async function resendVerification() {
  try {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: registeredEmail.value }),
    })

    if (res.ok) {
      alert('验证邮件已重新发送！')
    } else {
      alert('发送失败，请稍后重试')
    }
  } catch {
    alert('网络错误，请稍后重试')
  }
}
</script>

<template>
  <div class="auth-view">
    <div class="auth-card paper-panel">
      <!-- Success Section -->
      <div v-if="registrationComplete" class="success-section">
        <div class="icon">✓</div>
        <h1>注册成功！</h1>
        <p class="subtitle">
          我们已向 <strong>{{ registeredEmail }}</strong> 发送了验证邮件
        </p>
        <p class="instructions">
          请检查您的收件箱（包括垃圾邮件文件夹），点击邮件中的链接完成验证。
        </p>
        <div class="actions">
          <button @click="resendVerification" class="secondary">重新发送验证邮件</button>
          <RouterLink to="/login" class="action-link"> 已验证？前往登录 </RouterLink>
        </div>
      </div>

      <!-- Registration Form -->
      <div v-else>
        <h1>寻得安身之所</h1>
        <p class="eyebrow">创建账户</p>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="field">
            <label for="email">邮箱</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="your@email.com"
            />
          </div>

          <div class="field">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="new-password"
              placeholder="••••••••"
              @blur="validatePassword"
            />
            <small>至少包含8个字符</small>
          </div>

          <div class="field">
            <label for="confirm-password">确认密码</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              required
              autocomplete="new-password"
              placeholder="••••••••"
              @blur="validatePassword"
            />
          </div>

          <div v-if="passwordError" class="error-message">
            {{ passwordError }}
          </div>

          <div v-if="auth.error" class="error-message">
            {{ auth.error }}
          </div>

          <button type="submit" class="primary" :disabled="auth.loading">
            {{ auth.loading ? '创建账号...' : '注册' }}
          </button>
        </form>

        <div class="auth-links">
          <p>已有账号？ <RouterLink to="/login">登录</RouterLink></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-view {
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: 100%;
  padding: 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.auth-card h1 {
  margin: 0;
  font-size: 2.5rem;
  font-family: var(--font-serif);
  color: var(--ruins-accent-strong);
}

.eyebrow {
  font-size: 0.85rem;
  color: var(--ruins-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 12px;
  margin-bottom: 24px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ruins-muted);
}

.field input {
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  padding: 12px;
  font-size: 1rem;
  border-radius: 8px;
  transition: border-color 0.2s ease;
}

.field input:focus {
  outline: none;
  border-color: var(--ruins-accent);
}

.field small {
  font-size: 0.8rem;
  color: var(--ruins-muted);
  font-family: var(--font-mono);
}

button {
  padding: 12px 24px;
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  cursor: pointer;
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.2s ease;
  margin-top: 12px;
}

button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: var(--ruins-accent);
}

button.primary {
  background: var(--ruins-accent-strong);
  color: var(--ruins-bg);
  border: none;
}

button.primary:hover:not(:disabled) {
  background: var(--ruins-accent);
}

button.secondary {
  background: transparent;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: 8px;
  color: #ff4444;
  font-size: 0.9rem;
}

.auth-links {
  margin-top: 8px;
  text-align: center;
  font-size: 0.9rem;
}

.auth-links a {
  color: var(--ruins-accent-strong);
  text-decoration: none;
  transition: color 0.2s ease;
}

.auth-links a:hover {
  color: var(--ruins-accent);
  text-decoration: underline;
}

/* Success Section */
.success-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
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

.success-section h1 {
  margin: 0;
  font-size: 2rem;
}

.subtitle {
  margin: 0;
  color: var(--ruins-muted);
  line-height: 1.6;
}

.subtitle strong {
  color: var(--ruins-accent);
}

.instructions {
  margin: 0;
  color: var(--ruins-muted);
  line-height: 1.6;
  font-size: 0.95rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  width: 100%;
}

.action-link {
  display: inline-block;
  padding: 12px 24px;
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.action-link:hover {
  border-color: var(--ruins-accent);
  color: var(--ruins-accent);
}

@media (max-width: 640px) {
  .auth-card {
    padding: 32px 24px;
  }

  .auth-card h1 {
    font-size: 2rem;
  }
}
</style>
