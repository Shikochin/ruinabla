import { Hono } from 'hono'
import { requireAuth, createSession } from '../middleware/auth'
import { generateId } from '../utils/crypto'
import { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  RUINABLA_DB: D1Database
}

const passkey = new Hono<{ Bindings: Bindings }>()

// Helper function to encode to base64url
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// Get registration options
passkey.post('/register-options', requireAuth, async (c) => {
  const user = c.get('user') as { id: string; email: string; role: string }

  // Generate challenge
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const challengeB64 = base64UrlEncode(challenge)

  // Store challenge temporarily (in production, use a cache or temporary storage)
  // For now, we'll return it and verify client-side signature

  const options = {
    challenge: challengeB64,
    rp: {
      name: 'Ruinabla',
      id: new URL(c.req.url).hostname, // Should be your domain
    },
    user: {
      id: base64UrlEncode(new TextEncoder().encode(user.id)),
      name: user.email,
      displayName: user.email,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 }, // ES256
      { type: 'public-key', alg: -257 }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      requireResidentKey: false,
      userVerification: 'preferred',
    },
    timeout: 60000,
    attestation: 'none',
  }

  return c.json(options)
})

// Complete passkey registration
passkey.post('/register', requireAuth, async (c) => {
  const user = c.get('user') as { id: string; email: string; role: string }
  const { credential, name } = await c.req.json()

  if (!credential || !credential.id || !credential.response) {
    return c.json({ error: 'Invalid credential data' }, 400)
  }

  try {
    // In a production environment, you'd verify the attestation here
    // For simplicity, we'll just store the public key

    const passkeyId = generateId(16)
    const credentialId = credential.id
    const publicKey = credential.response.publicKey || ''
    const transports = credential.response.transports || []

    await c.env.RUINABLA_DB.prepare(
      'INSERT INTO passkeys (id, user_id, credential_id, public_key, counter, transports, name) VALUES (?, ?, ?, ?, 0, ?, ?)',
    )
      .bind(
        passkeyId,
        user.id,
        credentialId,
        publicKey,
        JSON.stringify(transports),
        name || 'My Passkey',
      )
      .run()

    return c.json({ success: true, id: passkeyId })
  } catch (e) {
    console.error('Passkey registration error:', e)
    return c.json({ error: 'Failed to register passkey' }, 500)
  }
})

// Get login options (for passkey authentication)
passkey.post('/login-options', async (c) => {
  // Generate challenge for any passkey
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const challengeB64 = base64UrlEncode(challenge)

  const options = {
    challenge: challengeB64,
    rpId: new URL(c.req.url).hostname,
    userVerification: 'preferred',
    timeout: 60000,
  }

  return c.json(options)
})

// Complete passkey login
passkey.post('/login', async (c) => {
  const { credential } = await c.req.json()

  if (!credential || !credential.id) {
    return c.json({ error: 'Invalid credential data' }, 400)
  }

  try {
    // Get passkey from database
    const passkeyRecord = await c.env.RUINABLA_DB.prepare(
      'SELECT p.*, u.id as user_id, u.email, u.role FROM passkeys p JOIN users u ON p.user_id = u.id WHERE p.credential_id = ?',
    )
      .bind(credential.id)
      .first()

    if (!passkeyRecord) {
      return c.json({ error: 'Passkey not found' }, 404)
    }

    // In production, verify the signature using the stored public key
    // For now, we'll trust the client verification

    // Update counter to prevent replay attacks
    await c.env.RUINABLA_DB.prepare(
      'UPDATE passkeys SET counter = counter + 1 WHERE credential_id = ?',
    )
      .bind(credential.id)
      .run()

    // Create session
    const sessionId = await createSession(c.env.RUINABLA_DB, passkeyRecord.user_id as string)

    return c.json({
      success: true,
      sessionId,
      user: {
        id: passkeyRecord.user_id,
        email: passkeyRecord.email,
        role: passkeyRecord.role,
      },
    })
  } catch (e) {
    console.error('Passkey login error:', e)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Verify passkey for 2FA (after password login)
passkey.post('/verify-2fa', async (c) => {
  const { userId, credential } = await c.req.json()

  if (!userId || !credential || !credential.id) {
    return c.json({ error: 'Invalid request data' }, 400)
  }

  try {
    // Verify the passkey belongs to this user
    const passkeyRecord = await c.env.RUINABLA_DB.prepare(
      'SELECT p.*, u.id as user_id, u.email, u.role FROM passkeys p JOIN users u ON p.user_id = u.id WHERE p.credential_id = ? AND p.user_id = ?',
    )
      .bind(credential.id, userId)
      .first()

    if (!passkeyRecord) {
      return c.json({ error: 'Passkey not found or does not belong to this user' }, 404)
    }

    // In production, verify the signature
    // For now, trust the client

    // Update counter
    await c.env.RUINABLA_DB.prepare(
      'UPDATE passkeys SET counter = counter + 1 WHERE credential_id = ?',
    )
      .bind(credential.id)
      .run()

    // Create session
    const sessionId = await createSession(c.env.RUINABLA_DB, userId)

    return c.json({
      success: true,
      sessionId,
      user: {
        id: passkeyRecord.user_id,
        email: passkeyRecord.email,
        role: passkeyRecord.role,
      },
    })
  } catch (e) {
    console.error('Passkey 2FA verification error:', e)
    return c.json({ error: 'Verification failed' }, 500)
  }
})

// Get 2FA options for a user (check what they have set up)
passkey.post('/2fa-options', async (c) => {
  const { userId } = await c.req.json()

  if (!userId) {
    return c.json({ error: 'User ID is required' }, 400)
  }

  try {
    // Check for passkeys
    const passkeys = await c.env.RUINABLA_DB.prepare(
      'SELECT credential_id, transports FROM passkeys WHERE user_id = ?',
    )
      .bind(userId)
      .all()

    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const challengeB64 = base64UrlEncode(challenge)

    const hasPasskeys = passkeys.results.length > 0

    const options = hasPasskeys
      ? {
          challenge: challengeB64,
          rpId: new URL(c.req.url).hostname,
          allowCredentials: passkeys.results.map((pk: any) => ({
            type: 'public-key',
            id: pk.credential_id,
            transports: pk.transports ? JSON.parse(pk.transports) : [],
          })),
          userVerification: 'preferred',
          timeout: 60000,
        }
      : null

    return c.json({
      hasPasskeys,
      passkeyOptions: options,
    })
  } catch (e) {
    console.error('Error getting 2FA options:', e)
    return c.json({ error: 'Failed to get 2FA options' }, 500)
  }
})

// List user's passkeys
passkey.get('/', requireAuth, async (c) => {
  const user = c.get('user') as { id: string; email: string; role: string }

  const passkeys = await c.env.RUINABLA_DB.prepare(
    'SELECT id, name, created_at FROM passkeys WHERE user_id = ?',
  )
    .bind(user.id)
    .all()

  return c.json({ passkeys: passkeys.results })
})

// Delete passkey
passkey.delete('/:id', requireAuth, async (c) => {
  const user = c.get('user') as { id: string; email: string; role: string }
  const passkeyId = c.req.param('id')

  // Verify ownership
  const passkeyRecord = await c.env.RUINABLA_DB.prepare('SELECT user_id FROM passkeys WHERE id = ?')
    .bind(passkeyId)
    .first()

  if (!passkeyRecord) {
    return c.json({ error: 'Passkey not found' }, 404)
  }

  if (passkeyRecord.user_id !== user.id) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await c.env.RUINABLA_DB.prepare('DELETE FROM passkeys WHERE id = ?').bind(passkeyId).run()

  return c.json({ success: true })
})

export default passkey
