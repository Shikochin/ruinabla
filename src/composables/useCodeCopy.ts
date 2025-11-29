import { onBeforeUnmount, onMounted } from 'vue'

export function useCodeCopy(selector: string) {
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
      btn.textContent = 'Copy'
      btn.type = 'button'
      btn.ariaLabel = 'Copy code'

      const copyHandler = async () => {
        try {
          const code = pre.querySelector('code')?.innerText || pre.innerText
          await navigator.clipboard.writeText(code)

          btn.textContent = 'Copied!'
          btn.classList.add('copied')

          setTimeout(() => {
            btn.textContent = 'Copy'
            btn.classList.remove('copied')
          }, 2000)
        } catch (err) {
          console.error('Failed to copy:', err)
          btn.textContent = 'Error'
        }
      }

      btn.addEventListener('click', copyHandler)
      pre.appendChild(btn)

      cleanupFns.push(() => {
        btn.removeEventListener('click', copyHandler)
        btn.remove()
      })
    })
  }

  function cleanup() {
    cleanupFns.forEach((fn) => fn())
    cleanupFns = []
  }

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
