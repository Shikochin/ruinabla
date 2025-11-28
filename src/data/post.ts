import type { Component } from 'vue'
import { Temporal } from '@js-temporal/polyfill'

export interface PostFrontMatter {
  id: number
  title: string
  date: string
  tags: string[]
  categories?: string[]
  readingMinutes: number
  summary?: string
}

export interface PostEntry extends PostFrontMatter {
  slug: string // Slug is now generated from filename, not frontmatter
  component: Component
  category: string
  summary?: string
}

type MdxModule = {
  default: Component
  metadata: PostFrontMatter
}

const mdxModules = import.meta.glob('@/posts/**/*.{mdx,md}', {
  eager: true,
}) as Record<string, MdxModule>

function loadPostEntries(): PostEntry[] {
  const entries = Object.entries(mdxModules).map(([path, mod], _) => {
    if (!mod?.metadata || !mod.default) {
      throw new Error(`File ${path} missing metadata or default export`)
    }

    const summary = mod.metadata.summary || ''
    // summary/readMinutes takes from markdown frontmatter
    const readingMinutes =
      typeof mod.metadata.readingMinutes === 'number' ? mod.metadata.readingMinutes : 1

    const tags = Array.isArray(mod.metadata.tags) ? mod.metadata.tags : []
    const categories = Array.isArray(mod.metadata.categories) ? mod.metadata.categories : []
    const category = categories.length > 0 ? categories[0] : tags.length > 0 ? tags[0] : ''
    const fileName = path.split('/').pop() || ''
    const slug = fileName.replace(/\.(mdx|md)$/, '')

    return {
      ...mod.metadata,
      slug,
      tags,
      categories,
      component: mod.default,
      readingMinutes,
      category,
      summary,
    }
  })

  return entries.sort((a, b) =>
    Temporal.PlainDate.compare(Temporal.PlainDate.from(b.date), Temporal.PlainDate.from(a.date)),
  ) as unknown as PostEntry[]
}

export const PostEntries = loadPostEntries()

export function getEntryBySlug(slug: string) {
  return PostEntries.find((entry) => entry.slug === slug)
}
