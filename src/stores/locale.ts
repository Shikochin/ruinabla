import { defineStore } from 'pinia'
import i18n from '@/i18n'

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    currentLocale: localStorage.getItem('locale') || 'zh-CN',
  }),
  actions: {
    setLocale(locale: string) {
      this.currentLocale = locale
      localStorage.setItem('locale', locale)
      // @ts-expect-error i18n.global.locale is a Ref in i18n v9+, but typing might be complex here
      i18n.global.locale.value = locale
    },
  },
})
