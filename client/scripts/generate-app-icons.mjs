/**
 * Genererar portalens app-ikoner ur ETT märke: public/logo-icon.svg.
 *
 * Bakgrund (2026-08-26): de fyra ikonfilerna i public/ visade tre olika bilder.
 * pwa-512.png var en AI-genererad logotyp med förvanskad text ("VÄĜÊN TILL NYTT
 * JÔBB"), medan favicon-64, apple-touch-icon och pwa-192 var en stockbild på en
 * man med portfölj. Ingen av dem var märket i components/ui/Logo.tsx, som pekar
 * på /logo-icon.svg. Ikonerna renderas därför härifrån i stället för att laddas
 * upp för hand — då kan de inte glida isär igen.
 *
 * Kör: node scripts/generate-app-icons.mjs
 *
 * Två former:
 *  - rundad  → purpose "any" + favicon. Rundade hörn, transparent utanför.
 *  - fylld   → purpose "maskable" + apple-touch-icon. Bakgrunden går kant till
 *              kant, eftersom både Androids mask och iOS rundar hörnen själva.
 *              En rundad ikon under en mask ger transparenta hörn.
 *
 * Skriptet MÄTER säkerhetszonen på den färdiga bilden i stället för att lova
 * något om den: varje målad pixel i maskable-ikonen ska ligga inom en cirkel med
 * radien 40 % av bredden. Faller den kontrollen skrivs ingen fil.
 */

import sharp from 'sharp'
import { writeFile, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

// Märket, identiskt med public/logo-icon.svg. Hålls ihop av kontrollen nedan.
const GRON = '#155F47'
const GLYF = `
  <circle cx="587" cy="282" r="62" fill="#FFFFFF"/>
  <path d="M587 422 L587 677 A75 75 0 0 1 437 677" fill="none" stroke="#FFFFFF"
        stroke-width="105" stroke-linecap="round"/>`

const svg = (form) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024"${form === 'rundad' ? ' rx="220"' : ''} fill="${GRON}"/>${GLYF}
</svg>`

const IKONER = [
  { fil: 'pwa-192.png', storlek: 192, form: 'rundad' },
  { fil: 'pwa-512.png', storlek: 512, form: 'rundad' },
  { fil: 'pwa-maskable-192.png', storlek: 192, form: 'fylld', maskbar: true },
  { fil: 'pwa-maskable-512.png', storlek: 512, form: 'fylld', maskbar: true },
  { fil: 'apple-touch-icon.png', storlek: 180, form: 'fylld' },
  { fil: 'favicon-64.png', storlek: 64, form: 'rundad' },
]

/**
 * Mäter var glyfen faktiskt hamnade. Returnerar största avstånd från mitten till
 * en målad (vit) pixel, i andel av bredden.
 */
async function matSakerhetszon(buffer, storlek) {
  const { data } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const mitt = (storlek - 1) / 2
  let maxAvstand = 0
  for (let y = 0; y < storlek; y++) {
    for (let x = 0; x < storlek; x++) {
      const i = (y * storlek + x) * 4
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
      // Vitt märke mot mörkgrön botten: allt som är påtagligt ljust är glyf.
      const arGlyf = a > 32 && r > 150 && g > 150 && b > 150
      if (!arGlyf) continue
      const avstand = Math.hypot(x - mitt, y - mitt)
      if (avstand > maxAvstand) maxAvstand = avstand
    }
  }
  return maxAvstand / storlek
}

async function kontrolleraKalla() {
  const kalla = await readFile(join(publicDir, 'logo-icon.svg'), 'utf8')
  for (const bit of ['cx="587" cy="282" r="62"', 'M587 422 L587 677 A75 75 0 0 1 437 677', GRON]) {
    if (!kalla.includes(bit)) {
      throw new Error(
        `logo-icon.svg har ändrats — "${bit}" hittades inte.\n` +
          'Uppdatera GLYF/GRON i det här skriptet så ikonerna följer märket.'
      )
    }
  }
}

async function generera() {
  await kontrolleraKalla()

  for (const { fil, storlek, form, maskbar } of IKONER) {
    const buffer = await sharp(Buffer.from(svg(form)))
      .resize(storlek, storlek)
      .png({ compressionLevel: 9 })
      .toBuffer()

    if (maskbar) {
      const andel = await matSakerhetszon(buffer, storlek)
      if (andel > 0.4) {
        throw new Error(
          `${fil}: glyfen når ${(andel * 100).toFixed(1)} % från mitten, taket för ` +
            'maskable är 40 %. Skala ned märket eller ta bort purpose="maskable".'
        )
      }
      console.log(`  säkerhetszon ${fil}: ${(andel * 100).toFixed(1)} % av 40 % ✓`)
    }

    await writeFile(join(publicDir, fil), buffer)
    console.log(`✓ ${fil} — ${storlek}×${storlek}, ${form}, ${(buffer.length / 1024).toFixed(1)} kB`)
  }
}

generera().catch((fel) => {
  console.error(String(fel.message || fel))
  process.exit(1)
})
