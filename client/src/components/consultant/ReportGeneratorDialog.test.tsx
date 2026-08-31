/**
 * Tester för ReportGeneratorDialog (KS6): rapportens tidsperiod byter rubrik
 * men inte siffror.
 *
 * Bakgrund: dialogen hade en egen "Tidsperiod"-väljare (vecka/månad/kvartal/
 * år) som bara skrev en TEXT i PDF-huvudet. `analyticsData` — den data som
 * faktiskt fyller rapporten — kom redan färdigberäknad från föräldern
 * (AnalyticsTab/OverviewTab) och reagerade inte på valet. En konsulent kunde
 * välja "Senaste året", ladda ner en PDF som SÄGER "Senaste året" i huvudet,
 * och få en annan periods siffror. Allt såg konsekvent ut i dokumentet — och
 * det är den PDF:en som går till uppdragsgivaren (AF eller en kommun).
 *
 * Fixen (väg a i uppdraget): dialogen väljer ingen period längre. Den VISAR
 * `periodLabel`-propen — den period anropande vy redan bestämt — eller,
 * saknas den (Översikt har ingen periodavgränsning alls), ett ärligt
 * ögonblicksvärde-meddelande med dagens datum. Se kommentaren på
 * `periodLabel` i ReportGeneratorDialog.tsx för hela resonemanget.
 *
 * Testerna körs mot den RIKTIGA PDF-generatorn (pdfReportGenerator mockas
 * INTE). Ett test som bara kollar att dialogen anropar funktionen med rätt
 * argument bevisar inget om vad som faktiskt hamnar i dokumentet en
 * konsulent laddar ner — det var precis den sortens bevisluckan som lät
 * KS6-buggen passera. Samma mönster och samma fälla som
 * `services/__tests__/artikelPdf.test.ts`: PDF-strängar eskaperar `(`, `)`
 * och `\` med bakstreck, så ett `toContain` mot en oav-eskaperad
 * byteström kan vara meningslöst grönt.
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReportGeneratorDialog } from './ReportGeneratorDialog'
import type { ReportData } from '@/services/pdfReportGenerator'

const analyticsData: ReportData = {
  totalParticipants: 12,
  activeParticipants: 9,
  completedParticipants: 3,
  cvCompletionRate: 75,
  goalsCompletionRate: 60,
  engagementRate: 80,
  averageTimeToPlacement: 42,
  monthlyProgress: [{ month: 'Jan', value: 50 }],
  statusDistribution: [{ label: 'Aktiva', value: 9 }],
  topGoalCategories: [{ category: 'CV', count: 5 }],
  cohortData: [
    { cohort: 'Vår 2026', participants: 12, cvComplete: 75, placed: 40, avgTime: 42 },
  ],
}

/**
 * PDF-strängar eskaperar `(`, `)` och `\` med bakstreck — de avgränsar
 * strängar i formatet. Utan den här normaliseringen letar testet efter text
 * i en ström som i själva verket bär extra bakstreck. Uppmätt-mönster från
 * artikelPdf.test.ts.
 */
const avEskapera = (rå: string) => rå.replace(/\\([()\\])/g, '$1')

/** Klickar "Förhandsgranska" och läser tillbaka den genererade PDF:ens rå text. */
async function forhandsgranskadPdfText(): Promise<string> {
  fireEvent.click(screen.getByRole('button', { name: /Förhandsgranska/i }))

  const iframe = await waitFor(
    () => screen.getByTitle('PDF Preview') as HTMLIFrameElement,
    { timeout: 15000 }
  )

  const dataUrl = iframe.src
  const markor = 'base64,'
  const base64 = dataUrl.slice(dataUrl.indexOf(markor) + markor.length)
  // jsPDF bygger data-URL:en med btoa() av en binärsträng (latin1) — atob()
  // ger tillbaka exakt samma byteström som i artikelPdf.test.ts:s
  // FileReader.readAsBinaryString.
  return avEskapera(atob(base64))
}

describe('ReportGeneratorDialog — periodetiketten ska motsvara datan (KS6)', () => {
  it('skriver EXAKT den period anropande vy redan valt — inte ett eget val', async () => {
    render(
      <ReportGeneratorDialog
        isOpen
        onClose={() => {}}
        analyticsData={analyticsData}
        periodLabel="Andra kvartalet 2026"
      />
    )

    // Syns i dialogen INNAN nedladdning, så konsulenten ser samma period
    // som siffrorna faktiskt gäller för.
    expect(screen.getByText('Andra kvartalet 2026')).toBeInTheDocument()

    const pdf = await forhandsgranskadPdfText()

    expect(pdf).toContain('Andra kvartalet 2026')
    // Ingen kvarleva av den gamla, urkopplade väljaren.
    expect(pdf).not.toContain('Senaste månaden')
    expect(pdf).not.toContain('Senaste året')
  }, 30000)

  it('ljuger inte om en period när vyn (Översikt) inte har någon alls', async () => {
    render(
      <ReportGeneratorDialog
        isOpen
        onClose={() => {}}
        analyticsData={analyticsData}
        // Ingen periodLabel — precis så OverviewTab.tsx anropar dialogen,
        // eftersom dess data är dagsaktuella totalsummor utan avgränsning.
      />
    )

    const idag = new Date().toLocaleDateString('sv-SE')
    expect(screen.getByText(new RegExp(idag))).toBeInTheDocument()

    const pdf = await forhandsgranskadPdfText()

    expect(pdf).toContain('Aktuell status per')
    expect(pdf).toContain(idag)
    // Det får ALDRIG stå en påhittad period när vyn inte har någon.
    expect(pdf).not.toContain('Senaste veckan')
    expect(pdf).not.toContain('Senaste månaden')
    expect(pdf).not.toContain('Senaste kvartalet')
    expect(pdf).not.toContain('Senaste året')
  }, 30000)

  it('erbjuder ingen egen periodväljare längre (regressionsvakt)', () => {
    render(
      <ReportGeneratorDialog
        isOpen
        onClose={() => {}}
        analyticsData={analyticsData}
        periodLabel="Andra kvartalet 2026"
      />
    )

    // En <select> här vore precis den urkopplade väljaren som orsakade
    // buggen — den ändrade bara en text, aldrig den data som redan låg fast.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('byter etikett när periodLabel-propen ändras, utan att kräva ny data', () => {
    const { rerender } = render(
      <ReportGeneratorDialog
        isOpen
        onClose={() => {}}
        analyticsData={analyticsData}
        periodLabel="Första kvartalet 2026"
      />
    )
    expect(screen.getByText('Första kvartalet 2026')).toBeInTheDocument()

    rerender(
      <ReportGeneratorDialog
        isOpen
        onClose={() => {}}
        analyticsData={analyticsData}
        periodLabel="Andra kvartalet 2026"
      />
    )
    expect(screen.getByText('Andra kvartalet 2026')).toBeInTheDocument()
    expect(screen.queryByText('Första kvartalet 2026')).not.toBeInTheDocument()
  })
})
