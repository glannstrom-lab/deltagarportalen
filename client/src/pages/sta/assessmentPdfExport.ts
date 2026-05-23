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
import { resolveParticipantName } from './enrollmentDisplay'

type ScoresJsonb = Record<string, { value?: number | string; person?: number | string; bedomare?: number | string; comment?: string }>

interface PdfContext {
  assessment: StaAssessment
  enrollment: StaEnrollment
  consultantName?: string
}

const TEMPLATE_URLS: Partial<Record<InstrumentCode, string>> = {
  AWP: '/sta-templates/awp-2.0-mall.pdf',
  AWC: '/sta-templates/awc-1.1-mall.pdf',
  MOHOST: '/sta-templates/mohost-sammanstallning-mall.pdf',
}

/**
 * Ordningen i instrumentInstruments matchar AWP/AWC:s Färdighet 1-14.
 * Varje färdighet har flera kandidater för fältnamn — PDF-mallen är
 * inkonsekvent (vissa fält heter "Kroppställning", andra har hela
 * beskrivningen som namn, t.ex. "välja använda efterfråga information slutföra"
 * för Kunskap).
 */
const AWP_AWC_FIELD_ORDER: string[][] = [
  // Motoriska 1-5
  ['Kroppsställning', 'Kroppställning', 'Kroppsställning (stabilisera, inta position)'],
  ['Rörlighet', 'Rörlighet (gå, sträcka, böja)'],
  ['Koordination'],
  ['Styrka'],
  ['Fysisk energi'],
  // Processfärdigheter 6-10
  ['Psykisk energi'],
  ['Kunskap', 'välja använda efterfråga information slutföra'],
  ['Tidsorganisation'],
  ['Planering av arbetssituationen'],
  ['Anpassning'],
  // Kommunikation 11-14
  ['Fysisk kommunikation och interaktion'],
  ['Språk'],
  ['Sociala kontakter'],
  ['Informationsutbyte'],
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

export async function fillMohostPdf(ctx: PdfContext): Promise<Blob> {
  const { assessment, enrollment, consultantName } = ctx
  const url = TEMPLATE_URLS.MOHOST
  if (!url) throw new Error('Ingen mall registrerad för MOHOST')

  const { PDFDocument } = await import('pdf-lib')
  const templateBytes = await fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Kunde inte hämta mall: ${r.status} ${r.statusText}`)
    return r.arrayBuffer()
  })

  const doc = await PDFDocument.load(templateBytes)
  const form = doc.getForm()
  const scores = (assessment.scores as ScoresJsonb) ?? {}

  // Metadata
  trySetText(form, 'Namn', resolveParticipantName(enrollment, ''))
  trySetText(form, 'Arbetsterapeutens namn', consultantName ?? '')
  trySetText(form, 'Datum ÅÅMMDD', formatDateShort(assessment.signed_at ?? assessment.created_at))
  trySetText(form, 'Födelsedata ÅÅMMDD', extractBirthDateFromPersonnummer(enrollment.external_personal_id))

  // 24 items: Rad{N} = PDFRadioGroup med Urval1-Urval6 alternativ
  // Mapping: F=Urval1, I=Urval2, D=Urval3, B=Urval4, IS=Urval5
  // Text1.{N-1} = kommentar för item N (1-indexerat i UI men 0-indexerat i fältnamn)
  const MOHOST_VALUE_TO_URVAL: Record<string, string> = {
    F: 'Urval1',
    I: 'Urval2',
    D: 'Urval3',
    B: 'Urval4',
    IS: 'Urval5',
  }

  const instrument = INSTRUMENTS.MOHOST
  let linearIndex = 0
  for (let catIdx = 0; catIdx < instrument.categories.length; catIdx++) {
    const category = instrument.categories[catIdx]
    for (let itemIdx = 0; itemIdx < category.items.length; itemIdx++) {
      const scoreKey = `c${catIdx}_i${itemIdx}`
      const entry = scores[scoreKey]
      const value = entry?.value
      const comment = entry?.comment ?? ''
      const radNr = linearIndex + 1
      const textNr = linearIndex // Text1.0 = item 1, Text1.23 = item 24

      const urval = typeof value === 'string' ? MOHOST_VALUE_TO_URVAL[value] : undefined
      if (urval) {
        trySelectRadio(form, `Rad${radNr}`, urval)
      }

      if (comment) {
        trySetText(form, `Text1.${textNr}`, comment)
      }
      linearIndex++
    }
  }

  // Sammanfattande kommentar i Text2 (allmän fri text-ruta)
  if (assessment.summary) {
    trySetText(form, 'Text2', assessment.summary)
  }

  const pdfBytes = await doc.save()
  return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
}

function formatDateShort(iso?: string | null): string {
  if (!iso) return ''
  // YYMMDD format som AF förväntar
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}${mm}${dd}`
}

function extractBirthDateFromPersonnummer(pnr?: string | null): string {
  if (!pnr) return ''
  // Stödjer YYYYMMDD-XXXX, YYMMDD-XXXX, etc.
  const digits = pnr.replace(/\D/g, '')
  if (digits.length >= 6) {
    const fullForm = digits.length >= 8
    const yy = fullForm ? digits.slice(2, 4) : digits.slice(0, 2)
    const mm = fullForm ? digits.slice(4, 6) : digits.slice(2, 4)
    const dd = fullForm ? digits.slice(6, 8) : digits.slice(4, 6)
    return `${yy}${mm}${dd}`
  }
  return ''
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
  const name = resolveParticipantName(enrollment, 'deltagare').replace(/\s+/g, '-').toLowerCase()
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
  trySetText(form, 'Namn', resolveParticipantName(enrollment, ''))
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
      const fieldCandidates = AWP_AWC_FIELD_ORDER[linearIndex] ?? []
      const primaryName = fieldCandidates[0] ?? ''
      const skattningNr = linearIndex + 1

      // För AWC: använd fält-format "Skattning N - <färdighetsnamn>"
      // För AWP: använd fält-format "Skattning N - Färdighet M"
      if (typeof value === 'number' && value >= 1 && value <= 4) {
        if (code === 'AWC') {
          tryCheckAny(form, fieldCandidates.map((n) => `Skattning ${value} - ${n}`))
        } else {
          tryCheck(form, `Skattning ${value} - Färdighet ${skattningNr}`)
        }
      } else if (value === 'EB' && code === 'AWC') {
        tryCheckAny(form, fieldCandidates.map((n) => `EB - ${n}`))
      }
      // Kommentar i textareaen som heter samma som färdigheten
      if (comment && primaryName) {
        trySetTextAny(form, fieldCandidates, comment)
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

/**
 * Robust fältsökning som hanterar Unicode-normalisering (NFC/NFD) och
 * case-insensitive fallback. PDF-mallar kan ha åäö lagrade som NFD medan
 * vår kod använder NFC, vilket gör direkt-matchning opålitlig.
 */
function findFieldExact(
  form: import('pdf-lib').PDFForm,
  name: string,
): import('pdf-lib').PDFField | null {
  // Försök direkt först (snabbaste vägen, fungerar i 95% av fallen)
  try {
    return form.getField(name)
  } catch {
    // Fallthrough till normaliserad sökning
  }

  const target = name.normalize('NFC').toLowerCase()
  const targetNfd = name.normalize('NFD').toLowerCase()

  for (const field of form.getFields()) {
    const candidate = field.getName()
    if (candidate === name) return field
    const candNfc = candidate.normalize('NFC').toLowerCase()
    const candNfd = candidate.normalize('NFD').toLowerCase()
    if (candNfc === target || candNfd === targetNfd) return field
  }
  return null
}

function trySetText(form: import('pdf-lib').PDFForm, name: string, value: string) {
  const field = findFieldExact(form, name)
  if (field && 'setText' in field) {
    try {
      ;(field as import('pdf-lib').PDFTextField).setText(value)
    } catch {
      // Field exists but text-set kraschade — ignorera
    }
  }
}

function trySetTextAny(form: import('pdf-lib').PDFForm, candidates: string[], value: string) {
  for (const name of candidates) {
    const field = findFieldExact(form, name)
    if (field && 'setText' in field) {
      try {
        ;(field as import('pdf-lib').PDFTextField).setText(value)
        return
      } catch {
        // försök nästa
      }
    }
  }
}

function tryCheck(form: import('pdf-lib').PDFForm, name: string) {
  const field = findFieldExact(form, name)
  if (field && 'check' in field) {
    try {
      ;(field as import('pdf-lib').PDFCheckBox).check()
    } catch {
      // Field exists but check failed — ignorera
    }
  }
}

function tryCheckAny(form: import('pdf-lib').PDFForm, candidates: string[]) {
  for (const name of candidates) {
    const field = findFieldExact(form, name)
    if (field && 'check' in field) {
      try {
        ;(field as import('pdf-lib').PDFCheckBox).check()
        return
      } catch {
        // försök nästa
      }
    }
  }
}

function trySelectRadio(form: import('pdf-lib').PDFForm, name: string, option: string) {
  const field = findFieldExact(form, name)
  if (field && 'select' in field) {
    try {
      ;(field as import('pdf-lib').PDFRadioGroup).select(option)
    } catch {
      // option finns inte i radio-gruppen — ignorera
    }
  }
}
