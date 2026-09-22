/**
 * BulkActionsDialog — exporten av deltagarlistan (städpasset 2026-09-22).
 *
 * Fyra fel i samma funktion, alla synliga först i mottagarens Excel:
 *  1. CSV:n citerades inte. Ett namn med kommatecken ("Berg, Bertil") eller en
 *     tom efternamnskolumn flyttade kolumnerna.
 *  2. Ingen BOM — Excel läser UTF-8 utan BOM som Windows-1252, så "Åsa Öberg"
 *     blev "Ã…sa Ã–berg".
 *  3. "Excel"-valet skrev tabbseparerad text med filändelsen .xlsx. Excel
 *     vägrar öppna den ("filformatet eller filnamnstillägget är ogiltigt").
 *  4. Status skrevs som databaskoden ("ACTIVE") i stället för etiketten
 *     konsulenten ser i gränssnittet, och ett saknat efternamn blev "null".
 * Dessutom: en cell som börjar med = + - @ tolkas som formel i Excel
 * (CSV-injektion) — deltagaren skriver själv sitt namn.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { BulkActionsDialog } from './BulkActionsDialog'

vi.mock('@/services/consultantService', () => ({
  consultantService: { addParticipantTags: vi.fn(), updateParticipantStatus: vi.fn(), logContact: vi.fn() },
}))

const deltagare = [
  { participant_id: 'p1', first_name: 'Åsa', last_name: 'Öberg, jr', email: 'asa@example.com', status: 'ACTIVE' },
  { participant_id: 'p2', first_name: '=HYPERLINK("x")', last_name: null as unknown as string, email: 'b@example.com', status: 'ON_HOLD' },
]

const BOM = String.fromCharCode(0xfeff)
const utanBom = (s: string) => (s.startsWith(BOM) ? s.slice(1) : s)

let blobbar: Blob[] = []
let filnamn: string[] = []

beforeEach(() => {
  blobbar = []
  filnamn = []
  URL.createObjectURL = vi.fn((b: Blob) => { blobbar.push(b); return 'blob:x' }) as typeof URL.createObjectURL
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    filnamn.push(this.download)
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function lasBytes(b: Blob): Promise<Uint8Array> {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(new Uint8Array(r.result as ArrayBuffer))
    r.readAsArrayBuffer(b)
  })
}

async function exportera(format: string | RegExp) {
  render(
    <BulkActionsDialog isOpen onClose={vi.fn()} actionType="export" selectedParticipants={deltagare} onComplete={vi.fn()} />,
  )
  fireEvent.click(screen.getByText(format))
  fireEvent.click(screen.getByRole('button', { name: /Ladda ner/i }))
  await waitFor(() => expect(blobbar).toHaveLength(1))
  // Råbytes: FileReader.readAsText tar bort en inledande BOM vid avkodning.
  const bytes = await lasBytes(blobbar[0])
  const text = utanBom(new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes))
  return { text, bytes, namn: filnamn[0] }
}

describe('CSV-exporten', () => {
  it('börjar med en UTF-8-BOM så Excel läser å/ä/ö rätt', async () => {
    const { bytes } = await exportera('CSV')
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
  })

  it('citerar fält med avgränsare, visar svensk status och skriver aldrig "null"', async () => {
    const { text } = await exportera('CSV')
    const rader = text.trim().split(/\r?\n/)
    expect(rader[1]).toBe('"Åsa Öberg, jr",asa@example.com,Aktiv')
    expect(text).not.toContain('null')
    expect(text).toContain('Pausad')
    expect(text).not.toContain('ACTIVE')
  })

  it('neutraliserar celler som Excel annars tolkar som formler', async () => {
    const { text } = await exportera('CSV')
    const rad = text.trim().split(/\r?\n/)[2]
    expect(rad.startsWith('"\'=HYPERLINK')).toBe(true)
  })
})

describe('Excel-valet', () => {
  it('ger en fil Excel faktiskt kan öppna: semikolonseparerad .csv, inte text med ändelsen .xlsx', async () => {
    const { text, namn } = await exportera(/^Excel/)
    expect(namn).toMatch(/\.csv$/)
    expect(namn).not.toMatch(/\.xlsx$/)
    expect(text.split(/\r?\n/)[0]).toBe('Namn;E-post;Status')
  })
})
