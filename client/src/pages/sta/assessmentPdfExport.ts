/**
 * STA — PDF-export av skattningar i AF:s officiella ifyllbara mallar.
 *
 * Stödjer för MVP:
 *   - AWP 2.0 (semantiskt namngivna form-fält)
 *   - AWC 1.1 (semantiskt namngivna + EB-fält för "Ej Bedömt")
 *
 * MOHOST + DOA tillkommer i senare iteration (DOA kräver reverse-engineering
 * av generiska form-fält i Del 1-kombi-PDF:n, ~1 dags arbete).
 *
 * Mall-PDF:erna ligger i client/public/sta-templates/ och serveras som
 * statiska assets av Vite/Vercel. pdf-lib lazy-loadas vid första anrop.
 *
 * JSONB-format som förväntas i assessment.scores (per research §7.2):
 *   { c{catIdx}_i{itemIdx}: { value: 1-4 | 'SI' | 'EA' | 'EB', comment: "..." } }
 *
 * AWP-mallen stödjer 4 bedömningar (Skattning 1-4). MVP fyller bara
 * bedömning 1 i AWP/AWC. Multi-bedömning kommer senare.
 */

import type { StaAssessment, StaEnrollment } from '@/services/staApi'
import { INSTRUMENTS, type InstrumentCode } from './assessmentInstruments'

type ScoresJsonb = Record<string, { value?: number | string; person?: number | string; bedomare?: number | string; comment?: string }>

interface PdfContext {
  assessment: StaAssessment
  enrollment: StaEnrollment
  consultantName?: string
}

const TEMPLATE_URLS: Partial<Record<InstrumentCode, string>> = {
  AWP: '/sta-templates/awp-2.0-mall.pdf',
  AWC: '/sta-templates/awc-1.1-mall.pdf',
}

/** Ordningen i instrumentInstruments matchar AWP/AWC:s Färdighet 1-14. */
const AWP_AWC_FIELD_ORDER: string[] = [
  // Motoriska 1-5
  'Kroppställning',
  'Rörlighet',
  'Koordination',
  'Styrka',
  'Fysisk energi',
  // Processfärdigheter 6-10
  'Psykisk energi',
  'Kunskap',
  'Tidsorganisation',
  'Planering av arbetssituationen',
  'Anpassning',
  // Kommunikation 11-14
  'Fysisk kommunikation och interaktion',
  'Språk',
  'Sociala kontakter',
  'Informationsutbyte',
]

// ===========================================================================
// PUBLIC API
// ===========================================================================

export async function fillAwpPdf(ctx: PdfContext): Promise<Blob> {
  return fillAwpAwcPdf(ctx, 'AWP')
}

export async function fillAwcPdf(ctx: PdfContext): Promise<Blob> {
  return fillAwpAwcPdf(ctx, 'AWC')
}

/** Triggar nedladdning i webbläsaren av en Blob. */
export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Bygger föreslaget filnamn för en assessment-PDF. */
export function suggestPdfFilename(assessment: StaAssessment, enrollment: StaEnrollment): string {
  const name = (enrollment.external_name ?? 'deltagare').replace(/\s+/g, '-').toLowerCase()
  const date = (assessment.signed_at ?? assessment.created_at ?? new Date().toISOString()).slice(0, 10)
  return `${assessment.instrument.toLowerCase()}-${name}-${date}.pdf`
}

// ===========================================================================
// AWP/AWC — IMPLEMENTATION
// ===========================================================================

async function fillAwpAwcPdf(ctx: PdfContext, code: 'AWP' | 'AWC'): Promise<Blob> {
  const { assessment, enrollment, consultantName } = ctx
  const url = TEMPLATE_URLS[code]
  if (!url) throw new Error(`Ingen mall registrerad för ${code}`)

  const { PDFDocument } = await import('pdf-lib')
  const templateBytes = await fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Kunde inte hämta mall: ${r.status} ${r.statusText}`)
    return r.arrayBuffer()
  })

  const doc = await PDFDocument.load(templateBytes)
  const form = doc.getForm()
  const scores = (assessment.scores as ScoresJsonb) ?? {}

  // ---------- Metadata ----------
  trySetText(form, 'Namn', enrollment.external_name ?? '')
  trySetText(form, 'Personnummer', (enrollment.external_personal_id ?? '') as string)
  trySetText(form, 'Bedömare', consultantName ?? '')
  trySetText(form, 'Hjälpmedel/anpassningar', enrollment.adaptations ?? '')
  trySetText(form, 'Sammanfattande kommentarer', assessment.summary ?? '')

  // Datum / period
  const dateStr = (assessment.signed_at ?? assessment.created_at ?? new Date().toISOString()).slice(0, 10)
  trySetText(form, 'Datum för bedömning', dateStr) // AWC
  trySetText(form, 'Observationstillfälle/period', dateStr) // AWP
  trySetText(form, 'Bedömning', dateStr) // AWP

  // Bedömningsnummer (multi-bedömning kommer senare, MVP = 1)
  trySetText(form, 'Bedömning nr', '1')

  // AWP-specifik klientdata
  if (code === 'AWP') {
    trySetText(form, 'Bedömningssituation', '')
    trySetText(form, 'Arbetsrelaterad problematik', '')
  }
  // AWC-specifik
  if (code === 'AWC') {
    trySetText(form, 'Arbetsuppgift', '')
    trySetText(form, 'Anpassning', '')
  }

  // ---------- Skattningar (Skattning 1-4 → Färdighet 1-14) ----------
  // Items i scores är c{catIdx}_i{itemIdx} och ordnade enligt INSTRUMENTS[code].categories.
  // Mappa till linjär 1-14 enligt AWP_AWC_FIELD_ORDER.
  const instrument = INSTRUMENTS[code]
  let linearIndex = 0
  for (let catIdx = 0; catIdx < instrument.categories.length; catIdx++) {
    const category = instrument.categories[catIdx]
    for (let itemIdx = 0; itemIdx < category.items.length; itemIdx++) {
      const scoreKey = `c${catIdx}_i${itemIdx}`
      const entry = scores[scoreKey]
      const value = entry?.value
      const comment = entry?.comment ?? ''
      const fieldName = AWP_AWC_FIELD_ORDER[linearIndex]
      const skattningNr = linearIndex + 1

      // För AWC: använd fält-format "Skattning N - <färdighetsnamn>"
      // För AWP: använd fält-format "Skattning N - Färdighet M"
      if (typeof value === 'number' && value >= 1 && value <= 4) {
        if (code === 'AWC') {
          tryCheck(form, `Skattning ${value} - ${fieldName}`)
        } else {
          tryCheck(form, `Skattning ${value} - Färdighet ${skattningNr}`)
        }
      } else if (value === 'EB' && code === 'AWC') {
        tryCheck(form, `EB - ${fieldName}`)
      }
      // Kommentar i textareaen som heter samma som färdigheten
      if (comment && fieldName) {
        trySetText(form, fieldName, comment)
      }
      linearIndex++
    }
  }

  // Save and return Blob
  const pdfBytes = await doc.save()
  return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
}

// ===========================================================================
// HELPERS — gracefully skip missing fields
// ===========================================================================

function trySetText(form: import('pdf-lib').PDFForm, name: string, value: string) {
  try {
    const field = form.getField(name)
    if (field && 'setText' in field) {
      ;(field as import('pdf-lib').PDFTextField).setText(value)
    }
  } catch {
    // Field doesn't exist or isn't a text field — silently skip
  }
}

function tryCheck(form: import('pdf-lib').PDFForm, name: string) {
  try {
    const field = form.getField(name)
    if (!field) return
    if ('check' in field) {
      ;(field as import('pdf-lib').PDFCheckBox).check()
    }
  } catch {
    // Field doesn't exist or isn't a checkbox — silently skip
  }
}
