<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const token = route.params.token as string
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const validating = ref(true)
const tokenValid = ref(false)
const success = ref(false)
const errorMessage = ref('')

useHead({
  title: t('auth.resetPassword.title'),
})

onMounted(async () => {
  // Just check if token exists
  // The actual validation will happen when submitting
  if (token) {
    tokenValid.value = true
  } else {
    tokenValid.value = false
    errorMessage.value = t('auth.resetPassword.invalidToken')
  }
  validating.value = false
})

async function handleSubmit() {
  errorMessage.value = ''

  // Validate passwords match
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = t('auth.resetPassword.mismatch')
    return
  }

  // Validate password strength
  if (newPassword.value.length < 8) {
    errorMessage.value = t('auth.resetPassword.tooShort')
    return
  }

  loading.value = true

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        newPassword: newPassword.value,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      success.value = true
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      errorMessage.value = data.error || t('auth.resetPassword.error')
    }
  } catch (error) {
    errorMessage.value = t('auth.resetPassword.networkError')
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="reset-container">
    <div class="reset-panel paper-panel">
      <!-- Validating Token -->
      <div v-if="validating" class="status-section">
        <div class="spinner"></div>
        <p>{{ $t('auth.resetPassword.validating') }}</p>
      </div>

      <!-- Invalid Token -->
      <div v-else-if="!tokenValid" class="status-section error">
        <div class="icon">✗</div>
        <h1>{{ $t('auth.resetPassword.invalidToken') }}</h1>
        <p>{{ errorMessage }}</p>
        <button @click="router.push('/forgot-password')" class="action-btn">
          {{ $t('auth.resetPassword.requestNew') }}
        </button>
      </div>

      <!-- Success -->
      <div v-else-if="success" class="status-section success">
        <div class="icon">✓</div>
        <h1>{{ $t('auth.resetPassword.successTitle') }}</h1>
        <p>{{ $t('auth.resetPassword.successSubtitle') }}</p>
        <p class="redirect-hint">{{ $t('auth.resetPassword.redirecting') }}</p>
      </div>

      <!-- Reset Form -->
      <div v-else>
        <h1>{{ $t('auth.resetPassword.title') }}</h1>
        <p class="subtitle">{{ $t('auth.resetPassword.subtitle') }}</p>

        <form @submit.prevent="handleSubmit" class="reset-form">
          <div class="field">
            <label for="newPassword">{{ $t('auth.resetPassword.newPassword') }}</label>
            <input
              id="newPassword"
              v-model="newPassword"
              type="password"
              required
              :placeholder="$t('auth.resetPassword.passwordHint')"
              minlength="8"
              :disabled="loading"
            />
          </div>

          <div class="field">
            <label for="confirmPassword">{{ $t('auth.resetPassword.confirmNew') }}</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              :placeholder="$t('auth.resetPassword.confirmNew')"
              minlength="8"
              :disabled="loading"
            />
          </div>

          <div class="password-hint">
            <p>{{ $t('auth.resetPassword.requirementTitle') }}</p>
            <ul>
              <li :class="{ met: newPassword.length >= 8 }">
                {{ $t('auth.resetPassword.reqLength') }}
              </li>
              <li :class="{ met: newPassword === confirmPassword && newPassword.length > 0 }">
                {{ $t('auth.resetPassword.reqMatch') }}
              </li>
            </ul>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="primary" :disabled="loading">
            {{
              loading ? $t('auth.resetPassword.resetting') : $t('auth.resetPassword.resetButton')
            }}
          </button>
        </form>

        <div class="links">
          <RouterLink to="/login">{{ $t('auth.resetPassword.requestNew') }}</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reset-container {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.reset-panel {
  max-width: 480px;
  width: 100%;
  padding: 48px 40px;
}

.status-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
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
  margin: 0 0 12px 0;
  color: var(--ruins-text);
  font-size: 2rem;
  text-align: center;
}

p {
  margin: 0;
  color: var(--ruins-muted);
}

.subtitle {
  margin: 0 0 32px 0;
  text-align: center;
  line-height: 1.6;
}

.redirect-hint {
  font-size: 0.9rem;
  color: var(--ruins-accent);
}

.reset-form {
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
  background: rgba(0, 0, 0, 0.2);
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

.password-hint {
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--ruins-border);
  border-radius: 8px;
  font-size: 0.9rem;
}

.password-hint p {
  margin: 0 0 8px 0;
  color: var(--ruins-text);
  font-weight: 500;
}

.password-hint ul {
  margin: 0;
  padding-left: 24px;
  list-style: none;
}

.password-hint li {
  color: var(--ruins-muted);
  position: relative;
  padding-left: 8px;
}

.password-hint li::before {
  content: '○';
  position: absolute;
  left: -16px;
  color: var(--ruins-muted);
}

.password-hint li.met {
  color: var(--ruins-accent);
}

.password-hint li.met::before {
  content: '●';
  color: var(--ruins-accent);
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
}

button.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 255, 136, 0.3);
}

button.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
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

.links {
  display: flex;
  justify-content: center;
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

@media (max-width: 640px) {
  .reset-panel {
    padding: 32px 24px;
  }

  h1 {
    font-size: 1.75rem;
  }
}
</style>
