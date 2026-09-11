/**
 * KA4 — EN `CVData` i klienten.
 *
 * 2026-09-12 fanns sju definitioner: den kanoniska i `services/supabaseApi.ts`
 * plus lokala kopior i `useDashboardData`, `Resources`, `cvWordExport`,
 * `pdf.types`, `AIWritingAssistant` (`CVDataForAI`) och dödkoden
 * `ContinueWhereYouLeft`/`validation`. Kopiorna gled isär tyst: en läste
 * `personal_info` (finns inte i `cvs`), en antog `skills: string[]` (prod har
 * objekt), en saknade `updated_at`. Den här grinden fäller nästa kopia.
 *
 * Tillåtet:
 *   - `types/cv.ts`: definitionen.
 *   - `services/supabaseApi.ts`: re-export (`export type { … CVData } from '@/types/cv'`).
 *   - `types/pdf.types.ts` och `hooks/useDashboardData.ts`: DERIVATIONER
 *     (`type CVData = …` som importerar `CVData as CanonicalCVData` från `@/types/cv`).
 * Undantag (dödkod, 0 importörer 2026-09-12, ska raderas i C-spåret — inte byggas på):
 *   - `components/resume/ContinueWhereYouLeft.tsx`
 *   - `utils/validation.ts`
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC = join(__dirname, '..')

const DEFINITION = 'types/cv.ts'
const REEXPORT = 'services/supabaseApi.ts'
const DERIVATIONER = ['types/pdf.types.ts', 'hooks/useDashboardData.ts']
const DODKOD = ['components/resume/ContinueWhereYouLeft.tsx', 'utils/validation.ts']

function alla(dir: string, ut: string[] = []): string[] {
  for (const namn of readdirSync(dir)) {
    const p = join(dir, namn)
    if (statSync(p).isDirectory()) {
      if (namn === 'node_modules' || namn === '__tests__') continue
      alla(p, ut)
    } else if (/\.(ts|tsx)$/.test(namn) && !/\.test\.(ts|tsx)$/.test(namn) && !/\.d\.ts$/.test(namn)) {
      ut.push(p)
    }
  }
  return ut
}

const DEF_RE = /^\s*(?:export\s+)?(?:interface|type)\s+CVData\b/m

function normalisera(p: string): string {
  return relative(SRC, p).replace(/\\/g, '/')
}

describe('KA4 — en CVData', () => {
  const filer = alla(SRC)
  const medDefinition = filer.filter((f) => DEF_RE.test(readFileSync(f, 'utf8'))).map(normalisera)

  it('definitionen finns bara i types/cv.ts', () => {
    const kalla = readFileSync(join(SRC, DEFINITION), 'utf8')
    expect(kalla).toMatch(/^export interface CVData \{/m)
    expect(kalla).toMatch(/^export interface Skill \{/m)
  })

  it('supabaseApi re-exporterar i stället för att definiera', () => {
    const kalla = readFileSync(join(SRC, REEXPORT), 'utf8')
    expect(kalla).not.toMatch(DEF_RE)
    expect(kalla).toMatch(/export type \{[\s\S]*?\bCVData,?[\s\S]*?\} from '@\/types\/cv'/)
  })

  it('ingen annan fil definierar CVData (derivationer måste importera den kanoniska)', () => {
    const otillatna = medDefinition.filter(
      (f) => f !== DEFINITION && !DERIVATIONER.includes(f) && !DODKOD.includes(f),
    )
    expect(otillatna).toEqual([])
    for (const d of DERIVATIONER) {
      const kalla = readFileSync(join(SRC, d), 'utf8')
      expect(kalla, `${d} ska härleda ur @/types/cv`).toMatch(/CVData as CanonicalCVData \} from '@\/types\/cv'/)
      expect(kalla, `${d} får inte ha en egen interface CVData`).not.toMatch(/^\s*(?:export\s+)?interface\s+CVData\b/m)
    }
  })

  it('dödkodsundantagen är fortfarande dödkod (0 importörer) — annars ska de in i grinden', () => {
    const importerare = filer.filter((f) => {
      const k = readFileSync(f, 'utf8')
      return /from ['"][^'"]*(ContinueWhereYouLeft|utils\/validation)['"]/.test(k) && !DODKOD.includes(normalisera(f))
    })
    expect(importerare.map(normalisera)).toEqual([])
  })
})
