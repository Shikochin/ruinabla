import { Hono } from 'hono'
import type { D1Database, R2Bucket } from '@cloudflare/workers-types'
import { requireAuth, requireRole } from '../middleware/auth'
import { calculateReadingTime } from '../utils/readingTime'

import { OpenAI } from 'openai'

type Bindings = {
  RUINABLA_DB: D1Database
  RUINABLA_BUCKET: R2Bucket
  OPENAI_API_KEY: string
  OPENAI_API_BASE: string
}

const posts = new Hono<{ Bindings: Bindings }>()

const generateFilename = (extension: string) => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`
}

// Upload image for markdown content
posts.post('/upload', requireAuth, requireRole('admin'), async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file uploaded' }, 400)
    }

    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'File must be an image' }, 400)
    }

    const extension = file.name.split('.').pop() || 'png'
    const filename = `images/${generateFilename(extension)}`

    // 上传到 R2
    await c.env.RUINABLA_BUCKET.put(filename, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    })

    const publicUrl = `https://assets.shikoch.in/${filename}`

    return c.json({
      success: true,
      url: publicUrl,
    })
  } catch (e) {
    console.error('Upload error:', e)
    return c.json({ error: 'Image upload failed' }, 500)
  }
})

// GET /api/posts - List all posts
posts.get('/', async (c) => {
  const { results } = await c.env.RUINABLA_DB.prepare(
    'SELECT * FROM posts ORDER BY date DESC',
  ).all()

  // Calculate reading time for each post from R2 content
  // Use stored readingMinutes and summary directly
  const processedResults = results.map((post) => ({
    ...post,
    tags: post.tags ? JSON.parse(post.tags as string) : [],
    pinned: Boolean(post.pinned),
    hide: Boolean(post.hide),
  }))

  return c.json(processedResults)
})

// POST /api/posts - Create or update a post (requires admin)
posts.post('/', requireAuth, requireRole('admin'), async (c) => {
  const body = await c.req.json()
  const {
    slug,
    title,
    date,
    tags,
    category,
    summary: providedSummary,
    readingMinutes: providedReadingMinutes,
    pinned,
    hide,
    license,
    content,
  } = body

  if (!slug || !title || !date) {
    return c.text('Missing required fields', 400)
  }

  // Calculate reading minutes and generate summary if content is updated
  let readingMinutes = providedReadingMinutes
  let summary = providedSummary

  if (content) {
    readingMinutes = calculateReadingTime(content)

    // Generate AI summary asynchronously if not provided
    if (content && !providedSummary) {
      if (!summary) {
        summary = content.slice(0, 150) + '...'
      }

      const apiKey = c.env.OPENAI_API_KEY
      const baseURL = c.env.OPENAI_API_BASE || 'https://api.openai.com/v1'

      if (apiKey) {
        c.executionCtx.waitUntil(
          (async () => {
            try {
              const openai = new OpenAI({
                apiKey,
                baseURL,
              })

              const completion = await openai.chat.completions.create({
                model: 'gemini-2.5-pro',
                messages: [
                  {
                    role: 'system',
                    content:
                      '请为以下文章写一个简短的摘要，直接输出摘要，不要给我选择（不超过100字，使用文章的语言）：',
                  },
                  {
                    role: 'user',
                    content: content.slice(0, 4000), // Limit context
                  },
                ],
              })

              if (completion.choices && completion.choices[0]?.message?.content) {
                const aiSummary = completion.choices[0].message.content.trim()

                // Define the update query separately to avoid syntax issues in interpolation
                await c.env.RUINABLA_DB.prepare('UPDATE posts SET summary = ? WHERE slug = ?')
                  .bind(aiSummary, slug)
                  .run()
              }
            } catch (e) {
              console.error('Async AI Summary Generation Failed:', e)
            }
          })(),
        )
      }
    }
  }

  try {
    // 1. Save to D1
    await c.env.RUINABLA_DB.prepare(
      `INSERT INTO posts (slug, title, date, tags, category, summary, readingMinutes, pinned, hide, license)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
       title=excluded.title, date=excluded.date, tags=excluded.tags, category=excluded.category,
       readingMinutes=excluded.readingMinutes, pinned=excluded.pinned,
       hide=excluded.hide, license=excluded.license, updated_at=unixepoch()
       ${providedSummary ? ', summary=excluded.summary' : ''}`,
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

  // 3. Calculate reading time dynamically
  const readingMinutes = calculateReadingTime(content)

  const result = {
    ...post,
    tags: post.tags ? JSON.parse(post.tags as string) : [],
    pinned: Boolean(post.pinned),
    hide: Boolean(post.hide),
    content,
    readingMinutes,
  }

  return c.json(result)
})

// DELETE /api/posts/:slug - Delete a post
posts.delete('/:slug', requireAuth, requireRole('admin'), async (c) => {
  const slug = decodeURIComponent(c.req.param('slug')).trim()

  try {
    await c.env.RUINABLA_DB.prepare('DELETE FROM posts WHERE slug = ?').bind(slug).run()
    await c.env.RUINABLA_BUCKET.delete(`posts/${slug}.md`)

    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500)
  }
})

export default posts
