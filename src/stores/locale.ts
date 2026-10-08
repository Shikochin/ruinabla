import { defineStore } from 'pinia'
import i18n from '@/i18n'
import { resolveLocale } from '@/i18n/locale'
import { setStoredItem } from '@/utils/storage'

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    currentLocale: i18n.global.locale.value,
  }),
  actions: {
    setLocale(locale: string) {
      const nextLocale = resolveLocale(locale)
      this.currentLocale = nextLocale
      setStoredItem('locale', nextLocale)
      i18n.global.locale.value = nextLocale
    },
  },
})
