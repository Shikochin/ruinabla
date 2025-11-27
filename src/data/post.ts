import type { Component } from 'vue'

export interface PostFrontMatter {
  id: number
  title: string
  date: string
  tags: string[]
  categories?: string[]
  summary?: string
  readingMinutes: number
}

export interface PostEntry extends PostFrontMatter {
  slug: string // Slug is now generated from filename, not frontmatter
  component: Component
  summary: string
  category: string
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

    // summary/readMinutes 统一直接取前端 frontmatter 字段
    const summary = mod.metadata.summary || ''
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
      summary,
      readingMinutes,
      category,
    }
  })

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const PostEntries = loadPostEntries()

export function getEntryBySlug(slug: string) {
  return PostEntries.find((entry) => entry.slug === slug)
}
