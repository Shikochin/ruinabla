import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypePrism from 'rehype-prism-plus'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeFancybox from '@/rehypeFancybox'

export async function renderMarkdown(markdown: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
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
    })
    .use(rehypePrism, {
      ignoreMissing: true,
      showLineNumbers: true,
    })
    .use(rehypeFancybox)
    .use(rehypeStringify, { allowDangerousHtml: true })

  const result = await processor.process(markdown)
  return String(result)
}
