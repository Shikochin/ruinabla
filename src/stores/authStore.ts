import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

interface User {
  id: string
  email: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const sessionId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Load session from localStorage on init
  const storedSessionId = localStorage.getItem('sessionId')
  const storedUser = localStorage.getItem('user')
  if (storedSessionId && storedUser) {
    sessionId.value = storedSessionId
    user.value = JSON.parse(storedUser)
  }

  const isAuthenticated = computed(() => !!user.value && !!sessionId.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // Register
  async function register(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Save session
      sessionId.value = data.sessionId
      user.value = data.user
      localStorage.setItem('sessionId', data.sessionId)
      localStorage.setItem('user', JSON.stringify(data.user))

      return { success: true }
    } catch (e) {
      error.value = (e as Error).message
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Login
  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        error.value = data.error || 'Login failed'
        return { success: false }
      }

      // Check if 2FA is required
      if (data.requires2FA) {
        return {
          success: true,
          requires2FA: true,
          userId: data.userId,
        }
      }

      // Direct login success (should not happen for password login)
      user.value = data.user
      sessionId.value = data.sessionId
      localStorage.setItem('sessionId', data.sessionId)
      localStorage.setItem('user', JSON.stringify(data.user))

      return { success: true, requires2FA: false }
    } catch (e) {
      error.value = (e as Error).message
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  // Verify TOTP
  async function verifyTOTP(userId: string, totpCode: string) {
    loading.value = true
    error.value = null

    try {
      const res = await fetch('/api/auth/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, totpCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'TOTP verification failed')
      }

      // Save session
      sessionId.value = data.sessionId
      user.value = data.user
      localStorage.setItem('sessionId', data.sessionId)
      localStorage.setItem('user', JSON.stringify(data.user))

      return { success: true }
    } catch (e) {
      error.value = (e as Error).message
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Logout
  async function logout() {
    loading.value = true

    try {
      if (sessionId.value) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionId.value}`,
          },
        })
      }
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      // Clear local state regardless
      user.value = null
      sessionId.value = null
      localStorage.removeItem('sessionId')
      localStorage.removeItem('user')
      loading.value = false
    }
  }

  // Fetch current user
  async function fetchMe() {
    if (!sessionId.value) return

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${sessionId.value}`,
        },
      })

      if (!res.ok) {
        // Session expired
        await logout()
        return
      }

      const data = await res.json()
      user.value = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch (e) {
      console.error('Failed to fetch user:', e)
    }
  }

  // Get auth header
  function getAuthHeader() {
    return sessionId.value ? `Bearer ${sessionId.value}` : ''
  }

  async function totpEnabled(): Promise<boolean> {
    try {
      if (!user.value?.id) return false

      const res = await fetch('/api/totp/check', {
        method: 'POST',
        body: JSON.stringify({ userId: user.value.id }),
      })

      if (!res.ok) {
        // Session expired
        await logout()
        return false
      }

      const data = await res.json()
      return data.enabled
    } catch (e) {
      console.error('Failed to fetch user:', e)
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
    logout,
    fetchMe,
    getAuthHeader,
    totpEnabled,
  }
})
