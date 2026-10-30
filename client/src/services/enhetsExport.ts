/**
 * Exportera enhetens data vid avtalsslut (FN12) — planer, pass med närvaro,
 * lämnade underlag och (bara efter ett aktivt val) journalen, som CSV i en zip.
 *
 * Behörighet (pg_policies, mätt 2026-10-30): organisationens chef/admin läser
 * activity_plans, activity_sessions och activity_plan_handovers för sin
 * organisation — men bara med aal2 (tvåstegsinloggning) eller i en
 * demoorganisation. Utan aal2 ger RLS 0 rader, inte ett fel. Anroparen ska
 * därför kontrollera aal2 först, och exporten vägrar att kalla en tom
 * utdragning "klar" (se `arTom`).
 *
 * Journalen: consultant_journal läses bara av konsulenten med aktiv relation
 * (har_aktiv_relation). En chef får därför bara med de anteckningar hen själv
 * har rätt att läsa; resten kräver en ändring av behörigheten. Antalet står i
 * LASMIG.txt så att filen aldrig ser fullständigare ut än den är.
 *
 * Inget raderas här. "Överlämningar" = lämnade underlag (activity_plan_handovers)
 * och MSFA-överföringar (msfa_overforingar). Caseload-överlämningen
 * (organization_handover) är en vy utan historik och kan inte exporteras.
 *
 * CSV: semikolon + BOM + CRLF (svensk Excel) via csvTabell.
 */

import { supabase } from '@/lib/supabase'
import { csvTabell } from '@/components/consultant/deltagarExport'
import { byggZip as packaZip, type ZipFil } from './zipLagring'

export interface EnhetsExportVal {
  /** Journalen tas BARA med efter ett aktivt val. */
  journal: boolean
  /** Kategorin "Oro" är konsulentens interna riskbedömning — eget val ovanpå journalvalet. */
  oro: boolean
}

export type Rad = Record<string, unknown>

export interface EnhetsData {
  planer: Rad[]
  pass: Rad[]
  underlag: Rad[]
  /** Markeringar att en plan förts över till kommunens system (msfa_overforingar). */
  overforingar: Rad[]
  /** null = journal inte vald (aldrig hämtad). */
  journal: Rad[] | null
}

export const FILNAMN = {
  planer: 'planer.csv',
  pass: 'pass_och_narvaro.csv',
  underlag: 'lamnade_underlag.csv',
  overforingar: 'overforingar_till_kommunens_system.csv',
  journal: 'journal.csv',
  lasmig: 'LASMIG.txt',
} as const

function cellvarde(v: unknown): string | number {
  if (v === null || v === undefined) return ''
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 'ja' : 'nej'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/** Rubrikraden = unionen av nycklar i den ordning de först förekommer. */
export function radTillCsv(rader: readonly Rad[]): string {
  if (rader.length === 0) return csvTabell([['(inga rader)']], ';')
  const kolumner: string[] = []
  for (const r of rader) for (const k of Object.keys(r)) if (!kolumner.includes(k)) kolumner.push(k)
  return csvTabell([kolumner, ...rader.map((r) => kolumner.map((k) => cellvarde(r[k])))], ';')
}

/** Ingenting av det som RLS släpper igenom för chefen — då är det inte "0 planer" utan ett glapp. */
export function arTom(d: EnhetsData): boolean {
  return d.planer.length === 0 && d.pass.length === 0 && d.underlag.length === 0 && d.overforingar.length === 0
}

export function filtreraJournal(rader: readonly Rad[], val: EnhetsExportVal): Rad[] {
  if (!val.journal) return []
  return rader.filter((r) => val.oro || r.category !== 'CONCERN')
}

export function byggLasmig(orgNamn: string, d: EnhetsData, val: EnhetsExportVal, nu: Date): string {
  const rader = [
    `Jobin — enhetens data: ${orgNamn}`,
    `Uttaget ${nu.toISOString()}`,
    '',
    'Innehåll (antal rader):',
    `  ${FILNAMN.planer}: ${d.planer.length}`,
    `  ${FILNAMN.pass}: ${d.pass.length}`,
    `  ${FILNAMN.underlag}: ${d.underlag.length}`,
    `  ${FILNAMN.overforingar}: ${d.overforingar.length}`,
    d.journal === null
      ? `  ${FILNAMN.journal}: ej med (journalen togs inte med — ingen aktiv begäran)`
      : `  ${FILNAMN.journal}: ${d.journal.length}${val.oro ? ' (inklusive orosanteckningar)' : ' (utan orosanteckningar)'}`,
    '',
    'Att veta:',
    '  - CSV-filerna är UTF-8 med semikolon som avgränsare och öppnas direkt i svensk Excel.',
    '  - Deltagare anges med id (participant_id). Namn ingår inte: chefsbehörigheten läser inte deltagarprofiler.',
    '  - Bara planer som är kopplade till organisationen (org_id) ingår.',
    d.journal !== null
      ? '  - Journalen innehåller bara de anteckningar som den som tog ut filen har rätt att läsa (aktiv relation). Andra konsulenters journal ingår inte.'
      : '  - Journalen tas bara med efter ett aktivt val vid uttaget.',
    '  - Överföringar: markeringar att en plan förts över till kommunens system. Överlämningar av caseload mellan konsulenter sparas inte som historik och ingår inte.',
    '  - Filen är en kopia. Inget har raderats i Jobin.',
  ]
  return rader.join('\r\n') + '\r\n'
}

export function byggZip(orgNamn: string, d: EnhetsData, val: EnhetsExportVal, nu: Date = new Date()): Uint8Array {
  const enc = new TextEncoder()
  const filer: ZipFil[] = [
    { namn: FILNAMN.planer, data: enc.encode(radTillCsv(d.planer)) },
    { namn: FILNAMN.pass, data: enc.encode(radTillCsv(d.pass)) },
    { namn: FILNAMN.underlag, data: enc.encode(radTillCsv(d.underlag)) },
    { namn: FILNAMN.overforingar, data: enc.encode(radTillCsv(d.overforingar)) },
  ]
  if (d.journal !== null) filer.push({ namn: FILNAMN.journal, data: enc.encode(radTillCsv(d.journal)) })
  filer.push({ namn: FILNAMN.lasmig, data: enc.encode(byggLasmig(orgNamn, d, val, nu)) })
  return packaZip(filer, nu)
}

// ---------------------------------------------------------------------------

const SIDSTORLEK = 1000
const MAX_SIDOR = 50
const KLUMP = 100

async function allaSidor(
  hamta: (fran: number, till: number) => PromiseLike<{ data: Rad[] | null; error: { message: string } | null }>,
): Promise<Rad[]> {
  const ut: Rad[] = []
  for (let s = 0; s < MAX_SIDOR; s++) {
    const { data, error } = await hamta(s * SIDSTORLEK, (s + 1) * SIDSTORLEK - 1)
    if (error) throw new Error(error.message)
    ut.push(...(data ?? []))
    if ((data ?? []).length < SIDSTORLEK) return ut
  }
  throw new Error('Uttaget är större än vad som kan hämtas i ett svep — hör av dig till Jobin.')
}

function klumpa<T>(lista: readonly T[], n: number): T[][] {
  const ut: T[][] = []
  for (let i = 0; i < lista.length; i += n) ut.push(lista.slice(i, i + n))
  return ut
}

export const enhetsExportApi = {
  async hamta(orgId: string, val: EnhetsExportVal): Promise<EnhetsData> {
    const planer = await allaSidor((a, b) =>
      supabase.from('activity_plans').select('*').eq('org_id', orgId).order('id').range(a, b),
    )
    const planIds = planer.map((p) => String(p.id))
    const deltagarIds = [...new Set(planer.map((p) => String(p.participant_id)))]

    const [pass, underlag, overforingar] = await Promise.all([
      Promise.all(
        klumpa(planIds, KLUMP).map((ids) =>
          allaSidor((a, b) => supabase.from('activity_sessions').select('*').in('plan_id', ids).order('id').range(a, b)),
        ),
      ).then((l) => l.flat()),
      allaSidor((a, b) =>
        supabase.from('activity_plan_handovers').select('*').eq('org_id', orgId).order('id').range(a, b),
      ),
      allaSidor((a, b) =>
        supabase.from('msfa_overforingar').select('*').eq('org_id', orgId).order('id').range(a, b),
      ),
    ])

    let journal: Rad[] | null = null
    if (val.journal) {
      const rader = (
        await Promise.all(
          klumpa(deltagarIds, KLUMP).map((ids) =>
            allaSidor((a, b) =>
              supabase.from('consultant_journal').select('*').in('participant_id', ids).order('id').range(a, b),
            ),
          ),
        )
      ).flat()
      journal = filtreraJournal(rader, val)
    }
    return { planer, pass, underlag, overforingar, journal }
  },
}

export function exportFilnamn(orgNamn: string, nu: Date): string {
  const slug = orgNamn
    .toLowerCase()
    .replace(/å|ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const d = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-${String(nu.getDate()).padStart(2, '0')}`
  return `jobin-enhetsdata-${slug || 'organisation'}-${d}.zip`
}
