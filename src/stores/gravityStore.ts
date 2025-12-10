import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGravityStore = defineStore('gravity', () => {
  const isMobile = ref(false)
  const hasMotionSupport = ref(false)
  const enabled = ref(false)
  const offsetX = ref(0)
  const offsetY = ref(0)
  const permissionError = ref<string | null>(null)

  let tiltX = 0
  let tiltY = 0
  let shakeX = 0
  let shakeY = 0
  let listenersAttached = false

  type BodyState = {
    el: HTMLElement
    baseLeft: number
    baseTop: number
    width: number
    height: number
    x: number
    y: number
    vx: number
    vy: number
  }

  const bodies: BodyState[] = []
  let rafId: number | null = null
  let lastTime = 0
  let observer: MutationObserver | null = null

  function detectMobile() {
    if (typeof navigator === 'undefined') return
    const ua = navigator.userAgent || ''
    isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  }

  function detectMotionSupport() {
    if (typeof window === 'undefined') return
    hasMotionSupport.value = 'DeviceMotionEvent' in window || 'DeviceOrientationEvent' in window
  }

  function applyOffsets() {
    let maxX = 120
    let maxY = 260

    if (typeof window !== 'undefined') {
      // 根据视口尺寸设置最大位移，作为“碰撞箱”边界
      maxX = window.innerWidth * 0.25
      maxY = window.innerHeight * 0.45
    }

    const baseX = tiltX * maxX + shakeX * maxX * 0.2
    const baseY = tiltY * maxY + shakeY * maxY * 0.25

    const clampedX = Math.max(-maxX, Math.min(maxX, baseX))
    const clampedY = Math.max(-maxY, Math.min(maxY, baseY))

    offsetX.value = clampedX
    offsetY.value = clampedY
  }

  function registerBody(el: HTMLElement) {
    if (typeof window === 'undefined') return
    const existing = bodies.find((b) => b.el === el)
    if (existing) return

    const rect = el.getBoundingClientRect()

    bodies.push({
      el,
      baseLeft: rect.left,
      baseTop: rect.top,
      width: rect.width,
      height: rect.height,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    })
  }

  function unregisterBody(el: HTMLElement) {
    const index = bodies.findIndex((b) => b.el === el)
    if (index === -1) return
    const body = bodies[index]
    if (!body) return
    body.el.style.transform = ''
    bodies.splice(index, 1)
  }

  function scanAndRegisterBodies(root: ParentNode) {
    const elements = root.querySelectorAll<HTMLElement>('*')
    elements.forEach((el) => registerBody(el))
  }

  function unregisterSubtree(root: HTMLElement) {
    for (let i = bodies.length - 1; i >= 0; i--) {
      const body = bodies[i]
      if (!body.el.isConnected || root.contains(body.el)) {
        body.el.style.transform = ''
        bodies.splice(i, 1)
      }
    }
  }

  function registerAllBodies() {
    if (typeof document === 'undefined') return
    scanAndRegisterBodies(document.body)
  }

  function startDomObserver() {
    if (typeof document === 'undefined') return
    if (observer) return

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            scanAndRegisterBodies(node)
          }
        })

        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            unregisterSubtree(node)
          }
        })
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  function stopDomObserver() {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  function handleOrientation(event: DeviceOrientationEvent) {
    if (!enabled.value) return
    const beta = event.beta ?? 0
    const gamma = event.gamma ?? 0

    // 纵向：-90° ~ 90° 基本对应平放到竖直，映射到 [-1, 1]
    const clampedBeta = Math.max(-90, Math.min(90, beta))
    // 横向：适当放大范围，但不至于太晃
    const clampedGamma = Math.max(-60, Math.min(60, gamma))

    tiltY = clampedBeta / 90
    tiltX = clampedGamma / 60

    applyOffsets()
  }

  function handleMotion(event: DeviceMotionEvent) {
    if (!enabled.value) return
    const acc = event.accelerationIncludingGravity
    if (!acc) return

    const ax = acc.x ?? 0
    const ay = acc.y ?? 0

    const max = 6
    shakeX = Math.max(-max, Math.min(max, ax)) / max
    shakeY = Math.max(-max, Math.min(max, ay)) / max

    applyOffsets()
  }

  function stepBodies(timestamp: number) {
    if (!enabled.value || bodies.length === 0) {
      if (typeof window !== 'undefined' && rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
      rafId = null
      lastTime = 0
      return
    }

    if (!lastTime) {
      lastTime = timestamp
    }
    let dt = (timestamp - lastTime) / 1000
    lastTime = timestamp
    if (dt > 0.05) dt = 0.05

    if (typeof window === 'undefined') return

    const vw = window.innerWidth
    const vh = window.innerHeight

    const gStrength = 2000

    const gx = tiltX * gStrength
    const gy = tiltY * gStrength

    for (const body of bodies) {
      body.vx += gx * dt
      body.vy += gy * dt

      body.x += body.vx * dt
      body.y += body.vy * dt

      const minX = -body.baseLeft
      const maxX = vw - (body.baseLeft + body.width)
      const minY = -body.baseTop
      const maxY = vh - (body.baseTop + body.height)

      if (body.x < minX) {
        body.x = minX
        body.vx = 0
      } else if (body.x > maxX) {
        body.x = maxX
        body.vx = 0
      }

      if (body.y < minY) {
        body.y = minY
        body.vy = 0
      } else if (body.y > maxY) {
        body.y = maxY
        body.vy = 0
      }

      body.vx *= 0.98
      body.vy *= 0.98

      body.el.style.transform = `translate3d(${body.x.toFixed(2)}px, ${body.y.toFixed(2)}px, 0)`
    }

    if (typeof window !== 'undefined') {
      rafId = window.requestAnimationFrame(stepBodies)
    }
  }

  function startBodiesLoop() {
    if (typeof window === 'undefined') return
    if (rafId !== null) return
    lastTime = 0
    rafId = window.requestAnimationFrame(stepBodies)
  }

  function stopBodiesLoop() {
    if (typeof window !== 'undefined' && rafId !== null) {
      window.cancelAnimationFrame(rafId)
    }
    rafId = null
    lastTime = 0
    for (const body of bodies) {
      body.x = 0
      body.y = 0
      body.vx = 0
      body.vy = 0
      body.el.style.transform = ''
    }
  }

  function addMotionListeners() {
    if (typeof window === 'undefined' || listenersAttached) return
    window.addEventListener('deviceorientation', handleOrientation)
    window.addEventListener('devicemotion', handleMotion)
    listenersAttached = true
  }

  function removeMotionListeners() {
    if (typeof window === 'undefined' || !listenersAttached) return
    window.removeEventListener('deviceorientation', handleOrientation)
    window.removeEventListener('devicemotion', handleMotion)
    listenersAttached = false
  }

  async function requestPermissionIfNeeded() {
    if (typeof window === 'undefined') return
    const w = window as any

    try {
      const hasRequest =
        typeof w.DeviceMotionEvent !== 'undefined' &&
        typeof w.DeviceMotionEvent.requestPermission === 'function'

      if (hasRequest) {
        const res = await w.DeviceMotionEvent.requestPermission()
        if (res !== 'granted') {
          permissionError.value = '需要允许“运动与方向”权限才能开启重力模式。'
          return
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function enable() {
    permissionError.value = null
    await requestPermissionIfNeeded()
    if (permissionError.value) {
      enabled.value = false
      return
    }

    enabled.value = true
    addMotionListeners()
    registerAllBodies()
    startDomObserver()
    startBodiesLoop()
  }

  function disable() {
    enabled.value = false
    removeMotionListeners()
    stopDomObserver()
    stopBodiesLoop()
    tiltX = 0
    tiltY = 0
    shakeX = 0
    shakeY = 0
    offsetX.value = 0
    offsetY.value = 0
  }

  function initEnvironment() {
    detectMobile()
    detectMotionSupport()
  }

  return {
    isMobile,
    hasMotionSupport,
    enabled,
    offsetX,
    offsetY,
    permissionError,
    initEnvironment,
    registerBody,
    unregisterBody,
    enable,
    disable,
  }
})
