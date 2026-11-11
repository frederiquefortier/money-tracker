import { createHmac } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { AUTH_DIR } from './account'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const LAST_CODE_FILE = `${AUTH_DIR}/last-code.txt`

function base32Decode(text: string): Buffer {
  let bits = ''
  for (const char of text.replace(/=+$/, '').toUpperCase())
    bits += ALPHABET.indexOf(char).toString(2).padStart(5, '0')
  const bytes: Array<number> = []
  for (let i = 0; i + 8 <= bits.length; i += 8)
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

/** RFC 6238 with the defaults Supabase uses: SHA-1, 30 seconds, 6 digits. */
export function totpCode(secret: string, at = Date.now()): string {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)))
  const hmac = createHmac('sha1', base32Decode(secret)).update(counter).digest()
  const offset = (hmac[hmac.length - 1] ?? 0) & 0x0f
  const value = hmac.readUInt32BE(offset) & 0x7fffffff
  return String(value % 1_000_000).padStart(6, '0')
}

/**
 * A code the server has not seen yet. Auth refuses a code used twice, so a second
 * sign-in in the same 30 second window waits for the next one.
 */
export async function freshCode(secret: string): Promise<string> {
  const last = existsSync(LAST_CODE_FILE)
    ? readFileSync(LAST_CODE_FILE, 'utf8')
    : ''
  let code = totpCode(secret)
  while (code === last) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    code = totpCode(secret)
  }
  writeFileSync(LAST_CODE_FILE, code)
  return code
}
