<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { useRouter } from 'vue-router'
import PasswordConfirmModal from '@/components/PasswordConfirmModal.vue'
import QRCode from 'qrcode'
import { formatTimestamp } from '@/utils/temporal'

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

// TOTP
const totpSecret = ref('')
const totpUri = ref('')
const totpQRCode = ref('')
const totpVerifyCode = ref('')
const backupCodes = ref<string[]>([])
const showBackupCodes = ref(false)
const isTOTPEnabled = ref(false)

// Passkeys
const passkeys = ref<any[]>([])
const passkeyName = ref('')

// Password confirmation
const showPasswordModal = ref(false)

onMounted(async () => {
  if (!auth.isAuthenticated) {
    router.push('/login')
    return
  }
  await loadPasskeys()
  isTOTPEnabled.value = await auth.totpEnabled()
})

async function enableTOTP() {
  try {
    const res = await fetch('/api/totp/enable', {
      method: 'POST',
      headers: {
        Authorization: auth.getAuthHeader(),
      },
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed to enable TOTP')
    }

    totpSecret.value = data.secret
    totpUri.value = data.uri
    backupCodes.value = data.backupCodes

    totpQRCode.value = await QRCode.toDataURL(totpUri.value)

    totpQRCode.value = await QRCode.toDataURL(totpUri.value)

    toast.info('使用您的认证器应用扫描二维码')
  } catch (e) {
    toast.error((e as Error).message)
  }
}

async function verifyAndEnableTOTP() {
  try {
    const res = await fetch('/api/totp/verify-enable', {
      method: 'POST',
      headers: {
        Authorization: auth.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: totpVerifyCode.value }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Invalid code')
    }

    isTOTPEnabled.value = true
    showBackupCodes.value = true
    isTOTPEnabled.value = true
    showBackupCodes.value = true
    toast.success('TOTP 已启用! 保存您的备份码。')
    totpSecret.value = ''
    totpUri.value = ''
    totpVerifyCode.value = ''
  } catch (e) {
    toast.error((e as Error).message)
  }
}

async function disableTOTP() {
  showPasswordModal.value = true
}

async function handleDisableTOTPConfirm(password: string) {
  try {
    const res = await fetch('/api/totp/disable', {
      method: 'POST',
      headers: {
        Authorization: auth.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed to disable TOTP')
    }

    isTOTPEnabled.value = false
    toast.success('TOTP 已禁用')
    showPasswordModal.value = false
  } catch (e) {
    toast.error((e as Error).message)
    showPasswordModal.value = false
  }
}

async function loadPasskeys() {
  try {
    const res = await fetch('/api/passkey', {
      headers: {
        Authorization: auth.getAuthHeader(),
      },
    })

    const data = await res.json()
    passkeys.value = data.passkeys || []
  } catch (e) {
    console.error('Failed to load passkeys:', e)
  }
}

async function registerPasskey() {
  if (!passkeyName.value.trim()) {
    toast.error('请输入您的 Passkey 名称')
    return
  }

  try {
    const optionsRes = await fetch('/api/passkey/register-options', {
      method: 'POST',
      headers: {
        Authorization: auth.getAuthHeader(),
      },
    })

    const options = await optionsRes.json()

    if (!optionsRes.ok) {
      throw new Error(options.error || 'Failed to get registration options')
    }

    if (!window.PublicKeyCredential) {
      toast.error('您的浏览器不支持 WebAuthn')
      return
    }

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

    options.user.id = base64UrlToBuffer(options.user.id)
    options.challenge = base64UrlToBuffer(options.challenge)

    const credential = (await navigator.credentials.create({
      publicKey: options,
    })) as PublicKeyCredential | null

    if (!credential) {
      throw new Error('Failed to create credential')
    }

    const bufferToBase64url = (buffer: ArrayBuffer) => {
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]!)
      }
      return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    }

    const response = credential.response as AuthenticatorAttestationResponse

    const registerRes = await fetch('/api/passkey/register', {
      method: 'POST',
      headers: {
        Authorization: auth.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credential: {
          id: credential.id,
          rawId: bufferToBase64url(credential.rawId),
          response: {
            clientDataJSON: bufferToBase64url(response.clientDataJSON),
            attestationObject: bufferToBase64url(response.attestationObject),
            publicKey: response.getPublicKey() ? bufferToBase64url(response.getPublicKey()!) : null,
            transports: response.getTransports ? response.getTransports() : [],
          },
          type: credential.type,
        },
        name: passkeyName.value,
      }),
    })

    const result = await registerRes.json()

    if (!registerRes.ok) {
      throw new Error(result.error || 'Failed to register passkey')
    }

    toast.success('Passkey 添加成功！')
    passkeyName.value = ''
    await loadPasskeys()
  } catch (e) {
    if ((e as Error).name === 'NotAllowedError') {
      toast.info('Passkey 添加被取消')
    } else {
      toast.error((e as Error).message)
    }
  }
}

async function deletePasskey(id: string) {
  if (!confirm('删除此 Passkey？')) return

  try {
    const res = await fetch(`/api/passkey/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: auth.getAuthHeader(),
      },
    })

    if (!res.ok) {
      throw new Error('Failed to delete passkey')
    }

    await loadPasskeys()
    toast.success('Passkey 已删除')
  } catch (e) {
    toast.error((e as Error).message)
  }
}
</script>

<template>
  <div class="security-view">
    <div class="page-header">
      <h1>安全设置</h1>
      <p class="subtitle">管理您的认证方式</p>
    </div>

    <!-- TOTP Section -->
    <section class="settings-section paper-panel">
      <div class="section-header">
        <div>
          <h2>双因素验证 (TOTP)</h2>
          <p class="section-desc">为您的账户添加额外的安全性</p>
        </div>
        <div v-if="isTOTPEnabled" class="status-badge enabled">已启用</div>
        <div v-else class="status-badge">未启用</div>
      </div>

      <div v-if="!isTOTPEnabled && !totpSecret" class="section-content">
        <button @click="enableTOTP" class="primary">启用 TOTP</button>
      </div>

      <div v-if="totpSecret && !isTOTPEnabled" class="section-content totp-setup">
        <h3>设置说明</h3>
        <ol>
          <li>打开您的认证器应用（Google Authenticator，Authy 等）</li>
          <li>扫描此二维码或手动输入密钥</li>
          <li>输入 6 位验证码</li>
        </ol>

        <div class="qr-code">
          <p class="secret-code">
            密钥: <code>{{ totpSecret }}</code>
          </p>
          <p>
            链接：<a :href="totpUri" target="_blank"
              ><small>{{ totpUri }}</small></a
            >
          </p>
          <img :src="totpQRCode" alt="QR Code" />
        </div>

        <div class="field">
          <label>验证代码</label>
          <input
            v-model="totpVerifyCode"
            type="text"
            pattern="[0-9]{6}"
            maxlength="6"
            placeholder="000000"
          />
        </div>

        <button @click="verifyAndEnableTOTP" class="primary">验证并启用</button>
      </div>

      <div v-if="isTOTPEnabled" class="section-content">
        <div v-if="backupCodes.length && showBackupCodes" class="backup-codes">
          <h3>备份码</h3>
          <p>
            将这些代码保存在安全的地方，它们只会显示一次。如果您无法访问您的认证器，可以使用它们。
          </p>
          <ul>
            <li v-for="code in backupCodes" :key="code">{{ code }}</li>
          </ul>
        </div>
        <p class="success-text">✓ 双因素验证已启用</p>
        <button @click="disableTOTP" class="danger">关闭两步验证</button>
      </div>
    </section>

    <!-- Passkeys Section -->
    <section class="settings-section paper-panel">
      <div class="section-header">
        <div>
          <h2>Passkeys</h2>
          <p class="section-desc">使用生物认证安全登录</p>
        </div>
        <div v-if="passkeys.length" class="status-badge enabled">{{ passkeys.length }} 个密钥</div>
      </div>

      <div class="section-content">
        <div v-if="passkeys.length" class="passkey-list">
          <div v-for="passkey in passkeys" :key="passkey.id" class="passkey-item">
            <div class="passkey-info">
              <strong>{{ passkey.name }}</strong>
              <small>创建于: {{ formatTimestamp(passkey.created_at) }}</small>
            </div>
            <button @click="deletePasskey(passkey.id)" class="danger-link">删除</button>
          </div>
        </div>

        <div class="field">
          <label>Passkey 名称</label>
          <input v-model="passkeyName" placeholder="My Passkey" />
        </div>

        <button @click="registerPasskey" class="primary">添加 Passkey</button>
      </div>
    </section>

    <!-- Password Confirmation Modal -->
    <PasswordConfirmModal
      :show="showPasswordModal"
      title="确认关闭两步验证"
      description="请输入您的密码以确认关闭两步验证。这将降低您账户的安全性。"
      action-text="关闭 TOTP"
      @confirm="handleDisableTOTPConfirm"
      @cancel="showPasswordModal = false"
    />
  </div>
</template>

<style scoped>
.security-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 800px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 2rem;
  font-family: var(--font-serif);
  color: var(--ruins-text);
}

.subtitle {
  margin: 0;
  color: var(--ruins-muted);
  font-size: 1rem;
}

.settings-section {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ruins-border);
}

.section-header h2 {
  margin: 0 0 4px 0;
  font-size: 1.25rem;
  font-family: var(--font-serif);
}

.section-desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ruins-muted);
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--ruins-border);
  color: var(--ruins-muted);
}

.status-badge.enabled {
  background: rgba(184, 187, 38, 0.1);
  border-color: rgba(184, 187, 38, 0.3);
  color: #b8bb26;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.success-text {
  color: #b8bb26;
  margin: 0;
}

.totp-setup ol {
  padding-left: 20px;
  margin: 0;
}

.qr-code {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--ruins-border);
  border-radius: 6px;
  display: flex;
  text-align: center;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.secret-code code {
  padding: 4px 8px;
  border-radius: 4px;
  font-family: var(--font-mono);
}

.backup-codes {
  padding: 20px;
  background: rgba(255, 200, 0, 0.05);
  border: 2px solid rgba(255, 200, 0, 0.3);
  border-radius: 6px;
}

.backup-codes h3 {
  margin: 0 0 8px 0;
}

.backup-codes ul {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  margin: 16px 0 0 0;
}

.backup-codes code {
  background: rgba(0, 0, 0, 0.3);
  padding: 6px 12px;
  border-radius: 4px;
  font-family: var(--font-mono);
}

.passkey-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.passkey-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--ruins-border);
  border-radius: 6px;
}

.passkey-info strong {
  display: block;
  margin-bottom: 4px;
}

.passkey-info small {
  color: var(--ruins-muted);
  font-size: 0.85rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
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
  border-radius: 6px;
  transition: border-color 0.2s ease;
}

.field input:focus {
  outline: none;
  border-color: var(--ruins-accent);
}

button {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  cursor: pointer;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.2s ease;
  width: fit-content;
}

button:hover {
  background: rgba(255, 255, 255, 0.15);
}

button.primary {
  background: var(--ruins-accent-strong);
  color: var(--ruins-bg);
  border: none;
}

button.primary:hover {
  background: var(--ruins-accent);
}

button.danger {
  background: transparent;
  color: #ff4444;
  border-color: #ff4444;
}

button.danger:hover {
  background: rgba(255, 68, 68, 0.1);
}

button.danger-link {
  background: transparent;
  border: 1px solid #ff4444;
  color: #ff4444;
  padding: 8px 16px;
  font-size: 0.85rem;
}

button.danger-link:hover {
  background: rgba(255, 68, 68, 0.1);
}
</style>
