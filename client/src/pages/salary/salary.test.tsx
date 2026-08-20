/**
 * /salary hade noll tester. Sex granskare gick igenom sidan 2026-08-20 och de
 * tre mutationerna som kördes mot sviten överlevde allihop: rutten kunde tas
 * bort ur `App.tsx`, nettolönen sättas till 10 % av brutto och Stockholms
 * påslag höjas från 15 % till 900 % — 1 760 tester förblev gröna.
 *
 * Testerna nedan är skrivna mot just de felen, och varje test är kört mot en
 * mutation som återinför felet. Ett test som passerar bevisar ingenting
 * förrän man vet att det kan falla.
 */

import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import {
  YRKESOMRADEN, LONEREGIONER, ERFARENHETSNIVAER,
  beraknaLonespann, regionmedian, riksmedian, EXTERNA_LONEKALLOR,
} from '@/data/lonedata'
import { beraknaNetto } from '@/lib/skatt'

const sparaMock = vi.fn(async (_post: Record<string, unknown>) => ({}) as never)
const hamtaMock = vi.fn(async () => [] as never[])
vi.mock('@/services/careerApi', () => ({
  salaryApi: {
    getAll: () => hamtaMock(),
    save: (post: Record<string, unknown>) => sparaMock(post),
    delete: vi.fn(),
  },
}))

vi.mock('@/components/ai', () => ({
  SalaryInsightsPanel: (props: Record<string, unknown>) => (
    <div data-testid="ai-panel" data-props={Object.keys(props).join(',')} />
  ),
}))

vi.mock('@/stores/profileStore', () => ({
  useProfileStore: (valjare: (s: unknown) => unknown) =>
    valjare({ profile: { first_name: 'Anna', location: 'Malmö' } }),
}))

import SalaryCalculatorTab from './SalaryCalculatorTab'
import MarketDataTab from './MarketDataTab'

function Kalkylator() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const [val, setVal] = useState({ yrke: '', region: '', erfarenhet: '' })
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SalaryCalculatorTab val={val} onValChange={setVal} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function renderaMarknad() {
  return render(
    <MemoryRouter>
      <MarketDataTab />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  sparaMock.mockClear()
  hamtaMock.mockClear()
})

describe('lönedata — en källa, inte tre', () => {
  it('marknadsvyn och kalkylatorn läser samma tabell', () => {
    // Buggen: kalkylatorn sa att Ekonomi & Finans har medianen 48 000 medan
    // Marknadsdata sa 55 000 för "Finans & Bank". Två flikar, ett klick isär.
    for (const y of YRKESOMRADEN) {
      const spann = beraknaLonespann(y.namn, 'Övriga storstadsregioner', '3-5 år')
      expect(spann).not.toBeNull()
      expect(spann!.median).toBe(y.median)
      expect(spann!.min).toBe(y.min)
      expect(spann!.max).toBe(y.max)
    }
  })

  it('okänt val ger null i stället för att tyst falla tillbaka på basbeloppet', () => {
    // `|| 0` respektive `|| 1` gjorde ett stavfel oskiljbart från ett
    // medvetet nollvärde (Övriga storstadsregioner har justeringen 0).
    expect(beraknaLonespann('Rymdfart', 'Stockholm', '3-5 år')).toBeNull()
    expect(beraknaLonespann('Juridik', 'Mordor', '3-5 år')).toBeNull()
    expect(beraknaLonespann('Juridik', 'Stockholm', '47 år')).toBeNull()
  })

  it('regionpåslaget håller sig inom rimliga gränser', () => {
    // Mutationen som överlevde sviten: Stockholm 15 → 900. En junior i
    // Stockholm fick tio gånger marknadslönen utan att något märkte det.
    for (const r of LONEREGIONER) {
      expect(Math.abs(r.justeringProcent)).toBeLessThanOrEqual(25)
    }
    for (const e of ERFARENHETSNIVAER) {
      expect(e.faktor).toBeGreaterThan(0.5)
      expect(e.faktor).toBeLessThan(2)
    }
  })

  it('regionens visade lön följer dess egen procentsats', () => {
    // Buggen: regionen visade "+15 %" bredvid "48 000 kr" där talen kom från
    // två oberoende literaler. 48 000 / 40 000 är +20 %, inte +15 %.
    for (const r of LONEREGIONER) {
      const forvantat = Math.round(riksmedian() * (1 + r.justeringProcent / 100))
      expect(regionmedian(r)).toBe(forvantat)
    }
  })

  it('varje extern källa har en riktig adress', () => {
    for (const k of EXTERNA_LONEKALLOR) {
      expect(k.url).toMatch(/^https:\/\//)
    }
  })
})

describe('kalkylatorn räknar skatt, inte schablon', () => {
  it('nettolönen kommer ur skattemodellen — inte 78 % av brutto', async () => {
    render(<Kalkylator />)

    fireEvent.change(screen.getByLabelText(/yrkesområde/i), { target: { value: 'Juridik' } })
    fireEvent.change(screen.getByLabelText(/var i landet/i), { target: { value: 'Stockholm' } })
    fireEvent.change(screen.getByLabelText(/hur länge/i), { target: { value: '10+ år' } })
    fireEvent.click(screen.getByRole('button', { name: /räkna ut din lön/i }))

    const spann = beraknaLonespann('Juridik', 'Stockholm', '10+ år')!
    const netto = beraknaNetto(spann.median)!
    const schablon = Math.round(spann.median * 0.78)

    // Vid den här lönen skiljer modellen och schablonen mer än 10 000 kr.
    expect(Math.abs(netto.nettoManad - schablon)).toBeGreaterThan(10_000)

    await waitFor(() => {
      expect(screen.getByText(new RegExp(netto.nettoManad.toLocaleString('sv-SE').replace(/\s/g, '\\s')))).toBeInTheDocument()
    })
    expect(screen.queryByText(new RegExp(schablon.toLocaleString('sv-SE').replace(/\s/g, '\\s')))).toBeNull()
  })

  it('säger att talen är uppskattningar och pekar vidare till en riktig källa', async () => {
    render(<Kalkylator />)
    expect(screen.getByText(/grova uppskattningar/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /SCB Lönesök/i })).toHaveAttribute(
      'href',
      expect.stringContaining('scb.se'),
    )
  })

  it('skickar inte en påhittad "nuvarande lön" till AI-panelen', () => {
    // Panelen fick kalkylatorns EGEN uppskattning och skickade den vidare
    // till modellen som "NUVARANDE LÖN" — ett tal användaren aldrig angett.
    render(<Kalkylator />)
    const props = screen.getByTestId('ai-panel').getAttribute('data-props') ?? ''
    expect(props).not.toContain('currentSalary')
  })

  it('förifyller regionen från profilen och säger att den gjort det', () => {
    render(<Kalkylator />)
    expect((screen.getByLabelText(/var i landet/i) as HTMLSelectElement).value).toBe('Malmö')
    expect(screen.getByText(/ifyllt från din profil/i)).toBeInTheDocument()
  })

  it('sparar beräkningen till salary_searches — inte till minnet', async () => {
    render(<Kalkylator />)
    fireEvent.change(screen.getByLabelText(/yrkesområde/i), { target: { value: 'Administration' } })
    fireEvent.change(screen.getByLabelText(/hur länge/i), { target: { value: '0-2 år' } })
    fireEvent.click(screen.getByRole('button', { name: /räkna ut din lön/i }))
    fireEvent.click(await screen.findByRole('button', { name: /spara den här beräkningen/i }))

    await waitFor(() => expect(sparaMock).toHaveBeenCalledTimes(1))
    const post = sparaMock.mock.calls[0][0]
    expect(post.occupation).toBe('Administration')
    expect(post.median_salary).toBe(beraknaLonespann('Administration', 'Malmö', '0-2 år')!.median)
  })
})

describe('marknadsdatan säger var siffrorna kommer ifrån', () => {
  it('tillskriver dem inte SCB', () => {
    renderaMarknad()
    // Rubriken "Var kommer siffrorna ifrån?" ska finnas, och texten får inte
    // påstå att talen ÄR hämtade från SCB. Länken till SCB är däremot rätt:
    // den pekar dit man hittar riktig statistik.
    expect(screen.getByText(/var kommer siffrorna ifrån/i)).toBeInTheDocument()
    expect(screen.getByText(/ingen källa bakom sig/i)).toBeInTheDocument()
    expect(screen.queryByText(/Data baseras på branschrapporter, SCB-statistik/i)).toBeNull()
    expect(screen.queryByText(/Senast uppdaterad: Q1 2026/i)).toBeNull()
  })

  it('visar inga löneökningsprognoser — de hade ingen källa och fel pilriktning', () => {
    renderaMarknad()
    // Sju av tretton branscher visade nedåtpil bredvid en POSITIV siffra,
    // eftersom pilen valdes av `change >= 3` i stället för av tecknet.
    expect(screen.queryByText(/%\/år/)).toBeNull()
  })

  it('varje utfällbar rad säger om den är öppen', () => {
    renderaMarknad()
    const rader = screen.getAllByRole('button', { expanded: false })
    expect(rader.length).toBeGreaterThanOrEqual(YRKESOMRADEN.length)

    fireEvent.click(screen.getByRole('button', { name: /Juridik/i }))
    expect(screen.getByRole('button', { name: /Juridik/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('sorteringsknapparna talar om vilken som är vald', () => {
    renderaMarknad()
    const efterLon = screen.getByRole('button', { name: /högst lön först/i })
    const efterNamn = screen.getByRole('button', { name: /bokstavsordning/i })
    expect(efterLon).toHaveAttribute('aria-pressed', 'true')
    expect(efterNamn).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(efterNamn)
    expect(efterNamn).toHaveAttribute('aria-pressed', 'true')
  })

  it('en sökning utan träff ger en väg vidare, inte bara ett konstaterande', () => {
    renderaMarknad()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'rymdfart' } })
    expect(screen.getByRole('button', { name: /rensa sökning/i })).toBeInTheDocument()
  })
})
