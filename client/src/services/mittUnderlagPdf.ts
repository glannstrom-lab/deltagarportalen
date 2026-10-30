/**
 * Ritar dokumentmodellen för "Mitt underlag" som PDF. Lazy-laddad jsPDF, samma
 * mönster som manadsunderlagPdf. Helvetica har bara Latin-1: tankstreck byts
 * mot bindestreck och tecken utanför Latin-1 (t.ex. arabiska i en jobbtitel)
 * blir "?" i stället för skräp. Det är en känd begränsning, inte ett fel.
 */
import type { Dokument } from './mittUnderlagTyper'

export function latin1(s: string): string {
  return s
    .replace(/[‐-―−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/[Ā-￿]/g, '?')
}

export async function byggUnderlagPdf(dok: Dokument): Promise<Uint8Array> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF('p', 'mm', 'a4')
  const bredd = doc.internal.pageSize.getWidth()
  const hojd = doc.internal.pageSize.getHeight()
  const marg = 15
  let y = marg + 3

  const ny = (behov: number) => {
    if (y + behov > hojd - marg) {
      doc.addPage()
      y = marg + 3
    }
  }
  const stycke = (text: string, storlek = 10, fet = false) => {
    doc.setFont('helvetica', fet ? 'bold' : 'normal')
    doc.setFontSize(storlek)
    const rader = doc.splitTextToSize(latin1(text), bredd - marg * 2) as string[]
    for (const rad of rader) {
      ny(storlek * 0.5)
      doc.text(rad, marg, y)
      y += storlek * 0.45
    }
    y += 2
  }

  stycke(dok.titel, 18, true)
  stycke(dok.undertitel, 10)
  y += 3

  for (const s of dok.sektioner) {
    ny(24)
    stycke(s.rubrik, 13, true)
    if (s.ingress) stycke(s.ingress)
    if (s.meddelande) stycke(s.meddelande)
    if (s.kolumner && s.rader) {
      autoTable(doc, {
        startY: y,
        head: [s.kolumner.map(latin1)],
        body: s.rader.map((r) => r.map(latin1)),
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 1.5, font: 'helvetica' },
        headStyles: { fillColor: [60, 60, 60], textColor: 255 },
        margin: { left: marg, right: marg },
      })
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
    }
    for (const p of s.stycken ?? []) stycke(p)
    y += 4
  }

  return new Uint8Array(doc.output('arraybuffer'))
}
