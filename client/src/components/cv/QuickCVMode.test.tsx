/**
 * PG8 (persona-genomgång 2026-09-12): Snabb-CV:t visade ett tomt namnfält med
 * platshållaren "Anna Andersson" fast användaren var inloggad och profilen hade
 * namnet, och kortet hade fem kontrastfel i mörkt läge (text-white/80 = 3,79:1,
 * vit text på bg-white/20 = 3,43:1).
 *
 * Reglerna som vaktas: (1) namn/e-post/telefon förifylls ur profilen,
 * (2) platshållaren är aldrig ett personnamn, (3) inga halvgenomskinliga
 * textklasser på kortet — text är helvit på hubbens solida färg och inputs är
 * solida vita med mörk text.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CVData } from '@/types/cv'

const profile = {
  first_name: 'Dana',
  last_name: 'Deltagare',
  email: 'dana@example.com',
  phone: '070-000 00 00',
}

vi.mock('@/stores/profileStore', () => ({
  useProfileStore: (selector: (s: { profile: typeof profile }) => unknown) => selector({ profile }),
}))

import { QuickCVMode } from './QuickCVMode'

describe('QuickCVMode — PG8', () => {
  it('förifyller namnet ur profilen i stället för att visa ett tomt fält', () => {
    render(<QuickCVMode onComplete={() => {}} onSwitchToFull={() => {}} />)
    const namn = screen.getByRole('textbox') as HTMLInputElement
    expect(namn.value).toBe('Dana Deltagare')
  })

  it('platshållaren är neutral, aldrig ett påhittat personnamn', () => {
    render(<QuickCVMode onComplete={() => {}} onSwitchToFull={() => {}} />)
    const namn = screen.getByRole('textbox') as HTMLInputElement
    // Ett personnamn = två versalinledda ord; "Ditt namn" börjar med versal men
    // andra ordet är gement. "Anna Andersson" fäller regeln.
    expect(namn.placeholder).not.toMatch(/^[A-ZÅÄÖ][a-zåäö]+ [A-ZÅÄÖ][a-zåäö]+$/)
    expect(namn.placeholder).toBe('Ditt namn')
  })

  it('kortet har inga halvgenomskinliga textklasser (kontrast ≥ 4,5:1 i båda lägena)', () => {
    const kalla = readFileSync(join(__dirname, 'QuickCVMode.tsx'), 'utf8')
    expect(kalla).not.toMatch(/text-white\/\d+/)
    expect(kalla).not.toMatch(/placeholder:text-white\/\d+/)
    // Inputs är solida vita med mörk text — inte vit text på bg-white/20
    expect(kalla).not.toMatch(/bg-white\/\d+[^"]*text-white/)
  })
})

describe('QuickCVMode — regression (2026-09-22): giltig språknivå', () => {
  it('sätter en riktig svensk nivå ("Modersmål"), inte det engelska "native" som Language.level inte känner till', async () => {
    vi.useFakeTimers()
    let result: Partial<CVData> | null = null
    render(
      <QuickCVMode
        onComplete={(data) => { result = data }}
        onSwitchToFull={() => {}}
      />
    )

    // Steg 1: namnet är redan förifyllt ur profilen — gå vidare.
    fireEvent.click(screen.getByRole('button', { name: /Nästa|Skapa/i }))

    // Steg 2: yrkestitel krävs för att kunna gå vidare.
    const jobbfält = screen.getByRole('textbox')
    fireEvent.change(jobbfält, { target: { value: 'Snickare' } })
    fireEvent.click(screen.getByRole('button', { name: /Nästa|Skapa/i }))

    // Steg 3: e-post är redan förifylld ur profilen — sista steget genererar CV:t.
    fireEvent.click(screen.getByRole('button', { name: /Nästa|Skapa/i }))

    await act(async () => {
      vi.advanceTimersByTime(1500)
    })
    vi.useRealTimers()

    expect(result).not.toBeNull()
    expect(result!.languages).toEqual([{ id: '1', language: 'Svenska', level: 'Modersmål' }])
  })
})
