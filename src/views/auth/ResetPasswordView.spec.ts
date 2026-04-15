import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import i18n from '@/i18n'
import ResetPasswordView from './ResetPasswordView.vue'

const push = vi.fn()
const opaqueMocks = vi.hoisted(() => ({
  startOpaqueRegistration: vi.fn(),
  finishOpaqueRegistration: vi.fn(),
}))

vi.mock('@unhead/vue', () => ({
  useHead: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      token: 'reset-token',
    },
  }),
  useRouter: () => ({ push }),
  RouterLink: {
    template: '<a><slot /></a>',
  },
}))

vi.mock('@/utils/opaque', () => ({
  startOpaqueRegistration: opaqueMocks.startOpaqueRegistration,
  finishOpaqueRegistration: opaqueMocks.finishOpaqueRegistration,
}))

describe('ResetPasswordView', () => {
  beforeEach(() => {
    push.mockReset()
    opaqueMocks.startOpaqueRegistration.mockReset()
    opaqueMocks.finishOpaqueRegistration.mockReset()
    vi.useFakeTimers()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('submits the OPAQUE password reset flow and shows the success state', async () => {
    opaqueMocks.startOpaqueRegistration.mockResolvedValue({
      clientRegistrationState: 'client-state',
      registrationRequest: 'registration-request',
    })
    opaqueMocks.finishOpaqueRegistration.mockResolvedValue({
      registrationRecord: 'registration-record',
      exportKey: 'export-key',
      serverStaticPublicKey: 'server-public-key',
    })
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            attemptId: 'attempt-1',
            registrationResponse: 'registration-response',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
          }),
          { status: 200 },
        ),
      )

    const wrapper = mount(ResetPasswordView, {
      global: {
        plugins: [i18n],
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    })

    await flushPromises()
    await wrapper.get('#newPassword').setValue('new-password-123')
    await wrapper.get('#confirmPassword').setValue('new-password-123')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(opaqueMocks.startOpaqueRegistration).toHaveBeenCalledWith('new-password-123')
    expect(vi.mocked(globalThis.fetch).mock.calls[0]?.[0]).toBe('/api/auth/opaque/reset/start')
    expect(vi.mocked(globalThis.fetch).mock.calls[1]?.[0]).toBe('/api/auth/opaque/reset/finish')
    expect(wrapper.text()).toContain(i18n.global.t('auth.resetPassword.successTitle'))
  })
})
