import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createElement } from 'react'
import { render, screen, act, cleanup } from '@testing-library/react'
import { ToastContainer } from '@/components/Toast'
import { notifications, TOAST_MESSAGES } from './toast'

/**
 * toast.ts är den ena av portalens två vägar till användarfeedback (14
 * importörer: konsulentflikarna, gruppmeddelandet, rapportutkastet,
 * aktivitetsrapporten, profileStore, profilkomponenterna).
 *
 * Före KA1 (2026-09-08) mockade det här testet react-hot-toast och
 * kontrollerade vilka argument adaptern skickade vidare — och var grönt i
 * månader medan ingen toast syntes utanför /profile, eftersom <Toaster/>
 * bara satt där. Nu renderas den RIKTIGA behållaren (<ToastContainer/>, samma
 * som Layout.tsx monterar) och testet frågar DOM:en. Det som vaktas är
 * tillgänglighetskontraktet: fel annonseras assertivt för skärmläsare
 * (role=alert), statusmeddelanden artigt (role=status), och laddningstoasts
 * får aldrig auto-stängas. WCAG 2.1 AA-krav, inte kosmetik.
 */

/**
 * Nedräkningen går i 100 ms-steg; när den nått noll startar en 300 ms
 * utgångsanimation innan elementet tas bort. React kör uppdateraren först när
 * act() flushar, så tidsutgången och animationen måste avanceras i två steg.
 */
function latTidenGa(ms: number) {
  act(() => { vi.advanceTimersByTime(ms + 200) })
  act(() => { vi.advanceTimersByTime(300) })
}

describe('notifications ritas av den monterade behållaren', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    render(createElement(ToastContainer))
  })

  afterEach(() => {
    act(() => { notifications.dismiss() })
    cleanup()
    vi.useRealTimers()
  })

  it('success annonseras artigt (role=status, aria-live=polite)', () => {
    act(() => { notifications.success('Sparat') })

    const el = screen.getByRole('status')
    expect(el).toHaveTextContent('Sparat')
    expect(el).toHaveAttribute('aria-live', 'polite')
    expect(el).toHaveAttribute('aria-atomic', 'true')
  })

  it('error annonseras assertivt (role=alert, aria-live=assertive)', () => {
    act(() => { notifications.error('Kunde inte spara') })

    const el = screen.getByRole('alert')
    expect(el).toHaveTextContent('Kunde inte spara')
    expect(el).toHaveAttribute('aria-live', 'assertive')
  })

  it('success stängs efter 3 s, error ligger kvar i 5 s', () => {
    act(() => {
      notifications.success('Klart')
      notifications.error('Fel')
    })
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()

    latTidenGa(3000)
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole('alert')).toBeInTheDocument()

    latTidenGa(2000)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('loading stängs ALDRIG av sig själv', () => {
    act(() => { notifications.loading('Genererar...') })
    expect(screen.getByRole('status')).toHaveTextContent('Genererar...')

    act(() => { vi.advanceTimersByTime(10 * 60 * 1000) })
    expect(screen.getByRole('status')).toHaveTextContent('Genererar...')
  })

  it('loading returnerar ett id som dismiss(id) stänger — mönstret i ProfileHeader/AISummary/DocumentsSection', () => {
    let id = ''
    act(() => { id = notifications.loading('Laddar upp...') })
    expect(id).toEqual(expect.any(String))
    expect(id.length).toBeGreaterThan(0)

    act(() => { notifications.dismiss(id) })
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('dismiss(id) stänger bara den toasten, dismiss() stänger alla', () => {
    let a = ''
    act(() => {
      a = notifications.loading('A')
      notifications.loading('B')
      notifications.loading('C')
    })
    expect(screen.getAllByRole('status')).toHaveLength(3)

    act(() => { notifications.dismiss(a) })
    const kvar = screen.getAllByRole('status').map(el => el.textContent)
    expect(kvar).toHaveLength(2)
    expect(kvar.join('')).not.toContain('A')

    act(() => { notifications.dismiss() })
    expect(screen.queryAllByRole('status')).toHaveLength(0)
  })

  it('info och warning är statusmeddelanden, inte larm', () => {
    act(() => {
      notifications.info('Ett tips')
      notifications.warning('Se upp')
    })

    const texter = screen.getAllByRole('status').map(el => el.textContent)
    expect(texter.join(' ')).toContain('Ett tips')
    expect(texter.join(' ')).toContain('Se upp')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('anroparens duration vinner över standardvärdet', () => {
    act(() => { notifications.success('Snabb', { duration: 500 }) })
    expect(screen.getByRole('status')).toBeInTheDocument()

    latTidenGa(500)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('varje toast har en stängknapp med tillgängligt namn', () => {
    act(() => { notifications.success('Sparat') })

    expect(screen.getByRole('button', { name: /stäng meddelande|close message/i })).toBeInTheDocument()
  })
})

describe('TOAST_MESSAGES', () => {
  it('är på svenska och saknar administrationsspråk (DESIGN.md §2)', () => {
    const alla = Object.values(TOAST_MESSAGES)

    expect(alla.length).toBeGreaterThan(10)
    for (const text of alla) {
      expect(text).not.toMatch(/\b(Konfigurera|Aktivera|Exekvera)\b/)
      expect(text.trim()).toBe(text)
      expect(text.length).toBeGreaterThan(0)
    }
  })

  it('har separata meddelanden för lyckat och misslyckat sparande', () => {
    expect(TOAST_MESSAGES.SAVE_SUCCESS).not.toBe(TOAST_MESSAGES.SAVE_ERROR)
  })
})
