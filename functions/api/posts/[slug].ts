export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { RUINABLA_DB, RUINABLA_BUCKET } = context.env
  const slug = (context.params.slug as string).trim()

  // 1. Get metadata from D1
  const post = await RUINABLA_DB.prepare('SELECT * FROM posts WHERE slug = ?').bind(slug).first()

  if (!post) {
    return new Response('Post not found', { status: 404 })
  }

  // 2. Get content from R2
  const object = await RUINABLA_BUCKET.get(`posts/${slug}.md`)
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

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { RUINABLA_DB, RUINABLA_BUCKET } = context.env
  const slug = (context.params.slug as string).trim()

  // TODO: Add authentication check here

  try {
    await RUINABLA_DB.prepare('DELETE FROM posts WHERE slug = ?').bind(slug).run()
    await RUINABLA_BUCKET.delete(`posts/${slug}.md`)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
