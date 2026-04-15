import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import i18n from '@/i18n'
import LoginView from './LoginView.vue'

const push = vi.fn()
const authStore = {
  loading: false,
  error: null as string | null,
  isAuthenticated: false,
  login: vi.fn(),
  verifyTOTP: vi.fn(),
  setSessionData: vi.fn(),
}

vi.mock('@unhead/vue', () => ({
  useHead: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => authStore,
}))

describe('LoginView', () => {
  beforeEach(() => {
    authStore.loading = false
    authStore.error = null
    authStore.isAuthenticated = false
    authStore.login.mockReset()
    authStore.verifyTOTP.mockReset()
    authStore.setSessionData.mockReset()
    push.mockReset()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows the second step and verifies TOTP with the pending auth id', async () => {
    authStore.login.mockResolvedValue({
      success: true,
      requires2FA: true,
      pendingAuthId: 'pending-1',
      userId: 'user-1',
      methods: {
        totp: true,
        passkey: false,
      },
    })
    authStore.verifyTOTP.mockResolvedValue({ success: true })

    const wrapper = mount(LoginView, {
      global: {
        plugins: [i18n],
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    })

    await wrapper.get('input[type="email"]').setValue('login@example.com')
    await wrapper.get('input[type="password"]').setValue('password123')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(authStore.login).toHaveBeenCalledWith('login@example.com', 'password123', false)
    expect(wrapper.find('#totp').exists()).toBe(true)

    await wrapper.get('#totp').setValue('123456')
    await wrapper.get('.method-card button').trigger('click')
    await flushPromises()

    expect(authStore.verifyTOTP).toHaveBeenCalledWith('pending-1', '123456')
    expect(push).toHaveBeenCalledWith('/')
  })
})
