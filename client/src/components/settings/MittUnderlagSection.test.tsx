import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const skapa = vi.fn()
const laddaNer = vi.fn()
vi.mock('@/services/mittUnderlag', () => ({
  skapaUnderlag: (...a: unknown[]) => skapa(...a),
  laddaNerZip: (...a: unknown[]) => laddaNer(...a),
}))

import { MittUnderlagSection } from './MittUnderlagSection'

beforeEach(() => {
  skapa.mockReset()
  laddaNer.mockReset()
})

describe('MittUnderlagSection', () => {
  it('journalen är avbockad som standard och skickas som false', async () => {
    skapa.mockResolvedValue({ zip: new Uint8Array(), filnamn: 'a.zip', poster: [{ fil: 'CV.pdf', status: 'tom' }] })
    render(<MittUnderlagSection />)
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(laddaNer).toHaveBeenCalled())
    expect(skapa.mock.calls[0][0]).toEqual({ journal: false })
    expect(screen.getByRole('status').textContent).toContain('CV.pdf')
  })

  it('skickar journal: true först när rutan bockats i', async () => {
    skapa.mockResolvedValue({ zip: new Uint8Array(), filnamn: 'a.zip', poster: [] })
    render(<MittUnderlagSection />)
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(skapa).toHaveBeenCalled())
    expect(skapa.mock.calls[0][0]).toEqual({ journal: true })
  })

  it('ett fel visas i klartext och laddar inte ner något', async () => {
    skapa.mockRejectedValue(new Error('x'))
    render(<MittUnderlagSection />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('kunde inte skapas'))
    expect(laddaNer).not.toHaveBeenCalled()
  })
})
