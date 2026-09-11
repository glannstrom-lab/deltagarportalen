/**
 * jsPDF med Helvetica skriver INTE tankstreck: `—`/`–` blir `() Tj`, en tom
 * cell (uppmätt 2026-09-11 i aktivitetsplanPdf). `pdfExportService` har
 * sedan tidigare `sanitizeText()` som byter dem mot `-` — det här testet
 * håller det sant, och gör det på byteströmmen, inte på en kommentar.
 *
 * Fällan: PDF-strängar eskaperar `(`/`)` med bakstreck, så en assertion mot
 * den råa strömmen är alltid falskt säker. Av-eskapera först (samma grepp
 * som aktivitetsplanPdf.test.ts / artikelPdf-lärdomen i CLAUDE.md).
 */
import { describe, it, expect } from 'vitest'
import { generateCVPDF } from './pdfExportService'
import type { CVData } from '@/types/pdf.types'

const avEskapera = (rå: string) => rå.replace(/\\([()\\])/g, '$1')

async function textenIPdf(data: CVData): Promise<string> {
  const blob = await generateCVPDF(data)
  return await new Promise<string>((resolve, reject) => {
    const läsare = new FileReader()
    läsare.onload = () => resolve(String(läsare.result))
    läsare.onerror = () => reject(läsare.error)
    läsare.readAsBinaryString(blob)
  }).then(avEskapera)
}

const cv: CVData = {
  firstName: 'Anna',
  lastName: 'Andersson',
  title: 'Kock – vikariat',
  email: 'anna@example.com',
  phone: '070-000 00 00',
  location: 'Örebro',
  summary: 'Erfaren kock — lugn i stress.',
  profileImage: null,
  workExperience: [],
  education: [],
  skills: [{ id: 's1', name: 'Storkök', level: 4, category: 'technical' }, 'Kassa'],
  languages: [],
  certificates: [],
  links: [],
  references: [],
  template: 'sidebar',
  colorScheme: 'navy',
  font: 'helvetica',
}

describe('pdfExportService — tankstreck når aldrig jsPDF', () => {
  it('skriver "-" där titel och sammanfattning hade – och —, och lämnar ingen tom cell', async () => {
    const text = await textenIPdf(cv)
    expect(text).toContain('Kock - vikariat')
    expect(text).toContain('Erfaren kock - lugn i stress.')
    expect(text).not.toMatch(/Kock [–—] vikariat/)
  }, 20000)

  it('kompetenser läses via skillNamn oavsett objekt- eller strängform', async () => {
    const text = await textenIPdf(cv)
    expect(text).toContain('Storkök')
    expect(text).toContain('Kassa')
    expect(text).not.toContain('undefined')
  }, 20000)
})
