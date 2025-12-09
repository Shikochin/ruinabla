import type { D1Database, EventContext } from '@cloudflare/workers-types'

interface Env {
  RUINABLA_DB: D1Database
}

interface PostRow {
  slug: string
  title: string
  date: string
  summary: string | null
}

export const onRequest = async (context: EventContext<Env, string, unknown>) => {
  try {
    const { results } = await context.env.RUINABLA_DB.prepare(
      'SELECT slug, title, date, summary FROM posts WHERE hide = 0 ORDER BY date DESC',
    ).all<PostRow>()

    const siteUrl = 'https://shikoch.in'

    const items = results
      .map((post) => {
        const pubDate = new Date(post.date).toUTCString()
        return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/posts/${post.slug}</link>
      <guid>${siteUrl}/posts/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.summary || ''}]]></description>
    </item>`
      })
      .join('')

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Rui∇abla</title>
    <link>${siteUrl}</link>
    <description>Records of Light and Dust. A personal blog by Shikochin.</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('RSS Generation Failed:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}
