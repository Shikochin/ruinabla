declare module 'gif.js' {
  interface GIFOptions {
    workers?: number
    quality?: number
    width?: number
    height?: number
    workerScript?: string
    background?: string
    transparent?: string | null
  }

  interface FrameOptions {
    delay?: number
    copy?: boolean
    dispose?: number
  }

  class GIF {
    constructor(options?: GIFOptions)
    addFrame(
      canvas: HTMLCanvasElement | CanvasRenderingContext2D | ImageData,
      options?: FrameOptions,
    ): void
    render(): void
    abort(): void
    on(event: 'finished', callback: (blob: Blob) => void): void
    on(event: 'progress', callback: (progress: number) => void): void
    on(event: 'start' | 'abort', callback: () => void): void
  }

  export = GIF
}
