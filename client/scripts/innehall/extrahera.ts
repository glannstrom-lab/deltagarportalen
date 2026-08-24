/**
 * Extraherar översättbar innehållstext ur datamodulerna till platta manifest.
 * Kör: npx tsx scripts/innehall/extrahera.ts [utkatalog]
 *
 * Manifesten är UNDERLAG för översättning och committas inte — grinden
 * (`innehallsparitet.test.ts`) räknar fram nycklarna på nytt vid varje körning,
 * så det finns ingen stale fil att glömma uppdatera.
 */
/* eslint-disable no-console -- utskriften är verktygets utdata, inte felsökningsrester */
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { gaIgenomTexter } from '../../src/lib/innehallsOversattning'
import { INNEHALLSMODULER } from '../../src/data/oversattningar/register'

const utkatalog = process.argv[2] ?? join(import.meta.dirname, '../../innehall-manifest')
mkdirSync(utkatalog, { recursive: true })

let totalt = 0
for (const modul of INNEHALLSMODULER) {
  const data = await modul.ladda()
  const manifest: Record<string, string> = {}
  for (const [namn, varde] of Object.entries(data)) {
    gaIgenomTexter(varde, (nyckel, text) => { manifest[nyckel] = text }, namn)
  }
  const antal = Object.keys(manifest).length
  totalt += antal
  writeFileSync(join(utkatalog, `${modul.namn}.sv.json`), JSON.stringify(manifest, null, 2), 'utf8')
  const tecken = Object.values(manifest).reduce((s, t) => s + t.length, 0)
  console.log(`${modul.namn.padEnd(24)} ${String(antal).padStart(5)} strängar  ${String(Math.round(tecken / 1000)).padStart(4)} k tecken`)
}
console.log(`\nTotalt ${totalt} strängar → ${utkatalog}`)
