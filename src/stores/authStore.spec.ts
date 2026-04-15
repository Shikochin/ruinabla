import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/utils/opaque', () => ({
  startOpaqueRegistration: vi.fn(),
  finishOpaqueRegistration: vi.fn(),
  startOpaqueLogin: vi.fn(),
  finishOpaqueLogin: vi.fn(),
}))

import { useAuthStore } from './authStore'
import { finishOpaqueLogin, startOpaqueLogin } from '@/utils/opaque'

const mockedStartOpaqueLogin = vi.mocked(startOpaqueLogin)
const mockedFinishOpaqueLogin = vi.mocked(finishOpaqueLogin)

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.restoreAllMocks()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('logs in through OPAQUE and stores the session', async () => {
    const store = useAuthStore()

    mockedStartOpaqueLogin.mockResolvedValue({
      clientLoginState: 'client-state',
      startLoginRequest: 'start-request',
    })
    mockedFinishOpaqueLogin.mockResolvedValue({
      finishLoginRequest: 'finish-request',
      sessionKey: 'session-key',
      exportKey: 'export-key',
      serverStaticPublicKey: 'server-public-key',
    })
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            attemptId: 'attempt-1',
            loginResponse: 'login-response',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            sessionId: 'session-1',
            user: {
              id: 'user-1',
              email: 'opaque@example.com',
              role: 'user',
            },
          }),
          { status: 200 },
        ),
      )

    const result = await store.login('opaque@example.com', 'hunter2', true)

    expect(result).toEqual({
      success: true,
      requires2FA: false,
    })
    expect(store.sessionId).toBe('session-1')
    expect(store.user).toEqual({
      id: 'user-1',
      email: 'opaque@example.com',
      role: 'user',
    })
    expect(localStorage.getItem('sessionId')).toBe('session-1')
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledTimes(2)
  })

  it('falls back to the legacy login endpoint when OPAQUE cannot finish', async () => {
    const store = useAuthStore()

    mockedStartOpaqueLogin.mockResolvedValue({
      clientLoginState: 'client-state',
      startLoginRequest: 'start-request',
    })
    mockedFinishOpaqueLogin.mockResolvedValue(undefined)
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            attemptId: 'attempt-legacy',
            loginResponse: 'login-response',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            sessionId: 'legacy-session',
            user: {
              id: 'user-legacy',
              email: 'legacy@example.com',
              role: 'user',
            },
          }),
          { status: 200 },
        ),
      )

    const result = await store.login('legacy@example.com', 'password123', false)

    expect(result).toEqual({
      success: true,
      requires2FA: false,
    })
    expect(store.sessionId).toBe('legacy-session')
    expect(vi.mocked(globalThis.fetch).mock.calls[1]?.[0]).toBe('/api/auth/login')
  })

  it('falls back to the legacy login endpoint when the OPAQUE client throws', async () => {
    const store = useAuthStore()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mockedStartOpaqueLogin.mockResolvedValue({
      clientLoginState: 'client-state',
      startLoginRequest: 'start-request',
    })
    mockedFinishOpaqueLogin.mockRejectedValue(new Error('opaque finish failed'))
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            attemptId: 'attempt-opaque',
            loginResponse: 'login-response',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            sessionId: 'legacy-session',
            user: {
              id: 'user-legacy',
              email: 'legacy@example.com',
              role: 'user',
            },
          }),
          { status: 200 },
        ),
      )

    const result = await store.login('legacy@example.com', 'password123', false)

    expect(result).toEqual({
      success: true,
      requires2FA: false,
    })
    expect(store.sessionId).toBe('legacy-session')
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledTimes(2)
    expect(vi.mocked(globalThis.fetch).mock.calls[1]?.[0]).toBe('/api/auth/login')
    expect(warnSpy).toHaveBeenCalled()
  })

  it('returns the pending challenge when OPAQUE login requires 2FA', async () => {
    const store = useAuthStore()

    mockedStartOpaqueLogin.mockResolvedValue({
      clientLoginState: 'client-state',
      startLoginRequest: 'start-request',
    })
    mockedFinishOpaqueLogin.mockResolvedValue({
      finishLoginRequest: 'finish-request',
      sessionKey: 'session-key',
      exportKey: 'export-key',
      serverStaticPublicKey: 'server-public-key',
    })
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            attemptId: 'attempt-2fa',
            loginResponse: 'login-response',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            requires2FA: true,
            pendingAuthId: 'pending-1',
            userId: 'user-2fa',
            methods: {
              totp: true,
              passkey: false,
            },
          }),
          { status: 200 },
        ),
      )

    const result = await store.login('twofactor@example.com', 'password123', false)

    expect(result).toEqual({
      success: true,
      requires2FA: true,
      pendingAuthId: 'pending-1',
      userId: 'user-2fa',
      methods: {
        totp: true,
        passkey: false,
      },
    })
    expect(store.sessionId).toBeNull()
  })

  it('completes OPAQUE reauthentication for sensitive actions', async () => {
    const store = useAuthStore()
    store.setSessionData('session-existing', {
      id: 'user-1',
      email: 'opaque@example.com',
      role: 'user',
    })

    mockedStartOpaqueLogin.mockResolvedValue({
      clientLoginState: 'client-state',
      startLoginRequest: 'start-request',
    })
    mockedFinishOpaqueLogin.mockResolvedValue({
      finishLoginRequest: 'finish-request',
      sessionKey: 'session-key',
      exportKey: 'export-key',
      serverStaticPublicKey: 'server-public-key',
    })
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            attemptId: 'reauth-attempt',
            loginResponse: 'reauth-response',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            reauthExpiresAt: 1234567890,
          }),
          { status: 200 },
        ),
      )

    const result = await store.reauthWithPassword('hunter2')

    expect(result).toEqual({
      success: true,
      reauthExpiresAt: 1234567890,
    })
    expect(vi.mocked(globalThis.fetch).mock.calls[0]?.[0]).toBe('/api/auth/opaque/reauth/start')
    expect(vi.mocked(globalThis.fetch).mock.calls[1]?.[0]).toBe('/api/auth/opaque/reauth/finish')
  })
})
