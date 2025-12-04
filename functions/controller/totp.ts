import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import {
  generateTOTPSecret,
  generateTOTPUri,
  verifyTOTP,
  generateBackupCodes,
} from '../utils/crypto'
import { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  RUINABLA_DB: D1Database
}

const totp = new Hono<{ Bindings: Bindings }>()

totp.get('/enabled', requireAuth, async (c) => {
  const user = c.get('user') as { id: string; email: string; role: string }

  const totpRecord = await c.env.RUINABLA_DB.prepare(
    'SELECT enabled FROM totp_secrets WHERE user_id = ?',
  )
    .bind(user.id)
    .first()

  if (!totpRecord) {
    return c.json({ enabled: false })
  }

  return c.json({ enabled: Boolean(totpRecord.enabled) })
})

// Enable TOTP - Generate secret and return URI for QR code
totp.post('/enable', requireAuth, async (c) => {
  const user = c.get('user') as { id: string; email: string; role: string }

  // Check if TOTP is already enabled
  const existing = await c.env.RUINABLA_DB.prepare(
    'SELECT enabled FROM totp_secrets WHERE user_id = ?',
  )
    .bind(user.id)
    .first()

  if (existing && existing.enabled) {
    return c.json({ error: 'TOTP is already enabled' }, 400)
  }

  // Generate new secret
  const secret = generateTOTPSecret()
  const uri = generateTOTPUri(secret, user.email)

  // Generate backup codes
  const backupCodes = generateBackupCodes()

  // Store secret (not enabled yet, needs verification)
  if (existing) {
    await c.env.RUINABLA_DB.prepare(
      'UPDATE totp_secrets SET secret = ?, enabled = 0, backup_codes = ? WHERE user_id = ?',
    )
      .bind(secret, JSON.stringify(backupCodes), user.id)
      .run()
  } else {
    await c.env.RUINABLA_DB.prepare(
      'INSERT INTO totp_secrets (user_id, secret, enabled, backup_codes) VALUES (?, ?, 0, ?)',
    )
      .bind(user.id, secret, JSON.stringify(backupCodes))
      .run()
  }

  return c.json({
    success: true,
    secret,
    uri,
    backupCodes,
  })
})

// Verify and enable TOTP
totp.post('/verify-enable', requireAuth, async (c) => {
  const user = c.get('user') as { id: string; email: string; role: string }
  const { code } = await c.req.json()

  if (!code) {
    return c.json({ error: 'TOTP code is required' }, 400)
  }

  // Get pending secret
  const totpRecord = await c.env.RUINABLA_DB.prepare(
    'SELECT secret, enabled FROM totp_secrets WHERE user_id = ?',
  )
    .bind(user.id)
    .first()

  if (!totpRecord) {
    return c.json({ error: 'No TOTP setup found. Call /enable first' }, 400)
  }

  if (totpRecord.enabled) {
    return c.json({ error: 'TOTP is already enabled' }, 400)
  }

  // Verify code
  const isValid = await verifyTOTP(totpRecord.secret as string, code)

  if (!isValid) {
    return c.json({ error: 'Invalid TOTP code' }, 401)
  }

  // Enable TOTP
  await c.env.RUINABLA_DB.prepare('UPDATE totp_secrets SET enabled = 1 WHERE user_id = ?')
    .bind(user.id)
    .run()

  return c.json({ success: true })
})

// Disable TOTP
totp.post('/disable', requireAuth, async (c) => {
  const user = c.get('user') as { id: string; email: string; role: string }
  const { password } = await c.req.json()

  if (!password) {
    return c.json({ error: 'Password is required to disable TOTP' }, 400)
  }

  // Verify password
  const userRecord = await c.env.RUINABLA_DB.prepare('SELECT password_hash FROM users WHERE id = ?')
    .bind(user.id)
    .first()

  if (!userRecord) {
    return c.json({ error: 'User not found' }, 404)
  }

  const { verifyPassword } = await import('../utils/crypto')
  const isValid = await verifyPassword(password, userRecord.password_hash as string)

  if (!isValid) {
    return c.json({ error: 'Invalid password' }, 401)
  }

  // Delete TOTP secret
  await c.env.RUINABLA_DB.prepare('DELETE FROM totp_secrets WHERE user_id = ?').bind(user.id).run()

  return c.json({ success: true })
})

// Get backup codes
totp.get('/backup-codes', requireAuth, async (c) => {
  const user = c.get('user') as { id: string; email: string; role: string }

  const totpRecord = await c.env.RUINABLA_DB.prepare(
    'SELECT backup_codes, enabled FROM totp_secrets WHERE user_id = ?',
  )
    .bind(user.id)
    .first()

  if (!totpRecord || !totpRecord.enabled) {
    return c.json({ error: 'TOTP is not enabled' }, 400)
  }

  const backupCodes = totpRecord.backup_codes ? JSON.parse(totpRecord.backup_codes as string) : []

  return c.json({ backupCodes })
})

// Regenerate backup codes
totp.post('/regenerate-backup-codes', requireAuth, async (c) => {
  const user = c.get('user') as { id: string; email: string; role: string }
  const { password } = await c.req.json()

  if (!password) {
    return c.json({ error: 'Password is required' }, 400)
  }

  // Verify password
  const userRecord = await c.env.RUINABLA_DB.prepare('SELECT password_hash FROM users WHERE id = ?')
    .bind(user.id)
    .first()

  if (!userRecord) {
    return c.json({ error: 'User not found' }, 404)
  }

  const { verifyPassword } = await import('../utils/crypto')
  const isValid = await verifyPassword(password, userRecord.password_hash as string)

  if (!isValid) {
    return c.json({ error: 'Invalid password' }, 401)
  }

  // Check if TOTP is enabled
  const totpRecord = await c.env.RUINABLA_DB.prepare(
    'SELECT enabled FROM totp_secrets WHERE user_id = ?',
  )
    .bind(user.id)
    .first()

  if (!totpRecord || !totpRecord.enabled) {
    return c.json({ error: 'TOTP is not enabled' }, 400)
  }

  // Generate new backup codes
  const backupCodes = generateBackupCodes()

  await c.env.RUINABLA_DB.prepare('UPDATE totp_secrets SET backup_codes = ? WHERE user_id = ?')
    .bind(JSON.stringify(backupCodes), user.id)
    .run()

  return c.json({ success: true, backupCodes })
})

export default totp
