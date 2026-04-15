import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getStoredItem, setStoredItem } from '@/utils/storage'

export const useDevStore = defineStore('dev', () => {
  const isDev = ref(false)

  // init
  if (getStoredItem('ruinabla-dev') === 'true') {
    isDev.value = true
  }

  function setIsDev(value: boolean) {
    isDev.value = value
    setStoredItem('ruinabla-dev', value ? 'true' : 'false')
  }

  return {
    isDev,
    setIsDev,
  }
})
