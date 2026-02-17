<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { parseGIF, decompressFrames } from 'gifuct-js'
import GIF from 'gif.js'

const fileInput = ref<HTMLInputElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const isDragging = ref(false)

// State
const originalImage = ref<HTMLImageElement | null>(null)

const fileName = ref<string>('')
const fileSize = ref<number>(0)
const outputSize = ref<number>(0)

// GIF-specific state
interface GifFrame {
  dims: { width: number; height: number; top: number; left: number }
  delay: number
  patch: Uint8ClampedArray
  disposalType?: number
}

const isAnimatedGif = ref<boolean>(false)
const gifBlob = ref<Blob | null>(null)
const gifFrames = ref<GifFrame[]>([])
const gifCompositedFrames = ref<HTMLCanvasElement[]>([]) // Pre-rendered full frames
const animationId = ref<number | null>(null)

// Settings
const width = ref<number>(0)
const height = ref<number>(0)
const format = ref<string>('image/webp')
const quality = ref<number>(0.8)
const keepAspectRatio = ref<boolean>(false)

// Format options
const formats = [
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/png', label: 'PNG' },
  { value: 'image/webp', label: 'WebP' },
  { value: 'image/gif', label: 'GIF (Animated)' },
]

// Computed preview URL for animated GIF
const gifPreviewUrl = ref<string>('')

// Update preview URL when gifBlob changes
watch(gifBlob, (newBlob) => {
  if (gifPreviewUrl.value) {
    URL.revokeObjectURL(gifPreviewUrl.value)
  }
  if (newBlob) {
    gifPreviewUrl.value = URL.createObjectURL(newBlob)
  } else {
    gifPreviewUrl.value = ''
  }
})

function triggerUpload() {
  fileInput.value?.click()
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    processFile(target.files[0])
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

function processFile(file: File) {
  fileName.value = file.name || 'artwork'
  fileSize.value = file.size

  // Check if it's a GIF
  if (file.type === 'image/gif') {
    // Store the original GIF blob for preview
    gifBlob.value = file

    const reader = new FileReader()
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      try {
        const gif = parseGIF(arrayBuffer)
        const frames = decompressFrames(gif, true) as GifFrame[]

        if (frames.length > 1 && frames[0]?.dims) {
          // Animated GIF
          isAnimatedGif.value = true
          gifFrames.value = frames
          format.value = 'image/gif' // Auto-select GIF format

          // Set dimensions from the GIF's logical screen
          const gifWidth = frames[0].dims.width
          const gifHeight = frames[0].dims.height
          width.value = gifWidth
          height.value = gifHeight

          // Pre-render all composited frames using drawImage (not putImageData)
          const bufferCanvas = document.createElement('canvas')
          bufferCanvas.width = gifWidth
          bufferCanvas.height = gifHeight
          const bufferCtx = bufferCanvas.getContext('2d')!
          bufferCtx.clearRect(0, 0, gifWidth, gifHeight)

          const composited: HTMLCanvasElement[] = []
          for (let i = 0; i < frames.length; i++) {
            const frame = frames[i]
            if (!frame) continue

            // Handle disposal of previous frame
            if (i > 0) {
              const prev = frames[i - 1]
              if (prev?.disposalType === 2) {
                bufferCtx.clearRect(
                  prev.dims.left,
                  prev.dims.top,
                  prev.dims.width,
                  prev.dims.height,
                )
              }
            }

            // Render patch to temp canvas, then drawImage for proper alpha compositing
            const patchCanvas = document.createElement('canvas')
            patchCanvas.width = frame.dims.width
            patchCanvas.height = frame.dims.height
            const patchCtx = patchCanvas.getContext('2d')!
            const imageData = new ImageData(
              new Uint8ClampedArray(frame.patch),
              frame.dims.width,
              frame.dims.height,
            )
            patchCtx.putImageData(imageData, 0, 0)
            bufferCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top)

            // Snapshot the composited buffer
            const snapshot = document.createElement('canvas')
            snapshot.width = gifWidth
            snapshot.height = gifHeight
            snapshot.getContext('2d')!.drawImage(bufferCanvas, 0, 0)
            composited.push(snapshot)
          }
          gifCompositedFrames.value = composited

          // Set originalImage for compatibility with other logic
          const img = new Image()
          img.onload = () => {
            originalImage.value = img
            nextTick(() => {
              startGifAnimation()
              updateSize()
            })
          }
          img.src = composited[0]?.toDataURL() || URL.createObjectURL(file)
        } else {
          // Static GIF
          isAnimatedGif.value = false
          gifBlob.value = null
          const img = new Image()
          img.onload = () => {
            originalImage.value = img
            width.value = img.width
            height.value = img.height
            nextTick(() => {
              renderCanvas()
              updateSize()
            })
          }
          img.src = URL.createObjectURL(file)
        }
      } catch (error) {
        console.error('Error parsing GIF:', error)
      }
    }
    reader.readAsArrayBuffer(file)
  } else {
    // Regular image (PNG, JPEG, WebP)
    isAnimatedGif.value = false
    gifBlob.value = null
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        originalImage.value = img
        width.value = img.width
        height.value = img.height
        nextTick(() => {
          renderCanvas()
          updateSize()
        })
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function startGifAnimation() {
  if (!canvas.value || gifCompositedFrames.value.length === 0) return

  stopGifAnimation()

  let frameIndex = 0
  let lastFrameTime = 0

  const animate = (timestamp: number) => {
    if (!canvas.value || gifCompositedFrames.value.length === 0) return

    const frame = gifFrames.value[frameIndex]
    if (!frame) return
    const delay = frame.delay || 100

    if (timestamp - lastFrameTime >= delay) {
      const ctx = canvas.value.getContext('2d')
      if (ctx) {
        canvas.value.width = width.value
        canvas.value.height = height.value
        // Draw pre-rendered composited frame scaled to target dimensions
        const composited = gifCompositedFrames.value[frameIndex]
        if (composited) {
          ctx.drawImage(composited, 0, 0, width.value, height.value)
        }
      }

      frameIndex = (frameIndex + 1) % gifCompositedFrames.value.length
      lastFrameTime = timestamp
    }

    animationId.value = requestAnimationFrame(animate)
  }

  animationId.value = requestAnimationFrame(animate)
}

function stopGifAnimation() {
  if (animationId.value !== null) {
    cancelAnimationFrame(animationId.value)
    animationId.value = null
  }
}

onUnmounted(() => {
  stopGifAnimation()
})

async function downloadImage() {
  // For animated GIF download, canvas is optional (we render frames directly)
  // For static image download, canvas is required
  if (!canvas.value && !(isAnimatedGif.value && format.value === 'image/gif')) return

  if (format.value === 'image/gif' && isAnimatedGif.value && gifFrames.value.length > 1) {
    // Generate animated GIF
    const gif = new GIF({
      workers: 2,
      quality: Math.round((1 - quality.value) * 30),
      width: width.value,
      height: height.value,
      workerScript: '/node_modules/gif.js/dist/gif.worker.js',
    })

    // Create buffer canvas for proper frame composition
    const bufferCanvas = document.createElement('canvas')
    const originalWidth = gifFrames.value[0]?.dims.width || width.value
    const originalHeight = gifFrames.value[0]?.dims.height || height.value
    bufferCanvas.width = originalWidth
    bufferCanvas.height = originalHeight
    const bufferCtx = bufferCanvas.getContext('2d')

    if (!bufferCtx) return

    // Initialize with transparent background
    bufferCtx.clearRect(0, 0, originalWidth, originalHeight)

    // Render each frame with proper composition
    for (let i = 0; i < gifFrames.value.length; i++) {
      const frame = gifFrames.value[i]
      if (!frame) continue

      // Handle disposal of the PREVIOUS frame
      if (i > 0) {
        const prevFrame = gifFrames.value[i - 1]
        if (prevFrame?.disposalType === 2) {
          bufferCtx.clearRect(
            prevFrame.dims.left,
            prevFrame.dims.top,
            prevFrame.dims.width,
            prevFrame.dims.height,
          )
        }
      }

      // Draw current frame patch using drawImage for proper alpha compositing
      // (putImageData replaces pixels directly, including transparent ones = corruption)
      const patchCanvas = document.createElement('canvas')
      patchCanvas.width = frame.dims.width
      patchCanvas.height = frame.dims.height
      const patchCtx = patchCanvas.getContext('2d')
      if (patchCtx) {
        const imageData = new ImageData(
          new Uint8ClampedArray(frame.patch),
          frame.dims.width,
          frame.dims.height,
        )
        patchCtx.putImageData(imageData, 0, 0)
        bufferCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top)
      }

      // Scale to output canvas
      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = width.value
      outputCanvas.height = height.value
      const outputCtx = outputCanvas.getContext('2d')
      if (outputCtx) {
        // Fill with black background
        outputCtx.fillStyle = '#000000'
        outputCtx.fillRect(0, 0, width.value, height.value)
        outputCtx.drawImage(bufferCanvas, 0, 0, width.value, height.value)
        gif.addFrame(outputCanvas, { delay: frame.delay || 100 })
      }

      // Reset buffer on loop back to start
      if (i === gifFrames.value.length - 1) {
        bufferCtx.clearRect(0, 0, originalWidth, originalHeight)
      }
    }

    gif.on('finished', (blob: Blob) => {
      const link = document.createElement('a')
      link.download = `${fileName.value}_processed.gif`
      link.href = URL.createObjectURL(blob)
      link.click()
    })

    gif.render()
  } else {
    // Generate static image
    if (!canvas.value) return
    const dataUrl = canvas.value.toDataURL(format.value, quality.value)
    const ext = format.value.split('/')[1]
    const link = document.createElement('a')
    link.download = `${fileName.value}_processed.${ext}`
    link.href = dataUrl
    link.click()
  }
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Throttle function (for rendering)
function throttle<T extends (...args: unknown[]) => void>(fn: T, delay: number) {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return (...args: Parameters<T>) => {
    const now = Date.now()
    const remaining = delay - (now - lastCall)

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = undefined
      }
      lastCall = now
      fn(...args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        timeoutId = undefined
        fn(...args)
      }, remaining)
    }
  }
}

// Debounce function (for size calculation)
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

const renderCanvas = throttle(() => {
  if (!canvas.value || !originalImage.value) return

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  canvas.value.width = width.value
  canvas.value.height = height.value

  // For animated GIFs, render first frame for size calculation
  // For static images, render normally
  if (isAnimatedGif.value && gifFrames.value.length > 0) {
    const firstFrame = gifFrames.value[0]
    if (firstFrame) {
      // Create buffer for first frame
      const bufferCanvas = document.createElement('canvas')
      bufferCanvas.width = firstFrame.dims.width
      bufferCanvas.height = firstFrame.dims.height
      const bufferCtx = bufferCanvas.getContext('2d')

      if (bufferCtx) {
        const imageData = new ImageData(
          new Uint8ClampedArray(firstFrame.patch),
          firstFrame.dims.width,
          firstFrame.dims.height,
        )
        bufferCtx.putImageData(imageData, 0, 0)
        ctx.drawImage(bufferCanvas, 0, 0, width.value, height.value)
      }
    }
  } else {
    // Regular static image rendering
    ctx.drawImage(originalImage.value, 0, 0, width.value, height.value)
  }

  updateSize()
}, 16) // ~60fps target

const updateSize = debounce(() => {
  if (!canvas.value) return
  // Export to data URL only for size estimation
  const dataUrl = canvas.value.toDataURL(format.value, quality.value)
  const head = `data:${format.value};base64,`
  outputSize.value = Math.round((dataUrl.length - head.length) * 0.75)
}, 500) // 500ms delay for expensive operation

// Watch for changes
watch([width, height, format, quality], () => {
  if (isAnimatedGif.value) {
    // Animation loop already reads width/height on each frame, just update size
    updateSize()
  } else {
    renderCanvas()
    updateSize()
  }
})

// Aspect ratio logic
const aspectRatio = ref(1)
watch(
  () => originalImage.value,
  (img) => {
    if (img) {
      aspectRatio.value = img.width / img.height
    }
  },
)

function onWidthChange() {
  if (keepAspectRatio.value) {
    height.value = Math.round(width.value / aspectRatio.value)
  }
}

function onHeightChange() {
  if (keepAspectRatio.value) {
    width.value = Math.round(height.value * aspectRatio.value)
  }
}
</script>

<template>
  <div class="paper-panel image-tool">
    <div class="tool-header">
      <div>
        <p class="eyebrow">UTILITIES // Wide-Putin Generator</p>
        <h1>宽体普京生成器</h1>
      </div>
      <div v-if="originalImage" class="status-badge">SYSTEM ACTIVE</div>
    </div>

    <div class="tool-layout">
      <!-- Controls Panel -->
      <aside class="controls-panel">
        <!-- Upload Section -->
        <div
          class="upload-zone"
          :class="{ dragging: isDragging, active: !!originalImage }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerUpload"
        >
          <input
            type="file"
            ref="fileInput"
            @change="handleFileUpload"
            accept="image/*"
            style="display: none"
          />
          <div class="upload-content">
            <span class="icon" v-if="!originalImage">⊕</span>
            <span class="text" v-if="!originalImage">DROP IMAGE HERE OR CLICK</span>

            <div v-else class="file-meta">
              <span class="filename">{{ fileName }}</span>
              <span class="filesize">{{ formatBytes(fileSize) }}</span>
              <button class="btn-text">REPLACE FILE</button>
            </div>
          </div>
          <div class="corner-decor top-left"></div>
          <div class="corner-decor bottom-right"></div>
        </div>

        <div v-if="originalImage" class="settings-group">
          <div class="group-header">DIMENSIONS</div>
          <div class="dimension-control">
            <div class="input-header">
              <label>WIDTH</label>
              <input
                type="number"
                v-model.number="width"
                @input="onWidthChange"
                class="ruin-input-mono small"
              />
            </div>
            <input
              type="range"
              :min="1"
              :max="originalImage.width * 2"
              v-model.number="width"
              @input="onWidthChange"
              class="ruin-range"
            />
          </div>

          <div class="dimension-control">
            <div class="input-header">
              <label>HEIGHT</label>
              <input
                type="number"
                v-model.number="height"
                @input="onHeightChange"
                class="ruin-input-mono small"
              />
            </div>
            <input
              type="range"
              :min="1"
              :max="originalImage.height * 2"
              v-model.number="height"
              @input="onHeightChange"
              class="ruin-range"
            />
          </div>

          <label class="checkbox-field">
            <input type="checkbox" v-model="keepAspectRatio" />
            <span class="checkmark"></span>
            <span class="label-text">LOCK ASPECT RATIO</span>
          </label>
        </div>

        <div v-if="originalImage" class="settings-group">
          <div class="group-header">OUTPUT FORMAT</div>
          <select v-model="format" class="ruin-select">
            <option v-for="fmt in formats" :key="fmt.value" :value="fmt.value">
              {{ fmt.label }}
            </option>
          </select>

          <div class="range-field" v-if="format !== 'image/png'">
            <div class="range-header">
              <label>QUALITY</label>
              <span class="value">{{ Math.round(quality * 100) }}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              v-model.number="quality"
              class="ruin-range"
            />
          </div>
        </div>

        <div v-if="originalImage" class="action-footer">
          <div class="output-stats">
            <span class="label">EST. SIZE</span>
            <span class="value" :class="outputSize < fileSize ? 'optimized' : 'warning'">
              {{ formatBytes(outputSize) }}
              <small>({{ Math.round((outputSize / fileSize) * 100) }}%)</small>
            </span>
          </div>
          <button class="btn primary full-width" @click="downloadImage">
            <span class="btn-content">INITIALIZE DOWNLOAD</span>
            <span class="btn-decor"></span>
          </button>
        </div>
      </aside>

      <!-- Preview Area -->
      <main class="preview-area">
        <div class="preview-frame">
          <div class="grid-bg"></div>
          <div class="preview-viewport" :class="{ empty: !originalImage }">
            <!-- Canvas preview for all image types (shows first frame for GIFs, updates with sliders) -->
            <canvas v-if="originalImage" ref="canvas" class="preview-canvas"></canvas>
            <!-- Empty state -->
            <div v-else class="empty-state">
              <span class="crosshair">✜</span>
              <span>NO SIGNAL</span>
            </div>
          </div>
          <!-- HUD Elements -->
          <div class="hud-corner top-left">VIEWPORT_01</div>
          <div class="hud-corner bottom-right" v-if="originalImage">
            {{ width }} × {{ height }} PX
          </div>
          <div class="hud-lines"></div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.image-tool {
  padding: 40px;
  /* max-width: 1400px; */
  /* Wider layout */
  /* margin: 0 auto; */
  min-height: 80vh;
  display: flex;
  flex-direction: column;
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 40px;
  border-bottom: 1px solid var(--ruins-border);
  padding-bottom: 20px;
}

.status-badge {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ruins-success);
  border: 1px solid var(--ruins-success);
  padding: 4px 8px;
  letter-spacing: 0.1em;
}

.tool-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 40px;
  flex: 1;
}

/* Controls Styles */
.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.upload-zone {
  border: 1px dashed var(--ruins-border);
  background: rgba(255, 255, 255, 0.01);
  padding: 32px 16px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-zone:hover,
.upload-zone.dragging {
  background: rgba(255, 255, 255, 0.03);
  border-color: var(--ruins-accent);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.upload-content .icon {
  font-size: 1.5rem;
  color: var(--ruins-muted);
}

.upload-content .text {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ruins-muted);
  letter-spacing: 0.1em;
}

.file-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filename {
  font-family: var(--font-mono);
  color: var(--ruins-text);
  font-weight: bold;
  word-break: break-all;
}

.filesize {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ruins-muted);
}

.btn-text {
  background: none;
  border: none;
  color: var(--ruins-accent);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  cursor: pointer;
  text-decoration: underline;
  margin-top: 4px;
}

.corner-decor {
  position: absolute;
  width: 8px;
  height: 8px;
  border: 1px solid var(--ruins-accent);
  transition: all 0.3s ease;
}

.top-left {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
}

.bottom-right {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
}

.upload-zone:hover .corner-decor {
  width: 12px;
  height: 12px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-header {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--ruins-muted);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 8px;
  border-left: 2px solid var(--ruins-accent);
  padding-left: 8px;
}

.dimension-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-header label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--ruins-muted);
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.input-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-field label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--ruins-muted);
}

.separator {
  padding-bottom: 8px;
  color: var(--ruins-muted);
}

.ruin-input-mono {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  font-family: var(--font-mono);
  font-size: 1.1rem;
  padding: 8px 0;
  border-radius: 0;
  transition: all 0.3s ease;
}

.ruin-input-mono.small {
  width: 80px;
  font-size: 0.9rem;
  padding: 4px 0;
  text-align: right;
}

.ruin-input-mono:focus {
  outline: none;
  border-bottom-color: var(--ruins-accent);
}

.ruin-select {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  font-family: var(--font-mono);
  padding: 10px;
  border-radius: 0;
  outline: none;
  cursor: pointer;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.checkbox-field input {
  display: none;
}

.checkmark {
  width: 16px;
  height: 16px;
  border: 1px solid var(--ruins-border);
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-field input:checked + .checkmark {
  background: var(--ruins-accent);
  border-color: var(--ruins-accent);
}

.label-text {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ruins-muted);
}

.range-field {
  margin-top: 8px;
}

.range-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ruins-muted);
}

.ruin-range {
  width: 100%;
  height: 4px;
  background: var(--ruins-border);
  appearance: none;
  outline: none;
  border-radius: 2px;
}

.ruin-range::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--ruins-accent);
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid var(--ruins-bg);
  box-shadow: 0 0 0 1px var(--ruins-accent);
}

.action-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-top: 1px solid var(--ruins-border);
  padding-top: 20px;
}

.output-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-mono);
}

.output-stats .label {
  font-size: 0.8rem;
  color: var(--ruins-muted);
}

.output-stats .value {
  font-weight: bold;
}

.output-stats .optimized {
  color: var(--ruins-success);
}

.output-stats .warning {
  color: var(--ruins-warning);
}

.full-width {
  width: 100%;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.btn-decor {
  position: absolute;
  top: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: linear-gradient(45deg, transparent 50%, rgba(255, 255, 255, 0.2) 50%);
}

/* Preview Area */
.preview-area {
  background: #1a1a1a;
  position: relative;
  border: 1px solid var(--ruins-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.grid-bg {
  position: absolute;
  inset: 0;
  /* Checkerboard pattern */
  background-image: conic-gradient(
    #262626 90deg,
    #1f1f1f 90deg 180deg,
    #262626 180deg 270deg,
    #1f1f1f 270deg
  );
  background-size: 20px 20px;
  opacity: 0.5;
  pointer-events: none;
}

.preview-frame {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  overflow: auto;
}

.preview-viewport {
  max-width: 100%;
  max-height: 100%;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 10;
  border: 1px solid transparent;
  transition: border-color 0.3s ease;
}

.preview-viewport.empty {
  width: 100%;
  height: 100%;
  box-shadow: none;
  border: none;
}

.preview-canvas {
  display: block;
  max-width: 100%;
  max-height: 70vh;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--ruins-border);
  font-family: var(--font-mono);
  gap: 16px;
  letter-spacing: 0.2em;
}

.crosshair {
  font-size: 3rem;
  font-weight: 100;
}

.hud-corner {
  position: absolute;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--ruins-border);
  padding: 8px;
  pointer-events: none;
}

.top-left {
  top: 0;
  left: 0;
}

.bottom-right {
  bottom: 0;
  right: 0;
}

.hud-lines {
  position: absolute;
  inset: 20px;
  border: 1px solid var(--ruins-border);
  pointer-events: none;
  opacity: 0.3;
}

.hud-lines::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -10px;
  right: -10px;
  height: 1px;
  background: var(--ruins-border);
}

.hud-lines::after {
  content: '';
  position: absolute;
  left: 50%;
  top: -10px;
  bottom: -10px;
  width: 1px;
  background: var(--ruins-border);
}

/* Response Layout */
@media (max-width: 1024px) {
  .tool-layout {
    grid-template-columns: 280px 1fr;
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .tool-layout {
    display: flex;
    flex-direction: column;
  }

  .controls-panel {
    order: 2;
  }

  .preview-area {
    order: 1;
    min-height: 300px;
  }

  .image-tool {
    padding: 20px;
    height: auto;
  }
}
</style>
