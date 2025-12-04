import { Hono } from 'hono'
import { hashPassword, verifyPassword, generateId } from '../utils/crypto'
import { requireAuth, createSession, invalidateSession } from '../middleware/auth'
import { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  RUINABLA_DB: D1Database
}

const auth = new Hono<{ Bindings: Bindings }>()

// Register new user
auth.post('/register', async (c) => {
  const { email, password } = await c.req.json()

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return c.json({ error: 'Invalid email format' }, 400)
  }

  // Validate password strength (minimum 8 characters)
  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400)
  }

  // Check if user already exists
  const existingUser = await c.env.RUINABLA_DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(email)
    .first()

  if (existingUser) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  try {
    const userId = generateId(16)
    const passwordHash = await hashPassword(password)

    await c.env.RUINABLA_DB.prepare(
      'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
    )
      .bind(userId, email, passwordHash, 'user')
      .run()

    // Create session
    const sessionId = await createSession(c.env.RUINABLA_DB, userId)

    return c.json({
      success: true,
      sessionId,
      user: {
        id: userId,
        email,
        role: 'user',
      },
    })
  } catch (e) {
    console.error('Registration error:', e)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// Login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  const user = await c.env.RUINABLA_DB.prepare(
    'SELECT id, email, password_hash, role FROM users WHERE email = ?',
  )
    .bind(email)
    .first()

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const isValid = await verifyPassword(password, user.password_hash as string)

  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Password-based login ALWAYS requires 2FA
  // User can choose TOTP or Passkey for the second factor
  return c.json({
    requires2FA: true,
    userId: user.id,
    email: user.email,
  })
})

// Verify TOTP and complete login
auth.post('/verify-totp', async (c) => {
  const { userId, totpCode } = await c.req.json()

  if (!userId || !totpCode) {
    return c.json({ error: 'User ID and TOTP code are required' }, 400)
  }

  // Get TOTP secret
  const totpRecord = await c.env.RUINABLA_DB.prepare(
    'SELECT secret, backup_codes FROM totp_secrets WHERE user_id = ? AND enabled = 1',
  )
    .bind(userId)
    .first()

  if (!totpRecord) {
    return c.json({ error: 'TOTP not enabled for this user' }, 400)
  }

  const { verifyTOTP } = await import('../utils/crypto')
  const isValid = await verifyTOTP(totpRecord.secret as string, totpCode)

  if (!isValid) {
    // Check backup codes
    const backupCodes = totpRecord.backup_codes ? JSON.parse(totpRecord.backup_codes as string) : []
    const backupCodeIndex = backupCodes.indexOf(totpCode.toUpperCase())

    if (backupCodeIndex === -1) {
      return c.json({ error: 'Invalid TOTP code' }, 401)
    }

    // Remove used backup code
    backupCodes.splice(backupCodeIndex, 1)
    await c.env.RUINABLA_DB.prepare('UPDATE totp_secrets SET backup_codes = ? WHERE user_id = ?')
      .bind(JSON.stringify(backupCodes), userId)
      .run()
  }

  // Get user info
  const user = await c.env.RUINABLA_DB.prepare('SELECT id, email, role FROM users WHERE id = ?')
    .bind(userId)
    .first()

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  // Create session
  const sessionId = await createSession(c.env.RUINABLA_DB, userId)

  return c.json({
    success: true,
    sessionId,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  })
})

// Logout
auth.post('/logout', requireAuth, async (c) => {
  const authHeader = c.req.header('Authorization')
  const sessionId = authHeader!.substring(7)

  await invalidateSession(c.env.RUINABLA_DB, sessionId)

  return c.json({ success: true })
})

// Get current user
auth.get('/me', requireAuth, async (c) => {
  const user = c.get('user')
  return c.json({ user })
})

export default auth
