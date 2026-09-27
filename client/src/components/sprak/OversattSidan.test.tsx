/**
 * RD31 (rollspelet 2026-09-27): "Översätt sidan" fanns bara i toppnaven på
 * dator. Nu en del av språkvalet, också på mobil.
 *   1. Före listan: att maskinöversättning kan bli fel, och att myndigheters
 *      namn ska stå kvar på svenska. Mutation: ta bort raden → faller.
 *   2. Somaliska finns och väljs: valet sparas, cookien sätts, sidan laddas om.
 *   3. "Svenska (utan översättning)" tar bort valet.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, userEvent } from '@/test/utils'
import { OversattSidan } from './OversattSidan'
import { sidan } from '@/services/sidoversattning'

beforeEach(() => {
  localStorage.removeItem('googleTranslateLanguage')
  document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
  vi.spyOn(sidan, 'laddaOm').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('OversattSidan (RD31)', () => {
  it('säger att översättningen kan bli fel och att myndighetsnamn står kvar', async () => {
    render(<OversattSidan />)
    await userEvent.click(screen.getByRole('button', { name: 'Översätt sidan till fler språk' }))
    expect(screen.getByText(/Översättningen kan bli fel/)).toBeInTheDocument()
    expect(screen.getByText(/Arbetsförmedlingen och Försäkringskassan, ska stå kvar på svenska/)).toBeInTheDocument()
    expect(screen.getByText(/skickas sidans innehåll till Google/)).toBeInTheDocument()
  })

  it('somaliska väljs: sparas, cookie sätts, sidan laddas om och menyn stängs', async () => {
    const onVal = vi.fn()
    render(<OversattSidan onVal={onVal} />)
    await userEvent.click(screen.getByRole('button', { name: 'Översätt sidan till fler språk' }))
    await userEvent.click(screen.getByRole('button', { name: 'Soomaali' }))
    expect(localStorage.getItem('googleTranslateLanguage')).toBe('so')
    expect(document.cookie).toContain('googtrans=/sv/so')
    expect(sidan.laddaOm).toHaveBeenCalledTimes(1)
    expect(onVal).toHaveBeenCalled()
  })

  it('visar valt språk och går tillbaka till svenska', async () => {
    localStorage.setItem('googleTranslateLanguage', 'so')
    render(<OversattSidan />)
    await userEvent.click(screen.getByRole('button', { name: 'Översatt till Soomaali' }))
    await userEvent.click(screen.getByRole('button', { name: 'Svenska (utan översättning)' }))
    expect(localStorage.getItem('googleTranslateLanguage')).toBeNull()
    expect(sidan.laddaOm).toHaveBeenCalledTimes(1)
  })
})
