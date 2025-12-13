import { Hono } from 'hono'
import { hashPassword, verifyPassword, generateId } from '../utils/crypto'
import { requireAuth, createSession, invalidateSession } from '../middleware/auth'
import { D1Database } from '@cloudflare/workers-types'
import { createResendClient, sendVerificationEmail, sendPasswordResetEmail } from '../utils/email'

type Bindings = {
  RUINABLA_DB: D1Database
  RESEND_API_KEY: string
  ENVIRONMENT?: string
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
      'INSERT INTO users (id, email, password_hash, email_verified, role) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(userId, email, passwordHash, false, 'user')
      .run()

    // Generate verification token
    const token = generateId(32)
    const expiresAt = Math.floor(Date.now() / 1000) + 3600 // 1 hour

    await c.env.RUINABLA_DB.prepare(
      'INSERT INTO email_verification_tokens (token, email, type, expires_at) VALUES (?, ?, ?, ?)',
    )
      .bind(token, email, 'verify_email', expiresAt)
      .run()

    // Send verification email - wrapped in try-catch to prevent registration failure
    try {
      const resend = createResendClient(c.env.RESEND_API_KEY)
      const baseUrl = new URL(c.req.url).origin
      await sendVerificationEmail(resend, email, token, baseUrl)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Continue registration even if email fails (API key not configured, etc.)
      // User can request resend later
    }

    return c.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      userId, // Return userId but don't create session yet
    })
  } catch (e) {
    console.error('Registration error:', e)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// Login
auth.post('/login', async (c) => {
  const { email, password, remember } = await c.req.json()

  // Test User for Development
  if (email === 'test@test.com' && password === 'testtest') {
    // Allow if explicit 'development' env OR locally if host is localhost (fallback)
    const isDev =
      c.env.ENVIRONMENT === 'development' ||
      new URL(c.req.url).hostname === 'localhost' ||
      new URL(c.req.url).hostname === '127.0.0.1'

    if (isDev) {
      // Ensure test user exists
      const testId = 'test-user-id'
      await c.env.RUINABLA_DB.prepare(
        `INSERT INTO users (id, email, password_hash, email_verified, role)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET role = ?, email_verified = ?`,
      )
        .bind(testId, 'test@example.com', 'n/a', true, 'admin', 'admin', true)
        .run()

      // Create session with 30 seconds expiry (30 / 86400 days)
      const sessionId = await createSession(c.env.RUINABLA_DB, testId, 30 / 86400)

      return c.json({
        success: true,
        sessionId,
        user: {
          id: testId,
          email: 'test@example.com',
          role: 'admin',
        },
      })
    }
  }

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

  // Check if user has any 2FA methods set up
  const [totpRecord, passkeyRecords] = await Promise.all([
    c.env.RUINABLA_DB.prepare('SELECT enabled FROM totp_secrets WHERE user_id = ?')
      .bind(user.id)
      .first(),
    c.env.RUINABLA_DB.prepare('SELECT id FROM passkeys WHERE user_id = ? LIMIT 1')
      .bind(user.id)
      .first(),
  ])

  const hasTOTP = totpRecord && totpRecord.enabled
  const hasPasskey = !!passkeyRecords

  // Only require 2FA if user has set up at least one method
  if (hasTOTP || hasPasskey) {
    return c.json({
      requires2FA: true,
      userId: user.id,
      email: user.email,
    })
  }

  // No 2FA set up, create session directly
  const durationDays = remember ? 365 : 31
  const sessionId = await createSession(c.env.RUINABLA_DB, user.id as string, durationDays)

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

// Verify TOTP and complete login
auth.post('/verify-totp', async (c) => {
  const { userId, totpCode, remember } = await c.req.json()

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
  const durationDays = remember ? 14 : 1
  const sessionId = await createSession(c.env.RUINABLA_DB, userId, durationDays)

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

// Verify email
auth.post('/verify-email', async (c) => {
  const { token } = await c.req.json()

  if (!token) {
    return c.json({ error: 'Token is required' }, 400)
  }

  try {
    // Get token from database
    const tokenRecord = await c.env.RUINABLA_DB.prepare(
      'SELECT * FROM email_verification_tokens WHERE token = ? AND type = ?',
    )
      .bind(token, 'verify_email')
      .first()

    if (!tokenRecord) {
      return c.json({ error: 'Invalid or expired token' }, 404)
    }

    // Check if expired
    const now = Math.floor(Date.now() / 1000)
    if (now > (tokenRecord.expires_at as number)) {
      // Delete expired token
      await c.env.RUINABLA_DB.prepare('DELETE FROM email_verification_tokens WHERE token = ?')
        .bind(token)
        .run()
      return c.json({ error: 'Token has expired' }, 400)
    }

    // Update user's email_verified status
    await c.env.RUINABLA_DB.prepare('UPDATE users SET email_verified = ? WHERE email = ?')
      .bind(true, tokenRecord.email)
      .run()

    // Delete used token
    await c.env.RUINABLA_DB.prepare('DELETE FROM email_verification_tokens WHERE token = ?')
      .bind(token)
      .run()

    // Get user and create session
    const user = await c.env.RUINABLA_DB.prepare(
      'SELECT id, email, role FROM users WHERE email = ?',
    )
      .bind(tokenRecord.email as string)
      .first()

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    const sessionId = await createSession(c.env.RUINABLA_DB, user.id as string)

    return c.json({
      success: true,
      message: 'Email verified successfully',
      sessionId,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (e) {
    console.error('Email verification error:', e)
    return c.json({ error: 'Verification failed' }, 500)
  }
})

// Resend verification email
auth.post('/resend-verification', async (c) => {
  const { email } = await c.req.json()

  if (!email) {
    return c.json({ error: 'Email is required' }, 400)
  }

  try {
    // Check if user exists and needs verification
    const user = await c.env.RUINABLA_DB.prepare(
      'SELECT id, email_verified FROM users WHERE email = ?',
    )
      .bind(email)
      .first()

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    if (user.email_verified) {
      return c.json({ error: 'Email already verified' }, 400)
    }

    // Delete old tokens for this email
    await c.env.RUINABLA_DB.prepare(
      'DELETE FROM email_verification_tokens WHERE email = ? AND type = ?',
    )
      .bind(email, 'verify_email')
      .run()

    // Generate new token
    const token = generateId(32)
    const expiresAt = Math.floor(Date.now() / 1000) + 3600 // 1 hour

    await c.env.RUINABLA_DB.prepare(
      'INSERT INTO email_verification_tokens (token, email, type, expires_at) VALUES (?, ?, ?, ?)',
    )
      .bind(token, email, 'verify_email', expiresAt)
      .run()

    // Send verification email
    const resend = createResendClient(c.env.RESEND_API_KEY)
    const baseUrl = new URL(c.req.url).origin

    await sendVerificationEmail(resend, email, token, baseUrl)

    return c.json({
      success: true,
      message: 'Verification email sent',
    })
  } catch (e) {
    console.error('Resend verification error:', e)
    return c.json({ error: 'Failed to resend verification email' }, 500)
  }
})

// Request password reset
auth.post('/request-reset', async (c) => {
  const { email } = await c.req.json()

  if (!email) {
    return c.json({ error: 'Email is required' }, 400)
  }

  try {
    // Check if user exists
    const user = await c.env.RUINABLA_DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first()

    // Always return success to prevent email enumeration
    if (!user) {
      return c.json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      })
    }

    // Delete old reset tokens for this email
    await c.env.RUINABLA_DB.prepare(
      'DELETE FROM email_verification_tokens WHERE email = ? AND type = ?',
    )
      .bind(email, 'reset_password')
      .run()

    // Generate reset token
    const token = generateId(32)
    const expiresAt = Math.floor(Date.now() / 1000) + 3600 // 1 hour

    await c.env.RUINABLA_DB.prepare(
      'INSERT INTO email_verification_tokens (token, email, type, expires_at) VALUES (?, ?, ?, ?)',
    )
      .bind(token, email, 'reset_password', expiresAt)
      .run()

    // Send reset email
    const resend = createResendClient(c.env.RESEND_API_KEY)
    const baseUrl = new URL(c.req.url).origin

    await sendPasswordResetEmail(resend, email, token, baseUrl)

    return c.json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
    })
  } catch (e) {
    console.error('Request reset error:', e)
    return c.json({ error: 'Failed to send reset email' }, 500)
  }
})

// Reset password
auth.post('/reset-password', async (c) => {
  const { token, newPassword } = await c.req.json()

  if (!token || !newPassword) {
    return c.json({ error: 'Token and new password are required' }, 400)
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400)
  }

  try {
    // Get token from database
    const tokenRecord = await c.env.RUINABLA_DB.prepare(
      'SELECT * FROM email_verification_tokens WHERE token = ? AND type = ?',
    )
      .bind(token, 'reset_password')
      .first()

    if (!tokenRecord) {
      return c.json({ error: 'Invalid or expired token' }, 404)
    }

    // Check if expired
    const now = Math.floor(Date.now() / 1000)
    if (now > (tokenRecord.expires_at as number)) {
      // Delete expired token
      await c.env.RUINABLA_DB.prepare('DELETE FROM email_verification_tokens WHERE token = ?')
        .bind(token)
        .run()
      return c.json({ error: 'Token has expired' }, 400)
    }

    // Update password
    const passwordHash = await hashPassword(newPassword)
    await c.env.RUINABLA_DB.prepare('UPDATE users SET password_hash = ? WHERE email = ?')
      .bind(passwordHash, tokenRecord.email)
      .run()

    // Delete used token
    await c.env.RUINABLA_DB.prepare('DELETE FROM email_verification_tokens WHERE token = ?')
      .bind(token)
      .run()

    // Invalidate all existing sessions for this user
    const user = await c.env.RUINABLA_DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(tokenRecord.email as string)
      .first()

    if (user) {
      await c.env.RUINABLA_DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run()
    }

    return c.json({
      success: true,
      message: 'Password reset successfully',
    })
  } catch (e) {
    console.error('Reset password error:', e)
    return c.json({ error: 'Failed to reset password' }, 500)
  }
})

export default auth
