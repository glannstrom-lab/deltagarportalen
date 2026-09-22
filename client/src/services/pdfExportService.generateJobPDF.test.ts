/**
 * Regression (2026-09-22): `generateJobPDF` läste `job.title`, `job.company`,
 * `job.location`, `job.type` och `job.description` som platta strängfält.
 * `JobData` följer i själva verket Platsbanken-formen: `headline`,
 * `employer.name`, `workplace_address.municipality`, `employment_type.label`
 * och `description: { text, text_formatted? }`. Med ett riktigt jobbobjekt
 * kastade `sanitizeText(job.description)` `str.replace is not a function`
 * eftersom `description` är ett OBJEKT, inte en sträng — funktionen kunde
 * alltså aldrig slutföra en PDF för en riktig annons.
 *
 * (Funktionen har idag ingen anropare i UI:t — inget renderar
 * `<PDFExportButton type="job" />` — men rättas ändå så den inte ligger kvar
 * som en krasch som väntar på sin första användning.)
 */
import { describe, it, expect } from 'vitest'
import { generateJobPDF } from './pdfExportService'
import type { JobData } from '@/types/pdf.types'

const job: JobData = {
  id: 'j1',
  headline: 'Kock till sommarkök',
  description: { text: 'Vi söker en erfaren kock för sommarsäsongen.' },
  employer: { name: 'Restaurang Solsidan' },
  workplace_address: { municipality: 'Örebro', region: 'Örebro län' },
  employment_type: { label: 'Vikariat' },
  publication_date: '2026-09-01T00:00:00.000Z',
}

describe('generateJobPDF', () => {
  it('genererar en PDF utan att kasta för ett riktigt Platsbanken-format jobbobjekt', async () => {
    await expect(generateJobPDF(job)).resolves.toBeInstanceOf(Blob)
  }, 20000)

  it('skriver headline, arbetsgivare, kommun och anställningsform i PDF:en', async () => {
    const blob = await generateJobPDF(job)
    const raw = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsBinaryString(blob)
    })
    const text = raw.replace(/\\([()\\])/g, '$1')

    expect(text).toContain('Kock till sommarkök')
    expect(text).toContain('Restaurang Solsidan')
    expect(text).toContain('Örebro')
    expect(text).toContain('Vikariat')
  }, 20000)
})
