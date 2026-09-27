/**
 * RD5 (rollspelet 2026-09-27): Hjälp på Lätt svenska förklarade ATS som
 * "Applicant Tracking System" och bad deltagaren "optimera" sitt CV.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'
import { sattLattSvenska } from '@/i18n/lattSvenska'

vi.mock('@/components/layout/index', () => ({ PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }))
vi.mock('@/components/FocusModeProvider', () => ({ useFocusMode: () => ({ isFocusMode: false, leaveWizard: vi.fn() }) }))

import Help from './Help'

afterEach(async () => {
  cleanup()
  await sattLattSvenska(false)
  await i18n.changeLanguage('sv')
})

describe('Hjälp följer språket (RD5)', () => {
  it('Lätt svenska: ATS förklaras med vanliga ord', async () => {
    await sattLattSvenska(true)
    render(<MemoryRouter><Help /></MemoryRouter>)
    expect(screen.getByText('Hur läser datorer mitt CV?')).toBeInTheDocument()
    expect(screen.queryByText(/ATS|Applicant Tracking|optimera/)).toBeNull()
  })

  it('engelska', async () => {
    i18n.addResourceBundle('en', 'translation', en, true, true)
    await i18n.changeLanguage('en')
    render(<MemoryRouter><Help /></MemoryRouter>)
    expect(screen.getByText('How do I create a CV?')).toBeInTheDocument()
  })
})
