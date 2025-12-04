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

useHead({
  title: '注册 - Rui∇abla',
})

onMounted(() => {
  // Redirect to home if already logged in
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
    router.push('/')
  }
}
</script>

<template>
  <div class="auth-view">
    <div class="auth-card paper-panel">
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
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  padding: 12px;
  font-size: 1rem;
  border-radius: 4px;
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
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  cursor: pointer;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.2s ease;
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

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: 4px;
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
}

@media (max-width: 640px) {
  .auth-card {
    padding: 32px;
  }

  .auth-card h1 {
    font-size: 2rem;
  }
}
</style>
