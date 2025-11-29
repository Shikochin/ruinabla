import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const POSTS_DIR = path.join(import.meta.dirname, '../src/posts')
const PUBLIC_DIR = path.join(import.meta.dirname, '../public')
const SITE_URL = 'https://shikoch.in' // Replace with actual site URL if different
const SITE_TITLE = 'Rui∇abla'
const SITE_DESCRIPTION = 'Records of Light and Dust. A personal blog by Shikochin.'

function getFilesRecursively(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath))
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      results.push(filePath)
    }
  })
  return results
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
    }
  })
}

function main() {
  const files = getFilesRecursively(POSTS_DIR)
  const posts = []

  for (const filePath of files) {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(fileContent)

    if (data.draft) continue

    // Calculate slug from relative path
    // e.g. src/posts/2023/my-post.md -> 2023/my-post
    const relativePath = path.relative(POSTS_DIR, filePath)
    const slug = relativePath.replace(/\.mdx?$/, '')

    posts.push({
      title: data.title,
      description: data.summary || '',
      date: new Date(data.date),
      link: `${SITE_URL}/posts/${slug}`,
      guid: `${SITE_URL}/posts/${slug}`,
    })
  }

  // Sort by date desc
  posts.sort((a, b) => b.date - a.date)

  const itemsXml = posts
    .map(
      (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${post.link}</link>
      <guid>${post.guid}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${post.date.toUTCString()}</pubDate>
    </item>
  `,
    )
    .join('')

  const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, 'rss.xml'), rssXml)
  console.log(`[✓] RSS feed generated at public/rss.xml with ${posts.length} posts.`)
}

main()
