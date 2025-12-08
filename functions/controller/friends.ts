// controller/friends.ts
import { Hono } from 'hono'
import { D1Database } from '@cloudflare/workers-types'
import { requireAuth } from '../middleware/auth'
import { generateId } from '../utils/crypto'

type Bindings = {
  RUINABLA_DB: D1Database
}

const friends = new Hono<{ Bindings: Bindings }>()

friends.get('/', async (c) => {
  try {
    const { results } = await c.env.RUINABLA_DB.prepare(
      'SELECT * FROM friend_links ORDER BY sort_order DESC, created_at DESC',
    ).all()
    return c.json(results)
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Failed to fetch signal' }, 500)
  }
})

friends.post('/', requireAuth, async (c) => {
  const user = c.get('user')
  if (user.role !== 'admin') return c.json({ error: 'Unauthorized' }, 403)

  const { name, url, avatar, desc } = await c.req.json()
  const id = generateId(16)

  await c.env.RUINABLA_DB.prepare(
    'INSERT INTO friend_links (id, name, url, avatar, desc) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(id, name, url, avatar, desc)
    .run()

  return c.json({ success: true, id })
})

friends.put('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  if (user.role !== 'admin') return c.json({ error: 'Unauthorized' }, 403)

  const id = c.req.param('id')
  const { name, url, avatar, desc } = await c.req.json()

  await c.env.RUINABLA_DB.prepare(
    'UPDATE friend_links SET name = ?, url = ?, avatar = ?, desc = ? WHERE id = ?',
  )
    .bind(name, url, avatar, desc, id)
    .run()

  return c.json({ success: true })
})

friends.delete('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  if (user.role !== 'admin') return c.json({ error: 'Unauthorized' }, 403)

  const id = c.req.param('id')
  await c.env.RUINABLA_DB.prepare('DELETE FROM friend_links WHERE id = ?').bind(id).run()

  return c.json({ success: true })
})

export default friends
