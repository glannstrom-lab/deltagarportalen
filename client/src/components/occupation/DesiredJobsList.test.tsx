/**
 * Önskade yrken på profilen — engelskt läge (driftgenomgången 2026-09-22).
 * Tomtexten, lägg-till-knappen, tipsraden och pilknapparnas namn var
 * hårdkodad svenska.
 *
 * Mutation: sätt tillbaka "Inga önskade yrken tillagda än." → första testet
 * faller; "Flytta ${label} uppåt" → andra testet faller.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'
import { DesiredJobsList } from './DesiredJobsList'

vi.mock('./OccupationPicker', () => ({ OccupationPicker: () => null }))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('sv')
})

async function engelska() {
  i18n.addResourceBundle('en', 'translation', en, true, true)
  await i18n.changeLanguage('en')
}

describe('DesiredJobsList — engelska', () => {
  it('tom lista och lägg-till-knappen', async () => {
    await engelska()
    const { container } = render(<DesiredJobsList jobs={[]} onChange={vi.fn()} maxJobs={5} />)
    expect(screen.getByText('No wanted jobs added yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add a job (0/5)' })).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/[åäöÅÄÖ]/)
  })

  it('knapparnas namn i en lista', async () => {
    await engelska()
    render(
      <DesiredJobsList
        jobs={[
          { conceptId: 'a', label: 'Cook', priority: 1 },
          { conceptId: null, label: 'Lagerarbetare', priority: 2 },
        ] as never}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Move Cook up' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Cook' })).toBeInTheDocument()
    expect(screen.getByText(/Jobs with ⚠ are free text/)).toBeInTheDocument()
  })
})
