/**
 * zipLagring — en liten zip-skrivare utan komprimering (metod 0, "stored").
 *
 * Varför egen: portalen har inget zip-bibliotek som direkt beroende. `jszip`
 * och `fflate` ligger bara i node_modules som underberoenden till `docx` och
 * `jspdf`; att importera dem därifrån vore att bygga på något ingen deklarerat.
 * Innehållet i "Mitt underlag" är en PDF (redan komprimerad), en liten
 * kalenderfil och lite text — att packa om det sparar några kilobyte. Därför
 * lagras filerna som de är, och formatet blir ~100 rader i stället för ett
 * nytt beroende.
 *
 * Det som är lätt att göra fel i zip-formatet:
 *  - filnamn som inte är ASCII kräver allmän flagga bit 11 (UTF-8), annars
 *    visar Windows "Ã¥" i stället för "å"
 *  - CRC-32 räknas över innehållet och skrivs i BÅDE lokala headern och
 *    centralkatalogen
 *  - alla heltal är little-endian
 *  - DOS-datumet börjar 1980 och har två sekunders upplösning
 */

export interface ZipFil {
  namn: string
  data: Uint8Array
}

let crcTabell: Uint32Array | null = null

function tabell(): Uint32Array {
  if (crcTabell) return crcTabell
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  crcTabell = t
  return t
}

export function crc32(data: Uint8Array): number {
  const t = tabell()
  let c = 0xffffffff
  for (let i = 0; i < data.length; i++) c = t[(c ^ data[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function dosTid(d: Date): { tid: number; datum: number } {
  const ar = Math.max(1980, d.getFullYear())
  return {
    tid: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    datum: ((ar - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  }
}

/** Zip-filnamn: snedstreck som skiljetecken, inga bakstreck och inga ledande snedstreck. */
export function zipNamn(namn: string): string {
  return namn.replace(/[\\]/g, '/').replace(/^[/]+/, '')
}

export function byggZip(filer: readonly ZipFil[], nu: Date = new Date()): Uint8Array {
  const kodare = new TextEncoder()
  const { tid, datum } = dosTid(nu)
  const delar: Uint8Array[] = []
  const central: Uint8Array[] = []
  let forskjutning = 0

  for (const fil of filer) {
    const namn = kodare.encode(zipNamn(fil.namn))
    const crc = crc32(fil.data)
    const storlek = fil.data.length

    const lokal = new DataView(new ArrayBuffer(30))
    lokal.setUint32(0, 0x04034b50, true)
    lokal.setUint16(4, 20, true) // version som krävs
    lokal.setUint16(6, 0x0800, true) // bit 11: UTF-8-namn
    lokal.setUint16(8, 0, true) // metod 0 = stored
    lokal.setUint16(10, tid, true)
    lokal.setUint16(12, datum, true)
    lokal.setUint32(14, crc, true)
    lokal.setUint32(18, storlek, true)
    lokal.setUint32(22, storlek, true)
    lokal.setUint16(26, namn.length, true)
    lokal.setUint16(28, 0, true)
    delar.push(new Uint8Array(lokal.buffer), namn, fil.data)

    const post = new DataView(new ArrayBuffer(46))
    post.setUint32(0, 0x02014b50, true)
    post.setUint16(4, 20, true) // skapad med version
    post.setUint16(6, 20, true)
    post.setUint16(8, 0x0800, true)
    post.setUint16(10, 0, true)
    post.setUint16(12, tid, true)
    post.setUint16(14, datum, true)
    post.setUint32(16, crc, true)
    post.setUint32(20, storlek, true)
    post.setUint32(24, storlek, true)
    post.setUint16(28, namn.length, true)
    post.setUint32(42, forskjutning, true)
    central.push(new Uint8Array(post.buffer), namn)

    forskjutning += 30 + namn.length + storlek
  }

  const centralStorlek = central.reduce((s, d) => s + d.length, 0)
  const slut = new DataView(new ArrayBuffer(22))
  slut.setUint32(0, 0x06054b50, true)
  slut.setUint16(8, filer.length, true)
  slut.setUint16(10, filer.length, true)
  slut.setUint32(12, centralStorlek, true)
  slut.setUint32(16, forskjutning, true)

  const alla = [...delar, ...central, new Uint8Array(slut.buffer)]
  const ut = new Uint8Array(alla.reduce((s, d) => s + d.length, 0))
  let pos = 0
  for (const d of alla) {
    ut.set(d, pos)
    pos += d.length
  }
  return ut
}
