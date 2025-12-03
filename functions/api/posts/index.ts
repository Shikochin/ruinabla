export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { RUINABLA_DB } = context.env
  const { results } = await RUINABLA_DB.prepare('SELECT * FROM posts ORDER BY date DESC').all()

  // Parse JSON tags
  const posts = results.map((post) => ({
    ...post,
    tags: post.tags ? JSON.parse(post.tags as string) : [],
    pinned: Boolean(post.pinned),
    hide: Boolean(post.hide),
  }))

  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { RUINABLA_DB, RUINABLA_BUCKET } = context.env
  const body = await context.request.json()

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
    return new Response('Missing required fields', { status: 400 })
  }

  // TODO: Add authentication check here

  try {
    // 1. Save to D1
    await RUINABLA_DB.prepare(
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
      await RUINABLA_BUCKET.put(`posts/${slug}.md`, content)
    }

    return new Response(JSON.stringify({ success: true, slug }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
