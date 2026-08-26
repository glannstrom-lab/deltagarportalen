/**
 * App-ikonerna mot manifestet (2026-08-26).
 *
 * ## Varför den här filen finns
 *
 * Ikonerna i `public/` hade glidit isär till tre olika bilder: `pwa-512.png` var
 * en AI-genererad logotyp med förvanskad text ("VÄĜÊN TILL NYTT JÔBB"), medan
 * `favicon-64`, `apple-touch-icon` och `pwa-192` var en stockbild på en man med
 * portfölj. Ingen av dem var märket i `components/ui/Logo.tsx`. Det syntes aldrig
 * så länge manifestet var olänkat — sedan O2 hamnar de på folks hemskärmar.
 *
 * Ikonerna genereras numera ur `public/logo-icon.svg` av
 * `scripts/generate-app-icons.mjs`. Det här testet vaktar tre saker som inte går
 * att se på en filnamnslista:
 *
 * 1. Varje `src` i manifestet pekar på en fil som finns.
 * 2. Ikonerna är kvadratiska och har den storlek manifestet påstår. Ett
 *    `sizes: "512x512"` bredvid en 192-bild är ett påstående utan täckning.
 * 3. Varje ikon märkt `purpose: "maskable"` håller säkerhetszonen — all glyf
 *    inom en cirkel med radien 40 % av bredden. Utan den kontrollen är
 *    `maskable` en gissning, och Androids mask skär av märket.
 *
 * Testet kan falla: byt `pwa-maskable-512.png` mot `pwa-512.png` (rundad, men i
 * övrigt samma bild) och punkt 3 står kvar grön — byt den mot en ikon där glyfen
 * går ut i kanten och den faller. Punkt 2 faller om man skalar om en fil för hand.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const publicDir = join(__dirname, '..', '..', 'public')

type Ikon = { src: string; sizes: string; type: string; purpose?: string }

const manifest = JSON.parse(readFileSync(join(publicDir, 'manifest.json'), 'utf8')) as {
  icons: Ikon[]
  theme_color: string
}

/** Läser bredd och höjd ur PNG-huvudet (IHDR ligger alltid på byte 16–24). */
function pngMatt(buffer: Buffer): { bredd: number; hojd: number } {
  const signatur = buffer.subarray(0, 8).toString('hex')
  if (signatur !== '89504e470d0a1a0a') throw new Error('inte en PNG')
  return { bredd: buffer.readUInt32BE(16), hojd: buffer.readUInt32BE(20) }
}

describe('app-ikonerna', () => {
  it('manifestet listar minst en any- och en maskable-ikon', () => {
    const syften = manifest.icons.map((i) => i.purpose)
    expect(syften).toContain('any')
    expect(syften).toContain('maskable')
  })

  it.each(manifest.icons.map((i) => [i.src, i] as const))('%s finns och har rätt mått', (_src, ikon) => {
    const buffer = readFileSync(join(publicDir, ikon.src.replace(/^\//, '')))
    const { bredd, hojd } = pngMatt(buffer)
    expect(bredd).toBe(hojd)
    expect(`${bredd}x${hojd}`).toBe(ikon.sizes)
  })

  it.each(manifest.icons.filter((i) => i.purpose === 'maskable').map((i) => [i.src, i] as const))(
    '%s håller maskable-säkerhetszonen',
    async (_src, ikon) => {
      const sharp = (await import('sharp')).default
      const buffer = readFileSync(join(publicDir, ikon.src.replace(/^\//, '')))
      const { bredd } = pngMatt(buffer)
      const { data } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

      const mitt = (bredd - 1) / 2
      let maxAvstand = 0
      for (let y = 0; y < bredd; y++) {
        for (let x = 0; x < bredd; x++) {
          const i = (y * bredd + x) * 4
          const arGlyf = data[i + 3] > 32 && data[i] > 150 && data[i + 1] > 150 && data[i + 2] > 150
          if (!arGlyf) continue
          const avstand = Math.hypot(x - mitt, y - mitt)
          if (avstand > maxAvstand) maxAvstand = avstand
        }
      }

      // Glyfen ska finnas — annars mäter vi en tom bild och testet blir grönt av fel skäl.
      expect(maxAvstand).toBeGreaterThan(bredd * 0.1)
      expect(maxAvstand / bredd).toBeLessThanOrEqual(0.4)
    }
  )

  it('theme_color är hubbfärgen, inte indigo från den gamla designen', () => {
    expect(manifest.theme_color.toLowerCase()).not.toBe('#4f46e5')
  })
})
