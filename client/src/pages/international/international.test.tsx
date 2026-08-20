/**
 * /international hade noll beteendetester. Sex granskare gick igenom sidan
 * 2026-08-20 och tre av fyra mutationer överlevde hela sviten på 2 072 tester —
 * bland dem att ändra lönegolvet i visumfliken till "1 kr/mån".
 *
 * Sidan är sedan dess omscopad (beslut Mikael): visumfliken är ersatt av
 * validering och legitimation, och sidan anger inga belopp alls. Testerna
 * nedan vaktar båda besluten, plus de mekaniska fel granskningen hittade.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const hamtaMock = vi.fn(async () => ({ items: {}, lastUpdated: '' }))
const sparaMock = vi.fn(async (_items: Record<string, unknown>) => true)
vi.mock('@/services/cloudStorage', () => ({
  integrationChecklistApi: {
    getProgress: () => hamtaMock(),
    saveProgress: (items: Record<string, unknown>) => sparaMock(items),
  },
}))

import ValideringTab from './ValideringTab'
import IntegrationTab from './IntegrationTab'
import LanguageTab from './LanguageTab'

const rendera = (el: React.ReactElement) => render(<MemoryRouter>{el}</MemoryRouter>)

beforeEach(() => {
  hamtaMock.mockClear()
  hamtaMock.mockResolvedValue({ items: {}, lastUpdated: '' })
  sparaMock.mockClear()
  sparaMock.mockResolvedValue(true)
})

describe('valideringsfliken säger vad som gäller — utan att ange belopp', () => {
  it('innehåller inga kronbelopp eller handläggningstider', () => {
    // Beslut 2026-08-20: sidan anger inga siffror om tillstånd. Den gamla
    // fliken sa "minst 13 000 kr/mån" — försörjningskravet fram till november
    // 2023 — och stod kvar i tre år. Ett indexerat belopp hör inte hemma i
    // källkod, och ett fel här kan kosta någon ett tillstånd.
    const { container } = rendera(<ValideringTab />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/\d[\d\s]*kr/i)
    expect(text).not.toMatch(/\d+\s*(–|-|till)\s*\d+\s*(månader|veckor)/i)
  })

  it('pekar på Migrationsverkets djuplänkar, inte på startsidan', () => {
    // Den gamla länken gav HTTP 200 men landade på förstasidan efter att
    // Migrationsverket lagt om sajten — en mjuk 404, som inget larmar om.
    const { container } = rendera(<ValideringTab />)
    const adresser = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
    expect(adresser).not.toContain('https://www.migrationsverket.se/Privatpersoner/Arbeta-i-Sverige.html')
    expect(adresser.some((u) => u?.includes('/du-vill-ansoka/arbeta/'))).toBe(true)
    expect(adresser.some((u) => u?.includes('uhr.se'))).toBe(true)
    expect(adresser.some((u) => u?.includes('socialstyrelsen.se'))).toBe(true)
  })

  it('säger att EU/EES-medborgare inte behöver tillstånd', () => {
    // Halva målgruppen läste tidigare en lista där punkt 1 var en ansökan de
    // aldrig ska göra.
    rendera(<ValideringTab />)
    expect(screen.getByText(/behöver du inget arbetstillstånd/i)).toBeInTheDocument()
  })

  it('visar när uppgifterna kontrollerades', () => {
    rendera(<ValideringTab />)
    expect(screen.getByText(/kontrollerades mot myndigheternas webbplatser/i)).toBeInTheDocument()
  })
})

describe('checklistan går att använda med tangentbord och sparar på riktigt', () => {
  it('varje punkt är en kryssruta med avläsbart tillstånd', async () => {
    rendera(<IntegrationTab />)
    const rutor = await screen.findAllByRole('checkbox')
    expect(rutor.length).toBeGreaterThanOrEqual(14)
    expect(rutor[0]).toHaveAttribute('aria-checked', 'false')
  })

  it('sparar krysset och skickar hela mängden', async () => {
    rendera(<IntegrationTab />)
    const rutor = await screen.findAllByRole('checkbox')
    fireEvent.click(rutor[0])

    await waitFor(() => expect(sparaMock).toHaveBeenCalledTimes(1))
    const skickat = sparaMock.mock.calls[0][0] as Record<string, { completed: boolean }>
    expect(skickat.folkbokforing.completed).toBe(true)
  })

  it('rullar tillbaka krysset när molnet säger nej — och säger till', async () => {
    // Tidigare kastades returvärdet. En användare vars skrivning nekades såg
    // fjorton gröna bockar som bara fanns i minnet.
    sparaMock.mockResolvedValue(false)
    rendera(<IntegrationTab />)
    const rutor = await screen.findAllByRole('checkbox')
    fireEvent.click(rutor[0])

    await waitFor(() => expect(screen.getByText(/kunde inte sparas/i)).toBeInTheDocument())
    expect((await screen.findAllByRole('checkbox'))[0]).toHaveAttribute('aria-checked', 'false')
  })

  it('visar att den hämtar innan svaret är inne — inte "0 av 14"', async () => {
    let slappLos: (v: { items: Record<string, never>; lastUpdated: string }) => void = () => {}
    hamtaMock.mockReturnValue(new Promise((r) => { slappLos = r }) as never)
    rendera(<IntegrationTab />)

    expect(screen.getByText(/hämtar var du är/i)).toBeInTheDocument()
    slappLos({ items: {}, lastUpdated: '' })
    await waitFor(() => expect(screen.queryByText(/hämtar var du är/i)).toBeNull())
  })

  it('räknar bara punkter som finns i listan i dag', async () => {
    // Räknaren summerade allt som låg i molnet, så en borttagen punkt kunde ge
    // "15 av 14".
    hamtaMock.mockResolvedValue({
      items: {
        folkbokforing: { id: 'folkbokforing', completed: true },
        enPunktSomTagitsBort: { id: 'enPunktSomTagitsBort', completed: true },
      },
      lastUpdated: '',
    } as never)
    rendera(<IntegrationTab />)
    expect(await screen.findByText(/1 av 14/)).toBeInTheDocument()
  })

  it('varje punkt kan fällas ut och säger om den är öppen', async () => {
    rendera(<IntegrationTab />)
    const knapp = (await screen.findAllByRole('button', { name: /visa mer om/i }))[0]
    expect(knapp).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(knapp)
    expect(knapp).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('språkfliken', () => {
  it('filtret filtrerar på riktigt', () => {
    // "Mellannivå"-knappen gav tidigare exakt samma lista som "Alla nivåer",
    // eftersom villkoret var `level !== 'advanced'` och ingen resurs hade den
    // nivån.
    rendera(<LanguageTab />)
    const alla = screen.getAllByRole('listitem').length
    fireEvent.click(screen.getByRole('button', { name: /bara gratis/i }))
    expect(screen.getAllByRole('listitem').length).toBeLessThan(alla)
    expect(screen.getByRole('button', { name: /bara gratis/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('märker de engelska raderna med lang, så talsyntesen inte läser dem som svenska', () => {
    const { container } = rendera(<LanguageTab />)
    expect(container.querySelectorAll('p[lang="en"]').length).toBe(10)
    expect(container.querySelectorAll('p[lang="sv"]').length).toBe(10)
  })

  it('säger vem som har rätt till sfi — inte bara att det är gratis', () => {
    rendera(<LanguageTab />)
    expect(screen.getByText(/bor i kommunen, fyllt 16 år/i)).toBeInTheDocument()
  })

  it('påstår inte att en viss nivå räcker på jobbet', () => {
    // "B1-nivå är ofta tillräckligt för att fungera bra på en svensk
    // arbetsplats" var ett obelagt påstående om arbetsmarknaden — och fel för
    // legitimationsyrken, där kravet är reglerat.
    const { container } = rendera(<LanguageTab />)
    expect(container.textContent ?? '').not.toMatch(/B1[^.]*tillräckligt/i)
    expect(screen.getByText(/I några yrken är kravet reglerat/i)).toBeInTheDocument()
  })
})
