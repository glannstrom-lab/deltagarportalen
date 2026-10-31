/**
 * periodiskRapportPdf — utskrift av underlaget för den periodiska rapporten (RM6).
 *
 * Ren text i jsPDF (lazy-laddat), `doc.save()`. Helvetica skriver inte
 * U+2013/2014, så tankstreck byts mot bindestreck. Texten säger att
 * fältordningen inte är verifierad mot Arbetsförmedlingens formulär.
 */

import type { jsPDF } from 'jspdf'
import type { PeriodiskRapport } from './periodiskRapport'

export const PDF_FORBEHALL =
  'Internt underlag. Inte den periodiska rapporten och inte skickat till Arbetsförmedlingen. Fältordningen är inte verifierad mot AF:s formulär.'

/** Helvetica-säker text: tankstreck och snedstreck-tecken byts. */
export function pdfSakerText(s: string): string {
  return s.replace(/[\u2013\u2014]/g, '-').replace(/\u00a0/g, ' ')
}

export async function skapaPeriodiskRapportPdf(namn: string, r: PeriodiskRapport): Promise<jsPDF> {
  const { jsPDF: Klass } = await import('jspdf')
  const doc = new Klass('p', 'mm', 'a4')
  const bredd = doc.internal.pageSize.getWidth()
  const hojd = doc.internal.pageSize.getHeight()
  const marg = 20
  let y = marg
  const skriv = (text: string, storlek: number, fet = false) => {
    doc.setFont('helvetica', fet ? 'bold' : 'normal')
    doc.setFontSize(storlek)
    const rader = doc.splitTextToSize(pdfSakerText(text), bredd - marg * 2) as string[]
    for (const rad of rader) {
      if (y > hojd - marg) { doc.addPage(); y = marg }
      doc.text(rad, marg, y)
      y += storlek * 0.5
    }
    y += 2
  }
  skriv(`Underlag för periodisk rapport - ${namn}`, 15, true)
  skriv(`Period ${r.period.from} till ${r.period.to}`, 10)
  skriv(PDF_FORBEHALL, 9)
  for (const f of r.falt) {
    skriv(f.etikett, 11, true)
    skriv(f.text, 10)
  }
  return doc
}

export async function laddaNerPeriodiskRapportPdf(namn: string, r: PeriodiskRapport): Promise<void> {
  const doc = await skapaPeriodiskRapportPdf(namn, r)
  doc.save(`periodisk-rapport-${r.period.from}-${r.period.to}.pdf`)
}
