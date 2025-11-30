import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const POSTS_DIR = path.join(import.meta.dirname, '../src/posts')
const PUBLIC_DIR = path.join(import.meta.dirname, '../public')
const SITE_URL = 'https://shikoch.in'

// Static routes
const STATIC_ROUTES = ['/', '/chronicle', '/lighthouse', '/about', '/experiment']

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

function main() {
  const files = getFilesRecursively(POSTS_DIR)
  const urls = []

  // Add static routes
  for (const route of STATIC_ROUTES) {
    urls.push({
      loc: `${SITE_URL}${route}`,
      lastmod: new Date().toISOString().split('T')[0], // Use current date for static pages
      changefreq: 'weekly',
      priority: route === '/' ? 1.0 : 0.8,
    })
  }

  // Add blog posts
  for (const filePath of files) {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(fileContent)

    if (data.draft || data.hide) continue

    // Calculate slug from relative path
    // Same logic as in gen-rss.js and post.ts
    const relativePath = path.relative(POSTS_DIR, filePath)

    // Handle the specific slug logic from post.ts:
    // /src/posts/zephyrus/zephyrus.mdx -> zephyrus/zephyrus (if we just used relative path)
    // But wait, post.ts has specific logic:
    // const match = path.match(/\/posts\/(.+)\.(mdx|md)$/)
    // const slug = match ? match[1] : ...
    // Actually, let's look at how gen-rss.js does it:
    // const relativePath = path.relative(POSTS_DIR, filePath)
    // const slug = relativePath.replace(/\.mdx?$/, '')
    // This seems to be what is used for links. Let's verify if this matches the router.
    // Router: /posts/:slug(.*)
    // So if the file is src/posts/2023/hello.md, relative is 2023/hello.md, slug is 2023/hello.
    // URL is /posts/2023/hello. This matches.

    // However, there is a special case in post.ts:
    // const slug = match ? match[1] : path.split('/').pop()?.replace(...)
    // Wait, post.ts logic is:
    // const match = path.match(/\/posts\/(.+)\.(mdx|md)$/)
    // This regex matches everything after /posts/ until extension.
    // So src/posts/a/b.md -> match[1] = a/b.
    // So gen-rss.js logic is correct and consistent.

    const slug = relativePath.replace(/\.mdx?$/, '')

    urls.push({
      loc: `${SITE_URL}/posts/${slug}`,
      lastmod: data.date
        ? new Date(data.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.6,
    })
  }

  const urlsetXml = urls
    .map(
      (url) => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
    )
    .join('')

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsetXml}
</urlset>`

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml)
  console.log(`[✓] Sitemap generated at public/sitemap.xml with ${urls.length} URLs.`)
}

main()
