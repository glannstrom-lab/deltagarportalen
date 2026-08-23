/**
 * Tester för Externa resurser.
 *
 * Sidan hade inga alls före 2026-08-23 — 3 580 rader och 323 externa länkar
 * utan en enda kontroll. Det enda testfilen som nämnde den låg i
 * `archive/2026-07-widget-system/` och prövade widget-systemet, som aldrig
 * monteras i prod.
 *
 * Testerna nedan är valda efter vad som faktiskt gick sönder i granskningen,
 * inte efter vad som var lätt att skriva. Varje ska kunna FALLA — kontrollerat
 * med riktade mutationer 2026-08-23, se noteringarna vid respektive test.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, waitFor, userEvent, within } from '@/test/utils'
import ExternalResources from './ExternalResources'
import {
  EXTERNA_RESURSER,
  HUVUDFLIKAR,
  UTVALDA_IDN,
  kategoriTitel,
} from '@/data/externaResurser'

// Rådgivarkolumnen läser en 43 kB datafil och hör inte till det som prövas.
vi.mock('@/components/radgivare/RadgivarPanel', () => ({
  RadgivarPanel: () => null,
  RadgivarTips: () => null,
}))

afterEach(cleanup)

/**
 * `SidRail` renderar flikraden TVÅ gånger — en kolumn för desktop och en
 * scrollande rad för mobil — så varje flik matchar två knappar. Att ta den
 * första är rätt: det är desktopvarianten, och båda styr samma tillstånd.
 */
async function valjFlik(namn: string) {
  const knappar = await screen.findAllByRole('button', { name: namn })
  await userEvent.click(knappar[0])
}

describe('Externa resurser — datans invarianter', () => {
  // Mutation: ta bort en kategori ur registret → kategoriTitel returnerar
  // id:t och det här testet faller. Före 2026-08-23 kraschade sidan i stället,
  // eftersom `categoryLabels[category]` destrukturerades utan reserv.
  it('varje resurs har en kategori som finns i registret', () => {
    const t = ((_nyckel: string, reserv?: string) => reserv ?? '') as never
    const utan = EXTERNA_RESURSER.filter((r) => kategoriTitel(t, r.category) === r.category)
    expect(utan.map((r) => `${r.id} (${r.category})`)).toEqual([])
  })

  // Mutation: ta bort en kategori ur en fliks `kategorier` → den blir osynlig
  // överallt utom i sökningen, utan att något annat larmar.
  it('varje kategori ligger i exakt en flik', () => {
    const iFlikar = HUVUDFLIKAR.flatMap((f) => f.kategorier)
    const anvanda = [...new Set(EXTERNA_RESURSER.map((r) => r.category))]

    expect(anvanda.filter((k) => !iFlikar.includes(k))).toEqual([])
    expect(iFlikar.filter((k, i) => iFlikar.indexOf(k) !== i)).toEqual([])
  })

  // Mutation: felstava ett id i UTVALDA_IDN → kortet försvinner tyst ur
  // "Bra att börja med". Det hände på riktigt: `yrkeskollen` låg kvar i
  // urvalet efter att posten tagits bort som död länk.
  it('alla utvalda id:n pekar på en resurs som finns', () => {
    const saknade = UTVALDA_IDN.filter((id) => !EXTERNA_RESURSER.some((r) => r.id === id))
    expect(saknade).toEqual([])
  })

  // 87 av 323 länkar var trasiga vid granskningen. Det här testet hittar inte
  // döda länkar — det kräver nätet — men det håller formen ren så att nästa
  // maskinella svep kan lita på datan.
  it('inga dubbletter och inga adresser utan https', () => {
    const idn = EXTERNA_RESURSER.map((r) => r.id)
    const urlar = EXTERNA_RESURSER.map((r) => r.url)

    expect(idn.filter((v, i) => idn.indexOf(v) !== i)).toEqual([])
    expect([...new Set(urlar.filter((v, i) => urlar.indexOf(v) !== i))]).toEqual([])
    expect(urlar.filter((u) => !u.startsWith('https://'))).toEqual([])
  })
})

describe('Externa resurser — sidan', () => {
  // Mutation: byt EmptyState mot den tomma griden som stod här före
  // 2026-08-23 → testet faller. Sökningen gav då en helt tom sida.
  it('en sökning utan träffar ger ett tomtillstånd med väg vidare', async () => {
    render(<ExternalResources />)
    const falt = await screen.findByLabelText(/Sök bland resurserna/i)

    await userEvent.type(falt, 'zzzqqqxyz')

    expect(await screen.findByText(/hittade ingen resurs som matchar/i)).toBeInTheDocument()
    const rensa = screen.getAllByRole('button', { name: /Rensa sökningen/i })
    await userEvent.click(rensa[rensa.length - 1])

    await waitFor(() =>
      expect(screen.queryByText(/hittade ingen resurs som matchar/i)).not.toBeInTheDocument()
    )
  })

  // Mutation: ta bort `role="status"` → testet faller. WCAG 4.1.3: räknaren
  // uppdaterades tyst vid varje tangenttryck.
  it('antalet träffar annonseras i en liveregion', async () => {
    render(<ExternalResources />)
    const falt = await screen.findByLabelText(/Sök bland resurserna/i)

    await userEvent.type(falt, 'a-kassa')

    await waitFor(() => {
      const status = screen.getAllByRole('status').map((e) => e.textContent ?? '')
      expect(status.some((s) => /resurs(er)? för/.test(s))).toBe(true)
    })
  })

  // Mutation: ta bort aria-expanded/aria-controls → testet faller. Före
  // 2026-08-23 fanns ingetdera, så en skärmläsare fick 35 namnlösa sektioner.
  it('kategoriavsnitten är kopplade knapp–panel och byter tillstånd', async () => {
    render(<ExternalResources />)
    await valjFlik('Hitta jobb')

    const knappar = await screen.findAllByRole('button', { expanded: true })
    const avsnitt = knappar.filter((k) => k.getAttribute('aria-controls')?.startsWith('avsnitt-panel'))
    expect(avsnitt.length).toBeGreaterThan(0)

    const forsta = avsnitt[0]
    const panelId = forsta.getAttribute('aria-controls')!
    expect(document.getElementById(panelId)).toBeTruthy()
    expect(document.getElementById(panelId)!.getAttribute('aria-labelledby')).toBe(forsta.id)

    await userEvent.click(forsta)
    await waitFor(() => expect(forsta).toHaveAttribute('aria-expanded', 'false'))
  })

  // Mutation: låt `valjFlik` bara sätta `aktivFlik` utan att öppna avsnitten →
  // testet faller. Det var precis felet: alla fem flikar visade åtta länkar.
  it('att välja en flik visar flikens länkar, inte bara hopfällda rubriker', async () => {
    render(<ExternalResources />)
    await valjFlik('Starta eget')

    const lankar = await screen.findAllByRole('link', { name: /öppnas i ny flik/i })
    expect(lankar.length).toBeGreaterThan(8)
  })

  // Mutation: rendera urvalet oavsett flik → testet faller. Samma åtta kort
  // upprepades tidigare ovanför varje fliks egna avsnitt.
  it('urvalet visas bara på Alla', async () => {
    render(<ExternalResources />)
    expect(await screen.findByRole('heading', { name: /Bra att börja med/i })).toBeInTheDocument()

    await valjFlik('Lärande')

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: /Bra att börja med/i })).not.toBeInTheDocument()
    )
  })

  // Mutation: ta bort sr-only-texten → testet faller. WCAG 3.2.5: alla
  // länkarna öppnar ny flik och ingenting sa det.
  it('varje länk säger att den öppnar en ny flik', async () => {
    render(<ExternalResources />)
    const urval = await screen.findByRole('region', { name: /Bra att börja med/i })

    const lankar = within(urval).getAllByRole('link')
    expect(lankar.length).toBe(UTVALDA_IDN.length)
    for (const l of lankar) {
      expect(l).toHaveAccessibleName(/öppnas i ny flik/i)
      expect(l).toHaveAttribute('rel', expect.stringContaining('noopener'))
    }
  })
})
