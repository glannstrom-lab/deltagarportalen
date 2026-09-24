/**
 * Delad profil — byte av delningslänk utan ommontering
 * (react-hooks/exhaustive-deps, 2026-09-24).
 *
 * /profile/shared/A → /profile/shared/B byter inte rutt, så sidan monteras
 * inte om. Förr nollställdes varken felet eller laddningen vid kodbyte: kom
 * man från en ogiltig länk stod "Länken är ogiltig" kvar även när B var giltig.
 *
 * Mutation: låt felet ligga kvar oberoende av koden → "visar B" faller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'

vi.mock('@/services/profileEnhancementsApi', () => ({
  profileShareApi: {
    getSharedProfile: vi.fn(async (kod: string) =>
      kod === 'giltig'
        ? { profile: { first_name: 'Anna', last_name: 'Berg' }, share: { show_contact: false } }
        : null,
    ),
  },
}))

import SharedProfile from './SharedProfile'
import sv from '@/i18n/locales/sv.json'

function GaTill({ till }: { till: string }) {
  const navigate = useNavigate()
  return <button onClick={() => navigate(till)}>nästa länk</button>
}

afterEach(cleanup)

describe('SharedProfile', () => {
  it('visar ogiltig länk för en okänd kod', async () => {
    render(
      <MemoryRouter initialEntries={['/profile/shared/okand']}>
        <Routes><Route path="/profile/shared/:shareCode" element={<SharedProfile />} /></Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText(sv.sharedProfile.linkInvalid)).toBeInTheDocument()
  })

  it('visar profil B efter att ha kommit från en ogiltig länk A', async () => {
    render(
      <MemoryRouter initialEntries={['/profile/shared/okand']}>
        <Routes>
          <Route path="/profile/shared/:shareCode" element={<><SharedProfile /><GaTill till="/profile/shared/giltig" /></>} />
        </Routes>
      </MemoryRouter>,
    )
    await screen.findByText(sv.sharedProfile.linkInvalid)
    fireEvent.click(screen.getByText('nästa länk'))
    expect(await screen.findByText(/Anna/)).toBeInTheDocument()
    expect(screen.queryByText(sv.sharedProfile.linkInvalid)).toBeNull()
  })
})
