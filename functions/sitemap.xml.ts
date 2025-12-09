import type { D1Database, EventContext } from '@cloudflare/workers-types'

interface Env {
  RUINABLA_DB: D1Database
}

interface PostRow {
  slug: string
  date: string
}

export const onRequest = async (context: EventContext<Env, string, unknown>) => {
  const { results } = await context.env.RUINABLA_DB.prepare(
    'SELECT slug, date FROM posts WHERE hide = 0',
  ).all<PostRow>()

  const siteUrl = 'https://shikoch.in'
  const today = new Date().toISOString().split('T')[0]

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/chronicle', priority: '0.8', changefreq: 'weekly' },
    { url: '/lighthouse', priority: '0.8', changefreq: 'weekly' },
  ]

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

  // Static Pages
  staticPages.forEach((page) => {
    sitemap += `
  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  })

  // Dynamic Posts
  results.forEach((post) => {
    // Assuming post.date is YYYY-MM-DD or comparable
    const date = post.date ? new Date(post.date).toISOString().split('T')[0] : today
    sitemap += `
  <url>
    <loc>${siteUrl}/posts/${post.slug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
  })

  sitemap += `
</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
