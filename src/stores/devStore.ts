import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDevStore = defineStore('dev', () => {
  const isDev = ref(false)

  // init
  if (localStorage.getItem('ruinabla-dev') === 'true') {
    isDev.value = true
  }

  function setIsDev(value: boolean) {
    isDev.value = value
    localStorage.setItem('ruinabla-dev', value ? 'true' : 'false')
  }

  return {
    isDev,
    setIsDev,
  }
})
