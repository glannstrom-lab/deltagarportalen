/**
 * CB1/CB2: CV-utkastet ska faktiskt återställas.
 * (Projektgenomgången 2026-08-21)
 *
 * VAD SOM VAR FEL
 * ---------------
 * Utkastlagret var dekorativt. Tre saker samverkade:
 *
 *   1. `restoreDraft()` hade NOLL anropare i produktionskod. Funktionen är
 *      välbyggd — åldersgräns, jämförelse mot senaste serversparning, rensning
 *      av gammal localStorage-PII — och kördes aldrig.
 *   2. `CVBuilder` rensade `sessionStorage['cv-draft']` ovillkorligt vid varje
 *      mount, alltså innan något hunnit läsa det.
 *   3. Unmount-cleanupen i `useCVAutoSave` gjorde bara `clearTimeout()` utan
 *      att flusha den väntande 800 ms-debouncen. Vid SPA-navigering körs
 *      varken `visibilitychange` eller `beforeunload` — bara unmount.
 *
 * Nettot: en deltagare som skrev något och klickade vidare inom debounce-
 * fönstret förlorade det tyst, i portalens mest använda verktyg.
 *
 * CB2: åldersgränsen i `CVBuilder` räknade `5 * 5 * 1000` = 25 sekunder medan
 * kommentaren bredvid lovade fem minuter. Faktor tolv fel. Den koden är borta;
 * `restoreDraft()` har sin egen uttryckliga gräns på sju dygn.
 *
 * VAD TESTET VAKTAR
 * -----------------
 * Beteendet hos `restoreDraft()` (den kan köras isolerat), plus källkodsvakter
 * för de två kopplingarna som annars kan falla bort tyst igen. Kopplingarna
 * går inte att enhetstesta meningsfullt utan att montera hela CVBuilder med
 * dess trettiotal mockar — och en sådan mock kan i sin tur ljuga om formen,
 * vilket är precis vad `CVPage.test.tsx` gjorde fram till i dag.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { useCVDraft } from './useCVAutoSave'

vi.mock('@/stores/cvStore', () => ({
  useCVStore: () => ({ setHasDraft: vi.fn() }),
}))

const DYGN = 24 * 60 * 60 * 1000

function skrivUtkast(data: Record<string, unknown>, alderMs = 0) {
  sessionStorage.setItem(
    'cv-draft',
    JSON.stringify({ ...data, _timestamp: Date.now() - alderMs }),
  )
}

describe('CB1: restoreDraft återställer det som inte hann sparas', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('ger tillbaka ett färskt utkast', () => {
    skrivUtkast({ firstName: 'Anna', title: 'Lagerarbetare' })
    const { result } = renderHook(() => useCVDraft())

    const utkast = result.current.restoreDraft()

    expect(utkast).toMatchObject({ firstName: 'Anna', title: 'Lagerarbetare' })
  })

  it('tar inte med den interna tidsstämpeln in i CV-datat', () => {
    skrivUtkast({ firstName: 'Anna' })
    const { result } = renderHook(() => useCVDraft())

    const utkast = result.current.restoreDraft() as Record<string, unknown> | null

    expect(utkast).not.toBeNull()
    expect(utkast).not.toHaveProperty('_timestamp')
  })

  it('ger null när inget utkast finns', () => {
    const { result } = renderHook(() => useCVDraft())
    expect(result.current.restoreDraft()).toBeNull()
  })

  it('kastar ett utkast äldre än sju dygn — och städar undan det', () => {
    skrivUtkast({ firstName: 'Anna' }, 8 * DYGN)
    const { result } = renderHook(() => useCVDraft())

    expect(result.current.restoreDraft()).toBeNull()
    expect(sessionStorage.getItem('cv-draft')).toBeNull()
  })

  it('behåller ett utkast som är sex dygn gammalt', () => {
    // Gränsen ska vara sju dygn, inte 25 sekunder (CB2).
    skrivUtkast({ firstName: 'Anna' }, 6 * DYGN)
    const { result } = renderHook(() => useCVDraft())

    expect(result.current.restoreDraft()).toMatchObject({ firstName: 'Anna' })
  })

  it('behåller ett utkast som är en minut gammalt', () => {
    // Den gamla koden i CVBuilder rensade efter 25 sekunder. Ett utkast från
    // för en minut sedan är precis det man vill ha tillbaka.
    skrivUtkast({ firstName: 'Anna' }, 60 * 1000)
    const { result } = renderHook(() => useCVDraft())

    expect(result.current.restoreDraft()).toMatchObject({ firstName: 'Anna' })
  })

  it('kastar utkastet när servern sparat senare', () => {
    skrivUtkast({ firstName: 'Gammal' }, 60 * 1000)
    localStorage.setItem('cv-last-saved', String(Date.now()))

    const { result } = renderHook(() => useCVDraft())

    expect(result.current.restoreDraft()).toBeNull()
  })

  it('behåller utkastet när det är nyare än serverns sparning', () => {
    localStorage.setItem('cv-last-saved', String(Date.now() - 5 * 60 * 1000))
    skrivUtkast({ firstName: 'Nyare' })

    const { result } = renderHook(() => useCVDraft())

    expect(result.current.restoreDraft()).toMatchObject({ firstName: 'Nyare' })
  })

  it('rensar gammal localStorage-PII vid varje anrop', () => {
    // Säkerhetsmigreringen från 2026-05-09: fullt CV låg i localStorage, som
    // överlever att fliken stängs — en läcka på delade datorer, vilket är
    // normalfallet för målgruppen.
    localStorage.setItem('cv-draft', JSON.stringify({ firstName: 'Läcka' }))
    localStorage.setItem('cv-data', JSON.stringify({ firstName: 'Läcka' }))

    const { result } = renderHook(() => useCVDraft())
    result.current.restoreDraft()

    expect(localStorage.getItem('cv-draft')).toBeNull()
    expect(localStorage.getItem('cv-data')).toBeNull()
  })

  it('överlever ett trasigt utkast utan att kasta', () => {
    sessionStorage.setItem('cv-draft', 'inte-json{{{')
    const { result } = renderHook(() => useCVDraft())

    expect(() => result.current.restoreDraft()).not.toThrow()
    expect(result.current.restoreDraft()).toBeNull()
  })
})

/**
 * Tar bort kommentarer före matchning.
 *
 * Nödvändigt, och upptäckt genom mutationstest: första versionen av vakten
 * nedan letade efter `restoreDraft()` var som helst i filen. En mutation som
 * bytte `const utkast = restoreDraft()` mot `const utkast = null` ÖVERLEVDE —
 * testet matchade min egen förklarande kommentar i stället för koden.
 *
 * Samma fälla som KO1, där en ärlighetsregel själv innehöll det påhittade
 * talet. En källkodsvakt måste läsa kod, inte prosa.
 */
function utanKommentarer(kalla: string): string {
  return kalla
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

describe('CB1: kopplingarna finns kvar i koden', () => {
  const cvBuilder = utanKommentarer(
    readFileSync(resolve(__dirname, '../pages/CVBuilder.tsx'), 'utf8')
  )
  const autoSave = utanKommentarer(
    readFileSync(resolve(__dirname, './useCVAutoSave.ts'), 'utf8')
  )

  it('kommentarsrensningen fungerar', () => {
    // Positiv kontroll. Utan den kan `utanKommentarer` börja returnera tom
    // sträng och göra varje `not.toMatch` nedan grönt av fel skäl.
    expect(utanKommentarer('const a = 1 // restoreDraft()')).not.toMatch(/restoreDraft/)
    expect(utanKommentarer('/* restoreDraft() */ const a = 1')).not.toMatch(/restoreDraft/)
    expect(utanKommentarer('const a = restoreDraft()')).toMatch(/restoreDraft/)
    expect(cvBuilder.length).toBeGreaterThan(1000)
  })

  it('CVBuilder tar emot restoreDraft ur hooken', () => {
    expect(autoSave).toMatch(/export function useCVDraft/)
    expect(cvBuilder).toMatch(/useCVDraft\(\)/)
    expect(cvBuilder).toMatch(/restoreDraft\s*\}?\s*=/)
  })

  it('CVBuilder använder returvärdet från restoreDraft', () => {
    // Kräver en TILLDELNING, inte bara att namnet förekommer. Ett anrop vars
    // resultat kastas bort är precis vad den gamla koden gjorde med utkastet.
    expect(cvBuilder).toMatch(/=\s*restoreDraft\(\)/)
  })

  it('CVBuilder läser utkastet FÖRE den skriver om cv-last-saved', () => {
    // Ordningen var hela buggen i det gamla blocket: tidsstämpeln skrevs en rad
    // för tidigt, så jämförelsen i restoreDraft alltid föll ut till "servern är
    // nyare" och utkastet kastades.
    const lasning = cvBuilder.search(/=\s*restoreDraft\(\)/)
    const skrivning = cvBuilder.indexOf("localStorage.setItem('cv-last-saved'")
    expect(lasning).toBeGreaterThan(-1)
    expect(skrivning).toBeGreaterThan(-1)
    expect(lasning).toBeLessThan(skrivning)
  })

  it('CVBuilder rensar inte sessionStorage-utkastet vid mount', () => {
    // Den ovillkorliga rensningen gjorde återställningen omöjlig oavsett hur
    // väl restoreDraft fungerade.
    expect(cvBuilder).not.toMatch(/sessionStorage\.removeItem\(\s*['"]cv-draft['"]\s*\)/)
  })

  it('unmount-cleanupen flushar i stället för att bara rensa timern', () => {
    expect(autoSave).toMatch(/flushRef/)
    // En cleanup som enbart gör clearTimeout kastar allt i debounce-fönstret.
    expect(autoSave).toMatch(/flushRef\.current\?\.\(\)/)
  })

  it('flushen skickar faktiskt vidare det som väntar', () => {
    // En flushRef som bara rensar timern vore samma bugg med ett nytt namn.
    expect(autoSave).toMatch(/saveToServer\(pendingData\.current\)/)
  })

  it('den felräknade tjugofemsekundersgränsen är borta', () => {
    // CB2: fem gånger fem gånger tusen, med kommentaren "äldre än 5 minuter"
    // bredvid. Talformen skrivs i ord här så regeln kan vara sträng — samma
    // lösning som KO1 landade på.
    expect(cvBuilder).not.toMatch(/5\s*\*\s*5\s*\*\s*1000/)
  })
})
