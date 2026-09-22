/**
 * Deltagarexporten i massåtgärderna — ren logik, testbar utan DOM.
 *
 * Städpasset 2026-09-22: exporten citerade inga fält, saknade BOM, skrev
 * statuskoden ("ACTIVE") och "null" för saknade namn, och "Excel"-valet var
 * tabbseparerad text med ändelsen .xlsx som Excel vägrar öppna. Se
 * BulkActionsDialog.export.test.tsx.
 */

/** Samma etiketter som statusväljaren i BulkActionsDialog visar. */
export const STATUS_ETIKETT: Record<string, string> = {
  ACTIVE: 'Aktiv',
  INACTIVE: 'Inaktiv',
  ON_HOLD: 'Pausad',
  COMPLETED: 'Avslutad',
}

export interface ExportDeltagare {
  first_name: string | null
  last_name: string | null
  email: string | null
  status: string | null
}

export const EXPORT_RUBRIKER = ['Namn', 'E-post', 'Status'] as const

export function exportRader(deltagare: readonly ExportDeltagare[]): string[][] {
  return deltagare.map((p) => {
    const namn = [p.first_name, p.last_name].filter((d) => d && d.trim()).join(' ').trim()
    const status = p.status ? (STATUS_ETIKETT[p.status] ?? p.status) : ''
    return [namn || (p.email ?? ''), p.email ?? '', status]
  })
}

/**
 * En cell som börjar med = + - @ (eller tabb/CR) tolkas som formel av Excel —
 * CSV-injektion. Deltagaren skriver själv sitt namn, så värdet är opålitligt.
 * En inledande apostrof gör cellen till text (OWASP:s rekommendation).
 */
function neutraliseraFormel(v: string): string {
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
}

function cell(v: string, avgransare: string): string {
  const s = neutraliseraFormel(v)
  return s.includes(avgransare) || /["\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * CSV med UTF-8-BOM (annars läser Excel å/ä/ö som Windows-1252) och CRLF.
 * `;` är listavgränsaren i svensk Excel — med `,` hamnar allt i kolumn A.
 */
export function csvText(rader: readonly (readonly string[])[], avgransare: ',' | ';'): string {
  const rubrik = EXPORT_RUBRIKER.map((r) => cell(r, avgransare)).join(avgransare)
  const kropp = rader.map((r) => r.map((v) => cell(v, avgransare)).join(avgransare))
  return '﻿' + [rubrik, ...kropp].join('\r\n') + '\r\n'
}
