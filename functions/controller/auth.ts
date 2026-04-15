import { Context, Hono } from 'hono'
import { D1Database } from '@cloudflare/workers-types'
import { createResendClient, sendPasswordResetEmail, sendVerificationEmail } from '../utils/email'
import { generateId, hashPassword, verifyPassword } from '../utils/crypto'
import {
  consumeOpaqueLoginAttempt,
  consumeOpaqueRegistrationAttempt,
  consumePendingAuthChallenge,
  createOpaqueLoginAttempt,
  createOpaqueLoginResponse,
  createOpaqueRegistrationAttempt,
  createOpaqueRegistrationResponse,
  createPendingAuthChallenge,
  finishOpaqueLogin,
  getOpaqueServerSetup,
  getReauthExpiresAt,
  getSessionDurationDays,
  buildOpaqueRegistrationRecordFromPassword,
  cleanupOpaqueArtifacts,
} from '../utils/opaque'
import {
  createSession,
  getAuthenticatedSession,
  invalidateSession,
  markSessionReauthenticated,
  requireAuth,
} from '../middleware/auth'

type Bindings = {
  RUINABLA_DB: D1Database
  RESEND_API_KEY: string
  OPAQUE_SERVER_SETUP?: string
  ENVIRONMENT?: string
}

type AppContext = Context<{ Bindings: Bindings }>

type UserRecord = {
  id: string
  email: string
  password_hash: string | null
  opaque_registration_record: string | null
  role: string
}

type TwoFactorMethods = {
  totp: boolean
  passkey: boolean
}

const auth = new Hono<{ Bindings: Bindings }>()

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isDevelopmentRequest(c: AppContext): boolean {
  const requestUrl = new URL(c.req.url)
  return (
    c.env.ENVIRONMENT === 'development' ||
    requestUrl.hostname === 'localhost' ||
    requestUrl.hostname === '127.0.0.1'
  )
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function validateEmail(email: string): string | null {
  const normalizedEmail = normalizeEmail(email)

  if (!emailRegex.test(normalizedEmail)) {
    return null
  }

  return normalizedEmail
}

async function getUserByEmail(db: D1Database, email: string): Promise<UserRecord | null> {
  const user = await db
    .prepare(
      'SELECT id, email, password_hash, opaque_registration_record, role FROM users WHERE email = ?',
    )
    .bind(email)
    .first()

  if (!user) {
    return null
  }

  return {
    id: user.id as string,
    email: user.email as string,
    password_hash: (user.password_hash as string | null) ?? null,
    opaque_registration_record: (user.opaque_registration_record as string | null) ?? null,
    role: user.role as string,
  }
}

async function getUserById(db: D1Database, userId: string) {
  return db.prepare('SELECT id, email, role FROM users WHERE id = ?').bind(userId).first()
}

async function getTwoFactorMethods(db: D1Database, userId: string): Promise<TwoFactorMethods> {
  const [totpRecord, passkeyRecord] = await Promise.all([
    db.prepare('SELECT enabled FROM totp_secrets WHERE user_id = ?').bind(userId).first(),
    db.prepare('SELECT id FROM passkeys WHERE user_id = ? LIMIT 1').bind(userId).first(),
  ])

  return {
    totp: Boolean(totpRecord && totpRecord.enabled),
    passkey: Boolean(passkeyRecord),
  }
}

async function sendVerificationEmailSafely(c: AppContext, email: string, token: string) {
  try {
    const resend = createResendClient(c.env.RESEND_API_KEY)
    const baseUrl = new URL(c.req.url).origin
    await sendVerificationEmail(resend, email, token, baseUrl)
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError)
  }
}

async function createVerificationToken(db: D1Database, email: string): Promise<string> {
  const token = generateId(32)
  const expiresAt = Math.floor(Date.now() / 1000) + 3600

  await db
    .prepare(
      'INSERT INTO email_verification_tokens (token, email, type, expires_at) VALUES (?, ?, ?, ?)',
    )
    .bind(token, email, 'verify_email', expiresAt)
    .run()

  return token
}

async function getResetTokenRecord(db: D1Database, token: string) {
  const tokenRecord = await db
    .prepare('SELECT * FROM email_verification_tokens WHERE token = ? AND type = ?')
    .bind(token, 'reset_password')
    .first()

  if (!tokenRecord) {
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  if (now > Number(tokenRecord.expires_at)) {
    await db.prepare('DELETE FROM email_verification_tokens WHERE token = ?').bind(token).run()
    return null
  }

  return tokenRecord
}

async function maybeCreateOpaqueRecordForLegacyPassword(
  c: AppContext,
  userId: string,
  password: string,
  existingOpaqueRecord: string | null,
) {
  if (existingOpaqueRecord) {
    return
  }

  try {
    const opaqueRegistrationRecord = await buildOpaqueRegistrationRecordFromPassword(
      getOpaqueServerSetup(c.env),
      userId,
      password,
    )

    await c.env.RUINABLA_DB.prepare(
      'UPDATE users SET opaque_registration_record = ?, updated_at = unixepoch() WHERE id = ?',
    )
      .bind(opaqueRegistrationRecord, userId)
      .run()
  } catch (error) {
    console.error('Failed to backfill OPAQUE record:', error)
  }
}

async function createPendingAuthResponse(
  db: D1Database,
  userId: string,
  durationDays: number,
  methods: TwoFactorMethods,
) {
  const pendingAuth = await createPendingAuthChallenge(db, userId, durationDays)

  return {
    requires2FA: true,
    pendingAuthId: pendingAuth.id,
    userId,
    methods,
  }
}

// Register new user through the legacy JSON endpoint.
auth.post('/register', async (c) => {
  const { email, password } = await c.req.json()

  const normalizedEmail = typeof email === 'string' ? validateEmail(email) : null
  if (!normalizedEmail || !password) {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400)
  }

  const existingUser = await c.env.RUINABLA_DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(normalizedEmail)
    .first()

  if (existingUser) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  try {
    const userId = generateId(16)
    const [passwordHash, opaqueRegistrationRecord] = await Promise.all([
      hashPassword(password),
      buildOpaqueRegistrationRecordFromPassword(getOpaqueServerSetup(c.env), userId, password),
    ])

    await c.env.RUINABLA_DB.prepare(
      `INSERT INTO users
         (id, email, password_hash, opaque_registration_record, email_verified, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(userId, normalizedEmail, passwordHash, opaqueRegistrationRecord, false, 'user')
      .run()

    const token = await createVerificationToken(c.env.RUINABLA_DB, normalizedEmail)
    await sendVerificationEmailSafely(c, normalizedEmail, token)

    return c.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      userId,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

auth.post('/opaque/register/start', async (c) => {
  const { email, registrationRequest } = await c.req.json()
  const normalizedEmail = typeof email === 'string' ? validateEmail(email) : null

  if (!normalizedEmail || typeof registrationRequest !== 'string' || !registrationRequest) {
    return c.json({ error: 'Email and registration request are required' }, 400)
  }

  await cleanupOpaqueArtifacts(c.env.RUINABLA_DB)

  const existingUser = await c.env.RUINABLA_DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(normalizedEmail)
    .first()

  if (existingUser) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  try {
    const userId = generateId(16)
    const registrationResponse = await createOpaqueRegistrationResponse(
      getOpaqueServerSetup(c.env),
      userId,
      registrationRequest,
    )
    const attempt = await createOpaqueRegistrationAttempt(c.env.RUINABLA_DB, {
      userId,
      email: normalizedEmail,
      purpose: 'register',
      token: null,
    })

    return c.json({
      attemptId: attempt.id,
      registrationResponse,
    })
  } catch (error) {
    console.error('OPAQUE register start error:', error)
    return c.json({ error: 'Failed to start registration' }, 500)
  }
})

auth.post('/opaque/register/finish', async (c) => {
  const { attemptId, registrationRecord } = await c.req.json()

  if (
    typeof attemptId !== 'string' ||
    typeof registrationRecord !== 'string' ||
    !registrationRecord
  ) {
    return c.json({ error: 'Attempt ID and registration record are required' }, 400)
  }

  await cleanupOpaqueArtifacts(c.env.RUINABLA_DB)
  const attempt = await consumeOpaqueRegistrationAttempt(c.env.RUINABLA_DB, attemptId, 'register')

  if (!attempt) {
    return c.json({ error: 'Registration attempt not found or expired' }, 404)
  }

  const existingUser = await c.env.RUINABLA_DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(attempt.email)
    .first()

  if (existingUser) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  try {
    await c.env.RUINABLA_DB.prepare(
      `INSERT INTO users
         (id, email, password_hash, opaque_registration_record, email_verified, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(attempt.userId, attempt.email, null, registrationRecord, false, 'user')
      .run()

    const token = await createVerificationToken(c.env.RUINABLA_DB, attempt.email)
    await sendVerificationEmailSafely(c, attempt.email, token)

    return c.json({
      success: true,
      userId: attempt.userId,
      message: 'Registration successful. Please check your email to verify your account.',
    })
  } catch (error) {
    console.error('OPAQUE register finish error:', error)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// Login through the legacy JSON endpoint.
auth.post('/login', async (c) => {
  const { email, password, remember } = await c.req.json()

  if (email === 'test@test.com' && password === 'testtest' && isDevelopmentRequest(c)) {
    const testId = 'test-user-id'

    await c.env.RUINABLA_DB.prepare(
      `INSERT INTO users (id, email, password_hash, email_verified, role)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET role = ?, email_verified = ?`,
    )
      .bind(testId, 'test@example.com', 'n/a', true, 'admin', 'admin', true)
      .run()

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

  const normalizedEmail = typeof email === 'string' ? validateEmail(email) : null
  if (!normalizedEmail || typeof password !== 'string' || !password) {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  const user = await getUserByEmail(c.env.RUINABLA_DB, normalizedEmail)

  if (!user || !user.password_hash) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const isValid = await verifyPassword(password, user.password_hash)
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  await maybeCreateOpaqueRecordForLegacyPassword(
    c,
    user.id,
    password,
    user.opaque_registration_record,
  )

  const methods = await getTwoFactorMethods(c.env.RUINABLA_DB, user.id)
  const durationDays = getSessionDurationDays(Boolean(remember))

  if (methods.totp || methods.passkey) {
    return c.json(
      await createPendingAuthResponse(c.env.RUINABLA_DB, user.id, durationDays, methods),
    )
  }

  const sessionId = await createSession(c.env.RUINABLA_DB, user.id, durationDays)

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

auth.post('/opaque/login/start', async (c) => {
  const { email, startLoginRequest, remember } = await c.req.json()
  const normalizedEmail = typeof email === 'string' ? validateEmail(email) : null

  if (!normalizedEmail || typeof startLoginRequest !== 'string' || !startLoginRequest) {
    return c.json({ error: 'Email and login request are required' }, 400)
  }

  await cleanupOpaqueArtifacts(c.env.RUINABLA_DB)

  try {
    const user = await getUserByEmail(c.env.RUINABLA_DB, normalizedEmail)
    const hasOpaqueRecord = Boolean(user?.opaque_registration_record)
    const loginResponse = await createOpaqueLoginResponse(
      getOpaqueServerSetup(c.env),
      user?.id ?? `missing:${normalizedEmail}`,
      user?.opaque_registration_record,
      startLoginRequest,
    )
    const attempt = await createOpaqueLoginAttempt(c.env.RUINABLA_DB, {
      userId: user?.id ?? null,
      purpose: 'login',
      serverLoginState: loginResponse.serverLoginState,
      hasOpaqueRecord,
      sessionDurationDays: getSessionDurationDays(Boolean(remember)),
    })

    return c.json({
      attemptId: attempt.id,
      loginResponse: loginResponse.loginResponse,
    })
  } catch (error) {
    console.error('OPAQUE login start error:', error)
    return c.json({ error: 'Failed to start login' }, 500)
  }
})

auth.post('/opaque/login/finish', async (c) => {
  const { attemptId, finishLoginRequest } = await c.req.json()

  if (
    typeof attemptId !== 'string' ||
    typeof finishLoginRequest !== 'string' ||
    !finishLoginRequest
  ) {
    return c.json({ error: 'Attempt ID and login finish request are required' }, 400)
  }

  await cleanupOpaqueArtifacts(c.env.RUINABLA_DB)
  const attempt = await consumeOpaqueLoginAttempt(c.env.RUINABLA_DB, attemptId, 'login')

  if (!attempt || !attempt.userId || !attempt.hasOpaqueRecord) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  try {
    await finishOpaqueLogin(attempt.serverLoginState, finishLoginRequest)
  } catch (error) {
    console.error('OPAQUE login finish error:', error)
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const user = await getUserById(c.env.RUINABLA_DB, attempt.userId)
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  const methods = await getTwoFactorMethods(c.env.RUINABLA_DB, attempt.userId)

  if (methods.totp || methods.passkey) {
    return c.json(
      await createPendingAuthResponse(
        c.env.RUINABLA_DB,
        attempt.userId,
        attempt.sessionDurationDays ?? getSessionDurationDays(false),
        methods,
      ),
    )
  }

  const sessionId = await createSession(
    c.env.RUINABLA_DB,
    attempt.userId,
    attempt.sessionDurationDays ?? getSessionDurationDays(false),
  )

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

auth.post('/opaque/reauth/start', requireAuth, async (c) => {
  const session = getAuthenticatedSession(c)
  const { startLoginRequest } = await c.req.json()

  if (typeof startLoginRequest !== 'string' || !startLoginRequest) {
    return c.json({ error: 'Login request is required' }, 400)
  }

  await cleanupOpaqueArtifacts(c.env.RUINABLA_DB)

  const user = await c.env.RUINABLA_DB.prepare(
    'SELECT opaque_registration_record FROM users WHERE id = ?',
  )
    .bind(session.userId)
    .first()

  const record = (user?.opaque_registration_record as string | null) ?? null
  if (!record) {
    return c.json({ error: 'OPAQUE reauthentication is unavailable. Please log in again.' }, 409)
  }

  try {
    const { loginResponse, serverLoginState } = await createOpaqueLoginResponse(
      getOpaqueServerSetup(c.env),
      session.userId,
      record,
      startLoginRequest,
    )
    const attempt = await createOpaqueLoginAttempt(c.env.RUINABLA_DB, {
      userId: session.userId,
      purpose: 'reauth',
      serverLoginState,
      hasOpaqueRecord: true,
      sessionDurationDays: null,
    })

    return c.json({
      attemptId: attempt.id,
      loginResponse,
    })
  } catch (error) {
    console.error('OPAQUE reauth start error:', error)
    return c.json({ error: 'Failed to start reauthentication' }, 500)
  }
})

auth.post('/opaque/reauth/finish', requireAuth, async (c) => {
  const session = getAuthenticatedSession(c)
  const { attemptId, finishLoginRequest } = await c.req.json()

  if (
    typeof attemptId !== 'string' ||
    typeof finishLoginRequest !== 'string' ||
    !finishLoginRequest
  ) {
    return c.json({ error: 'Attempt ID and login finish request are required' }, 400)
  }

  await cleanupOpaqueArtifacts(c.env.RUINABLA_DB)
  const attempt = await consumeOpaqueLoginAttempt(c.env.RUINABLA_DB, attemptId, 'reauth')

  if (!attempt || attempt.userId !== session.userId || !attempt.hasOpaqueRecord) {
    return c.json({ error: 'Invalid reauthentication attempt' }, 401)
  }

  try {
    await finishOpaqueLogin(attempt.serverLoginState, finishLoginRequest)
    await markSessionReauthenticated(c.env.RUINABLA_DB, session.id)

    return c.json({
      success: true,
      reauthExpiresAt: getReauthExpiresAt(),
    })
  } catch (error) {
    console.error('OPAQUE reauth finish error:', error)
    return c.json({ error: 'Invalid credentials' }, 401)
  }
})

// Verify TOTP and complete login.
auth.post('/verify-totp', async (c) => {
  const { pendingAuthId, userId, totpCode, remember } = await c.req.json()

  if (!totpCode) {
    return c.json({ error: 'TOTP code is required' }, 400)
  }

  await cleanupOpaqueArtifacts(c.env.RUINABLA_DB)

  let resolvedUserId: string | null = typeof userId === 'string' ? userId : null
  let durationDays = getSessionDurationDays(Boolean(remember))

  if (typeof pendingAuthId === 'string' && pendingAuthId) {
    const pendingAuth = await consumePendingAuthChallenge(c.env.RUINABLA_DB, pendingAuthId)
    if (!pendingAuth) {
      return c.json({ error: 'Authentication challenge expired' }, 401)
    }
    resolvedUserId = pendingAuth.userId
    durationDays = pendingAuth.sessionDurationDays
  }

  if (!resolvedUserId) {
    return c.json({ error: 'User ID or pending auth ID is required' }, 400)
  }

  const totpRecord = await c.env.RUINABLA_DB.prepare(
    'SELECT secret, backup_codes FROM totp_secrets WHERE user_id = ? AND enabled = 1',
  )
    .bind(resolvedUserId)
    .first()

  if (!totpRecord) {
    return c.json({ error: 'TOTP not enabled for this user' }, 400)
  }

  const { verifyTOTP } = await import('../utils/crypto')
  const isValid = await verifyTOTP(totpRecord.secret as string, totpCode)

  if (!isValid) {
    const backupCodes = totpRecord.backup_codes ? JSON.parse(totpRecord.backup_codes as string) : []
    const backupCodeIndex = backupCodes.indexOf(totpCode.toUpperCase())

    if (backupCodeIndex === -1) {
      return c.json({ error: 'Invalid TOTP code' }, 401)
    }

    backupCodes.splice(backupCodeIndex, 1)
    await c.env.RUINABLA_DB.prepare('UPDATE totp_secrets SET backup_codes = ? WHERE user_id = ?')
      .bind(JSON.stringify(backupCodes), resolvedUserId)
      .run()
  }

  const user = await getUserById(c.env.RUINABLA_DB, resolvedUserId)
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  const sessionId = await createSession(c.env.RUINABLA_DB, resolvedUserId, durationDays)

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

// Logout.
auth.post('/logout', requireAuth, async (c) => {
  const session = getAuthenticatedSession(c)
  await invalidateSession(c.env.RUINABLA_DB, session.id)
  return c.json({ success: true })
})

// Get current user.
auth.get('/me', requireAuth, async (c) => {
  const session = getAuthenticatedSession(c)
  const user = await getUserById(c.env.RUINABLA_DB, session.userId)

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  })
})

// Verify email.
auth.post('/verify-email', async (c) => {
  const { token } = await c.req.json()

  if (!token) {
    return c.json({ error: 'Token is required' }, 400)
  }

  try {
    const tokenRecord = await c.env.RUINABLA_DB.prepare(
      'SELECT * FROM email_verification_tokens WHERE token = ? AND type = ?',
    )
      .bind(token, 'verify_email')
      .first()

    if (!tokenRecord) {
      return c.json({ error: 'Invalid or expired token' }, 404)
    }

    const now = Math.floor(Date.now() / 1000)
    if (now > Number(tokenRecord.expires_at)) {
      await c.env.RUINABLA_DB.prepare('DELETE FROM email_verification_tokens WHERE token = ?')
        .bind(token)
        .run()
      return c.json({ error: 'Token has expired' }, 400)
    }

    await c.env.RUINABLA_DB.prepare('UPDATE users SET email_verified = ? WHERE email = ?')
      .bind(true, tokenRecord.email)
      .run()
    await c.env.RUINABLA_DB.prepare('DELETE FROM email_verification_tokens WHERE token = ?')
      .bind(token)
      .run()

    const user = await c.env.RUINABLA_DB.prepare(
      'SELECT id, email, role FROM users WHERE email = ?',
    )
      .bind(tokenRecord.email as string)
      .first()

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    const sessionId = await createSession(
      c.env.RUINABLA_DB,
      user.id as string,
      getSessionDurationDays(false),
    )

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
  } catch (error) {
    console.error('Email verification error:', error)
    return c.json({ error: 'Verification failed' }, 500)
  }
})

// Resend verification email.
auth.post('/resend-verification', async (c) => {
  const { email } = await c.req.json()
  const normalizedEmail = typeof email === 'string' ? validateEmail(email) : null

  if (!normalizedEmail) {
    return c.json({ error: 'Email is required' }, 400)
  }

  try {
    const user = await c.env.RUINABLA_DB.prepare(
      'SELECT id, email_verified FROM users WHERE email = ?',
    )
      .bind(normalizedEmail)
      .first()

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    if (user.email_verified) {
      return c.json({ error: 'Email already verified' }, 400)
    }

    await c.env.RUINABLA_DB.prepare(
      'DELETE FROM email_verification_tokens WHERE email = ? AND type = ?',
    )
      .bind(normalizedEmail, 'verify_email')
      .run()

    const token = await createVerificationToken(c.env.RUINABLA_DB, normalizedEmail)
    const resend = createResendClient(c.env.RESEND_API_KEY)
    const baseUrl = new URL(c.req.url).origin
    await sendVerificationEmail(resend, normalizedEmail, token, baseUrl)

    return c.json({
      success: true,
      message: 'Verification email sent',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return c.json({ error: 'Failed to resend verification email' }, 500)
  }
})

// Request password reset.
auth.post('/request-reset', async (c) => {
  const { email } = await c.req.json()
  const normalizedEmail = typeof email === 'string' ? validateEmail(email) : null

  if (!normalizedEmail) {
    return c.json({ error: 'Email is required' }, 400)
  }

  try {
    const user = await c.env.RUINABLA_DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(normalizedEmail)
      .first()

    if (!user) {
      return c.json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      })
    }

    await c.env.RUINABLA_DB.prepare(
      'DELETE FROM email_verification_tokens WHERE email = ? AND type = ?',
    )
      .bind(normalizedEmail, 'reset_password')
      .run()

    const token = generateId(32)
    const expiresAt = Math.floor(Date.now() / 1000) + 3600

    await c.env.RUINABLA_DB.prepare(
      'INSERT INTO email_verification_tokens (token, email, type, expires_at) VALUES (?, ?, ?, ?)',
    )
      .bind(token, normalizedEmail, 'reset_password', expiresAt)
      .run()

    const resend = createResendClient(c.env.RESEND_API_KEY)
    const baseUrl = new URL(c.req.url).origin
    await sendPasswordResetEmail(resend, normalizedEmail, token, baseUrl)

    return c.json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
    })
  } catch (error) {
    console.error('Request reset error:', error)
    return c.json({ error: 'Failed to send reset email' }, 500)
  }
})

auth.post('/opaque/reset/start', async (c) => {
  const { token, registrationRequest } = await c.req.json()

  if (
    typeof token !== 'string' ||
    typeof registrationRequest !== 'string' ||
    !registrationRequest
  ) {
    return c.json({ error: 'Token and registration request are required' }, 400)
  }

  await cleanupOpaqueArtifacts(c.env.RUINABLA_DB)

  const tokenRecord = await getResetTokenRecord(c.env.RUINABLA_DB, token)
  if (!tokenRecord) {
    return c.json({ error: 'Invalid or expired token' }, 404)
  }

  const user = await c.env.RUINABLA_DB.prepare('SELECT id, email FROM users WHERE email = ?')
    .bind(tokenRecord.email as string)
    .first()

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  try {
    const registrationResponse = await createOpaqueRegistrationResponse(
      getOpaqueServerSetup(c.env),
      user.id as string,
      registrationRequest,
    )
    const attempt = await createOpaqueRegistrationAttempt(c.env.RUINABLA_DB, {
      userId: user.id as string,
      email: user.email as string,
      purpose: 'reset_password',
      token,
    })

    return c.json({
      attemptId: attempt.id,
      registrationResponse,
    })
  } catch (error) {
    console.error('OPAQUE reset start error:', error)
    return c.json({ error: 'Failed to start password reset' }, 500)
  }
})

auth.post('/opaque/reset/finish', async (c) => {
  const { attemptId, registrationRecord } = await c.req.json()

  if (
    typeof attemptId !== 'string' ||
    typeof registrationRecord !== 'string' ||
    !registrationRecord
  ) {
    return c.json({ error: 'Attempt ID and registration record are required' }, 400)
  }

  await cleanupOpaqueArtifacts(c.env.RUINABLA_DB)
  const attempt = await consumeOpaqueRegistrationAttempt(
    c.env.RUINABLA_DB,
    attemptId,
    'reset_password',
  )

  if (!attempt || !attempt.token) {
    return c.json({ error: 'Reset attempt not found or expired' }, 404)
  }

  const tokenRecord = await getResetTokenRecord(c.env.RUINABLA_DB, attempt.token)
  if (!tokenRecord) {
    return c.json({ error: 'Invalid or expired token' }, 404)
  }

  try {
    await c.env.RUINABLA_DB.prepare(
      `UPDATE users
       SET password_hash = ?, opaque_registration_record = ?, updated_at = unixepoch()
       WHERE id = ?`,
    )
      .bind(null, registrationRecord, attempt.userId)
      .run()
    await c.env.RUINABLA_DB.prepare('DELETE FROM email_verification_tokens WHERE token = ?')
      .bind(attempt.token)
      .run()
    await c.env.RUINABLA_DB.prepare('DELETE FROM sessions WHERE user_id = ?')
      .bind(attempt.userId)
      .run()

    return c.json({
      success: true,
      message: 'Password reset successfully',
    })
  } catch (error) {
    console.error('OPAQUE reset finish error:', error)
    return c.json({ error: 'Failed to reset password' }, 500)
  }
})

// Reset password through the legacy JSON endpoint.
auth.post('/reset-password', async (c) => {
  const { token, newPassword } = await c.req.json()

  if (!token || !newPassword) {
    return c.json({ error: 'Token and new password are required' }, 400)
  }

  if (newPassword.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400)
  }

  try {
    const tokenRecord = await getResetTokenRecord(c.env.RUINABLA_DB, token)
    if (!tokenRecord) {
      return c.json({ error: 'Invalid or expired token' }, 404)
    }

    const user = await c.env.RUINABLA_DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(tokenRecord.email as string)
      .first()

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    const [passwordHash, opaqueRegistrationRecord] = await Promise.all([
      hashPassword(newPassword),
      buildOpaqueRegistrationRecordFromPassword(
        getOpaqueServerSetup(c.env),
        user.id as string,
        newPassword,
      ),
    ])

    await c.env.RUINABLA_DB.prepare(
      `UPDATE users
       SET password_hash = ?, opaque_registration_record = ?, updated_at = unixepoch()
       WHERE email = ?`,
    )
      .bind(passwordHash, opaqueRegistrationRecord, tokenRecord.email)
      .run()
    await c.env.RUINABLA_DB.prepare('DELETE FROM email_verification_tokens WHERE token = ?')
      .bind(token)
      .run()
    await c.env.RUINABLA_DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run()

    return c.json({
      success: true,
      message: 'Password reset successfully',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return c.json({ error: 'Failed to reset password' }, 500)
  }
})

export default auth
