import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { glob } from 'glob'

const API_URL = 'https://shikoch.in/api/posts' // Change if needed

async function migrate() {
  const files = await glob('src/posts/**/*.{md,mdx}')

  console.log(`Found ${files.length} files to migrate.`)

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const { data, content: body } = matter(content)

    // Derive slug from filename if not in frontmatter
    const filename = path.basename(file, path.extname(file))
    const slug = filename // Simple slug generation

    const payload = {
      slug,
      title: data.title || slug,
      date: data.date
        ? new Date(data.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      tags: data.tags || [],
      category: data.categories?.[0] || data.category || '',
      summary: data.summary || '',
      readingMinutes: data.readingMinutes || 1,
      pinned: data.pinned || false,
      hide: data.hide || false,
      license: data.license || 'CC BY-SA 4.0',
      content: body,
    }

    try {
      console.log(`Migrating ${slug}...`)
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error(`Failed to migrate ${slug}: ${err}`)
      } else {
        console.log(`Success: ${slug}`)
      }
    } catch (e) {
      console.error(`Error migrating ${slug}:`, e)
    }
  }
}

migrate()
