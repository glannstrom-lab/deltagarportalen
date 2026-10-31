/**
 * KC15 — deltagarvyn: tre lägen, genomförd när allt är läst, ingen påhittad nolla.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { KursYta } from './KursYta'
import type { Kurs } from '@/data/kurser'

vi.mock('@/hooks/useSupabase', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }))
const svar = vi.hoisted(() => ({ data: [] as { article_id: string }[], error: null as unknown }))
vi.mock('@/lib/supabase', () => {
  const b: Record<string, unknown> = {}
  b.select = () => b
  b.eq = () => b
  b.in = () => Promise.resolve({ data: svar.error ? null : svar.data, error: svar.error })
  return { supabase: { from: () => b } }
})

const kurser: Kurs[] = [{
  id: 'arbetslivet', namn: 'Förbered dig för arbetslivet', beskrivning: 'Beskrivning',
  delar: [{ slug: 'a', minuter: 4 }, { slug: 'b', minuter: 3 }, { slug: 'finnsinte', minuter: 9 }],
}]
const articles = [{ id: 'a', title: 'Artikel A' }, { id: 'b', title: 'Artikel B' }]

function visa() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><MemoryRouter><KursYta articles={articles} kurser={kurser} /></MemoryRouter></QueryClientProvider>)
}

beforeEach(() => { svar.data = []; svar.error = null })

describe('KursYta', () => {
  it('inget läst: en invit, inte "0 av 2"', async () => {
    visa()
    expect(await screen.findByText(/Börja med första delen/)).toBeInTheDocument()
    expect(screen.queryByText(/0 av/)).toBeNull()
  })
  it('räknar bara delar som finns som artiklar och visar tiden för dem (7 min blir 10)', async () => {
    visa()
    expect(await screen.findByText(/2 delar, ungefär 10 minuter/)).toBeInTheDocument()
  })
  it('en av två lästa visas som "1 av 2 lästa"', async () => {
    svar.data = [{ article_id: 'a' }]
    visa()
    expect(await screen.findByText(/1 av 2 lästa/)).toBeInTheDocument()
    expect(screen.queryByText('Genomförd')).toBeNull()
  })
  it('alla lästa: Genomförd', async () => {
    svar.data = [{ article_id: 'a' }, { article_id: 'b' }]
    visa()
    expect(await screen.findByText('Genomförd')).toBeInTheDocument()
  })
  it('läsfel: påstår inget om läst, men kursen går att öppna', async () => {
    svar.error = new Error('boom')
    visa()
    expect(await screen.findByText(/kunde inte hämta vad du har läst/)).toBeInTheDocument()
    expect(screen.queryByText('Genomförd')).toBeNull()
    expect(screen.queryByText(/Börja med första/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Förbered dig för arbetslivet/ }))
    expect(screen.getByRole('link', { name: /Artikel A/ })).toHaveAttribute('href', '/knowledge-base/article/a')
  })
  it('en kurs vars artiklar alla saknas visas inte', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const tom: Kurs[] = [{ id: 'samhallet', namn: 'Tomkurs', beskrivning: 'x', delar: [{ slug: 'borta', minuter: 3 }] }]
    render(<QueryClientProvider client={qc}><MemoryRouter><KursYta articles={articles} kurser={tom} /></MemoryRouter></QueryClientProvider>)
    expect(screen.queryByText('Tomkurs')).toBeNull()
    expect(screen.queryByTestId('kurser')).toBeNull()
  })
  it('utfälld lista markerar lästa delar och bär aria-expanded', async () => {
    svar.data = [{ article_id: 'b' }]
    visa()
    const knapp = screen.getByRole('button', { name: /Förbered dig för arbetslivet/ })
    expect(knapp).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(screen.getByText(/1 av 2 lästa/)).toBeInTheDocument())
    fireEvent.click(knapp)
    expect(knapp).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: /Artikel B.*Läst/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Artikel A' })).toBeInTheDocument()
  })
})
