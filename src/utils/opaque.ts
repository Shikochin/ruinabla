import { client as opaqueClient, ready as opaqueReady } from '@serenity-kit/opaque'

export type OpaqueRegistrationStartResult = {
  clientRegistrationState: string
  registrationRequest: string
}

export type OpaqueRegistrationFinishParams = {
  password: string
  registrationResponse: string
  clientRegistrationState: string
}

export type OpaqueLoginStartResult = {
  clientLoginState: string
  startLoginRequest: string
}

export type OpaqueLoginFinishParams = {
  password: string
  loginResponse: string
  clientLoginState: string
}

export async function ensureOpaqueReady(): Promise<void> {
  await opaqueReady
}

export async function startOpaqueRegistration(
  password: string,
): Promise<OpaqueRegistrationStartResult> {
  await ensureOpaqueReady()
  return opaqueClient.startRegistration({ password })
}

export async function finishOpaqueRegistration({
  password,
  registrationResponse,
  clientRegistrationState,
}: OpaqueRegistrationFinishParams) {
  await ensureOpaqueReady()
  return opaqueClient.finishRegistration({
    password,
    registrationResponse,
    clientRegistrationState,
  })
}

export async function startOpaqueLogin(password: string): Promise<OpaqueLoginStartResult> {
  await ensureOpaqueReady()
  return opaqueClient.startLogin({ password })
}

export async function finishOpaqueLogin({
  password,
  loginResponse,
  clientLoginState,
}: OpaqueLoginFinishParams) {
  await ensureOpaqueReady()
  return opaqueClient.finishLogin({
    password,
    loginResponse,
    clientLoginState,
  })
}
