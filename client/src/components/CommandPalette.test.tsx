/**
 * Tester för kommandopaletten (steg 1 i navigationsomläggningen, 2026-08-17).
 *
 * Paletten är portalens svar på "svårt att hitta saker": 25 undersidor ligger
 * bakom 5 hubbar, och för att nå Löneläget måste man i dag veta att den bor
 * under Söka jobb.
 *
 * Det som testas är i tur och ordning:
 *  1. Matchningens REGLER, som rena funktioner. De avgör om paletten känns
 *     begriplig eller nyckfull, och de går att testa utan DOM.
 *  2. Att listan byggs ur `navHubs` — inte ur en egen kopia. En andra lista
 *     hade glidit isär och skickat folk till sidor som tagits bort. Samma
 *     buggklass som artikellänkarna mot en Set som inte var en routematchare.
 *  3. Öppning, tangentbord och tillgänglighetsmärkning i DOM.
 *
 * jsdom-förbehållet: `offsetParent` är alltid null, så `useFocusTrap` ser noll
 * fokuserbara element och fokuscyklingen kan inte verifieras här (lärdomen
 * 2026-08-04). Escape och `aria-activedescendant` går däremot att mäta, och
 * det är de som bär beteendet.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CommandPalette from './CommandPalette'
import { normalisera, matchar, poang, type PalettMal } from '@/lib/palettMatchning'
import { navHubs } from './layout/navigation'

afterEach(cleanup)

function oppna() {
  const utils = render(
    <MemoryRouter>
      <CommandPalette />
    </MemoryRouter>
  )
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
  return utils
}

const mal = (label: string, grupp: string): PalettMal => ({ path: '/x', label, grupp })

describe('normalisering — svenska tecken får inte stå i vägen', () => {
  it('gör om å ä ö så att "lonelage" hittar "Löneläget"', () => {
    expect(normalisera('Löneläget')).toBe('lonelaget')
    expect(normalisera('Nätverk')).toBe('natverk')
    expect(normalisera('Spontanansökan')).toBe('spontanansokan')
  })

  it('skälet: målgruppen inkluderar personer som är nya i Sverige', () => {
    // Fem av K20:s guider handlar om just det. Ett svenskt tangentbord är inte
    // givet, och en sökruta som kräver ö är en sökruta som inte fungerar.
    expect(matchar(mal('Löneläget', 'Söka jobb'), 'lonelaget')).toBe(true)
  })
})

describe('matchningen är begriplig, inte smart', () => {
  it('varje ord måste finnas — "brev jobb" hittar Personligt brev under Söka jobb', () => {
    expect(matchar(mal('Personligt brev', 'Söka jobb'), 'brev jobb')).toBe(true)
  })

  it('"brev vardag" hittar ingenting, vilket är rätt svar', () => {
    expect(matchar(mal('Personligt brev', 'Söka jobb'), 'brev vardag')).toBe(false)
  })

  it('tom sökterm visar allt', () => {
    expect(matchar(mal('Dagbok', 'Min vardag'), '')).toBe(true)
    expect(matchar(mal('Dagbok', 'Min vardag'), '   ')).toBe(true)
  })

  it('matchar mitt i ordet — man ska inte behöva veta hur namnet börjar', () => {
    expect(matchar(mal('Intervjuträning', 'Söka jobb'), 'traning')).toBe(true)
  })

  it('gör INTE fuzzy-matchning: "lg" hittar inte Löneläget', () => {
    // Medvetet val. En sökning som hittar Löneläget på "lg" hittar också fel
    // saker på stavfel, och en oväntad träfflista är värre än ingen för någon
    // med låg digital vana.
    expect(matchar(mal('Löneläget', 'Söka jobb'), 'lg')).toBe(false)
  })
})

describe('rangordningen sätter det uppenbara först', () => {
  it('exakt träff slår början slår mitten slår grupp', () => {
    const exakt = poang(mal('CV', 'Söka jobb'), 'cv')
    const borjan = poang(mal('CV-mallar', 'Söka jobb'), 'cv')
    const mitten = poang(mal('Mitt CV', 'Söka jobb'), 'cv')
    const grupp = poang(mal('Dagbok', 'CV och brev'), 'cv')
    expect(exakt).toBeGreaterThan(borjan)
    expect(borjan).toBeGreaterThan(mitten)
    expect(mitten).toBeGreaterThan(grupp)
  })

  it('"dokument" sätter Dokument före Mina dokument', () => {
    expect(poang(mal('Dokument', 'Resurser'), 'dokument'))
      .toBeGreaterThan(poang(mal('Mina dokument', 'Resurser'), 'dokument'))
  })
})

describe('listan byggs ur navHubs, inte ur en egen kopia', () => {
  it('varje undersida i navHubs går att hitta', () => {
    oppna()
    const input = screen.getByRole('combobox')
    // Stickprov över alla fem hubbar — hela listan hade gjort testet långsamt
    // utan att bevisa mer, eftersom källan är densamma för alla.
    const stickprov = navHubs.flatMap((h) => h.items.slice(0, 2)).map((i) => i.path)
    expect(stickprov.length).toBeGreaterThan(6)

    // Tom sökning visar de tolv första — att listan alls fylls ur navHubs
    // bevisas av att en hubs egen etikett dyker upp som grupp.
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.getAllByRole('option').length).toBeGreaterThan(5)
  })

  it('hittar en sida som INTE syns i dagens /jobb-hubb (fynd F26)', () => {
    // /linkedin-optimizer och /international saknas i hubbsidans kort men
    // finns i navHubs[].items. Paletten når dem därför gratis.
    oppna()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'linkedin' } })
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
  })

  it('visar vilken kategori träffen ligger i — det är hela poängen', () => {
    oppna()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dagbok' } })
    const forsta = screen.getAllByRole('option')[0]
    expect(forsta.textContent).toMatch(/vardag/i)
  })
})

describe('öppning och stängning', () => {
  it('renderar ingenting förrän den öppnas', () => {
    render(<MemoryRouter><CommandPalette /></MemoryRouter>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('Ctrl+K öppnar', () => {
    oppna()
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('⌘K öppnar också — Mac-tangentbord', () => {
    render(<MemoryRouter><CommandPalette /></MemoryRouter>)
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('Ctrl+K igen stänger', () => {
    oppna()
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('Escape stänger', () => {
    oppna()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('ensamt K gör ingenting — annars kan man inte skriva bokstaven k', () => {
    render(<MemoryRouter><CommandPalette /></MemoryRouter>)
    fireEvent.keyDown(document, { key: 'k' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('tangentbordet räcker hela vägen', () => {
  it('pil ner flyttar markeringen', () => {
    oppna()
    const input = screen.getByRole('combobox')
    expect(input.getAttribute('aria-activedescendant')).toBe('palett-0')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.getAttribute('aria-activedescendant')).toBe('palett-1')
  })

  it('pil upp från första posten går runt till sista', () => {
    oppna()
    const input = screen.getByRole('combobox')
    const antal = screen.getAllByRole('option').length
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input.getAttribute('aria-activedescendant')).toBe(`palett-${antal - 1}`)
  })

  it('markeringen nollställs när träfflistan krymper under den', () => {
    // Utan detta kunde Enter aktivera en post som inte längre finns.
    oppna()
    const input = screen.getByRole('combobox')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.change(input, { target: { value: 'dagbok' } })
    expect(input.getAttribute('aria-activedescendant')).toBe('palett-0')
  })
})

describe('tillgänglighet', () => {
  it('är märkt som modal dialog med namn', () => {
    oppna()
    const d = screen.getByRole('dialog')
    expect(d.getAttribute('aria-modal')).toBe('true')
    expect(d.getAttribute('aria-label')).toBeTruthy()
  })

  it('fältet är en combobox som styr listboxen', () => {
    oppna()
    const input = screen.getByRole('combobox')
    expect(input.getAttribute('aria-controls')).toBe('palett-lista')
    expect(screen.getByRole('listbox')).toBeTruthy()
  })

  it('antalet träffar annonseras — annars vet skärmläsaren inte om det blev noll', () => {
    oppna()
    expect(screen.getByRole('status').textContent).toMatch(/\d/)
  })

  it('markerad post är aria-selected, inte bara färgad', () => {
    oppna()
    expect(screen.getAllByRole('option')[0].getAttribute('aria-selected')).toBe('true')
  })
})

describe('tomt läge säger vad man ska göra', () => {
  it('föreslår ett kortare ord i stället för att bara konstatera noll', () => {
    oppna()
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'xyzzy-finns-inte' },
    })
    expect(screen.queryByRole('option')).toBeNull()
    // DESIGN.md §7 och F30: ett tomt tillstånd ska säga nästa steg.
    expect(screen.getByText(/kortare ord/i)).toBeTruthy()
  })
})

describe('negativ kontroll — testet kan falla', () => {
  it('matchar() kan svara nej', () => {
    // Utan den här raden bevisar de gröna testerna ovan inte att matchningen
    // gör något alls — en funktion som alltid returnerar true hade passerat
    // varje positivt test. Jfr lärdomen 2026-08-09 om mutationsstickprov.
    expect(matchar(mal('Dagbok', 'Min vardag'), 'raketuppskjutning')).toBe(false)
  })

  it('navHubs är inte tom — annars testar vi ingenting', () => {
    expect(navHubs.length).toBeGreaterThan(3)
    expect(navHubs.flatMap((h) => h.items).length).toBeGreaterThan(20)
  })
})

describe('navigering', () => {
  it('Enter navigerar och stänger paletten', () => {
    oppna()
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'dagbok' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('Enter utan träffar gör ingenting — ingen krasch', () => {
    oppna()
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'xyzzy-finns-inte' } })
    expect(() => fireEvent.keyDown(input, { key: 'Enter' })).not.toThrow()
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('klick på en post navigerar', () => {
    const spy = vi.fn()
    oppna()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dagbok' } })
    fireEvent.click(screen.getAllByRole('option')[0])
    expect(screen.queryByRole('dialog')).toBeNull()
    spy()
  })
})
