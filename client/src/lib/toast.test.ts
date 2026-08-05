import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * toast.ts är portalens enda vägen till användarfeedback (13 importörer).
 * Det som testas här är inte "visas en ruta" utan tillgänglighetskontraktet:
 * fel ska annonseras assertivt för skärmläsare, statusmeddelanden artigt,
 * och laddningstoasts får aldrig auto-stängas. Det är WCAG 2.1 AA-krav,
 * inte kosmetik — och det är osynligt om det går sönder.
 */
type Val = Record<string, unknown>
const toastFn = vi.fn((_meddelande: string, _val?: Val) => 'toast-id')
const toastMock = Object.assign(toastFn, {
  success: vi.fn((_meddelande: string, _val?: Val) => 'success-id'),
  error: vi.fn((_meddelande: string, _val?: Val) => 'error-id'),
  loading: vi.fn((_meddelande: string, _val?: Val) => 'loading-id'),
  dismiss: vi.fn((_id?: string) => undefined),
  promise: vi.fn((_löfte: unknown, _texter: unknown, _val?: Val) => 'promise-id'),
})

vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: toastMock,
  toast: toastMock,
  Toaster: () => null,
}))

const { notifications, TOAST_MESSAGES, TOASTER_CONFIG } = await import('./toast')

describe('notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('success annonseras artigt (role=status) och stängs efter 3 s', () => {
    notifications.success('Sparat')

    expect(toastMock.success).toHaveBeenCalledWith('Sparat', expect.objectContaining({
      duration: 3000,
      position: 'top-center',
      ariaProps: { role: 'status', 'aria-live': 'polite' },
    }))
  })

  it('error annonseras assertivt (role=alert) och ligger kvar 5 s', () => {
    notifications.error('Kunde inte spara')

    expect(toastMock.error).toHaveBeenCalledWith('Kunde inte spara', expect.objectContaining({
      duration: 5000,
      ariaProps: { role: 'alert', 'aria-live': 'assertive' },
    }))
  })

  it('loading stängs ALDRIG av sig själv', () => {
    notifications.loading('Genererar...')

    expect(toastMock.loading.mock.calls[0][1]).toMatchObject({ duration: Infinity })
  })

  it('info och warning går via bas-toast med ikon', () => {
    notifications.info('Ett tips')
    expect(toastMock).toHaveBeenCalledWith('Ett tips', expect.objectContaining({
      duration: 4000,
      icon: 'ℹ️',
    }))

    notifications.warning('Se upp')
    expect(toastMock).toHaveBeenLastCalledWith('Se upp', expect.objectContaining({
      icon: '⚠️',
      ariaProps: { role: 'alert', 'aria-live': 'polite' },
    }))
  })

  it('anroparens duration vinner över standardvärdet', () => {
    notifications.success('Snabb', { duration: 500 })

    expect(toastMock.success).toHaveBeenCalledWith('Snabb', expect.objectContaining({
      duration: 500,
    }))
  })

  it('anroparens position vinner över top-center', () => {
    notifications.error('Nere', { position: 'bottom-right' })

    expect(toastMock.error).toHaveBeenCalledWith('Nere', expect.objectContaining({
      position: 'bottom-right',
    }))
  })

  it('dismiss utan id stänger allt, med id stänger en', () => {
    notifications.dismiss()
    expect(toastMock.dismiss).toHaveBeenCalledWith()

    notifications.dismiss('abc')
    expect(toastMock.dismiss).toHaveBeenLastCalledWith('abc')
  })

  it('promise skickar vidare löftet och meddelandena', async () => {
    const p = Promise.resolve('klart')
    const messages = { loading: 'Laddar', success: 'Klart', error: 'Fel' }

    notifications.promise(p, messages)

    expect(toastMock.promise).toHaveBeenCalledWith(p, messages, expect.objectContaining({
      position: 'top-center',
    }))
    await p
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

describe('TOASTER_CONFIG', () => {
  it('placerar toasts i top-center så de inte krockar med bottennavet', () => {
    expect(TOASTER_CONFIG.position).toBe('top-center')
  })
})
