/**
 * JD2 (docs/ROADMAP.md): `/ai-policy` påstod tidigare fel personuppgiftsbiträde
 * ("OpenAI, Inc.") och ett skydd som inte finns ("USA (EU-US DPF)"). Faktisk
 * leverantör är OpenRouter (modell `openai/gpt-oss-120b`), överföringsgrunden
 * är olöst (ROADMAP A5), och Perplexity (`perplexity/sonar`) används som
 * underbiträde i fem edge-funktioner utan att nämnas.
 *
 * PREMISSGRANSKNING 2026-09-02: sidan var redan omskriven (DOK2, klar
 * 2026-08-31) när den här punkten togs upp igen — `grep -n "OpenAI"
 * AiPolicy.tsx` gav noll träffar, och filen namnger uttryckligen OpenRouter
 * och Perplexity med de fem funktionerna. Det som saknades var ett VAKT-test
 * — inget skyddade rättelsen mot att någon råkar återinföra påståendet.
 * Källkodstext, inte rendering: `Section`/`ListItem` kräver `useTranslation`
 * och `sv.json`-nycklar som ligger utanför den här filens ägarskap, medan
 * leverantörsnamnen och överföringstexten ligger som ren JSX-sträng i denna
 * fil (samma skäl som gjorde JD2 möjlig från början — texten ligger inte i
 * i18n). Samma teknik som `career-arlighet.test.tsx`.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const kalla = readFileSync(join(__dirname, 'AiPolicy.tsx'), 'utf-8')
  .replace(/(?<!:)\/\/.*$/gm, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')

describe('JD2 — /ai-policy anger rätt biträde och inget skydd som inte finns', () => {
  it('påstår inte att leverantören är OpenAI, Inc.', () => {
    expect(kalla).not.toContain('OpenAI, Inc.')
    expect(kalla).not.toMatch(/\bOpenAI\b/)
  })

  it('påstår inte EU-US Data Privacy Framework som gällande skydd', () => {
    // Sidan FÅR nämna DPF för att uttryckligen säga att det INTE gäller
    // ("not yet the EU-US Data Privacy Framework" / "inte EU-US Data Privacy
    // Framework") — det som är förbjudet är att påstå det som en etablerad
    // överföringsgrund, typiskt skrivet som "(EU-US DPF)" utan reservation.
    expect(kalla).not.toContain('(EU-US DPF)')
    for (const match of kalla.matchAll(/EU-US Data Privacy Framework/g)) {
      const fore = kalla.slice(Math.max(0, match.index! - 40), match.index!)
      expect(fore).toMatch(/(not yet|inte)\s+(the\s+)?$/)
    }
  })

  it('anger OpenRouter som leverantör', () => {
    expect(kalla).toContain('OpenRouter')
  })

  it('redovisar Perplexity som underbiträde', () => {
    expect(kalla).toContain('Perplexity')
  })
})
