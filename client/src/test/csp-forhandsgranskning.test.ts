/**
 * RK10 (rollspelet 2026-09-27): PDF-förhandsgranskningen i rapportdialogen var
 * alltid tom. Konsolen: "Framing '' violates … default-src 'self' … 'frame-src'
 * was not explicitly set". CSP:n i vercel.json saknade frame-src, så
 * default-src 'self' gällde även för iframen — och den visar en data:-URL.
 *
 * Grinden läser den RIKTIGA CSP:n och den RIKTIGA förhandsgranskningens URL
 * (pdfReportGenerator), så den faller om någon av dem byter form utan den andra:
 * byter förhandsgranskningen till blob: måste CSP:n tillåta blob:, och tar
 * någon bort frame-src faller den igen. Verifierat i Chrome (Playwright,
 * kanal chrome) 2026-09-27: med `frame-src 'self' blob: data:` renderas PDF:en
 * i iframen både som data: och blob:, trots `object-src 'none'`.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateReportDataUrl, type ReportData } from '@/services/pdfReportGenerator'

const config = JSON.parse(readFileSync(resolve(__dirname, '../../vercel.json'), 'utf8')) as {
  headers: Array<{ headers: Array<{ key: string; value: string }> }>
}
const csp = config.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')!.value

function direktiv(namn: string): string[] | null {
  for (const del of csp.split(';')) {
    const [n, ...varden] = del.trim().split(/\s+/)
    if (n === namn) return varden
  }
  return null
}

/** Den källista som faktiskt styr en iframe: frame-src → child-src → default-src. */
const ramkallor = direktiv('frame-src') ?? direktiv('child-src') ?? direktiv('default-src') ?? []

const data: ReportData = {
  totalParticipants: 1, activeParticipants: 1, completedParticipants: 0, cvCompletionRate: 0, goalsCompletionRate: 0,
  engagementRate: 0, averageTimeToPlacement: null, monthlyProgress: [], statusDistribution: [], topGoalCategories: [], cohortData: [],
}

describe('RK10: CSP:n tillåter förhandsgranskningens iframe', () => {
  it('schemat som förhandsgranskningen visar finns i frame-src', async () => {
    const url = await generateReportDataUrl(data, { consultantName: 'Test', dateRange: 'Test', language: 'sv' })
    const schema = url.slice(0, url.indexOf(':') + 1) // "data:" eller "blob:"
    expect(ramkallor).toContain(schema)
  }, 30000)

  it('blob: är också tillåtet, så ett byte till object-URL inte tömmer förhandsgranskningen igen', () => {
    expect(ramkallor).toContain('blob:')
  })

  it('öppningen gäller bara vad sidan själv ramar in — inramning av portalen är fortfarande stängd', () => {
    expect(direktiv('frame-ancestors')).toEqual(["'none'"])
    expect(direktiv('object-src')).toEqual(["'none'"])
  })
})
