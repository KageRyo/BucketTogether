import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const KEY_LENGTH = 64

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, KEY_LENGTH) as Buffer
  return `scrypt$${salt}$${derivedKey.toString('hex')}`
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, salt, storedKey] = encoded.split('$')

  if (algorithm !== 'scrypt' || !salt || !storedKey) {
    return false
  }

  const storedBuffer = Buffer.from(storedKey, 'hex')
  const suppliedBuffer = await scrypt(password, salt, storedBuffer.length) as Buffer

  return storedBuffer.length === suppliedBuffer.length
    && timingSafeEqual(storedBuffer, suppliedBuffer)
}
