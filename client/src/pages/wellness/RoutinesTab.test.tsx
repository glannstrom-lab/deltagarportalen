/**
 * 2026-10-09 — rutinfliken sparade ingenting: allt låg i useState och
 * försvann vid omladdning, och en standardrutin stod förbockad som "klar".
 *
 * Mutationer: ta bort sparaRutiner-effekten → test 1 faller;
 * låt lasRutiner behålla gårdagens bockar → test 2 faller.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RoutinesTab from './RoutinesTab'
import { lasRutiner, rutinNyckel } from './rutinLagring'
import { useAuthStore } from '@/stores/authStore'
import { formatLocalDate } from '@/services/aktivitetSchema'

const nyckel = rutinNyckel('u1')

describe('Rutinerna sparas', () => {
  beforeEach(() => {
    cleanup()
    localStorage.clear()
    useAuthStore.setState({ profile: { id: 'u1' } as never })
  })

  it('en ny rutin och en bock finns kvar efter omladdning', async () => {
    const user = userEvent.setup()
    render(<RoutinesTab />)
    expect(screen.getByText(/0 av 4/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /lägg till/i }))
    await user.type(screen.getByRole('textbox'), 'Ring mamma')
    await user.click(screen.getByRole('button', { name: /^spara$/i }))
    await user.click(screen.getByRole('button', { name: /klar i dag: ring mamma/i }))

    cleanup()
    render(<RoutinesTab />)
    expect(screen.getByText('Ring mamma')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /klar i dag: ring mamma/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/1 av 5/)).toBeInTheDocument()
  })

  it('gårdagens bockar gäller inte i dag', () => {
    localStorage.setItem(nyckel, JSON.stringify({
      rutiner: [{ id: 'x', title: 'Promenad', time: '08:00', ikon: 'sun', days: ['Mon'] }],
      klara: { datum: '2020-01-01', ids: ['x'] },
    }))
    const idag = formatLocalDate(new Date())
    expect(lasRutiner(nyckel, idag).klara).toEqual({ datum: idag, ids: [] })
  })

  it('ingen standardrutin är förbockad', () => {
    render(<RoutinesTab />)
    for (const knapp of screen.getAllByRole('button', { name: /klar i dag/i })) {
      expect(knapp).toHaveAttribute('aria-pressed', 'false')
    }
  })
})
