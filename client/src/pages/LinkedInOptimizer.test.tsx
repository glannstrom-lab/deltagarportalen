/**
 * /linkedin-optimizer hade noll tester. Sex granskare gick igenom sidan
 * 2026-08-20 och tre riktade mutationer överlevde hela sviten på 1 824 tester:
 * en i18n-nyckel bytt mot en obefintlig, AI-felet svalt till en tom yta, och
 * hela `LinkedInOptimizerInner` ersatt med `return null` — sidan kunde vara
 * helt tom utan att något larmade.
 *
 * Testerna nedan är skrivna mot de fel granskningen fann, och varje test är
 * kört mot en mutation som återinför felet.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const callAIMock = vi.fn()
vi.mock('@/services/aiApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/aiApi')>('@/services/aiApi')
  return {
    ...faktisk,
    callAI: (namn: string, params: unknown) => callAIMock(namn, params),
  }
})

const hamtaKryssMock = vi.fn(async (_id: string) => [] as string[])
const sparaKryssMock = vi.fn(async (_id: string, _poster: string[]) => undefined)
vi.mock('@/services/cloudStorage', () => ({
  articleChecklistApi: {
    get: (id: string) => hamtaKryssMock(id),
    update: (id: string, items: string[]) => sparaKryssMock(id, items),
  },
}))

vi.mock('@/services/supabaseApi', () => ({
  cvApi: { getCV: async () => ({ title: 'Undersköterska' }) },
}))

vi.mock('@/stores/profileStore', () => ({
  useProfileStore: (valjare: (s: unknown) => unknown) => valjare({ profile: { first_name: 'Anna' } }),
}))

vi.mock('@/components/radgivare/RadgivarPanel', () => ({ RadgivarTips: () => null }))

vi.mock('@/components/layout/PageLayout', () => ({
  PageLayout: ({ children, sidoflikar }: {
    children?: React.ReactNode
    sidoflikar?: { poster: { id: string; etikett: string }[]; vidVal: (id: string) => void }
  }) => (
    <div>
      {sidoflikar?.poster.map((p) => (
        <button key={p.id} onClick={() => sidoflikar.vidVal(p.id)}>{p.etikett}</button>
      ))}
      {children}
    </div>
  ),
}))

let fokuslage = false
vi.mock('@/components/FocusModeProvider', () => ({
  useFocusMode: () => ({ isFocusMode: fokuslage, leaveWizard: vi.fn() }),
  FocusModeProvider: () => null,
}))

import { AiConsentRequiredError } from '@/services/aiApi'
import LinkedInOptimizer from './LinkedInOptimizer'

function rendera() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LinkedInOptimizer />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  fokuslage = false
  callAIMock.mockReset()
  hamtaKryssMock.mockClear()
  sparaKryssMock.mockClear()
})

describe('checklistan går att nå från sin egen flik', () => {
  it('visar sektioner och kryssrutor direkt när fliken öppnas', async () => {
    // Buggen: `auditSections` fylldes bara av en knapp som renderades på
    // rubrik-fliken. Den som klickade "Checklista" i skenan fick rubriken,
    // stycket "gå igenom listan" — och sedan ingenting.
    rendera()
    fireEvent.click(screen.getByRole('button', { name: 'Checklista' }))

    // Fyra delar, och den första är utfälld med sina punkter synliga.
    for (const del of [/Rubriken/, /Om-avsnittet/, /Erfarenheterna/, /Rekommendationer/]) {
      expect(await screen.findByRole('button', { name: del })).toBeInTheDocument()
    }
    const kryssrutor = await screen.findAllByRole('checkbox')
    expect(kryssrutor.length).toBe(3)
    expect(kryssrutor[0]).toHaveAttribute('aria-checked', 'false')
  })

  it('sparar krysset i stället för att tappa det vid nästa navigering', async () => {
    rendera()
    fireEvent.click(screen.getByRole('button', { name: 'Checklista' }))
    const kryssrutor = await screen.findAllByRole('checkbox')
    fireEvent.click(kryssrutor[0])

    await waitFor(() => expect(sparaKryssMock).toHaveBeenCalledTimes(1))
    const [id, poster] = sparaKryssMock.mock.calls[0]
    expect(id).toBe('linkedin-profil')
    expect(poster).toEqual(['rubrik.yrke'])
  })

  it('varje utfällbar del säger om den är öppen', async () => {
    rendera()
    fireEvent.click(screen.getByRole('button', { name: 'Checklista' }))
    const delknapp = await screen.findByRole('button', { name: /Om-avsnittet/ })
    expect(delknapp).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(delknapp)
    expect(delknapp).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('mallen är en mall — inte ett AI-svar', () => {
  it('märker INTE reservmallen som AI-genererad när anropet failar', async () => {
    // Buggen: mallen lades i samma `resultat` som AI-svaret och renderades med
    // data-ai-generated="true" + "Detta förslag är genererat med AI-stöd".
    callAIMock.mockRejectedValue(new Error('502'))
    const { container } = rendera()

    fireEvent.change(screen.getByLabelText(/Vad du gör eller vill göra/i), { target: { value: 'Lokalvårdare' } })
    fireEvent.click(screen.getByRole('button', { name: /Skriv ett förslag med AI/i }))

    expect(await screen.findByText(/Grundmall — inte ett AI-svar/)).toBeInTheDocument()
    expect(container.querySelector('[data-ai-generated="true"]')).toBeNull()
    expect(screen.queryByText(/genererat med AI-stöd/i)).toBeNull()
  })

  it('mallen påstår ingenting om personen — den har hålrum att fylla i', async () => {
    // Den gamla mallen skrev "Erfaren specialist inom branschen" och "Jag är en
    // driven … med passion för …" om någon som bara angett sitt yrke.
    callAIMock.mockRejectedValue(new Error('502'))
    rendera()
    fireEvent.change(screen.getByLabelText(/Vad du gör eller vill göra/i), { target: { value: 'Lokalvårdare' } })
    fireEvent.click(screen.getByRole('button', { name: /Skriv ett förslag med AI/i }))

    const text = (await screen.findByText(/Lokalvårdare \|/)).textContent ?? ''
    expect(text).toMatch(/\[.+\]/) // hålrum kvar att fylla i
    expect(text).not.toMatch(/erfaren specialist|driven|passion/i)
  })

  it('märker AI-svaret som AI-genererat', async () => {
    callAIMock.mockResolvedValue({ text: 'Lokalvårdare | van vid storkök | söker arbete i Malmö' })
    const { container } = rendera()
    fireEvent.change(screen.getByLabelText(/Vad du gör eller vill göra/i), { target: { value: 'Lokalvårdare' } })
    fireEvent.click(screen.getByRole('button', { name: /Skriv ett förslag med AI/i }))

    await screen.findByText(/van vid storkök/)
    expect(container.querySelector('[data-ai-generated="true"]')).not.toBeNull()
  })
})

describe('felen skiljs åt', () => {
  it('säger att DU stängt av AI — inte att tjänsten är nere', async () => {
    // Alla fyra orsaker gav tidigare samma mening: "AI-tjänsten är inte
    // tillgänglig just nu". Osant i tre av fyra fall, och utan väg vidare.
    callAIMock.mockRejectedValue(new AiConsentRequiredError('Du har stängt av AI-behandling'))
    rendera()
    fireEvent.change(screen.getByLabelText(/Vad du gör eller vill göra/i), { target: { value: 'Lokalvårdare' } })
    fireEvent.click(screen.getByRole('button', { name: /Skriv ett förslag med AI/i }))

    expect(await screen.findByText(/du har stängt av AI-behandling/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Öppna inställningarna/i })).toHaveAttribute('href', '/settings')
  })

  it('säger till om inloggningen gått ut', async () => {
    callAIMock.mockRejectedValue(new Error('Du måste vara inloggad för att använda AI'))
    rendera()
    fireEvent.change(screen.getByLabelText(/Vad du gör eller vill göra/i), { target: { value: 'Lokalvårdare' } })
    fireEvent.click(screen.getByRole('button', { name: /Skriv ett förslag med AI/i }))

    expect(await screen.findByText(/inloggning verkar ha gått ut/i)).toBeInTheDocument()
  })
})

describe('sidan hjälper användaren vidare', () => {
  it('kan inte generera utan underlag', () => {
    rendera()
    fireEvent.change(screen.getByLabelText(/Vad du gör eller vill göra/i), { target: { value: '' } })
    expect(screen.getByRole('button', { name: /Skriv ett förslag med AI/i })).toBeDisabled()
    expect(screen.getByText(/Fyll i fälten ovan först/)).toBeInTheDocument()
  })

  it('förifyller yrket från CV:t och säger att den gjort det', async () => {
    rendera()
    await waitFor(() =>
      expect((screen.getByLabelText(/Vad du gör eller vill göra/i) as HTMLInputElement).value).toBe('Undersköterska'),
    )
    expect(screen.getByText(/Hämtat från ditt CV/)).toBeInTheDocument()
  })

  it('behåller texten när man byter flik och tillbaka', async () => {
    // `bytTab` gjorde tidigare `setResultat('')` villkorslöst — en text man
    // höll på att läsa försvann av ett klick på en annan flik.
    callAIMock.mockResolvedValue({ text: 'Ett förslag att läsa' })
    rendera()
    fireEvent.change(screen.getByLabelText(/Vad du gör eller vill göra/i), { target: { value: 'Lokalvårdare' } })
    fireEvent.click(screen.getByRole('button', { name: /Skriv ett förslag med AI/i }))
    await screen.findByText('Ett förslag att läsa')

    fireEvent.click(screen.getByRole('button', { name: 'Checklista' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rubrik' }))
    expect(await screen.findByText('Ett förslag att läsa')).toBeInTheDocument()
  })

  it('räknar tecken mot LinkedIns riktiga gräns för fältet', async () => {
    callAIMock.mockResolvedValue({ text: 'x'.repeat(230) })
    rendera()
    fireEvent.change(screen.getByLabelText(/Vad du gör eller vill göra/i), { target: { value: 'Lokalvårdare' } })
    fireEvent.click(screen.getByRole('button', { name: /Skriv ett förslag med AI/i }))

    // Rubriken rymmer 220 tecken; 230 är tio för många.
    expect(await screen.findByText(/230 tecken — det är 10 för många/)).toBeInTheDocument()
  })

  it('säger var texten ska klistras in, och att den ska läsas igenom först', async () => {
    callAIMock.mockResolvedValue({ text: 'Ett förslag' })
    rendera()
    fireEvent.change(screen.getByLabelText(/Vad du gör eller vill göra/i), { target: { value: 'Lokalvårdare' } })
    fireEvent.click(screen.getByRole('button', { name: /Skriv ett förslag med AI/i }))

    expect(await screen.findByText(/Innan du klistrar in/)).toBeInTheDocument()
    expect(screen.getByText(/Allt som står ska vara sant om dig/)).toBeInTheDocument()
    expect(screen.getByText(/fältet Rubrik/)).toBeInTheDocument()
  })

  it('säger att LinkedIn inte är lika viktigt i alla branscher', () => {
    // Sidan lovade tidigare synlighet utan förbehåll. För den som söker inom
    // vård, lager, handel, bygg, städ eller restaurang är det ett råd som
    // kostar tid utan att ge jobb.
    rendera()
    const knapp = screen.getByRole('button', { name: /Är LinkedIn rätt kanal för dig/ })
    expect(knapp).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(knapp)
    expect(screen.getByText(/tillsätts jobben oftast på annat sätt/)).toBeInTheDocument()
  })
})

describe('fokuslägesväxeln raderar inte det ifyllda', () => {
  it('behåller yrket OCH den genererade texten när läget slås på och av igen', async () => {
    callAIMock.mockResolvedValue({ text: 'En text jag höll på att läsa' })
    const { rerender } = rendera()
    const falt = screen.getByLabelText(/Vad du gör eller vill göra/i) as HTMLInputElement
    fireEvent.change(falt, { target: { value: 'Lagerarbetare' } })
    fireEvent.click(screen.getByRole('button', { name: /Skriv ett förslag med AI/i }))
    await screen.findByText('En text jag höll på att läsa')

    fokuslage = true
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter><LinkedInOptimizer /></MemoryRouter>
      </QueryClientProvider>,
    )
    fokuslage = false
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter><LinkedInOptimizer /></MemoryRouter>
      </QueryClientProvider>,
    )

    expect((screen.getByLabelText(/Vad du gör eller vill göra/i) as HTMLInputElement).value).toBe('Lagerarbetare')
    // Det som skiljer en gömd vy från en avmonterad: resultatet bor i Inner.
    // Ligger grenen i den yttre komponenten byts hela trädet ut och texten är
    // borta, även om fälten (som föräldern äger) ser oförändrade ut.
    expect(screen.getByText('En text jag höll på att läsa')).toBeInTheDocument()
  })
})
