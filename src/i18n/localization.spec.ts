import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import i18n from './index'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'
import jaJP from './locales/ja-JP.json'
import { resolveLocale, supportedLocales } from './locale'
import { localizeApiError } from './errors'
import { useLocaleStore } from '@/stores/locale'
import { getRelativeTime } from '@/utils/temporal'
import PasswordConfirmModal from '@/components/PasswordConfirmModal.vue'
import GiscusComment from '@/components/GiscusComment.vue'

function flatten(messages: object, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(messages).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key
      return typeof value === 'string' ? [[path, value]] : Object.entries(flatten(value, path))
    }),
  )
}

const catalogs = { 'zh-CN': zhCN, 'en-US': enUS, 'ja-JP': jaJP }
const source = flatten(zhCN)
const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)]
    .map((match) => match[1])
    .filter((value, index, all) => all.indexOf(value) === index)
    .sort()

afterEach(() => {
  i18n.global.locale.value = 'zh-CN'
  vi.restoreAllMocks()
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('localization coverage', () => {
  for (const locale of supportedLocales) {
    it(`${locale} has complete messages with matching interpolation parameters`, () => {
      const compilationErrors = vi.spyOn(console, 'error').mockImplementation(() => {})
      const messages = flatten(catalogs[locale])
      expect(Object.keys(messages).sort()).toEqual(Object.keys(source).sort())
      const translator = createI18n({
        legacy: false,
        locale,
        messages: catalogs,
        warnHtmlMessage: false,
      })
      for (const [key, value] of Object.entries(messages)) {
        expect(value.trim(), key).not.toBe('')
        expect(placeholders(value), key).toEqual(placeholders(source[key]!))
        const params = Object.fromEntries(
          placeholders(value).map((name) => [name!, name === 'n' ? 2 : 'sample']),
        )
        expect(translator.global.t(key, params), key).not.toBe(key)
      }
      expect(compilationErrors).not.toHaveBeenCalled()
    })
  }

  it('defines every literal translation key used by the application', () => {
    const src = resolve(process.cwd(), 'src')
    for (const path of readdirSync(src, { recursive: true, encoding: 'utf8' })) {
      if (!/\.(vue|ts)$/.test(path) || path.endsWith('.spec.ts')) continue
      const content = readFileSync(resolve(src, path), 'utf8')
      const keys = [
        ...[...content.matchAll(/(?<![\w])\$?t\(['"]([^'"]+)['"]/g)].map((match) => match[1]),
        ...[...content.matchAll(/keypath=['"]([^'"]+)['"]/g)].map((match) => match[1]),
        ...[...content.matchAll(/titleKey: ['"]([^'"]+)['"]/g)].map((match) => match[1]),
      ]
      for (const key of keys) expect(source[key!], `${path}: ${key}`).toBeTypeOf('string')
    }
  })

  it('persists supported locales and falls back safely for invalid stored values', () => {
    setActivePinia(createPinia())
    const store = useLocaleStore()
    store.setLocale('ja-JP')
    expect(i18n.global.locale.value).toBe('ja-JP')
    expect(localStorage.getItem('locale')).toBe('ja-JP')
    store.setLocale('unsupported')
    expect(store.currentLocale).toBe('zh-CN')
    expect(i18n.global.locale.value).toBe('zh-CN')
    expect(resolveLocale(null)).toBe('zh-CN')
  })

  it('renders English singular and plural counts', () => {
    i18n.global.locale.value = 'en-US'
    expect(i18n.global.t('entry.minutesRead', { n: 1 })).toBe('1 minute read')
    expect(i18n.global.t('entry.minutesRead', { n: 2 })).toBe('2 minutes read')
    expect(i18n.global.t('auth.security.passkeys.count', { n: 1 })).toBe('1 key')
  })

  it('formats recent timestamps in all three languages', () => {
    const timestamp = Date.now() / 1000 - 125
    expect(getRelativeTime(timestamp, 'zh-CN')).toBe('2分钟前')
    expect(getRelativeTime(timestamp, 'en-US')).toBe('2 minutes ago')
    expect(getRelativeTime(timestamp, 'ja-JP')).toBe('2 分前')
    expect(getRelativeTime(Date.now() / 1000 - 5, 'ja-JP')).toBe('今')
  })

  it('translates API errors and uses a localized fallback for unknown errors', () => {
    i18n.global.locale.value = 'ja-JP'
    expect(localizeApiError('Email already registered')).toBe(jaJP.errors.emailRegistered)
    expect(localizeApiError('Internal database details', 'auth.login.messages.failed')).toBe(
      jaJP.auth.login.messages.failed,
    )
    i18n.global.locale.value = 'zh-CN'
    expect(localizeApiError('Invalid credentials')).toBe(zhCN.errors.invalidCredentials)
  })

  it('updates an open confirmation dialog when the language changes', async () => {
    const wrapper = mount(PasswordConfirmModal, {
      props: { show: true, title: 'Test' },
      global: { plugins: [i18n], stubs: { teleport: true } },
    })
    expect(wrapper.text()).toContain('密码')
    i18n.global.locale.value = 'ja-JP'
    await nextTick()
    expect(wrapper.text()).toContain('パスワード')
    expect(wrapper.text()).toContain('キャンセル')
    wrapper.unmount()
  })

  it('switches the embedded comment language with the site locale', async () => {
    const wrapper = mount(GiscusComment, {
      global: {
        plugins: [createPinia(), i18n],
        stubs: { Giscus: { props: ['lang'], template: '<div :data-lang="lang" />' } },
      },
    })
    for (const [locale, lang] of [
      ['en-US', 'en'],
      ['ja-JP', 'ja'],
      ['zh-CN', 'zh-CN'],
    ] as const) {
      i18n.global.locale.value = locale
      await nextTick()
      expect(wrapper.find('[data-lang]').attributes('data-lang')).toBe(lang)
      expect(wrapper.text()).toContain(catalogs[locale].comments.title)
    }
    wrapper.unmount()
  })
})
