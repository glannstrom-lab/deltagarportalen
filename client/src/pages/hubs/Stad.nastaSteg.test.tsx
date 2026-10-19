/**
 * Nästa steg får inte försvinna med rådgivarna (2026-10-19).
 *
 * Funnet i drift på demokontot Anna: med rådgivarna dolda ("Dölj" på
 * dialogrutan, eller Inställningar → Utseende) stod Översikten utan nästa
 * steg — det fanns bara i rådgivarens replik. Kvar var "!" i bilden och en
 * platsruta med platsens rader, inte själva steget.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Stad from './Stad'
import { useSettingsStore } from '@/stores/settingsStore'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'

vi.mock('@/components/radgivare/RadgivarHalsning', () => ({ default: () => <div data-testid="radgivare" /> }))

const UTAN_CV: OversiktSummary = {
  profile: { onboarded_hubs: [], full_name: 'Anna Exempel', profile_image_url: null },
  jobsok: {
    cv: null,
    coverLetters: [],
    interviewSessions: [],
    applicationStats: { total: 0, byStatus: {}, segments: [], awaitingSince: null },
    spontaneousCount: 0,
    spontaneousFollowups: { count: 0, nextDate: null },
  },
  karriar: undefined,
  resurser: undefined,
  minVardag: undefined,
}

const rendera = (summary: OversiktSummary | undefined, tillstand: 'klart' | 'laddar' = 'klart') =>
  render(
    <MemoryRouter>
      <Stad summary={summary} tillstand={tillstand} fornamn="Anna" />
    </MemoryRouter>
  )

describe('Översikten med rådgivarna dolda', () => {
  beforeEach(() => {
    if (useSettingsStore.getState().showCoachWidget) useSettingsStore.getState().toggleCoachWidget()
  })

  it('visar nästa steg som ett eget kort, med knappen som pulserar', () => {
    rendera(UTAN_CV)
    const kort = screen.getByTestId('stad-nasta-steg')
    expect(kort.querySelector('[data-nasta-steg="cv-start"]')).not.toBeNull()
    expect(screen.queryByTestId('radgivare')).toBeNull()
  })

  it('inget kort medan datan laddar', () => {
    rendera(undefined, 'laddar')
    expect(screen.queryByTestId('stad-nasta-steg')).toBeNull()
  })

  it('med rådgivarna på står steget i deras replik — inget dubbelkort', () => {
    useSettingsStore.getState().toggleCoachWidget()
    rendera(UTAN_CV)
    expect(screen.queryByTestId('stad-nasta-steg')).toBeNull()
  })
})
