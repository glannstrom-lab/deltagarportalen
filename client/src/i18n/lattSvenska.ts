/**
 * Lätt svenska (KM11) — ett val i språkväljaren som byter ut texterna i
 * deltagarens känsligaste vyer (Min vecka, samtyckesfrågan om konsulenten,
 * hubbkortet) mot enklare svenska. Allt annat faller tillbaka på vanlig svenska.
 *
 * Varför inte ett eget i18next-språk ('sv-latt'): i18next tolkar delen efter
 * bindestrecket som region, `document.documentElement.lang` skulle få en ogiltig
 * BCP 47-tagg, och paritetsgrinden sv/en känner bara två filer. I stället läggs
 * `sv-latt.json` OVANPÅ sv-bundlen (`addResourceBundle` med deep + overwrite) och
 * tas bort igen genom att de överskrivna nycklarna återställs ur sv.json.
 *
 * Valet sparas i localStorage (`lattSvenska`), inte i user_preferences —
 * kolumnen finns inte, och ett språkval per enhet räcker för piloten.
 *
 * Arabiska/somaliska/tigrinja/dari för samma vyer kräver en människa som
 * översätter; mekanismen här (en överläggsfil per språk) är förberedd för det.
 */

import i18n from 'i18next'
import sv from './locales/sv.json'
import latt from './locales/sv-latt.json'

export const LATT_SVENSKA_NYCKEL = 'lattSvenska'
/** Koden språkväljaren använder för valet. Är INTE ett i18next-språk. */
export const LATT_SVENSKA_KOD = 'sv-latt'

type Tree = { [k: string]: unknown }

function utanKommentar(o: Tree): Tree {
  const kopia: Tree = { ...o }
  delete kopia._kommentar
  return kopia
}

/** Plocka ut, ur `kalla`, exakt de grenar som finns i `mall` (för återställning). */
function urval(kalla: Tree, mall: Tree): Tree {
  const ut: Tree = {}
  for (const [k, v] of Object.entries(mall)) {
    const kv = kalla[k]
    if (v && typeof v === 'object' && !Array.isArray(v) && kv && typeof kv === 'object' && !Array.isArray(kv)) {
      ut[k] = urval(kv as Tree, v as Tree)
    } else if (kv !== undefined) {
      ut[k] = kv
    }
  }
  return ut
}

// i18next deep-mergar in överlägget i SAMMA objekt som sv.json exporterar
// (resursbundlen är en referens, inte en kopia). Originalet måste därför
// frysas som en djup kopia vid modulladdning, innan något överlägg lagts på.
const svOriginalForOverlagget: Tree = JSON.parse(
  JSON.stringify(urval(sv as unknown as Tree, utanKommentar(latt as unknown as Tree))),
) as Tree

export function arLattSvenska(): boolean {
  try {
    return localStorage.getItem(LATT_SVENSKA_NYCKEL) === '1'
  } catch {
    return false
  }
}

/** Lägger på eller tar bort överlägget i den laddade sv-bundlen. Idempotent. */
export function tillampaLattSvenska(pa: boolean): void {
  const overlagg = utanKommentar(latt as unknown as Tree)
  if (pa) {
    // Djup kopia även här: i18next kan annars binda in latt.json:s objekt i sv-trädet.
    i18n.addResourceBundle('sv', 'translation', JSON.parse(JSON.stringify(overlagg)) as Tree, true, true)
  } else {
    i18n.addResourceBundle('sv', 'translation', JSON.parse(JSON.stringify(svOriginalForOverlagget)) as Tree, true, true)
  }
}

/** Slår på/av, sparar valet, och tvingar en om-rendering på svenska. */
export async function sattLattSvenska(pa: boolean): Promise<void> {
  try {
    if (pa) localStorage.setItem(LATT_SVENSKA_NYCKEL, '1')
    else localStorage.removeItem(LATT_SVENSKA_NYCKEL)
  } catch {
    // localStorage kan vara blockerat — valet gäller då bara tills sidan laddas om.
  }
  tillampaLattSvenska(pa)
  // addResourceBundle triggar ingen om-rendering; changeLanguage gör det.
  await i18n.changeLanguage('sv')
}

/** Nycklar (platta, punktseparerade) som överlägget täcker — för testet. */
export function overlaggetsNycklar(): string[] {
  const ut: string[] = []
  const gå = (o: Tree, p: string) => {
    for (const [k, v] of Object.entries(o)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) gå(v as Tree, p + k + '.')
      else ut.push(p + k)
    }
  }
  gå(utanKommentar(latt as unknown as Tree), '')
  return ut
}
