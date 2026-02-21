<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const totpCode = ref('')
const show2FAOptions = ref(false)
const pendingUserId = ref('')
const hasPasskeys = ref(false)
const passkeyOptions = ref<any>(null)
const isTOTPEnabled = ref(false)

onMounted(async () => {
  // Redirect to home if already logged in
  if (auth.isAuthenticated) {
    router.push('/')
    return
  }
})

useHead({
  title: t('auth.login.title'),
})

async function handlePasswordLogin() {
  const result = await auth.login(email.value, password.value, rememberMe.value)
  if (result.success && result.requires2FA) {
    pendingUserId.value = result.userId!
    show2FAOptions.value = true

    // Fetch TOTP status and Passkey availability
    const [totpStatus, passkeyOpts] = await Promise.all([
      fetch('/api/totp/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: result.userId }),
      }).then((r) => r.json()),
      fetch('/api/passkey/2fa-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: result.userId }),
      }).then((r) => r.json()),
    ])

    isTOTPEnabled.value = totpStatus.enabled
    hasPasskeys.value = passkeyOpts.hasPasskeys
    passkeyOptions.value = passkeyOpts.passkeyOptions
  } else if (result.success && !result.requires2FA) {
    // No 2FA required, redirect to home
    router.push('/')
  }
}

async function verifyWithTOTP() {
  const result = await auth.verifyTOTP(pendingUserId.value, totpCode.value, rememberMe.value)
  if (result.success) {
    router.push('/')
  }
}

async function verifyWithPasskey() {
  if (!passkeyOptions.value) return

  try {
    // Decode base64url to ArrayBuffer
    const base64UrlToBuffer = (base64url: string) => {
      const padding = '='.repeat((4 - (base64url.length % 4)) % 4)
      const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding
      const rawData = window.atob(base64)
      const buffer = new Uint8Array(rawData.length)
      for (let i = 0; i < rawData.length; i++) {
        buffer[i] = rawData.charCodeAt(i)
      }
      return buffer.buffer
    }

    // Prepare options - convert credential IDs to ArrayBuffer
    const options = {
      challenge: base64UrlToBuffer(passkeyOptions.value.challenge),
      rpId: passkeyOptions.value.rpId,
      allowCredentials: passkeyOptions.value.allowCredentials.map((cred: any) => ({
        type: cred.type,
        id: typeof cred.id === 'string' ? base64UrlToBuffer(cred.id) : cred.id,
        transports: cred.transports,
      })),
      userVerification: passkeyOptions.value.userVerification,
      timeout: passkeyOptions.value.timeout,
    }

    const credential = (await navigator.credentials.get({
      publicKey: options,
    })) as PublicKeyCredential | null

    if (!credential) {
      throw new Error(t('auth.login.messages.noCredential'))
    }

    // Convert to format for server
    const bufferToBase64url = (buffer: ArrayBuffer) => {
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]!)
      }
      return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    }

    const response = credential.response as AuthenticatorAssertionResponse

    const credentialData = {
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      response: {
        clientDataJSON: bufferToBase64url(response.clientDataJSON),
        authenticatorData: bufferToBase64url(response.authenticatorData),
        signature: bufferToBase64url(response.signature),
        userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : null,
      },
      type: credential.type,
    }

    // Send to server for verification
    const res = await fetch('/api/passkey/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: pendingUserId.value,
        credential: credentialData,
      }),
    })

    const data = await res.json()
    if (res.ok && data.success) {
      auth.user = data.user
      auth.sessionId = data.sessionId
      localStorage.setItem('sessionId', data.sessionId)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/')
    } else {
      auth.error = data.error || t('auth.login.passkeyFailed')
    }
  } catch (e) {
    auth.error = (e as Error).message
  }
}

async function loginWithPasskey() {
  try {
    // Get passkey login options
    const optionsRes = await fetch('/api/passkey/login-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })

    const options = await optionsRes.json()

    if (!optionsRes.ok) {
      throw new Error(options.error || t('auth.login.messages.passkeyOptionsFailed'))
    }

    // Decode challenge
    const base64UrlToBuffer = (base64url: string) => {
      const padding = '='.repeat((4 - (base64url.length % 4)) % 4)
      const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding
      const rawData = window.atob(base64)
      const buffer = new Uint8Array(rawData.length)
      for (let i = 0; i < rawData.length; i++) {
        buffer[i] = rawData.charCodeAt(i)
      }
      return buffer.buffer
    }

    const publicKeyOptions = {
      ...options,
      challenge: base64UrlToBuffer(options.challenge),
    }

    const credential = (await navigator.credentials.get({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential | null

    if (!credential) {
      throw new Error(t('auth.login.messages.noCredential'))
    }

    const bufferToBase64url = (buffer: ArrayBuffer) => {
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]!)
      }
      return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    }

    const response = credential.response as AuthenticatorAssertionResponse

    // Login with passkey
    const res = await fetch('/api/passkey/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: {
          id: credential.id,
          rawId: bufferToBase64url(credential.rawId),
          response: {
            clientDataJSON: bufferToBase64url(response.clientDataJSON),
            authenticatorData: bufferToBase64url(response.authenticatorData),
            signature: bufferToBase64url(response.signature),
            userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : null,
          },
          type: credential.type,
        },
      }),
    })

    const data = await res.json()
    if (res.ok && data.success) {
      auth.user = data.user
      auth.sessionId = data.sessionId
      localStorage.setItem('sessionId', data.sessionId)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/')
    } else {
      auth.error = data.error || t('auth.login.passkeyFailed')
    }
  } catch (e) {
    auth.error = (e as Error).message
  }
}
</script>

<template>
  <div class="auth-view">
    <div class="auth-card paper-panel">
      <h1>{{ $t('auth.login.title') }}</h1>
      <p class="eyebrow">{{ $t('auth.login.eyebrow') }}</p>

      <!-- Passkey login (quick access) -->
      <div v-if="!show2FAOptions" class="passkey-login">
        <button
          type="button"
          @click="loginWithPasskey"
          class="passkey-btn"
          :disabled="auth.loading"
        >
          🔑 {{ $t('auth.login.usePasskey') }}
        </button>

        <div class="divider">
          <span>{{ $t('auth.login.orUsePassword') }}</span>
        </div>
      </div>

      <!-- Password login form -->
      <form v-if="!show2FAOptions" @submit.prevent="handlePasswordLogin" class="auth-form">
        <div class="field">
          <label for="email">{{ $t('auth.login.email') }}</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            :placeholder="$t('auth.login.emailPlaceholder')"
          />
        </div>

        <div class="field">
          <label for="password">{{ $t('auth.login.password') }}</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            :placeholder="$t('auth.login.passwordPlaceholder')"
          />
        </div>

        <div class="field-checkbox">
          <label class="checkbox-label">
            <input type="checkbox" v-model="rememberMe" />
            <span>{{ $t('auth.login.rememberMe') }}</span>
          </label>
        </div>

        <div class="forgot-password-link">
          <RouterLink to="/forgot-password">{{ $t('auth.login.forgotPassword') }}</RouterLink>
        </div>

        <div v-if="auth.error" class="error-message">
          {{ auth.error }}
        </div>

        <button type="submit" class="primary" :disabled="auth.loading">
          {{ auth.loading ? $t('auth.login.loggingIn') : $t('auth.login.verify') }}
        </button>
      </form>

      <!-- 2FA verification -->
      <div v-else class="two-fa-options">
        <h2>{{ $t('auth.login.title2fa') }}</h2>
        <p class="subtitle">{{ $t('auth.login.subtitle2fa') }}</p>

        <div class="verification-methods">
          <!-- TOTP Option -->
          <div class="method-card paper-panel" v-if="isTOTPEnabled">
            <h3>📱 {{ $t('auth.login.totpTitle') }}</h3>
            <p>{{ $t('auth.login.totpDesc') }}</p>
            <div class="field">
              <label for="totp">{{ $t('auth.login.totpLabel') }}</label>
              <input
                id="totp"
                v-model="totpCode"
                type="text"
                pattern="[0-9]{6}"
                maxlength="6"
                :placeholder="$t('auth.login.totpPlaceholder')"
                inputmode="numeric"
                autocomplete="one-time-code"
              />
            </div>
            <button @click="verifyWithTOTP" class="primary" :disabled="!totpCode || auth.loading">
              {{ $t('auth.login.verify') }}
            </button>
          </div>

          <!-- Passkey Option -->
          <div v-if="hasPasskeys" class="method-card paper-panel">
            <h3>🔑 {{ $t('auth.login.passkeyTitle') }}</h3>
            <p>{{ $t('auth.login.passkeyDesc') }}</p>
            <button @click="verifyWithPasskey" class="primary" :disabled="auth.loading">
              {{ $t('auth.login.usePasskeyVerify') }}
            </button>
          </div>

          <div v-else class="method-card paper-panel disabled">
            <h3>🔑 {{ $t('auth.login.passkeyTitle') }}</h3>
            <p>{{ $t('auth.login.noPasskey') }}</p>
          </div>
        </div>

        <div v-if="auth.error" class="error-message">
          {{ auth.error }}
        </div>
      </div>

      <div class="auth-links">
        <p>
          {{ $t('auth.login.noAccount') }}
          <RouterLink to="/register">{{ $t('auth.login.registerNow') }} </RouterLink>
        </p>
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

.passkey-login {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.passkey-btn {
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(184, 187, 38, 0.2), rgba(184, 187, 38, 0.1));
  color: var(--ruins-text);
  cursor: pointer;
  border-radius: 8px;
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.passkey-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(184, 187, 38, 0.3), rgba(184, 187, 38, 0.15));
  border-color: var(--ruins-accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(184, 187, 38, 0.2);
}

.passkey-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
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
  border-radius: 4px;
  transition: border-color 0.2s ease;
}

.field input:focus {
  outline: none;
  border-color: var(--ruins-accent);
}

.divider {
  position: relative;
  text-align: center;
  margin: 8px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--ruins-border);
}

.divider span {
  position: relative;
  padding: 0 16px;
  color: var(--ruins-muted);
  font-size: 0.85rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
}

.two-fa-options {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.two-fa-options h2 {
  margin: 0;
  font-size: 1.75rem;
  font-family: var(--font-serif);
  color: var(--ruins-text);
}

.subtitle {
  margin: 0;
  color: var(--ruins-muted);
}

.verification-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.method-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.method-card.disabled {
  opacity: 0.5;
}

.method-card h3 {
  margin: 0;
  font-size: 1.15rem;
  font-family: var(--font-sans);
}

.method-card p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ruins-muted);
}

button {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  cursor: pointer;
  border-radius: 4px;
  font-family: var(--font-sans);
  font-size: 0.9rem;
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

.forgot-password-link {
  text-align: right;
  margin-top: -8px;
}

.forgot-password-link a {
  color: var(--ruins-accent);
  text-decoration: none;
  font-size: 0.9rem;
}

.forgot-password-link a:hover {
  text-decoration: underline;
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

.field-checkbox {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 0.9rem;
  color: var(--ruins-text);
}

.checkbox-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  accent-color: var(--ruins-accent);
}

@media (max-width: 640px) {
  .auth-card {
    padding: 32px;
  }

  .auth-card h1 {
    font-size: 2rem;
  }

  .verification-methods {
    grid-template-columns: 1fr;
  }
}
</style>
