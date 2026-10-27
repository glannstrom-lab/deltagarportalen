/**
 * FN9 (2026-10-27): sidan /sakerhet-och-avtal/.
 *
 * Sidan är en lista påståenden en kommuns IT och dataskyddsombud kan citera i en
 * upphandling. Ett påstående som slutat stämma är värre än inget påstående, så
 * grinden här kopplar de som går att koppla till sin källa i koden. Den läser
 * källfilerna, inte en handskriven kopia, och kan falla:
 *   - byt `allow_fallbacks: false` mot `true` i api/ai.js        → "ingen reserv" fäller
 *   - lägg `'admin'` ur ROLLER_MED_KRAV i services/mfaApi.ts       → tvåstegskravet fäller
 *   - byt `fra1` i vercel.json                                    → Frankfurt-raden fäller
 *   - ta bort luckan "Inget avtalat SLA" ur JSON-filen            → luckvakten fäller
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* eslint-disable @typescript-eslint/no-require-imports */
const mall = require('../../scripts/lib/guide-template.cjs') as { renderSakerhet: (o: unknown) => string }
const SIDA = require('../../content/sakerhet-och-avtal.json') as {
  slug: string
  sektioner: { id: string; rubrik: string }[]
  luckor: { punkter: string[] }
  lankar: { href: string }[]
}
const B2B = (require('../../content/b2b.json') as { sidor: { slug: string; gdprAi: { lankHref: string } }[] }).sidor
/* eslint-enable @typescript-eslint/no-require-imports */

const CLIENT = resolve(__dirname, '../..')
const REPO = resolve(CLIENT, '..')
const las = (p: string) => readFileSync(p, 'utf-8').replace(/\r\n/g, '\n')
const html = mall.renderSakerhet(SIDA)
const text = JSON.stringify(SIDA)

describe('sakerhet-och-avtal: sidan', () => {
  it('har rätt slug, canonical och är sökbar', () => {
    expect(SIDA.slug).toBe('sakerhet-och-avtal')
    expect(html).toContain('href="https://www.jobin.se/sakerhet-och-avtal/"')
    expect(html).toContain('<meta name="robots" content="index, follow">')
  })

  it('har alla sektioner som FN9 kräver, med ankare', () => {
    const id = SIDA.sektioner.map((s) => s.id)
    for (const krav of ['underbitraden', 'tvasteg', 'ai', 'gallring', 'backup', 'incident', 'tillganglighet', 'pub']) {
      expect(id).toContain(krav)
      expect(html).toContain(`id="${krav}"`)
    }
    expect(html).toContain('id="luckor"')
  })

  it('har krisstödsblocket och tabellerna har radrubriker', () => {
    expect(html).toContain('class="krisstod"')
    expect(html).toContain('href="tel:90101"')
    expect(html).toContain('<th scope="row">Supabase</th>')
    expect(html).toContain('<th scope="col">Avtalsläge</th>')
  })

  it('escapar text (inget rått < eller & från data)', () => {
    expect(html).toContain('Glänne &amp; Söner')
    expect(html).not.toContain('Glänne & Söner,')
  })

  it('internlänkarna pekar på sidor som finns: /#/-rutter eller prerenderade B2B-sidor', () => {
    for (const l of SIDA.lankar) {
      const ok = l.href.startsWith('/#/') || B2B.some((b) => l.href === `/${b.slug}/`)
      expect(ok, l.href).toBe(true)
    }
  })

  it('B2B-sidorna länkar hit från sitt GDPR-avsnitt', () => {
    for (const b of B2B) expect(b.gdprAi.lankHref, b.slug).toBe('/sakerhet-och-avtal/')
  })
})

describe('sakerhet-och-avtal: ärligheten (inget som inte går att belägga)', () => {
  it('luckorna är kvar: SLA, DPIA, Perplexity-avtal, penetrationstest, statussida', () => {
    const luckor = SIDA.luckor.punkter.join(' ')
    expect(luckor).toContain('Inget avtalat SLA')
    expect(luckor).toContain('DPIA')
    expect(luckor).toContain('Perplexity')
    expect(luckor).toContain('penetrationstest')
    expect(luckor).toContain('statussida')
  })

  it('lovar ingen uppetid, svarstid, certifiering eller kundreferens', () => {
    expect(text).not.toMatch(/99[,.]\d\s*%/)
    expect(text).not.toMatch(/ISO\s*27001|SOC\s*2/i)
    expect(text).not.toMatch(/referenskund(er)? (finns|inom)/i)
    expect(text).not.toMatch(/garanterar|dygnet runt-support/i)
  })

  it('PUB-utkastet är märkt som utkast och ej juridiskt granskat', () => {
    const pub = SIDA.sektioner.find((s) => s.id === 'pub')
    expect(JSON.stringify(pub)).toContain('inte juridiskt granskat')
    expect(JSON.stringify(pub)).toMatch(/utkast/i)
  })
})

describe('sakerhet-och-avtal: påståendena mot sin källa', () => {
  it('AI för organisationer: bara Bedrock i Irland, ingen reserv, ingen datalagring (api/ai.js)', () => {
    const ai = las(resolve(CLIENT, 'api/ai.js'))
    const blk = ai.match(/const OPENROUTER_PROVIDER_EU_STRIKT = \{[\s\S]*?\};/)?.[0] ?? ''
    expect(blk).toContain("order: ['amazon-bedrock/eu-west-1']")
    expect(blk).toContain('allow_fallbacks: false')
    expect(blk).toContain("data_collection: 'deny'")
    expect(text).toContain('Det finns ingen reserv')
  })

  it('samma regel i edge-funktionerna (aiGate.ts) och Perplexity bara för konton utan organisation', () => {
    const gate = las(resolve(REPO, 'supabase/functions/_shared/aiGate.ts'))
    const blk = gate.match(/export const OPENROUTER_PROVIDER_EU_STRIKT = \{[\s\S]*?\}/)?.[0] ?? ''
    expect(blk).toContain('allow_fallbacks: false')
    // valjModell: organisationskonto → basmodell med orgKonto: true; sökmodellen är sista grenen.
    expect(gate).toMatch(/return \{ model: SOKMODELL, webbsokning: true, orgKonto: false \}/)
    expect(text).toContain('Webbsökningen via Perplexity är avstängd för organisationers konton')
  })

  it('tvåsteg: obligatoriskt för chef och admin, ingen annan roll (mfaApi.ts)', () => {
    const mfa = las(resolve(CLIENT, 'src/services/mfaApi.ts'))
    expect(mfa).toMatch(/export const ROLLER_MED_KRAV = \['chef', 'admin'\] as const/)
    expect(text).toContain('rollen chef eller admin')
    expect(text).toContain('en spärr i gränssnittet')
  })

  it('regioner: Vercel-funktioner i fra1 (vercel.json), Supabase i Irland (HOSTING-REGIONS)', () => {
    const v = las(resolve(CLIENT, 'vercel.json'))
    expect(v).toContain('"regions": ["fra1"]')
    expect(las(resolve(REPO, 'docs/HOSTING-REGIONS.md'))).toMatch(/Supabase[^\n]*Ireland/)
    expect(html).toContain('Frankfurt (EU)')
    expect(html).toContain('Irland (EU)')
  })

  it('backup: varje natt, 30 dagars lagring, AES-256-GCM (backup.yml, BACKUP.md)', () => {
    const wf = las(resolve(REPO, '.github/workflows/backup.yml'))
    expect(wf).toContain("cron: '17 2 * * *'")
    const doc = las(resolve(REPO, 'docs/BACKUP.md'))
    expect(doc).toContain('30 dagar')
    expect(doc).toContain('AES-256-GCM')
    expect(doc).toMatch(/Förlust upp till ett dygn/)
    expect(text).toContain('upp till ett dygns ändringar')
  })

  it('gallring: tiderna på sidan finns i migrationen som skapar jobben', () => {
    const mig = las(resolve(REPO, 'supabase/migrations/20260912150000_retention_cron_rattad.sql'))
    expect(mig).toContain("ai_usage_logs WHERE created_at < NOW() - INTERVAL '90 days'")
    const mig2 = las(resolve(REPO, 'supabase/migrations/20260912170000_retention_bekraftade.sql'))
    expect(mig2).toContain("consultant_messages WHERE created_at < NOW() - INTERVAL '2 years'")
    expect(mig2).toContain("login_attempts WHERE attempted_at < NOW() - INTERVAL '30 days'")
    expect(mig2).toContain("INTERVAL '12 months'")
    expect(text).toContain('90 dagar')
    expect(text).toContain('30 dagar')
  })

  it('AI av som standard för organisationer: kolumnens default i migrationen', () => {
    const mig = las(resolve(REPO, 'supabase/migrations/20261011_org_ai_av_som_standard.sql'))
    expect(mig).toContain('ALTER COLUMN ai_enabled SET DEFAULT false')
    expect(text).toContain('En ny organisation startar med AI avstängt')
  })
})
