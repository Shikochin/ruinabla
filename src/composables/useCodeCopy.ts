import { onBeforeUnmount, onMounted, watch } from 'vue'

import { useI18n } from 'vue-i18n'

export function useCodeCopy(selector: string) {
  const { t, locale } = useI18n()
  let cleanupFns: (() => void)[] = []

  function init() {
    // Clean up previous buttons/listeners
    cleanup()

    const container = document.querySelector(selector)
    if (!container) return

    const preBlocks = container.querySelectorAll('pre')
    preBlocks.forEach((pre) => {
      // Check if button already exists (in case of re-renders without full unmount)
      if (pre.querySelector('.copy-btn')) return

      // Create wrapper if needed, but usually pre is the block.
      // We'll append the button to the pre block.
      // Ensure pre has relative position for absolute button positioning
      if (getComputedStyle(pre).position === 'static') {
        pre.style.position = 'relative'
      }

      const btn = document.createElement('button')
      btn.className = 'copy-btn'
      btn.textContent = t('common.copy')
      btn.type = 'button'
      btn.ariaLabel = t('common.copyCode')

      let resetTimer: ReturnType<typeof setTimeout> | undefined
      const copyHandler = async () => {
        try {
          const code = pre.querySelector('code')?.innerText || pre.innerText
          await navigator.clipboard.writeText(code)

          btn.textContent = t('common.copied')
          btn.classList.add('copied')

          clearTimeout(resetTimer)
          resetTimer = setTimeout(() => {
            btn.textContent = t('common.copy')
            btn.classList.remove('copied')
          }, 2000)
        } catch (err) {
          console.error('Failed to copy:', err)
          btn.textContent = t('common.copyFailed')
        }
      }

      btn.addEventListener('click', copyHandler)
      pre.appendChild(btn)

      cleanupFns.push(() => {
        clearTimeout(resetTimer)
        btn.removeEventListener('click', copyHandler)
        btn.remove()
      })
    })
  }

  function cleanup() {
    cleanupFns.forEach((fn) => fn())
    cleanupFns = []
  }

  watch(locale, init)

  onMounted(() => {
    // Initial init if content is already there
    init()
  })

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    init,
  }
}
