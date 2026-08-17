/**
 * Rådgivaren säger inte samma sak två gånger på samma sida.
 *
 * Sedan 2026-08-17 finns rådgivaren på två ytor samtidigt: ett infogat kort i
 * innehållet och en kolumn till höger. Sjutton av tjugo sidor renderar kortet
 * med `index={0}` — alltså exakt det råd kolumnen leder med. Uppmätt på
 * /linkedin-optimizer vid 1440 px stod Daniels profilbildsråd ordagrant två
 * gånger inom samma vy.
 *
 * Lösningen är en registrering: kortet talar om vilket råd det visar, kolumnen
 * hoppar över det. Första försöket lade hela kontextobjektet i effektens
 * beroendelista och gav en oändlig loop som **kraschade sidan** — felgränsen
 * visade "Något gick fel". Därför finns det här testet: mekanismen har redan
 * gått sönder en gång, och den går inte att se i ett typfel.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useCallback, useMemo, useState } from 'react'
import RadgivarPanel, { RadgivarTips } from './RadgivarPanel'
import { RadgivarTipsApiContext, VisadeTipsContext } from './radgivarKontext'
import { radgivareForPath } from './radgivarData'
import { COACHES } from '@/data/coaches'

afterEach(cleanup)

/** Samma providerlogik som Layout.tsx, i miniatyr. */
function Provider({ children }: { children: React.ReactNode }) {
  const [visade, setVisade] = useState<ReadonlySet<string>>(() => new Set())
  const registrera = useCallback((rad: string) => {
    setVisade((f) => (f.has(rad) ? f : new Set(f).add(rad)))
  }, [])
  const avregistrera = useCallback((rad: string) => {
    setVisade((f) => {
      if (!f.has(rad)) return f
      const n = new Set(f)
      n.delete(rad)
      return n
    })
  }, [])
  const api = useMemo(() => ({ registrera, avregistrera }), [registrera, avregistrera])
  return (
    <RadgivarTipsApiContext.Provider value={api}>
      <VisadeTipsContext.Provider value={visade}>{children}</VisadeTipsContext.Provider>
    </RadgivarTipsApiContext.Provider>
  )
}

const SIDA = '/linkedin-optimizer'

/** Det första rådet på sidan — det som kortet och kolumnen slogs om. */
function forstaRadet(): string {
  const innehall = radgivareForPath(SIDA)!
  const coachId = innehall.coachIds[0]
  return innehall.byCoach[coachId]!.tips[0]
}

function rendera(medKort: boolean) {
  return render(
    <MemoryRouter>
      <Provider>
        {medKort && <RadgivarTips pathname={SIDA} index={0} />}
        <RadgivarPanel pathname={SIDA} />
      </Provider>
    </MemoryRouter>
  )
}

describe('infogat råd och kolumn upprepar inte varandra', () => {
  it('rådet står på exakt ett ställe när båda ytorna finns', () => {
    const rad = forstaRadet()
    rendera(true)
    expect(screen.getAllByText(rad)).toHaveLength(1)
  })

  it('kolumnen visar rådet när inget kort gör det', () => {
    // Kontrollen som ger föregående test mening: utan kortet ÄR rådet
    // kolumnens, och filtreringen får inte svälja det.
    const rad = forstaRadet()
    rendera(false)
    expect(screen.getAllByText(rad)).toHaveLength(1)
  })

  it('kolumnen visar fortfarande sina övriga råd', () => {
    const innehall = radgivareForPath(SIDA)!
    const tips = innehall.byCoach[innehall.coachIds[0]]!.tips
    expect(tips.length).toBeGreaterThan(1)
    rendera(true)
    // Råd nummer två hör kolumnen till och ska inte försvinna med råd ett.
    expect(screen.getByText(tips[1])).toBeTruthy()
  })

  it('rådgivarens namn står kvar i kolumnen', () => {
    const coach = COACHES[radgivareForPath(SIDA)!.coachIds[0]]
    rendera(true)
    expect(screen.getAllByText(coach.name).length).toBeGreaterThan(0)
  })
})

describe('registreringen loopar inte', () => {
  it('renderar ett ändligt antal gånger', () => {
    // Loopen som kraschade sidan syntes som obegränsat många renderingar.
    // React kastar "Maximum update depth exceeded" vid ~50; en ren montering
    // ska ligga långt under. Vi räknar panelens renderingar via en spion på
    // filtreringens indata.
    const spion = vi.fn()
    function Raknare() {
      spion()
      return null
    }
    render(
      <MemoryRouter>
        <Provider>
          <RadgivarTips pathname={SIDA} index={0} />
          <Raknare />
          <RadgivarPanel pathname={SIDA} />
        </Provider>
      </MemoryRouter>
    )
    // En montering + en omrendering när mängden fylls på. Fler än en handfull
    // betyder att cykeln är tillbaka.
    expect(spion.mock.calls.length).toBeLessThanOrEqual(5)
    expect(spion.mock.calls.length).toBeGreaterThan(0)
  })
})
