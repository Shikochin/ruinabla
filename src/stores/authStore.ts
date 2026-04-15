import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import i18n from '@/i18n'
import { http } from '@/utils/http'
import {
  finishOpaqueLogin,
  finishOpaqueRegistration,
  startOpaqueLogin,
  startOpaqueRegistration,
} from '@/utils/opaque'
import { getStoredItem, removeStoredItem, setStoredItem } from '@/utils/storage'

const { t } = i18n.global as any

interface User {
  id: string
  email: string
  role: string
}

interface TwoFactorMethods {
  totp: boolean
  passkey: boolean
}

type LoginResult =
  | {
      success: true
      requires2FA: true
      pendingAuthId: string
      userId: string
      methods: TwoFactorMethods
    }
  | {
      success: true
      requires2FA: false
    }
  | {
      success: false
      error?: string | null
    }

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const sessionId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const storedSessionId = getStoredItem('sessionId')
  const storedUser = getStoredItem('user')
  if (storedSessionId && storedUser) {
    sessionId.value = storedSessionId
    user.value = JSON.parse(storedUser)
  }

  const isAuthenticated = computed(() => !!user.value && !!sessionId.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setSessionData(nextSessionId: string, nextUser: User) {
    sessionId.value = nextSessionId
    user.value = nextUser
    setStoredItem('sessionId', nextSessionId)
    setStoredItem('user', JSON.stringify(nextUser))
  }

  function clearSessionData() {
    user.value = null
    sessionId.value = null
    removeStoredItem('sessionId')
    removeStoredItem('user')
  }

  async function register(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const { clientRegistrationState, registrationRequest } =
        await startOpaqueRegistration(password)
      const startRes = await http('/api/auth/opaque/register/start', {
        method: 'POST',
        body: JSON.stringify({ email, registrationRequest }),
      })
      const startData = await startRes.json()

      if (!startRes.ok) {
        throw new Error(startData.error || t('auth.register.messages.failed'))
      }

      const { registrationRecord } = await finishOpaqueRegistration({
        password,
        registrationResponse: startData.registrationResponse,
        clientRegistrationState,
      })
      const finishRes = await http('/api/auth/opaque/register/finish', {
        method: 'POST',
        body: JSON.stringify({
          attemptId: startData.attemptId,
          registrationRecord,
        }),
      })
      const finishData = await finishRes.json()

      if (!finishRes.ok) {
        throw new Error(finishData.error || t('auth.register.messages.failed'))
      }

      return { success: true }
    } catch (e) {
      error.value = (e as Error).message
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function tryOpaqueLogin(
    email: string,
    password: string,
    remember: boolean,
  ): Promise<Exclude<LoginResult, { success: false }> | null> {
    const { clientLoginState, startLoginRequest } = await startOpaqueLogin(password)
    const startRes = await http('/api/auth/opaque/login/start', {
      method: 'POST',
      body: JSON.stringify({ email, startLoginRequest, remember }),
    })
    const startData = await startRes.json()

    if (!startRes.ok) {
      throw new Error(startData.error || t('auth.login.messages.failed'))
    }

    const loginResult = await finishOpaqueLogin({
      password,
      loginResponse: startData.loginResponse,
      clientLoginState,
    })

    if (!loginResult) {
      return null
    }

    const finishRes = await http('/api/auth/opaque/login/finish', {
      method: 'POST',
      body: JSON.stringify({
        attemptId: startData.attemptId,
        finishLoginRequest: loginResult.finishLoginRequest,
      }),
    })
    const finishData = await finishRes.json()

    if (finishRes.status === 401) {
      return null
    }

    if (!finishRes.ok) {
      throw new Error(finishData.error || t('auth.login.messages.failed'))
    }

    if (finishData.requires2FA) {
      return {
        success: true,
        requires2FA: true,
        pendingAuthId: finishData.pendingAuthId,
        userId: finishData.userId,
        methods: finishData.methods,
      }
    }

    setSessionData(finishData.sessionId, finishData.user)
    return {
      success: true,
      requires2FA: false,
    }
  }

  async function loginWithLegacy(
    email: string,
    password: string,
    remember: boolean,
  ): Promise<LoginResult> {
    const res = await http('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember }),
      skipInterceptor: true,
    })
    const data = await res.json()

    if (!res.ok) {
      error.value = data.error || t('auth.login.messages.failed')
      return { success: false, error: error.value }
    }

    if (data.requires2FA) {
      return {
        success: true,
        requires2FA: true,
        pendingAuthId: data.pendingAuthId,
        userId: data.userId,
        methods: data.methods,
      }
    }

    setSessionData(data.sessionId, data.user)
    return {
      success: true,
      requires2FA: false,
    }
  }

  async function login(
    email: string,
    password: string,
    remember: boolean = false,
  ): Promise<LoginResult> {
    loading.value = true
    error.value = null

    try {
      try {
        const opaqueResult = await tryOpaqueLogin(email, password, remember)
        if (opaqueResult) {
          return opaqueResult
        }
      } catch (opaqueError) {
        console.warn('OPAQUE login failed, falling back to legacy login:', opaqueError)
      }

      return await loginWithLegacy(email, password, remember)
    } catch (e) {
      error.value = (e as Error).message
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function verifyTOTP(pendingAuthId: string, totpCode: string) {
    loading.value = true
    error.value = null

    try {
      const res = await http('/api/auth/verify-totp', {
        method: 'POST',
        body: JSON.stringify({ pendingAuthId, totpCode }),
        skipInterceptor: true,
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || t('auth.security.totp.messages.verifyFailed'))
      }

      setSessionData(data.sessionId, data.user)
      return { success: true }
    } catch (e) {
      error.value = (e as Error).message
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function reauthWithPassword(password: string) {
    loading.value = true
    error.value = null

    try {
      const { clientLoginState, startLoginRequest } = await startOpaqueLogin(password)
      const startRes = await http('/api/auth/opaque/reauth/start', {
        method: 'POST',
        body: JSON.stringify({ startLoginRequest }),
        skipInterceptor: true,
      })
      const startData = await startRes.json()

      if (!startRes.ok) {
        throw new Error(startData.error || t('auth.security.reauth.messages.startFailed'))
      }

      const finishResult = await finishOpaqueLogin({
        password,
        loginResponse: startData.loginResponse,
        clientLoginState,
      })

      if (!finishResult) {
        throw new Error(t('auth.security.reauth.messages.invalidPassword'))
      }

      const finishRes = await http('/api/auth/opaque/reauth/finish', {
        method: 'POST',
        body: JSON.stringify({
          attemptId: startData.attemptId,
          finishLoginRequest: finishResult.finishLoginRequest,
        }),
        skipInterceptor: true,
      })
      const finishData = await finishRes.json()

      if (!finishRes.ok) {
        throw new Error(finishData.error || t('auth.security.reauth.messages.finishFailed'))
      }

      return { success: true, reauthExpiresAt: finishData.reauthExpiresAt as number }
    } catch (e) {
      error.value = (e as Error).message
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true

    try {
      if (sessionId.value) {
        await http('/api/auth/logout', {
          method: 'POST',
          skipInterceptor: true,
        })
      }
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      clearSessionData()
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!sessionId.value) return

    try {
      const res = await http('/api/auth/me')

      if (!res.ok) {
        await logout()
        return
      }

      const data = await res.json()
      user.value = data.user
      setStoredItem('user', JSON.stringify(data.user))
    } catch (e) {
      console.error('Failed to fetch user:', e)
    }
  }

  function getAuthHeader() {
    return sessionId.value ? `Bearer ${sessionId.value}` : ''
  }

  async function totpEnabled(): Promise<boolean> {
    try {
      if (!user.value?.id) {
        return false
      }

      const res = await http('/api/totp/check', {
        method: 'POST',
        body: JSON.stringify({ userId: user.value.id }),
      })

      if (!res.ok) {
        return false
      }

      const data = await res.json()
      return data.enabled
    } catch (e) {
      console.error('Failed to check TOTP status:', e)
      return false
    }
  }

  return {
    user,
    sessionId,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    register,
    login,
    verifyTOTP,
    reauthWithPassword,
    logout,
    fetchMe,
    getAuthHeader,
    totpEnabled,
    setSessionData,
    clearSessionData,
  }
})
