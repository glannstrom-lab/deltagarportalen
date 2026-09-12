/**
 * Bulk-import parser for STA participants
 *
 * Supports CSV (papaparse) and Excel .xlsx (SheetJS, lazy-loaded).
 * Column headers are case-insensitive and accept Swedish + English aliases.
 *
 * Required column: email
 * Optional columns: first_name (förnamn / fornamn), last_name (efternamn),
 *                   started_at (startdatum / startdate)
 */

import Papa from 'papaparse'

export interface ParsedRow {
  email: string
  first_name?: string
  last_name?: string
  started_at?: string // YYYY-MM-DD or undefined
  rowIndex: number // 1-based row number from file (for error reporting)
  error?: string
}

// Header aliases — all lowercase
const HEADER_MAP: Record<string, keyof ParsedRow> = {
  email: 'email',
  'e-post': 'email',
  epost: 'email',
  mail: 'email',
  'e-mail': 'email',
  'first_name': 'first_name',
  firstname: 'first_name',
  fornamn: 'first_name',
  förnamn: 'first_name',
  'last_name': 'last_name',
  lastname: 'last_name',
  efternamn: 'last_name',
  'started_at': 'started_at',
  startdatum: 'started_at',
  startdate: 'started_at',
  startdat: 'started_at',
  'start_date': 'started_at',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeHeader(h: string): keyof ParsedRow | null {
  const key = String(h ?? '').trim().toLowerCase()
  return HEADER_MAP[key] ?? null
}

function normalizeDate(input: unknown): string | undefined {
  if (input == null || input === '') return undefined
  // Excel returns Date objects when cellDates: true
  if (input instanceof Date && !isNaN(input.getTime())) {
    return input.toISOString().slice(0, 10)
  }
  const s = String(input).trim()
  if (!s) return undefined
  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // YYYY/MM/DD or DD/MM/YYYY — try to parse
  const d = new Date(s)
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10)
  }
  return undefined
}

function buildRow(record: Record<string, unknown>, rowIndex: number): ParsedRow {
  const email = String(record.email ?? '').trim().toLowerCase()
  const first_name = (record.first_name != null ? String(record.first_name).trim() : '') || undefined
  const last_name = (record.last_name != null ? String(record.last_name).trim() : '') || undefined
  const started_at = normalizeDate(record.started_at)

  let error: string | undefined
  if (!email) {
    error = 'E-postadress saknas'
  } else if (!EMAIL_RE.test(email)) {
    error = 'Ogiltig e-postadress'
  }

  return { email, first_name, last_name, started_at, rowIndex, error }
}

/**
 * Map a record with arbitrary header names to our canonical fields.
 * Returns an object with only the recognized fields populated.
 */
function mapHeaders(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [rawHeader, value] of Object.entries(record)) {
    const canonical = normalizeHeader(rawHeader)
    if (canonical) {
      out[canonical] = value
    }
  }
  return out
}

// ===========================================================================
// CSV
// ===========================================================================

export async function parseCSV(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const rows = results.data.map((rec, i) => {
          const mapped = mapHeaders(rec)
          return buildRow(mapped, i + 2) // +2: row 1 is header, data starts at 2
        }).filter((r) => r.email || r.first_name || r.last_name)
        resolve(rows)
      },
      error: (err) => reject(err),
    })
  })
}

// ===========================================================================
// Excel — lazy-loaded
// ===========================================================================

export async function parseExcel(file: File): Promise<ParsedRow[]> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const firstSheetName = wb.SheetNames[0]
  if (!firstSheetName) {
    throw new Error('Excel-filen innehåller inga blad')
  }
  const sheet = wb.Sheets[firstSheetName]
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  })
  return data
    .map((rec, i) => {
      const mapped = mapHeaders(rec)
      return buildRow(mapped, i + 2)
    })
    .filter((r) => r.email || r.first_name || r.last_name)
}

// ===========================================================================
// Templates — what users download to get the column structure right
// ===========================================================================

const TEMPLATE_HEADERS = ['email', 'fornamn', 'efternamn', 'startdatum'] as const

const TEMPLATE_EXAMPLES: Array<Record<typeof TEMPLATE_HEADERS[number], string>> = [
  {
    email: 'anna.svensson@exempel.se',
    fornamn: 'Anna',
    efternamn: 'Svensson',
    startdatum: new Date().toISOString().slice(0, 10),
  },
  {
    email: 'bjorn.karlsson@exempel.se',
    fornamn: 'Björn',
    efternamn: 'Karlsson',
    startdatum: '',
  },
]

export function generateCSVTemplate(): Blob {
  const csv = Papa.unparse({
    fields: TEMPLATE_HEADERS as unknown as string[],
    data: TEMPLATE_EXAMPLES.map((row) => TEMPLATE_HEADERS.map((h) => row[h])),
  })
  // BOM for Excel to recognize UTF-8 (so åäö display correctly when opened in Excel)
  return new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
}

export async function generateExcelTemplate(): Promise<Blob> {
  const XLSX = await import('xlsx')
  const wsData = [
    TEMPLATE_HEADERS as unknown as string[],
    ...TEMPLATE_EXAMPLES.map((row) => TEMPLATE_HEADERS.map((h) => row[h])),
  ]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Deltagare')
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ===========================================================================
// File type detection
// ===========================================================================

export function isCSV(file: File): boolean {
  return file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv'
}

export function isExcel(file: File): boolean {
  return (
    file.name.toLowerCase().endsWith('.xlsx') ||
    file.name.toLowerCase().endsWith('.xls') ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel'
  )
}
