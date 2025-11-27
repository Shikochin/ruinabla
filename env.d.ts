/// <reference types="vite/client" />

declare module '*.mdx' {
  import type { Component } from 'vue'
  const Component: Component
  export const metadata: import('./src/data/post').PostFrontMatter
  export default Component
}

declare module '*.md' {
  import type { Component } from 'vue'
  const Component: Component
  export const metadata: import('./src/data/post').PostFrontMatter
  export default Component
}
