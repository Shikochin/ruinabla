import type { D1Database } from '@cloudflare/workers-types'
import { generateId } from './crypto'

export const KRTL_ISSUER = 'https://krtl.net'
export const KRTL_AUTHORIZATION_ENDPOINT = 'https://krtl.net/oauth/authorize'
export const KRTL_TOKEN_ENDPOINT = 'https://krtl.net/v0/oauth/token'
export const KRTL_USERINFO_ENDPOINT = 'https://krtl.net/v0/oauth/userinfo'
export const KRTL_JWKS_ENDPOINT = 'https://krtl.net/.well-known/jwks.json'
export const KRTL_REDIRECT_URI = 'https://shikoch.in/oidc/callback'
export const KRTL_SCOPES = 'openid profile email'

const encoder = new TextEncoder()

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

export async function createKrtlLoginAttempt(
  db: D1Database,
  redirectPath: string,
): Promise<{ state: string; verifier: string; nonce: string }> {
  const state = generateId(32)
  const verifier = generateId(32)
  const nonce = generateId(32)
  const stateHash = base64Url(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(state))),
  )
  const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60

  await db
    .prepare(
      `INSERT INTO krtl_login_attempts
       (state_hash, code_verifier, nonce, redirect_path, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(stateHash, verifier, nonce, redirectPath, expiresAt)
    .run()

  return { state, verifier, nonce }
}

export async function createKrtlLinkAttempt(
  db: D1Database,
  userId: string,
  redirectPath: string,
): Promise<{ state: string; verifier: string; nonce: string }> {
  const state = generateId(32)
  const verifier = generateId(32)
  const nonce = generateId(32)
  const stateHash = base64Url(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(state))),
  )
  const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60

  await db
    .prepare(
      `INSERT INTO krtl_login_attempts
       (state_hash, code_verifier, nonce, redirect_path, expires_at, mode, user_id)
       VALUES (?, ?, ?, ?, ?, 'link', ?)`,
    )
    .bind(stateHash, verifier, nonce, redirectPath, expiresAt, userId)
    .run()

  return { state, verifier, nonce }
}

export async function consumeKrtlLoginAttempt(db: D1Database, state: string) {
  const stateHash = base64Url(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(state))),
  )
  return db
    .prepare(
      `DELETE FROM krtl_login_attempts
       WHERE state_hash = ? AND expires_at > unixepoch()
       RETURNING state_hash, code_verifier, nonce, redirect_path, expires_at, mode, user_id`,
    )
    .bind(stateHash)
    .first<{
      state_hash: string
      code_verifier: string
      nonce: string
      redirect_path: string
      expires_at: number
      mode?: 'login' | 'link'
      user_id?: string | null
    }>()
}

export async function exchangeKrtlCode(
  code: string,
  verifier: string,
  clientId: string,
  clientSecret: string,
) {
  const response = await fetch(KRTL_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: KRTL_REDIRECT_URI,
      code_verifier: verifier,
    }),
  })

  if (!response.ok) {
    console.error('KRTL token exchange failed:', response.status)
    throw new Error('KRTL token exchange failed')
  }

  const data = (await response.json()) as {
    access_token?: string
    id_token?: string
    token_type?: string
  }
  if (!data.access_token || !data.id_token) throw new Error('KRTL token response is incomplete')
  return data
}

export async function verifyKrtlIdToken(
  idToken: string,
  expectedNonce: string,
  clientId: string,
): Promise<Record<string, unknown>> {
  const parts = idToken.split('.')
  if (parts.length !== 3) throw new Error('Invalid KRTL ID token')

  let header: { alg?: string; kid?: string }
  let claims: Record<string, unknown>
  try {
    header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0]!)))
    claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]!)))
  } catch {
    throw new Error('Invalid KRTL ID token')
  }
  if (header.alg !== 'RS256') throw new Error('Unsupported KRTL ID token algorithm')

  const jwksResponse = await fetch(KRTL_JWKS_ENDPOINT)
  if (!jwksResponse.ok) throw new Error('KRTL JWKS unavailable')
  const jwks = (await jwksResponse.json()) as { keys?: JsonWebKey[] }
  if (!header.kid) throw new Error('KRTL signing key id is missing')
  const jwk = jwks.keys?.find((key) => {
    const candidate = key as JsonWebKey & { kid?: string; alg?: string; use?: string }
    return (
      candidate.kid === header.kid &&
      candidate.kty === 'RSA' &&
      (!candidate.alg || candidate.alg === 'RS256') &&
      (!candidate.use || candidate.use === 'sig')
    )
  })
  if (!jwk) throw new Error('KRTL signing key not found')

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    decodeBase64Url(parts[2]!),
    encoder.encode(`${parts[0]}.${parts[1]}`),
  )
  if (!valid) throw new Error('Invalid KRTL ID token signature')

  const now = Math.floor(Date.now() / 1000)
  const audience = claims.aud
  const audienceMatches =
    audience === clientId || (Array.isArray(audience) && audience.includes(clientId))
  const authorizedParty = claims.azp
  const azpValid = !Array.isArray(audience) || authorizedParty === clientId
  if (
    claims.iss !== KRTL_ISSUER ||
    !audienceMatches ||
    !azpValid ||
    claims.nonce !== expectedNonce
  ) {
    throw new Error('Invalid KRTL ID token claims')
  }
  if (typeof claims.exp !== 'number' || claims.exp <= now) throw new Error('Expired KRTL ID token')
  if (typeof claims.iat !== 'number' || claims.iat > now + 60)
    throw new Error('Invalid KRTL ID token time')
  return claims
}

export async function fetchKrtlUserInfo(accessToken: string) {
  const response = await fetch(KRTL_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error('KRTL userinfo request failed')
  return (await response.json()) as Record<string, unknown>
}
