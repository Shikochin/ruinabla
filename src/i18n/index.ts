import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'
import jaJP from './locales/ja-JP.json'
import { getStoredItem } from '@/utils/storage'

const i18n = createI18n({
  legacy: false,
  locale: getStoredItem('locale') || 'zh-CN',
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'ja-JP': jaJP,
  },
})

export default i18n
