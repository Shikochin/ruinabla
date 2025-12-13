import { Context } from 'hono'
import { generateId } from '../utils/crypto'
import { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  RUINABLA_DB: D1Database
}

// Extend Context to include user info
export interface AuthContext extends Context {
  get user(): { id: string; email: string; role: string } | null
  set user(value: { id: string; email: string; role: string } | null)
}

// Middleware to check authentication
export async function requireAuth(c: Context<{ Bindings: Bindings }>, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const sessionId = authHeader.substring(7)

  // Verify session
  const session = await c.env.RUINABLA_DB.prepare(
    'SELECT s.*, u.id, u.email, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > unixepoch()',
  )
    .bind(sessionId)
    .first()

  if (!session) {
    return c.json({ error: 'Invalid or expired session' }, 401)
  }

  // Attach user to context
  c.set('user', {
    id: session.id as string,
    email: session.email as string,
    role: session.role as string,
  })

  await next()
}

// Middleware to check role
export function requireRole(...roles: string[]) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as { id: string; email: string; role: string } | null

    if (!user || !roles.includes(user.role)) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    await next()
  }
}

// Create session
export async function createSession(
  db: D1Database,
  userId: string,
  durationDays: number = 14,
): Promise<string> {
  const sessionId = generateId(32)
  const expiresAt = Math.floor(Date.now() / 1000) + durationDays * 24 * 60 * 60

  await db
    .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, userId, expiresAt)
    .run()

  return sessionId
}

// Invalidate session
export async function invalidateSession(db: D1Database, sessionId: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
}

// Clean up expired sessions
export async function cleanupExpiredSessions(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE expires_at <= unixepoch()').run()
}
