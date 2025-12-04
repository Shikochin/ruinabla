import { Hono } from 'hono'
import type { D1Database, R2Bucket } from '@cloudflare/workers-types'

type Bindings = {
  RUINABLA_DB: D1Database
  RUINABLA_BUCKET: R2Bucket
}

const posts = new Hono<{ Bindings: Bindings }>()

// GET /api/posts - List all posts
posts.get('/', async (c) => {
  const { results } = await c.env.RUINABLA_DB.prepare(
    'SELECT * FROM posts ORDER BY date DESC',
  ).all()

  const posts = results.map((post) => ({
    ...post,
    tags: post.tags ? JSON.parse(post.tags as string) : [],
    pinned: Boolean(post.pinned),
    hide: Boolean(post.hide),
  }))

  return c.json(posts)
})

// POST /api/posts - Create or update a post
posts.post('/', async (c) => {
  const body = await c.req.json()
  const {
    slug,
    title,
    date,
    tags,
    category,
    summary,
    readingMinutes,
    pinned,
    hide,
    license,
    content,
  } = body

  if (!slug || !title || !date) {
    return c.text('Missing required fields', 400)
  }

  // TODO: Add authentication check here

  try {
    // 1. Save to D1
    await c.env.RUINABLA_DB.prepare(
      `INSERT INTO posts (slug, title, date, tags, category, summary, readingMinutes, pinned, hide, license)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
       title=excluded.title, date=excluded.date, tags=excluded.tags, category=excluded.category,
       summary=excluded.summary, readingMinutes=excluded.readingMinutes, pinned=excluded.pinned,
       hide=excluded.hide, license=excluded.license, updated_at=unixepoch()`,
    )
      .bind(
        slug,
        title,
        date,
        JSON.stringify(tags || []),
        category,
        summary,
        readingMinutes,
        pinned ? 1 : 0,
        hide ? 1 : 0,
        license,
      )
      .run()

    // 2. Save content to R2
    if (content) {
      await c.env.RUINABLA_BUCKET.put(`posts/${slug}.md`, content)
    }

    return c.json({ success: true, slug })
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500)
  }
})

// GET /api/posts/:slug - Get a single post
posts.get('/:slug', async (c) => {
  const slug = decodeURIComponent(c.req.param('slug')).trim()

  // 1. Get metadata from D1
  const post = await c.env.RUINABLA_DB.prepare('SELECT * FROM posts WHERE slug = ?')
    .bind(slug)
    .first()

  if (!post) {
    return c.text('Post not found', 404)
  }

  // 2. Get content from R2
  const object = await c.env.RUINABLA_BUCKET.get(`posts/${slug}.md`)
  let content = ''

  if (object) {
    content = await object.text()
  }

  const result = {
    ...post,
    tags: post.tags ? JSON.parse(post.tags as string) : [],
    pinned: Boolean(post.pinned),
    hide: Boolean(post.hide),
    content,
  }

  return c.json(result)
})

// DELETE /api/posts/:slug - Delete a post
posts.delete('/:slug', async (c) => {
  const slug = decodeURIComponent(c.req.param('slug')).trim()

  // TODO: Add authentication check here

  try {
    await c.env.RUINABLA_DB.prepare('DELETE FROM posts WHERE slug = ?').bind(slug).run()
    await c.env.RUINABLA_BUCKET.delete(`posts/${slug}.md`)

    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500)
  }
})

export default posts
