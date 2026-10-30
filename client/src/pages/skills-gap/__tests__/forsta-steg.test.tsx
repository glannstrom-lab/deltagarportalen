/**
 * AIX7 — "Första steget i dag" i kompetensanalysens handlingsplan.
 *
 * Kolumnerna som skrivs till kalendern kontrolleras mot prod-schemats snapshot:
 * lint:schema ser inte nycklar i .insert() (se CLAUDE.md, lärdomen 2026-08-09),
 * och AI-teamets motsvarande insert var strukturellt omöjligt i flera veckor.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const insertMock = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (tabell: string) => ({ insert: (rad: unknown) => insertMock(tabell, rad) }),
  },
}))
vi.mock('@/lib/anvandareFranSession', () => ({
  anvandareFranSession: () => Promise.resolve({ data: { user: { id: 'u1' } } }),
}))
vi.mock('@/components/Toast', () => ({ showToast: { success: vi.fn(), error: vi.fn() } }))

import { ForstaStegRad } from '../ForstaStegRad'

beforeEach(() => insertMock.mockReset())

const renderRad = (typ?: string) =>
  render(
    <MemoryRouter>
      <ForstaStegRad steg="Skriv ner tre saker du redan kan." typ={typ} rubrik="Kartlägg det du kan" />
    </MemoryRouter>
  )

describe('ForstaStegRad', () => {
  it('lägger steget som en uppgift i kalendern med kolumner som finns i prod', async () => {
    insertMock.mockResolvedValue({ error: null })
    renderRad('kartlagga')
    fireEvent.click(screen.getByRole('button', { name: /Lägg i min kalender/ }))
    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1))

    const [tabell, rad] = insertMock.mock.calls[0] as [string, Record<string, unknown>]
    expect(tabell).toBe('calendar_events')
    expect(rad.type).toBe('task')
    expect(rad.user_id).toBe('u1')
    expect(rad.description).toBe('Skriv ner tre saker du redan kan.')
    expect(rad.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    const snap = JSON.parse(readFileSync(resolve(__dirname, '../../../../../supabase/schema-snapshot.json'), 'utf8'))
    const kolumner: string[] = (snap.tables ?? snap.columns ?? snap)['calendar_events']
    expect(kolumner, 'calendar_events i snapshoten').toBeTruthy()
    for (const k of Object.keys(rad)) expect(kolumner, k).toContain(k)

    await waitFor(() => expect(screen.getByText(/Finns i din kalender/)).toBeTruthy())
  })

  it('visar ett fel och ingen bekräftelse när sparandet misslyckas', async () => {
    insertMock.mockResolvedValue({ error: { message: 'nej' } })
    renderRad()
    fireEvent.click(screen.getByRole('button', { name: /Lägg i min kalender/ }))
    await waitFor(() => expect(insertMock).toHaveBeenCalled())
    expect(screen.queryByText(/Finns i din kalender/)).toBeNull()
  })

  it('länkar bara till kunskapsbanken när stegtypen är en av de fasta', () => {
    const med = renderRad('natverka')
    expect(med.container.querySelector('a[href="/knowledge-base/article/natverka-for-jobb"]')).toBeTruthy()
    med.unmount()
    const utan = renderRad('https://exempel.se')
    expect(utan.container.querySelector('a[href^="/knowledge-base"]')).toBeNull()
  })
})
