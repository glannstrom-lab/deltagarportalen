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
  return csvTabell([EXPORT_RUBRIKER, ...rader], avgransare)
}

/**
 * Samma regler för valfri tabell (första raden är rubriken). RK9 (rollspelet
 * 2026-09-27): Rapporters "Excel" var samma tabbseparerade text med ändelsen
 * .xlsx som rättades här 2026-09-22 — nu går båda genom samma funktion.
 */
export function csvTabell(rader: readonly (readonly (string | number)[])[], avgransare: ',' | ';'): string {
  return '\ufeff' + rader.map((r) => r.map((v) => cell(String(v), avgransare)).join(avgransare)).join('\r\n') + '\r\n'
}
