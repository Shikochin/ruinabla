import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import i18n from '@/i18n'
import RegisterView from './RegisterView.vue'

const push = vi.fn()
const authStore = {
  loading: false,
  error: null as string | null,
  isAuthenticated: false,
  register: vi.fn(),
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

describe('RegisterView', () => {
  beforeEach(() => {
    authStore.loading = false
    authStore.error = null
    authStore.isAuthenticated = false
    authStore.register.mockReset()
    push.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('submits the registration form through the auth store and shows the success state', async () => {
    authStore.register.mockResolvedValue({ success: true })

    const wrapper = mount(RegisterView, {
      global: {
        plugins: [i18n],
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    })

    await wrapper.get('input[type="email"]').setValue('register@example.com')
    await wrapper.get('#password').setValue('password123')
    await wrapper.get('#confirm-password').setValue('password123')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(authStore.register).toHaveBeenCalledWith('register@example.com', 'password123')
    expect(wrapper.text()).toContain(i18n.global.t('auth.register.successTitle'))
  })
})
