/**
 * CV-exporten ska ge samma PDF som CV-byggaren (beslut Mikael 2026-10-11).
 *
 * Det betyder: `type="cv"` går ALLTID via `/api/cv-pdf` (Chromium + deltagarens
 * mall) — aldrig via jsPDF:s `generateCVPDF`, som ritar ett helt annat CV. Och
 * ett `versionId` måste följa med i kroppen, annars hämtar servern `cvs`-raden
 * och levererar dagens CV under versionens filnamn.
 *
 * Knappen används av CV-byggaren, /cv/my-cvs och /resources — testet vaktar
 * alla tre på en gång.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: 'tok' } } })) },
  },
}))

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }))
vi.mock('@/components/Toast', () => ({ showToast: toast }))

const pdf = vi.hoisted(() => ({
  generateCVPDF: vi.fn(async () => new Blob(['jspdf'])),
  generateJobPDF: vi.fn(async () => new Blob(['job'])),
  generateApplicationHistoryPDF: vi.fn(async () => new Blob(['apps'])),
  downloadPDF: vi.fn(),
  previewPDF: vi.fn(),
}))
vi.mock('@/services/pdfExportService', () => pdf)

import { PDFExportButton } from './PDFExportButton'
import { CV_PDF_FEL } from './serverCvPdf'

const cv = { firstName: 'Anna', lastName: 'Berg', template: 'nordic', colorScheme: 'navy' }

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  fetchMock = vi.fn(async () => new Response('pdf', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

function kropp(anrop = 0) {
  const [, init] = fetchMock.mock.calls[anrop] as [string, RequestInit]
  return JSON.parse(String(init.body))
}

describe('PDFExportButton type="cv" — samma PDF som CV-byggaren', () => {
  it('anropar /api/cv-pdf med Bearer-token och mallen — aldrig jsPDF', async () => {
    render(<PDFExportButton type="cv" data={cv} showPreview={false} />)
    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(pdf.downloadPDF).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/cv-pdf')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
    expect(kropp()).toEqual({ template: 'nordic' })
    expect(pdf.generateCVPDF).not.toHaveBeenCalled()
  })

  it('skickar versionId när knappen exporterar en sparad version', async () => {
    render(<PDFExportButton type="cv" data={cv} versionId="v-42" showPreview={false} />)
    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(pdf.downloadPDF).toHaveBeenCalled())
    expect(kropp()).toEqual({ template: 'nordic', versionId: 'v-42' })
  })

  it('laddar ner under samma filnamn som CV-byggaren (cvFilnamn)', async () => {
    render(<PDFExportButton type="cv" data={cv} showPreview={false} />)
    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => expect(pdf.downloadPDF).toHaveBeenCalled())
    expect(pdf.downloadPDF.mock.calls[0][1]).toBe('CV_Anna_Berg.pdf')
  })

  it('visar laddar-läge medan PDF:en skapas', async () => {
    let svara: (r: Response) => void = () => {}
    fetchMock.mockImplementation(() => new Promise<Response>((r) => { svara = r }))
    render(<PDFExportButton type="cv" data={cv} showPreview={false} />)
    await userEvent.click(screen.getByRole('button'))

    const knapp = await screen.findByRole('button', { name: /Genererar PDF/ })
    expect(knapp).toBeDisabled()
    svara(new Response('pdf', { status: 200 }))
    await waitFor(() => expect(pdf.downloadPDF).toHaveBeenCalled())
  })

  it('visar ett begripligt fel när PDF:en inte kunde skapas — aldrig tyst', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }))
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      render(<PDFExportButton type="cv" data={cv} showPreview={false} />)
      await userEvent.click(screen.getByRole('button'))
      await vi.advanceTimersByTimeAsync(2000)
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(CV_PDF_FEL))
    } finally {
      vi.useRealTimers()
    }
    expect(pdf.downloadPDF).not.toHaveBeenCalled()
    expect(pdf.generateCVPDF).not.toHaveBeenCalled()
  })
})
