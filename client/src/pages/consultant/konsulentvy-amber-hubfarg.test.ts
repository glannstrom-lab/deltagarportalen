/**
 * Vakt för KT3 (2026-08-31): amber hade tagit över konsulentvyns hub-färg.
 *
 * Amber användes för fokusringar, aktiva filter, vyväxlarens valda läge,
 * avatarcirklar, valda rader, taggar och länkar — allt rent dekorativt/
 * interaktivt. Konsekvensen: en riktig varning ("obesvarat i sju dagar",
 * "hög prioritet") fick samma färg som "det här är valt". Färgen slutade
 * betyda något.
 *
 * Fixen bytte allt dekorativt/interaktivt till hub-tokens (var(--c-solid) /
 * var(--c-bg) / var(--c-accent) / var(--c-text)) i sex filer och lämnade
 * amber ENBART kvar på faktiska varningsstatusar (ON_HOLD, hög prioritet,
 * "obesvarat länge", kvalitetströsklar, "snart"/"oro"-taggar, "osparade
 * ändringar"-bannern). Den här vakten låser fast den gränsen: varje rad som
 * innehåller en amber-klass (`amber-<siffra>`) måste vara EXAKT en av de
 * rader som är whitelistade nedan som en riktig varningsstatus. Allt annat
 * amber i dessa sex filer är per definition en regression tillbaka mot
 * dekoration — och rör man en whitelistad rad (t.ex. byter nyans) upptäcks
 * det också, eftersom raden då inte längre matchar exakt.
 *
 * Källkodsvakt, inte en renderingsvakt — samma familj som
 * statusikoner-kontrast.test.ts (KT4). Den här vakten gäller ENBART
 * dekorativt/interaktivt amber i de sex KT3-filerna; den ersätter inte och
 * konkurrerar inte med KT4:s kontrastvakt (text-amber-600 + bg-amber-100),
 * som fortsätter gälla oberoende av den här.
 *
 * Mutationstestad: att lägga tillbaka en av de borttagna dekorativa
 * amber-klasserna (t.ex. `ring-2 ring-amber-500` för en vald rad) på en
 * icke-whitelistad rad gör att testet faller.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')

/**
 * Källkoden UTAN kommentarer, med CRLF normaliserat till LF — annars matchar
 * vakten sin egen förklaring, eller missar rader p.g.a. \r i arbetskopian
 * (se lärdomen 2026-08-23: "Arbetskopian har CRLF").
 */
const rader = (relativSokvag: string): string[] =>
  readFileSync(join(ROOT, relativSokvag), 'utf-8')
    .replace(/\r\n/g, '\n')
    .replace(/(?<!:)\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((rad) => rad.trim())

const AMBER_KLASS = /amber-\d/

/**
 * Whitelist per fil: exakta (trimmade) rader där amber representerar en
 * faktisk varningsstatus — hög prioritet, "obesvarat länge",
 * kvalitetströskel, "snart förfaller", "oro"-tagg, eller en
 * osparade-ändringar-banner. Allt annat amber i filen är dekoration.
 */
const TILLATNA_RADER: Record<string, string[]> = {
  'pages/consultant/ParticipantsTab.tsx': [
    `ON_HOLD: { label: t('consultant.participants.status.onHold'), color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },`,
    `if (priority === 1) return { label: t('consultant.participants.priority.high'), color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' }`,
    `isOverdue(p.last_contact_at) ? 'text-amber-600' : 'text-stone-500'`,
    `(p.ats_score || 0) >= 50 ? 'text-amber-600' : 'text-stone-600'`,
  ],
  'pages/consultant/ResourcesTab.tsx': [],
  'pages/consultant/OverviewTab.tsx': [
    `yellow: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',`,
    `yellow: 'text-amber-700 dark:text-amber-400',`,
    `status === 'yellow' ? 'bg-amber-100 dark:bg-amber-900/40' :`,
    `color: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40',`,
    `<div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">`,
    `{activity.type === 'cv_updated' && <FileText className="w-4 h-4 text-amber-700 dark:text-amber-400" />}`,
    `{activity.type === 'job_saved' && <Briefcase className="w-4 h-4 text-amber-700 dark:text-amber-400" />}`,
    `{activity.type === 'login' && <Users className="w-4 h-4 text-amber-700 dark:text-amber-400" />}`,
  ],
  'pages/consultant/ParticipantDetailPage.tsx': [
    `ON_HOLD: { label: t('consultant.participants.status.onHold'), color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },`,
    `warning: 'text-amber-600',`,
    `MEDIUM: 'text-amber-600',`,
  ],
  // ParticipantJournal kopplades in 2026-08-31 (efter KT3-svepet) och tog
  // över kategorifärgerna som tidigare låg inline i ParticipantDetailPage —
  // CONCERN ("Oro") är samma faktiska varningsstatus, bara flyttad.
  'components/consultant/ParticipantJournal.tsx': [
    `badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',`,
    `border: 'border-amber-200 dark:border-amber-800',`,
  ],
  'pages/consultant/SettingsTab.tsx': [
    `: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'`,
    `<p className="font-medium text-amber-900 dark:text-amber-100">`,
  ],
  'pages/consultant/AnalyticsTab.tsx': [
    `cohort.cvComplete >= 60 ? 'text-amber-600' : 'text-rose-600'`,
    `cohort.placed >= 50 ? 'text-amber-600' : 'text-rose-600'`,
    `status.tone === 'soon' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',`,
  ],
}

describe('KT3 — amber i konsulentvyns sex filer får bara stå kvar som varningsstatus', () => {
  for (const [fil, tillatna] of Object.entries(TILLATNA_RADER)) {
    const tillatnaSet = new Set(tillatna)

    it(`${fil}: varje amber-rad är en whitelistad varningsstatus, inte dekoration`, () => {
      const filensRader = rader(fil)
      const overtradelser = filensRader.filter(
        (rad) => AMBER_KLASS.test(rad) && !tillatnaSet.has(rad)
      )
      expect(overtradelser).toEqual([])
    })

    if (tillatna.length > 0) {
      it(`${fil}: de whitelistade varningsstatusarna finns fortfarande kvar`, () => {
        const filensRader = rader(fil)
        const saknas = tillatna.filter((linje) => !filensRader.includes(linje))
        expect(saknas).toEqual([])
      })
    }
  }
})
