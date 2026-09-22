/**
 * CSV-injektion i konsulentens deltagarexport — alla inledande tecken OWASP
 * räknar upp, inte bara `=`.
 *
 * BulkActionsDialog.export.test.tsx provade bara `=HYPERLINK`. Excel och
 * LibreOffice tolkar också `+`, `-` och `@` som början på en formel, och en
 * inledande tabb eller vagnretur kan få cellen att tolkas om efter att
 * blanktecknet trimmats. Deltagaren skriver själv sitt namn, så värdet är
 * opålitligt.
 *
 * Mutation: ta bort `\-` ur regexen i neutraliseraFormel → `-`-fallet faller.
 * (Kontrollerad 2026-09-22.)
 */
import { describe, it, expect } from 'vitest'
import { csvText } from './deltagarExport'

/** Den enda dataraden, med citattecken runt fältet borttagna. */
function forstaCell(varde: string): string {
  const text = csvText([[varde, 'a@example.com', 'Aktiv']], ';')
  const rad = text.replace(new RegExp('^' + String.fromCharCode(0xfeff)), '').split('\r\n')[1]
  // Citerat fält kan innehålla CR — läs fram till första avgränsaren utanför citat.
  const m = rad.match(/^"((?:[^"]|"")*)"/) ?? rad.match(/^([^;]*)/)
  return m![1].replace(/""/g, '"')
}

describe('deltagarExport — formelskydd (OWASP CSV injection)', () => {
  const farliga: Array<[string, string]> = [
    ['=', '=HYPERLINK("https://x","klicka")'],
    ['+', '+1+cmd|\' /C calc\'!A0'],
    ['-', '-2+3+cmd|\' /C calc\'!A0'],
    ['@', '@SUM(1+1)*cmd|\' /C calc\'!A0'],
    ['tabb', '\t=1+1'],
    ['CR', '\r=1+1'],
  ]

  for (const [namn, varde] of farliga) {
    it(`neutraliserar en cell som börjar med ${namn}`, () => {
      const cell = forstaCell(varde)
      expect(cell.startsWith("'")).toBe(true)
      expect(cell.slice(1)).toBe(varde)
    })
  }

  it('lämnar vanliga namn orörda', () => {
    expect(forstaCell('Anna Andersson')).toBe('Anna Andersson')
    expect(forstaCell('Karl-Erik Ek')).toBe('Karl-Erik Ek')
  })
})
