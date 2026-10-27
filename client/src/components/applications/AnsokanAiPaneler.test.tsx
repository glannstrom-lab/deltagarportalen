import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const skapaSamtalsmanus = vi.fn()
const skapaUppfoljningsmejl = vi.fn()
vi.mock('@/services/ansokanAiApi', () => ({
  skapaSamtalsmanus: (...a: unknown[]) => skapaSamtalsmanus(...a),
  skapaUppfoljningsmejl: (...a: unknown[]) => skapaUppfoljningsmejl(...a),
}))

import { SamtalsmanusPanel } from './SamtalsmanusPanel'
import { UppfoljningsmejlPanel } from './UppfoljningsmejlPanel'
import type { Application } from '@/types/application.types'

const ansokan = (over: Partial<Application> = {}): Application => ({
  id: 'a1', userId: 'u', jobId: 'j', status: 'applied', source: 'manual', priority: 'medium',
  jobData: { headline: 'Lagerarbetare', employer: { name: 'Nordfrakt AB' } },
  applicationDate: '2020-01-01', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z',
  ...over,
} as Application)

beforeEach(() => {
  skapaSamtalsmanus.mockReset()
  skapaUppfoljningsmejl.mockReset()
})

describe('SamtalsmanusPanel', () => {
  it('skickar företag, roll och kontakt, inget annat, och visar luckorna', async () => {
    skapaSamtalsmanus.mockResolvedValue('Hej, jag heter [ditt namn].')
    render(<SamtalsmanusPanel kontaktnamn="Anna" kontakttitel="Rekryterare" ansokan={ansokan()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Förbered samtalet' }))
    await userEvent.click(screen.getByRole('button', { name: 'Skriv ett manus' }))
    expect(await screen.findByText('Hej, jag heter [ditt namn].')).toBeInTheDocument()
    expect(skapaSamtalsmanus).toHaveBeenCalledWith({
      syfte: 'folj_upp', foretag: 'Nordfrakt AB', roll: 'Lagerarbetare', kontaktnamn: 'Anna', kontakttitel: 'Rekryterare',
    })
    expect(screen.getByText(/1 kvar/)).toBeInTheDocument()
  })

  it('en sparad men ej skickad ansökan föreslår att fråga om annonsen', async () => {
    skapaSamtalsmanus.mockResolvedValue('x')
    render(<SamtalsmanusPanel kontaktnamn="Anna" ansokan={ansokan({ status: 'saved' })} />)
    await userEvent.click(screen.getByRole('button', { name: 'Förbered samtalet' }))
    expect(screen.getByRole('radio', { name: 'Fråga om annonsen' })).toBeChecked()
  })

  it('utan ansökan skickas inget företag, prompten gör det till en lucka', async () => {
    skapaSamtalsmanus.mockResolvedValue('x')
    render(<SamtalsmanusPanel kontaktnamn="Anna" />)
    await userEvent.click(screen.getByRole('button', { name: 'Förbered samtalet' }))
    await userEvent.click(screen.getByRole('button', { name: 'Skriv ett manus' }))
    expect(skapaSamtalsmanus.mock.calls[0][0]).toMatchObject({ foretag: undefined, roll: undefined })
  })

  it('visar felet i klartext', async () => {
    skapaSamtalsmanus.mockRejectedValue(new Error('Slå på AI i Inställningar'))
    render(<SamtalsmanusPanel kontaktnamn="Anna" />)
    await userEvent.click(screen.getByRole('button', { name: 'Förbered samtalet' }))
    await userEvent.click(screen.getByRole('button', { name: 'Skriv ett manus' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Slå på AI i Inställningar')
  })
})

describe('UppfoljningsmejlPanel', () => {
  it('visas inte för en ansökan som varken är avslagen eller har väntat 14 dagar', () => {
    const { container } = render(<UppfoljningsmejlPanel ansokan={ansokan({ status: 'interview' })} />)
    expect(container).toBeEmptyDOMElement()
    const d = new Date()
    const idag = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const { container: c2 } = render(<UppfoljningsmejlPanel ansokan={ansokan({ status: 'applied', applicationDate: idag })} />)
    expect(c2).toBeEmptyDOMElement()
  })

  it('avslag: skickar orsak avslag och säger att AI:n inte vet varför', async () => {
    skapaUppfoljningsmejl.mockResolvedValue('Ämne: Tack\n\nHej [kontaktens namn]')
    render(<UppfoljningsmejlPanel ansokan={ansokan({ status: 'rejected' })} kontaktnamn="Anna" />)
    await userEvent.click(screen.getByRole('button', { name: 'Skriv ett kort mejl' }))
    expect(await screen.findByText(/Ämne: Tack/)).toBeInTheDocument()
    expect(skapaUppfoljningsmejl.mock.calls[0][0]).toMatchObject({ orsak: 'avslag', foretag: 'Nordfrakt AB', roll: 'Lagerarbetare', kontaktnamn: 'Anna', ansoktDatum: '2020-01-01' })
    expect(screen.getByText(/inget underlag för varför/)).toBeInTheDocument()
  })

  it('tystnad: antalet dagar räknas av koden och skickas med', async () => {
    skapaUppfoljningsmejl.mockResolvedValue('Ämne: Hej')
    render(<UppfoljningsmejlPanel ansokan={ansokan()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Skriv ett kort mejl' }))
    await screen.findByText(/Ämne: Hej/)
    const data = skapaUppfoljningsmejl.mock.calls[0][0]
    expect(data.orsak).toBe('tystnad')
    expect(data.dagarSedan).toBeGreaterThan(1000)
  })
})
