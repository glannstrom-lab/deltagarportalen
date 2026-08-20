/**
 * MV1: varje samtycke ska registreras, inte bara tidsstämplas.
 * (Projektgenomgången 2026-08-21)
 *
 * VAD SOM VAR FEL
 * ---------------
 * `grant_consent()` och `withdraw_consent()` skrevs 2026-03-28 och gör två
 * saker i en transaktion: sätter `profiles.<typ>_consent_at` OCH skriver en
 * rad i `consent_history`. Den andra halvan är hela poängen — GDPR art. 7.1
 * lägger bevisbördan på oss.
 *
 * Funktionerna hade noll anropare i fem månader. Alla fyra skrivvägar gick
 * rakt på profilraden via `userApi.updateProfile()`, så tidsstämpeln blev
 * rätt och registret förblev tomt. Utåt såg det likadant ut — vilket är
 * precis varför ingen upptäckte det, och varför A30 ("noll rader") beskrevs
 * som ett driftproblem i stället för en aldrig inkopplad väg.
 *
 * VARFÖR TESTET LÄSER KÄLLKOD
 * ---------------------------
 * Ett vanligt enhetstest mockar Supabase-klienten och kan då inte se
 * *vilken* väg komponenten valde — samma blindhet som gjorde att A19 kunde
 * ligga i drift en månad medan testerna var gröna, och som `journey_goals`
 * visade på schemanivå. Den här grinden läser källan och kräver att ingen
 * komponent skriver en samtyckeskolumn direkt.
 *
 * Grinden är avsiktligt bred: den letar efter kolumnnamnen, inte efter ett
 * specifikt anropsmönster. En ny väg som skriver `wellness_consent_at` fäller
 * bygget oavsett hur den är formulerad.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join, relative } from 'node:path'

const SRC = resolve(__dirname, '..')

/** Kolumnerna `grant_consent`/`withdraw_consent` äger. */
const SAMTYCKESKOLUMNER = [
  'terms_accepted_at',
  'privacy_accepted_at',
  'ai_consent_at',
  'marketing_consent_at',
  'health_consent_at',
  'wellness_consent_at',
] as const

/**
 * Filer som får nämna kolumnerna i skrivsammanhang, med skäl.
 * Att lägga till en rad här ska kosta en motivering.
 */
const FAR_SKRIVA: Record<string, string> = {
  'services/consentApi.ts':
    'Är själva vägen. Skriver dock inte kolumnerna direkt — den anropar RPC:erna ' +
    'och listar kolumnnamnen i SAMTYCKESKOLUMN för att spegla migrationens CASE-sats.',
}

function allaKallfiler(dir: string, ut: string[] = []): string[] {
  for (const post of readdirSync(dir)) {
    const p = join(dir, post)
    if (statSync(p).isDirectory()) {
      if (post === 'node_modules' || post === 'test') continue
      allaKallfiler(p, ut)
    } else if (/\.tsx?$/.test(post) && !/\.test\.tsx?$/.test(post)) {
      ut.push(p)
    }
  }
  return ut
}

/**
 * Skrivanrop kolumnen kan hamna i. Namnen är de som förekommer i kodbasen.
 */
const SKRIVANROP = /\b(updateProfile|update|upsert|insert)\s*\(/g

/**
 * Matchar en SKRIVNING av kolumnen, inte en läsning eller en typdeklaration.
 *
 * Första versionen letade efter `kolumn:` var som helst i filen och gav sju
 * falska utslag direkt: `authStore.ts` deklarerar alla sex kolumnerna i sitt
 * `Profile`-interface (`wellness_consent_at: string | null`), och
 * `useAiConsent.ts` nämner en av dem i en docstring. Båda är läsningar och
 * fullständigt i sin ordning — en grind som fäller dem hade blivit avstängd
 * i stället för åtgärdad.
 *
 * Nu letar den i stället efter kolumnen INUTI ett skrivanrop. Det är den
 * farliga formen: `updateProfile({ wellness_consent_at: ... })`. En läsning
 * (`profile?.wellness_consent_at`) och en typrad ligger aldrig där.
 *
 * Fönstret på 400 tecken täcker ett flerradigt objektargument utan att svälja
 * nästa sats. Dynamiska nycklar (`{ [columnMap[typ]]: v }` — precis vad
 * `Settings.tsx` gjorde) syns inte här; de fångas i stället av testet nedan
 * som kräver att de fyra kända vägarna anropar `consentApi`.
 */
function hittarSkrivning(kalla: string, kolumn: string): boolean {
  SKRIVANROP.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = SKRIVANROP.exec(kalla)) !== null) {
    const fonster = kalla.slice(m.index, m.index + 400)
    if (new RegExp(`['"\`]?${kolumn}['"\`]?\\s*:`).test(fonster)) return true
  }
  return false
}

describe('MV1: samtycken går genom registret, inte förbi det', () => {
  const filer = allaKallfiler(SRC)

  it('hittar ett rimligt antal källfiler att granska', () => {
    // Positiv kontroll: utan den blir testet nedan grönt genom att aldrig köra
    // om katalogstrukturen ändras.
    expect(filer.length).toBeGreaterThan(200)
  })

  it('ingen komponent skriver en samtyckeskolumn direkt', () => {
    const overtradelser: string[] = []

    for (const fil of filer) {
      const rel = relative(SRC, fil).replace(/\\/g, '/')
      if (FAR_SKRIVA[rel]) continue

      const kalla = readFileSync(fil, 'utf8')
      for (const kolumn of SAMTYCKESKOLUMNER) {
        if (hittarSkrivning(kalla, kolumn)) {
          overtradelser.push(`${rel} skriver ${kolumn}`)
        }
      }
    }

    expect(
      overtradelser,
      'Samtycken ska sättas via services/consentApi.ts, som anropar ' +
        'grant_consent/withdraw_consent och därmed skriver till consent_history ' +
        '(GDPR art. 7.1). En direkt kolumnskrivning sätter tiden men lämnar ' +
        'inget spår. Se MV1 i docs/ROADMAP.md.'
    ).toEqual([])
  })

  it('undantagen bär en läsbar motivering', () => {
    for (const [fil, skal] of Object.entries(FAR_SKRIVA)) {
      expect(skal.length, `undantaget för ${fil} saknar motivering`).toBeGreaterThan(40)
    }
  })
})

describe('MV1: de fyra kända skrivvägarna anropar consentApi', () => {
  // De här fyra var de som gick förbi registret. Testet ovan hindrar att de
  // faller tillbaka; det här kräver att de faktiskt använder den nya vägen —
  // en komponent som slutar sätta samtycke helt vore också en regression.
  const VAGAR: [string, string][] = [
    ['pages/Settings.tsx', 'vaxlaSamtycke'],
    ['components/ai/AiConsentGate.tsx', 'beviljaSamtycke'],
    ['components/consent/HealthConsentGate.tsx', 'beviljaSamtycke'],
    ['components/consent/WellnessConsentGate.tsx', 'beviljaSamtycke'],
  ]

  it.each(VAGAR)('%s anropar %s', (fil, funktion) => {
    const kalla = readFileSync(resolve(SRC, fil), 'utf8')
    expect(kalla).toMatch(new RegExp(`from ['"]@/services/consentApi['"]`))
    expect(kalla).toMatch(new RegExp(`await\\s+${funktion}\\s*\\(`))
  })
})

describe('MV1: consentApi täcker migrationens alla samtyckestyper', () => {
  // Glider CASE-satsen i databasen och kartan här isär får man ett
  // `RAISE EXCEPTION 'Invalid consent type'` i drift, inte ett typfel.
  const migration = readFileSync(
    resolve(__dirname, '../../../supabase/migrations/20260328100000_health_data_consent.sql'),
    'utf8'
  )
  const api = readFileSync(resolve(SRC, 'services/consentApi.ts'), 'utf8')

  const typerIMigrationen = [
    ...new Set(
      [...migration.matchAll(/WHEN '([a-z_]+)' THEN column_name/g)].map((m) => m[1])
    ),
  ]

  it('migrationen deklarerar de typer vi tror', () => {
    expect(typerIMigrationen.length).toBeGreaterThanOrEqual(6)
  })

  it.each(typerIMigrationen)('consentApi känner till typen %s', (typ) => {
    expect(api).toMatch(new RegExp(`['"]${typ}['"]`))
  })
})
