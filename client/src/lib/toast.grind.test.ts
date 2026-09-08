/**
 * Grind KA1 (2026-09-08): ETT toastsystem, EN monteringspunkt.
 *
 * Portalen hade två toastsystem. `lib/toast.ts` gick via react-hot-toast, som
 * kräver en <Toaster/> — och den fanns bara på profilsidan. Fjorton levande
 * filer anropade `notifications.*` och visade ingenting på alla andra sidor.
 * Det andra systemet (`components/Toast.tsx`, <ToastContainer/> i Layout.tsx)
 * var det som syntes. Nu är `lib/toast.ts` en adapter mot det senare.
 *
 * Den här grinden läser filerna, inte importgrafen — så den ser också en
 * `vi.mock('react-hot-toast')` i en testfil, vilket är ett tecken på att någon
 * bygger mot den gamla vägen igen. Mutationstestad 2026-09-08: en tillagd
 * import i en godtycklig fil fäller regel 1; en andra <ToastContainer/> fäller
 * regel 3.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const SRC = join(__dirname, '..')
const DENNA_FIL = relative(SRC, __filename).split(sep).join('/')
const ADAPTER = 'lib/toast.ts'
const MONTERINGSPUNKT = 'components/Layout.tsx'

const KODFIL = /\.(ts|tsx|js|jsx|mjs|cjs)$/

function allaKodfiler(dir: string, ut: string[] = []): string[] {
  for (const namn of readdirSync(dir)) {
    if (namn === 'node_modules') continue
    const p = join(dir, namn)
    if (statSync(p).isDirectory()) allaKodfiler(p, ut)
    else if (KODFIL.test(namn)) ut.push(p)
  }
  return ut
}

const filer = allaKodfiler(SRC)
  .map(p => ({ sokvag: relative(SRC, p).split(sep).join('/'), text: utanKommentarer(readFileSync(p, 'utf8')) }))
  .filter(f => f.sokvag !== DENNA_FIL)

/**
 * Kommentarer skalas av innan mönstren körs. Både adaptern och det här testet
 * nämner <Toaster> och <ToastContainer/> i sin dokumentation — en grind som
 * fäller på sin egen kommentar är grinden i 2026-08-21-fällan.
 */
function utanKommentarer(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '')
}

const REACT_HOT_TOAST = /(from\s*['"]react-hot-toast['"]|require\(\s*['"]react-hot-toast['"]\s*\)|vi\.mock\(\s*['"]react-hot-toast['"])/

describe('grind KA1: ett toastsystem', () => {
  it('läser ett träd av rimlig storlek (sanity — annars mäter grinden ingenting)', () => {
    expect(filer.length).toBeGreaterThan(300)
    expect(filer.some(f => f.sokvag === ADAPTER)).toBe(true)
    expect(filer.some(f => f.sokvag === MONTERINGSPUNKT)).toBe(true)
  })

  it('regel 1: ingen fil i src importerar eller mockar react-hot-toast', () => {
    const traffar = filer.filter(f => REACT_HOT_TOAST.test(f.text)).map(f => f.sokvag)
    expect(traffar, `react-hot-toast är avvecklat (KA1). Gå via @/lib/toast eller @/components/Toast i: ${traffar.join(', ')}`).toEqual([])
  })

  it('regel 2: ingen <Toaster> (react-hot-toasts behållare) renderas någonstans', () => {
    const traffar = filer.filter(f => /<Toaster\b/.test(f.text)).map(f => f.sokvag)
    expect(traffar, `<Toaster> hör till react-hot-toast och ritar en andra toaststack i: ${traffar.join(', ')}`).toEqual([])
  })

  it('regel 3: <ToastContainer/> monteras exakt en gång, i Layout.tsx', () => {
    const traffar = filer
      .filter(f => !/\.(test|spec)\.tsx?$/.test(f.sokvag))
      .flatMap(f => {
        const antal = (f.text.match(/<ToastContainer\b/g) ?? []).length
        return antal > 0 ? [`${f.sokvag} (${antal})`] : []
      })
    expect(traffar).toEqual([`${MONTERINGSPUNKT} (1)`])
  })

  it('regel 4: lib/toast.ts är en adapter mot components/Toast — inte ett eget system', () => {
    const adapter = filer.find(f => f.sokvag === ADAPTER)!
    expect(adapter.text).toMatch(/from\s*['"]@\/components\/Toast['"]/)
  })
})
