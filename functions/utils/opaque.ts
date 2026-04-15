import {
  client as opaqueClient,
  ready as opaqueReady,
  server as opaqueServer,
} from '@serenity-kit/opaque'
import { D1Database } from '@cloudflare/workers-types'
import { generateId } from './crypto'

export const OPAQUE_ATTEMPT_TTL_SECONDS = 5 * 60
export const PENDING_AUTH_TTL_SECONDS = 5 * 60
export const REAUTH_WINDOW_SECONDS = 5 * 60

export type OpaqueRegistrationAttemptPurpose = 'register' | 'reset_password'
export type OpaqueLoginAttemptPurpose = 'login' | 'reauth'

type OpaqueEnv = {
  OPAQUE_SERVER_SETUP?: string
}

export type OpaqueRegistrationAttempt = {
  id: string
  userId: string
  email: string
  purpose: OpaqueRegistrationAttemptPurpose
  token: string | null
  expiresAt: number
}

export type OpaqueLoginAttempt = {
  id: string
  userId: string | null
  purpose: OpaqueLoginAttemptPurpose
  serverLoginState: string
  hasOpaqueRecord: boolean
  sessionDurationDays: number | null
  expiresAt: number
}

export type PendingAuthChallenge = {
  id: string
  userId: string
  sessionDurationDays: number
  expiresAt: number
}

export async function ensureOpaqueReady(): Promise<void> {
  await opaqueReady
}

export function getOpaqueServerSetup(env: OpaqueEnv): string {
  if (!env.OPAQUE_SERVER_SETUP) {
    throw new Error('OPAQUE_SERVER_SETUP is required')
  }

  return env.OPAQUE_SERVER_SETUP
}

export async function buildOpaqueRegistrationRecordFromPassword(
  serverSetup: string,
  userIdentifier: string,
  password: string,
): Promise<string> {
  await ensureOpaqueReady()

  const { clientRegistrationState, registrationRequest } = opaqueClient.startRegistration({
    password,
  })
  const { registrationResponse } = opaqueServer.createRegistrationResponse({
    serverSetup,
    userIdentifier,
    registrationRequest,
  })
  const { registrationRecord } = opaqueClient.finishRegistration({
    password,
    registrationResponse,
    clientRegistrationState,
  })

  return registrationRecord
}

export async function createOpaqueRegistrationResponse(
  serverSetup: string,
  userIdentifier: string,
  registrationRequest: string,
): Promise<string> {
  await ensureOpaqueReady()

  return opaqueServer.createRegistrationResponse({
    serverSetup,
    userIdentifier,
    registrationRequest,
  }).registrationResponse
}

export async function createOpaqueLoginResponse(
  serverSetup: string,
  userIdentifier: string,
  registrationRecord: string | null | undefined,
  startLoginRequest: string,
): Promise<{ loginResponse: string; serverLoginState: string }> {
  await ensureOpaqueReady()

  return opaqueServer.startLogin({
    serverSetup,
    userIdentifier,
    registrationRecord,
    startLoginRequest,
  })
}

export async function finishOpaqueLogin(
  serverLoginState: string,
  finishLoginRequest: string,
): Promise<string> {
  await ensureOpaqueReady()

  return opaqueServer.finishLogin({
    serverLoginState,
    finishLoginRequest,
  }).sessionKey
}

export function getSessionDurationDays(remember: boolean): number {
  return remember ? 365 : 31
}

export function getReauthExpiresAt(now: number = Math.floor(Date.now() / 1000)): number {
  return now + REAUTH_WINDOW_SECONDS
}

export function isRecentReauthenticationValid(
  reauthenticatedAt: number | null,
  now: number = Math.floor(Date.now() / 1000),
): boolean {
  return reauthenticatedAt !== null && reauthenticatedAt + REAUTH_WINDOW_SECONDS > now
}

export async function cleanupOpaqueArtifacts(db: D1Database): Promise<void> {
  await Promise.all([
    db.prepare('DELETE FROM opaque_registration_attempts WHERE expires_at <= unixepoch()').run(),
    db.prepare('DELETE FROM opaque_login_attempts WHERE expires_at <= unixepoch()').run(),
    db.prepare('DELETE FROM pending_auth_challenges WHERE expires_at <= unixepoch()').run(),
  ])
}

export async function createOpaqueRegistrationAttempt(
  db: D1Database,
  attempt: Omit<OpaqueRegistrationAttempt, 'id' | 'expiresAt'>,
): Promise<OpaqueRegistrationAttempt> {
  const id = generateId(16)
  const expiresAt = Math.floor(Date.now() / 1000) + OPAQUE_ATTEMPT_TTL_SECONDS

  await db
    .prepare(
      `INSERT INTO opaque_registration_attempts
         (id, user_id, email, purpose, token, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, attempt.userId, attempt.email, attempt.purpose, attempt.token, expiresAt)
    .run()

  return {
    id,
    userId: attempt.userId,
    email: attempt.email,
    purpose: attempt.purpose,
    token: attempt.token,
    expiresAt,
  }
}

export async function consumeOpaqueRegistrationAttempt(
  db: D1Database,
  id: string,
  purpose: OpaqueRegistrationAttemptPurpose,
): Promise<OpaqueRegistrationAttempt | null> {
  const attempt = await db
    .prepare(
      `SELECT id, user_id, email, purpose, token, expires_at
       FROM opaque_registration_attempts
       WHERE id = ? AND purpose = ? AND expires_at > unixepoch()`,
    )
    .bind(id, purpose)
    .first()

  if (!attempt) {
    return null
  }

  await db.prepare('DELETE FROM opaque_registration_attempts WHERE id = ?').bind(id).run()

  return {
    id: attempt.id as string,
    userId: attempt.user_id as string,
    email: attempt.email as string,
    purpose: attempt.purpose as OpaqueRegistrationAttemptPurpose,
    token: (attempt.token as string | null) ?? null,
    expiresAt: Number(attempt.expires_at),
  }
}

export async function createOpaqueLoginAttempt(
  db: D1Database,
  attempt: Omit<OpaqueLoginAttempt, 'id' | 'expiresAt'>,
): Promise<OpaqueLoginAttempt> {
  const id = generateId(16)
  const expiresAt = Math.floor(Date.now() / 1000) + OPAQUE_ATTEMPT_TTL_SECONDS

  await db
    .prepare(
      `INSERT INTO opaque_login_attempts
         (id, user_id, purpose, server_login_state, has_opaque_record, session_duration_days, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      attempt.userId,
      attempt.purpose,
      attempt.serverLoginState,
      attempt.hasOpaqueRecord,
      attempt.sessionDurationDays,
      expiresAt,
    )
    .run()

  return {
    id,
    userId: attempt.userId,
    purpose: attempt.purpose,
    serverLoginState: attempt.serverLoginState,
    hasOpaqueRecord: attempt.hasOpaqueRecord,
    sessionDurationDays: attempt.sessionDurationDays,
    expiresAt,
  }
}

export async function consumeOpaqueLoginAttempt(
  db: D1Database,
  id: string,
  purpose: OpaqueLoginAttemptPurpose,
): Promise<OpaqueLoginAttempt | null> {
  const attempt = await db
    .prepare(
      `SELECT id, user_id, purpose, server_login_state, has_opaque_record, session_duration_days, expires_at
       FROM opaque_login_attempts
       WHERE id = ? AND purpose = ? AND expires_at > unixepoch()`,
    )
    .bind(id, purpose)
    .first()

  if (!attempt) {
    return null
  }

  await db.prepare('DELETE FROM opaque_login_attempts WHERE id = ?').bind(id).run()

  return {
    id: attempt.id as string,
    userId: (attempt.user_id as string | null) ?? null,
    purpose: attempt.purpose as OpaqueLoginAttemptPurpose,
    serverLoginState: attempt.server_login_state as string,
    hasOpaqueRecord: Boolean(attempt.has_opaque_record),
    sessionDurationDays:
      typeof attempt.session_duration_days === 'number'
        ? attempt.session_duration_days
        : attempt.session_duration_days === null
          ? null
          : Number(attempt.session_duration_days),
    expiresAt: Number(attempt.expires_at),
  }
}

export async function createPendingAuthChallenge(
  db: D1Database,
  userId: string,
  sessionDurationDays: number,
): Promise<PendingAuthChallenge> {
  const id = generateId(16)
  const expiresAt = Math.floor(Date.now() / 1000) + PENDING_AUTH_TTL_SECONDS

  await db
    .prepare(
      `INSERT INTO pending_auth_challenges
         (id, user_id, session_duration_days, expires_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(id, userId, sessionDurationDays, expiresAt)
    .run()

  return {
    id,
    userId,
    sessionDurationDays,
    expiresAt,
  }
}

export async function getPendingAuthChallenge(
  db: D1Database,
  id: string,
): Promise<PendingAuthChallenge | null> {
  const challenge = await db
    .prepare(
      `SELECT id, user_id, session_duration_days, expires_at
       FROM pending_auth_challenges
       WHERE id = ? AND expires_at > unixepoch()`,
    )
    .bind(id)
    .first()

  if (!challenge) {
    return null
  }

  return {
    id: challenge.id as string,
    userId: challenge.user_id as string,
    sessionDurationDays: Number(challenge.session_duration_days),
    expiresAt: Number(challenge.expires_at),
  }
}

export async function consumePendingAuthChallenge(
  db: D1Database,
  id: string,
): Promise<PendingAuthChallenge | null> {
  const challenge = await getPendingAuthChallenge(db, id)

  if (!challenge) {
    return null
  }

  await db.prepare('DELETE FROM pending_auth_challenges WHERE id = ?').bind(id).run()

  return challenge
}
