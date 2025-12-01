import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import mdx from '@mdx-js/rollup'
import rehypeShiki from '@shikijs/rehype'
import { transformerTwoslash } from '@shikijs/twoslash'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeFancybox from './src/rehypeFancybox'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    mdx({
      jsxImportSource: 'vue',
      providerImportSource: '@mdx-js/vue',
      // @ts-expect-error no practical issues
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'metadata' }]],
      extensions: ['.mdx', '.md'],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'prepend',
            content: {
              type: 'text',
              value: '#',
            },
            properties: {
              class: 'anchor-link',
              ariaHidden: true,
              tabIndex: -1,
            },
          },
        ],
        [
          rehypeShiki,
          {
            theme: 'gruvbox-dark-hard',
            transformers: [transformerTwoslash({})],
          },
        ],
        rehypeFancybox,
      ],
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
