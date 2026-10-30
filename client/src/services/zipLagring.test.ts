import { describe, it, expect } from 'vitest'
import { byggZip, crc32, zipNamn } from './zipLagring'

const enc = (s: string) => new TextEncoder().encode(s)

/** Läser en zip bakifrån via centralkatalogen — samma väg som ett riktigt zip-program. */
function lasZip(zip: Uint8Array) {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength)
  const eocd = zip.length - 22
  expect(v.getUint32(eocd, true)).toBe(0x06054b50)
  const antal = v.getUint16(eocd + 10, true)
  let pos = v.getUint32(eocd + 16, true)
  const ut: Array<{ namn: string; text: string; crc: number; flagga: number }> = []
  for (let i = 0; i < antal; i++) {
    expect(v.getUint32(pos, true)).toBe(0x02014b50)
    const flagga = v.getUint16(pos + 8, true)
    const crc = v.getUint32(pos + 16, true)
    const storlek = v.getUint32(pos + 24, true)
    const nl = v.getUint16(pos + 28, true)
    const lokalPos = v.getUint32(pos + 42, true)
    const namn = new TextDecoder().decode(zip.subarray(pos + 46, pos + 46 + nl))
    expect(v.getUint32(lokalPos, true)).toBe(0x04034b50)
    const lnl = v.getUint16(lokalPos + 26, true)
    const start = lokalPos + 30 + lnl
    const data = zip.subarray(start, start + storlek)
    expect(crc32(data)).toBe(crc)
    ut.push({ namn, text: new TextDecoder().decode(data), crc, flagga })
    pos += 46 + nl
  }
  return ut
}

describe('zipLagring', () => {
  it('crc32 ger det kända testvärdet', () => {
    expect(crc32(enc('123456789'))).toBe(0xcbf43926)
  })

  it('rundar filer med svenska tecken i namn och innehåll', () => {
    const zip = byggZip([
      { namn: 'Läs mig.txt', data: enc('Hej åäö') },
      { namn: 'Veckan.ics', data: enc('BEGIN:VCALENDAR') },
    ])
    const filer = lasZip(zip)
    expect(filer.map((f) => f.namn)).toEqual(['Läs mig.txt', 'Veckan.ics'])
    expect(filer[0].text).toBe('Hej åäö')
    expect(filer[0].flagga & 0x0800).toBe(0x0800)
  })

  it('en tom zip är giltig', () => {
    expect(lasZip(byggZip([]))).toEqual([])
  })

  it('normaliserar bakstreck och ledande snedstreck i namn', () => {
    expect(zipNamn('\\a\\b.txt')).toBe('a/b.txt')
  })
})
