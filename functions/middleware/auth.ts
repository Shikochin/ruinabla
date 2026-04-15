import { Context } from 'hono'
import { generateId } from '../utils/crypto'
import { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  RUINABLA_DB: D1Database
}

export type AuthenticatedUser = {
  id: string
  email: string
  role: string
}

export type AuthenticatedSession = {
  id: string
  userId: string
  expiresAt: number
  reauthenticatedAt: number | null
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthenticatedUser
    session: AuthenticatedSession
  }
}

// Extend Context to include user info
export interface AuthContext extends Context {
  get user(): AuthenticatedUser | null
  set user(value: AuthenticatedUser | null)
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
    `SELECT
        s.id AS session_id,
        s.user_id AS session_user_id,
        s.expires_at,
        s.reauthenticated_at,
        u.id AS user_id,
        u.email,
        u.role
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > unixepoch()`,
  )
    .bind(sessionId)
    .first()

  if (!session) {
    return c.json({ error: 'Invalid or expired session' }, 401)
  }

  // Attach user to context
  c.set('user', {
    id: session.user_id as string,
    email: session.email as string,
    role: session.role as string,
  })
  c.set('session', {
    id: session.session_id as string,
    userId: session.session_user_id as string,
    expiresAt: Number(session.expires_at),
    reauthenticatedAt:
      typeof session.reauthenticated_at === 'number'
        ? session.reauthenticated_at
        : session.reauthenticated_at === null
          ? null
          : Number(session.reauthenticated_at),
  })

  await next()
}

export function getAuthenticatedUser(c: Context): AuthenticatedUser {
  return c.get('user') as AuthenticatedUser
}

export function getAuthenticatedSession(c: Context): AuthenticatedSession {
  return c.get('session') as AuthenticatedSession
}

// Middleware to check role
export function requireRole(...roles: string[]) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as AuthenticatedUser | null

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
    .prepare(
      'INSERT INTO sessions (id, user_id, expires_at, reauthenticated_at) VALUES (?, ?, ?, ?)',
    )
    .bind(sessionId, userId, expiresAt, null)
    .run()

  return sessionId
}

// Invalidate session
export async function invalidateSession(db: D1Database, sessionId: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
}

export async function markSessionReauthenticated(
  db: D1Database,
  sessionId: string,
  reauthenticatedAt: number = Math.floor(Date.now() / 1000),
): Promise<void> {
  await db
    .prepare('UPDATE sessions SET reauthenticated_at = ? WHERE id = ?')
    .bind(reauthenticatedAt, sessionId)
    .run()
}

// Clean up expired sessions
export async function cleanupExpiredSessions(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE expires_at <= unixepoch()').run()
}
