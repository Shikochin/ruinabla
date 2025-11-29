// rehype-fancy-img.ts

// Import necessary types
import { visit } from 'unist-util-visit'
import { h } from 'hastscript'
import type { Root, Element, ElementContent } from 'hast'

export default function rehypeFancyImg() {
  return (tree: Root): void => {
    // @ts-expect-error no pratical problems
    visit<Root, 'element'>(
      tree,
      'element',
      (node: Element, index: number | null, parent: Element | Root | null): void => {
        if (node.tagName === 'img') {
          const imgNode = node
          const src = imgNode.properties?.src as string | undefined
          const alt = (imgNode.properties?.alt as string) || ''

          if (!src) return

          // Key fix: Use data-src for the image URL instead of href
          // Set href to a safe value to prevent page navigation
          const aNode: Element = h(
            'a',
            {
              // Use javascript:void(0); to prevent page jumps
              href: 'javascript:void(0);',
              'data-fancybox': 'markdown-gallery',
              'data-src': src, // Fancybox uses data-src to load the actual image
              'data-caption': alt,
            },
            [imgNode as ElementContent],
          )

          if (parent && index !== null && Array.isArray(parent.children)) {
            parent.children[index] = aNode
          }
        }
      },
    )
  }
}
