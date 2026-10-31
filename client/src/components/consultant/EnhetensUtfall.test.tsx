import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const hamta = vi.fn()
vi.mock('@/services/enhetensUtfall', async (orig) => ({
  ...(await orig<typeof import('@/services/enhetensUtfall')>()),
  enhetensUtfallApi: { hamta: (...a: unknown[]) => hamta(...a) },
}))

import { EnhetensUtfall, VyVaxel, type Vy } from './EnhetensUtfall'
import { arEnhetsroll, byggUtfall } from '@/services/enhetensUtfall'

function Harness({ roll }: { roll: string }) {
  const [vy, setVy] = useState<Vy>('mina')
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      {arEnhetsroll(roll) && <VyVaxel vy={vy} onChange={setVy} />}
      {arEnhetsroll(roll) && vy === 'enheten' && <EnhetensUtfall orgId="o1" orgNamn="Enheten Nord" />}
    </QueryClientProvider>
  )
}

describe('VyVaxel och roll', () => {
  it('visas för chef och admin', () => {
    for (const r of ['chef', 'admin']) {
      const { unmount } = render(<Harness roll={r} />)
      expect(screen.getByTestId('vyvaxel')).toBeTruthy()
      unmount()
    }
  })
  it('visas inte för konsulent eller handläggare', () => {
    for (const r of ['konsulent', 'handlaggare']) {
      const { unmount } = render(<Harness roll={r} />)
      expect(screen.queryByTestId('vyvaxel')).toBeNull()
      unmount()
    }
  })
  it('växlar och markerar valt läge', () => {
    hamta.mockResolvedValue({ status: 'kraver_aal2' })
    render(<Harness roll="chef" />)
    expect(screen.getByText('Mina deltagare').getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByText('Hela enheten'))
    expect(screen.getByText('Hela enheten').getAttribute('aria-pressed')).toBe('true')
  })
})

describe('EnhetensUtfall', () => {
  const wrap = (ui: React.ReactElement) => render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>)
  it('utan aal2 säger kortet det och visar inga tal', async () => {
    hamta.mockResolvedValue({ status: 'kraver_aal2' })
    wrap(<EnhetensUtfall orgId="o1" orgNamn="Nord" />)
    expect(await screen.findByTestId('utfall-aal2')).toBeTruthy()
    expect(screen.queryByTestId('utfall-avslut')).toBeNull()
  })
  it('visar streck med orsak, aldrig 0, när underlag saknas', async () => {
    hamta.mockResolvedValue({ status: 'klart', kalla: 'planer', rader: byggUtfall({ rpc: null, planer: [] }) })
    wrap(<EnhetensUtfall orgId="o1" orgNamn="Nord" />)
    expect((await screen.findByTestId('utfall-arbete_studier')).textContent).toBe('—')
    expect(screen.getAllByText(/enhetens_utfall/).length).toBeGreaterThan(0)
  })
})
