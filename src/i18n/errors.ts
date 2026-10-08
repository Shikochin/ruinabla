import i18n from '@/i18n'

// The API currently returns English messages rather than stable error codes.
// Keep that transport contract intact and translate only at the display boundary.
const apiErrorKeys: Record<string, string> = {
  'Invalid credentials': 'errors.invalidCredentials',
  'Invalid password': 'auth.security.reauth.messages.invalidPassword',
  'Email already registered': 'errors.emailRegistered',
  'Email already verified': 'errors.emailVerified',
  'Please verify your email first': 'errors.emailUnverified',
  'User not found': 'errors.userNotFound',
  Unauthorized: 'common.sessionExpired',
  'Invalid or expired session': 'common.sessionExpired',
  Forbidden: 'errors.forbidden',
  'Authentication challenge expired': 'errors.expired',
  'Registration attempt not found or expired': 'errors.expired',
  'Reset attempt not found or expired': 'errors.expired',
  'Invalid or expired token': 'errors.expired',
  'Token has expired': 'errors.expired',
  'Invalid reauthentication attempt': 'errors.reauthRequired',
  'Recent reauthentication is required': 'errors.reauthRequired',
  'Recent reauthentication is required to disable TOTP': 'errors.reauthRequired',
  'OPAQUE reauthentication is unavailable. Please log in again.': 'errors.passwordUnavailable',
  'Password confirmation is unavailable for this account': 'errors.passwordUnavailable',
  'Password must be at least 8 characters': 'auth.register.errors.passwordTooShort',
  'Invalid TOTP code': 'auth.security.totp.messages.invalidCode',
  'TOTP is already enabled': 'errors.totpEnabled',
  'TOTP is not enabled': 'errors.totpDisabled',
  'TOTP not enabled for this user': 'errors.totpDisabled',
  'No TOTP setup found. Call /enable first': 'errors.totpSetup',
  'Passkey not found': 'errors.passkeyNotFound',
  'Passkey not found or does not belong to this user': 'errors.passkeyNotFound',
  'Invalid credential data': 'errors.invalidRequest',
  'Invalid request data': 'errors.invalidRequest',
  'No file uploaded': 'errors.noImage',
  'File must be an image': 'errors.imageRequired',
  'Image upload failed': 'editor.messages.uploadFailed',
  'Failed to register passkey': 'auth.security.passkeys.messages.registerFailed',
  'Failed to get 2FA options': 'auth.login.messages.passkeyOptionsFailed',
  'Login failed': 'auth.login.messages.failed',
  'Failed to start login': 'auth.login.messages.failed',
  'Registration failed': 'auth.register.messages.failed',
  'Failed to start registration': 'auth.register.messages.failed',
  'Failed to start reauthentication': 'auth.security.reauth.messages.startFailed',
  'Verification failed': 'auth.verifyEmail.genericError',
  'Failed to resend verification email': 'auth.register.messages.resendFailed',
  'Failed to send reset email': 'auth.forgotPassword.error',
  'Failed to start password reset': 'auth.resetPassword.error',
  'Failed to reset password': 'auth.resetPassword.error',
}

export function localizeApiError(error: unknown, fallbackKey = 'errors.generic'): string {
  const key = typeof error === 'string' ? apiErrorKeys[error] : undefined
  return i18n.global.t(key ?? fallbackKey)
}
