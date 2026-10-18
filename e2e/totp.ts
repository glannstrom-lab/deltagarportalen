/**
 * TOTP-kod (RFC 6238, SHA-1, 30 s, 6 siffror) ur en base32-hemlighet — samma som
 * en autentiseringsapp räknar fram. För e2e-kontot som har tvåstegsinloggning på
 * (km-konsulent är chef, och chef/admin måste ha tvåsteg sedan 2026-10-18).
 * Hemligheten bor i TEST_CONSULTANT_TOTP_SECRET (GitHub-secret + .env.test.local).
 */
import { createHmac } from 'node:crypto'

const ALFABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function totpKod(hemlighet: string, tid = Date.now(), forskjutning = 0): string {
  let bitar = ''
  for (const c of hemlighet.replace(/=+$/, '').toUpperCase()) {
    const v = ALFABET.indexOf(c)
    if (v < 0) throw new Error('Ogiltig base32-hemlighet')
    bitar += v.toString(2).padStart(5, '0')
  }
  const nyckel = Buffer.from((bitar.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)))
  const raknare = Buffer.alloc(8)
  raknare.writeBigUInt64BE(BigInt(Math.floor(tid / 30_000) + forskjutning))
  const h = createHmac('sha1', nyckel).update(raknare).digest()
  const o = h[h.length - 1] & 15
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, '0')
}
