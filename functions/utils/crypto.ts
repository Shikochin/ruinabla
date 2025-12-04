/**
 * Crypto utilities
 */

// Generate cryptographically secure random ID
export function generateId(length: number = 32): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// PBKDF2 password hashing
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  const hashArray = new Uint8Array(derivedBits)
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const hashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return `${saltHex}:${hashHex}`
}

// Verify password against hash
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':')
  if (!saltHex || !hashHex) return false

  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)))
  const storedHashBytes = new Uint8Array(hashHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)))

  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  const hashArray = new Uint8Array(derivedBits)

  // Constant-time comparison
  if (hashArray.length !== storedHashBytes.length) return false
  let result = 0
  for (let i = 0; i < hashArray.length; i++) {
    result |= hashArray[i]! ^ storedHashBytes[i]!
  }
  return result === 0
}

// Base32 encoding for TOTP
const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buffer: Uint8Array): string {
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]!
    bits += 8

    while (bits >= 5) {
      output += base32Chars[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += base32Chars[(value << (5 - bits)) & 31]
  }

  return output
}

function base32Decode(base32: string): Uint8Array {
  const cleanedInput = base32.toUpperCase().replace(/=+$/, '')
  let bits = 0
  let value = 0
  let index = 0
  const output = new Uint8Array(Math.ceil((cleanedInput.length * 5) / 8))

  for (let i = 0; i < cleanedInput.length; i++) {
    const char = cleanedInput[i]
    const charValue = base32Chars.indexOf(char!)
    if (charValue === -1) throw new Error('Invalid base32 character')

    value = (value << 5) | charValue
    bits += 5

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255
      bits -= 8
    }
  }

  return output.slice(0, index)
}

// Generate TOTP secret
export function generateTOTPSecret(): string {
  const secret = crypto.getRandomValues(new Uint8Array(20))
  return base32Encode(secret)
}

// HOTP/TOTP implementation
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message)
  return new Uint8Array(signature)
}

async function hotp(secret: Uint8Array, counter: number): Promise<string> {
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  view.setBigUint64(0, BigInt(counter), false)

  return hmacSha1(secret, new Uint8Array(buffer)).then((hmac) => {
    const offset = hmac[hmac.length - 1]! & 0x0f
    const binary =
      ((hmac[offset]! & 0x7f) << 24) |
      (hmac[offset + 1]! << 16) |
      (hmac[offset + 2]! << 8) |
      hmac[offset + 3]!

    const otp = binary % 1000000
    return otp.toString().padStart(6, '0')
  })
}

// Verify TOTP code
export async function verifyTOTP(
  secret: string,
  token: string,
  window: number = 1,
): Promise<boolean> {
  const secretBytes = base32Decode(secret)
  const now = Math.floor(Date.now() / 1000)
  const timeStep = 30
  const counter = Math.floor(now / timeStep)

  // Check current time window and adjacent windows
  for (let i = -window; i <= window; i++) {
    const expectedToken = await hotp(secretBytes, counter + i)
    if (expectedToken === token) {
      return true
    }
  }

  return false
}

// Generate TOTP URI for QR code
export function generateTOTPUri(
  secret: string,
  email: string,
  issuer: string = 'Ruinabla',
): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`
}

// Generate backup codes
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = generateId(4) // 8 character codes
    codes.push(code.toUpperCase())
  }
  return codes
}
