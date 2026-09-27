/**
 * RD26 (rollspelet 2026-09-27): CV:ts sparfel stod som "Offline" även när
 * servern sa nej, och det fanns inget att trycka på.
 *   1. Ett serverfel säger "Det du skrev är kvar" och Försök igen anropar
 *      autosavens nya försök. Mutation: rendera "Offline" igen → faller.
 *   2. Utan nät säger raden det, utan knapp (sparningen sker när nätet kommer).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, userEvent } from '@/test/utils'
import { SaveIndicator } from './SaveIndicator'
import { useCVStore } from '@/stores/cvStore'

afterEach(() => {
  cleanup()
  useCVStore.setState({ saveStatus: 'idle', pendingCount: 0, hasUnsavedChanges: false, forsokSparaIgen: null })
  vi.restoreAllMocks()
})

describe('SaveIndicator (RD26)', () => {
  it('ett sparfel säger att texten är kvar och kan försökas igen', async () => {
    const forsok = vi.fn()
    useCVStore.setState({ saveStatus: 'error', pendingCount: 1, forsokSparaIgen: forsok })
    render(<SaveIndicator />)
    expect(screen.getByRole('alert')).toHaveTextContent('Det gick inte att spara. Det du skrev är kvar.')
    expect(screen.queryByText('Offline')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
    expect(forsok).toHaveBeenCalledTimes(1)
  })

  it('utan nät säger raden det, utan knapp', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    useCVStore.setState({ saveStatus: 'error', pendingCount: 1, forsokSparaIgen: vi.fn() })
    render(<SaveIndicator />)
    expect(screen.getByRole('alert')).toHaveTextContent(/du verkar sakna internet/)
    expect(screen.queryByRole('button', { name: 'Försök igen' })).toBeNull()
  })
})
