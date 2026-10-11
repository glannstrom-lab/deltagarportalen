/**
 * Grind: CV-mallarnas text klarar WCAG AA, och dokumentet har en rubrikhierarki
 * (CVK1, 2026-10-11).
 *
 * ## Varför
 *
 * Mallarna skrevs med färger som `#999` på vitt (2,84:1), `#888` (3,54:1) och
 * `#94A3B8` (2,56:1). Samma färger hamnar i PDF:en som arbetsgivaren läser,
 * och i förhandsvisningen som axe såg först när EG3 öppnade /cv på
 * granskningen. Förhandsvisningen var därför undantagen i
 * `e2e/axe-a11y.spec.ts`. Ett okulärt "ser lagom grått ut" är precis hur
 * färgerna kom dit — den här grinden räknar i stället.
 *
 * ## Hur den mäter
 *
 * Varje mall renderas med ett rikt och ett tunt CV. För varje element som bär
 * egen text slås förgrunden upp (närmaste `color`, med `opacity` och alfa
 * inräknade) och bakgrunden (närmaste täckande `background`, med halv-
 * genomskinliga lager ovanpå sammansatta). En gradient prövas mot varje
 * färgstopp — det sämsta stoppet räknas. Stor text (≥ 24 px, eller ≥ 18,66 px
 * fet) får 3:1, allt annat 4,5:1. Även `aria-hidden`-text prövas — den syns.
 *
 * Mallarna sätter all färg inline, så jsdom räcker — men det betyder också att
 * en färg som kommer från en klass inte syns här. Mallarna har inga sådana.
 *
 * Grinden kräver dessutom att varje text har en uttalad färg i mallen: en
 * mall som ärver portalens textfärg ser olika ut i förhandsvisningen och i
 * PDF:en, och den färgen kan grinden inte pröva.
 *
 * ## Sidopanelen i print
 *
 * I PDF:en målas sidopanelen inte av `<aside>` utan som canvas-bakgrund från
 * `SIDEBAR_CONFIG` i `CVPrintLayout.tsx` (lärdomen 2026-07-03). Är de två
 * färgerna olika ser PDF:en annorlunda ut än förhandsvisningen, och texten i
 * panelen prövas mot fel bakgrund. Grinden kräver därför att de är lika.
 */

import { describe, it, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ComponentType } from 'react'
import * as Mallar from '../index'
import type { TemplateCVData, TemplateProps } from '../types'
import { MALLFORMER } from '@/data/cvMallar'

type Rgba = [number, number, number, number]

const NAMNGIVNA: Record<string, Rgba> = {
  white: [255, 255, 255, 1],
  black: [0, 0, 0, 1],
  transparent: [0, 0, 0, 0],
}

function tolkaFarg(s: string): Rgba | null {
  const t = s.trim().toLowerCase()
  if (NAMNGIVNA[t]) return NAMNGIVNA[t]
  let m = /^#([0-9a-f]{3})$/.exec(t)
  if (m) return [...m[1].split('').map((c) => parseInt(c + c, 16)), 1] as Rgba
  m = /^#([0-9a-f]{6})$/.exec(t)
  if (m) return [parseInt(t.slice(1, 3), 16), parseInt(t.slice(3, 5), 16), parseInt(t.slice(5, 7), 16), 1]
  m = /^rgba?\(([^)]+)\)$/.exec(t)
  if (m) {
    const d = m[1].split(',').map((x) => parseFloat(x))
    return [d[0], d[1], d[2], d.length > 3 ? d[3] : 1]
  }
  return null
}

/** Alla färger i ett deklarationsvärde — en för solid, flera för gradient. */
function fargerI(varde: string): Rgba[] {
  const traffar = varde.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]*\)|\bwhite\b|\bblack\b|\btransparent\b/g) ?? []
  return traffar.map((x) => tolkaFarg(x)).filter((x): x is Rgba => x !== null)
}

function deklaration(el: Element, egenskap: string): string | null {
  const stil = el.getAttribute('style') ?? ''
  const re = new RegExp(`(?:^|;)\\s*${egenskap}\\s*:\\s*([^;]+)`, 'i')
  return re.exec(stil)?.[1]?.trim() ?? null
}

function over(fg: Rgba, bg: Rgba): Rgba {
  const a = fg[3]
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]
}

function luminans([r, g, b]: Rgba): number {
  const k = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * k(r) + 0.7152 * k(g) + 0.0722 * k(b)
}

function kontrast(a: Rgba, b: Rgba): number {
  const [l1, l2] = [luminans(a), luminans(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

function hex(c: Rgba): string {
  return '#' + c.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase()
}

/** Bakgrunden bakom ett element: lista av möjliga färger (gradientstopp). */
function bakgrunder(el: Element, sida: Rgba): Rgba[] {
  const lager: Rgba[][] = []
  for (let n: Element | null = el; n; n = n.parentElement) {
    const v = deklaration(n, 'background-color') ?? deklaration(n, 'background')
    if (!v) continue
    const farger = fargerI(v).filter((f) => f[3] > 0)
    if (farger.length === 0) continue
    lager.push(farger)
    if (farger.every((f) => f[3] >= 1)) break
  }
  let kandidater: Rgba[] = [sida]
  for (const l of lager.reverse()) {
    kandidater = l.flatMap((f) => kandidater.map((k) => over(f, k)))
  }
  return kandidater
}

function narmast(el: Element, egenskap: string): string | null {
  for (let n: Element | null = el; n; n = n.parentElement) {
    const v = deklaration(n, egenskap)
    if (v) return v
  }
  return null
}

function opacitet(el: Element): number {
  let o = 1
  for (let n: Element | null = el; n; n = n.parentElement) {
    const v = deklaration(n, 'opacity')
    if (v) o *= parseFloat(v)
  }
  return o
}

// Bara ikoner räknas bort. `aria-hidden` göms för skärmläsare men SYNS — axe
// prövar den, och det gör grinden också (initialerna i Nordic föll på just det).
function arDekor(el: Element): boolean {
  return !!el.closest('svg')
}

function egenText(el: Element): string {
  return [...el.childNodes]
    .filter((n) => n.nodeType === 3)
    .map((n) => n.textContent ?? '')
    .join('')
    .trim()
}

// ─── SIDEBAR_CONFIG ur CVPrintLayout (källan, inte en kopia) ───────────────

const printLayout = readFileSync(resolve(__dirname, '../../CVPrintLayout.tsx'), 'utf-8')
const panelblock = printLayout.slice(printLayout.indexOf('const SIDEBAR_CONFIG'))
const PANELER: Record<string, { width: string; bg: string; main?: string } | null> = {}
for (const m of panelblock.slice(0, panelblock.indexOf('\n}')).matchAll(/^\s+(\w+):\s+(null|\{ width: '([^']+)',\s*bg: '([^']+)'(?:,\s*main: '([^']+)')?)/gm)) {
  PANELER[m[1]] = m[2] === 'null' ? null : { width: m[3], bg: m[4], main: m[5] }
}

// ─── Fixturer ──────────────────────────────────────────────────────────────

const FOTO = 'data:image/svg+xml;base64,PHN2Zy8+'

const RIKT: TemplateCVData = {
  firstName: 'Mikael',
  lastName: 'Glännström',
  title: 'Arbetskonsulent',
  email: 'mikael@example.se',
  phone: '070-123 45 67',
  location: 'Lindesberg',
  summary: 'Arbetskonsulent med lång erfarenhet av arbetsmarknadsintegration och stödinsatser.',
  profileImage: FOTO,
  workExperience: [
    { id: 'w1', title: 'Arbetskonsulent', company: 'Arbetslivsresurs', location: 'Lindesberg', startDate: '2025-12', endDate: '', current: true, description: 'Föreläsningar och samtal.\n\n- Kontakt med arbetsgivare\n- Uppföljning' },
    { id: 'w2', title: 'Jobbcoach', company: 'Arcus', location: '', startDate: '2020-12', endDate: '2025-11', current: false, description: 'Rad ett\nRad två' },
  ],
  education: [
    { id: 'e1', degree: 'Magisterexamen', school: 'Örebro universitet', field: 'Psykologi', location: 'Örebro', startDate: '2006-08', endDate: '2011-06', description: 'Uppsats om motivation.' },
  ],
  skills: [
    { id: 's1', name: 'MI', level: 5, category: 'technical' },
    { id: 's2', name: 'B-körkort', level: 4, category: 'other' },
  ],
  languages: [
    { id: 'l1', language: 'Svenska', level: 'Modersmål' },
    { id: 'l2', language: 'Engelska', level: 'Flytande' },
  ],
  certificates: [{ id: 'c1', name: 'HLR', issuer: 'Röda Korset', date: '2024-01' }],
  links: [{ id: 'k1', type: 'linkedin', url: 'linkedin.com/in/mikael', label: 'LinkedIn' }],
}

const TUNT: TemplateCVData = {
  firstName: 'Sara',
  lastName: 'Ek',
  email: 'sara@example.se',
  workExperience: [{ id: 'w1', title: 'Butiksbiträde', company: 'ICA', startDate: '2023-03', current: true }],
  education: [],
  skills: [],
  languages: [],
  certificates: [],
  links: [],
}

const FIXTURER: [string, TemplateCVData][] = [
  ['rikt CV med foto', RIKT],
  ['rikt CV utan foto', { ...RIKT, profileImage: null }],
  ['tunt CV', TUNT],
]

function mallkomponent(namn: string): ComponentType<TemplateProps> {
  const k = (Mallar as unknown as Record<string, ComponentType<TemplateProps>>)[namn]
  if (!k) throw new Error(`Mallen ${namn} exporteras inte från templates/index.ts`)
  return k
}

const fullName = (d: TemplateCVData) => `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim()

// ─── Grinden ───────────────────────────────────────────────────────────────

/** Kör kontrastmätningen på ett renderat dokument; returnerar fynden. */
function kontrastfel(rot: Element, sida: Rgba): string[] {
  const fel: string[] = []
  for (const el of rot.querySelectorAll('*')) {
    const text = egenText(el)
    if (!text || arDekor(el)) continue
    const fargVarde = narmast(el, 'color')
    if (!fargVarde) {
      fel.push(`"${text.slice(0, 30)}" har ingen uttalad färg i mallen`)
      continue
    }
    const fg0 = tolkaFarg(fargVarde)
    if (!fg0) {
      fel.push(`"${text.slice(0, 30)}": färgen "${fargVarde}" går inte att tolka`)
      continue
    }
    const fg: Rgba = [fg0[0], fg0[1], fg0[2], fg0[3] * opacitet(el)]
    const storlek = parseFloat(narmast(el, 'font-size') ?? '16')
    const vikt = parseInt(narmast(el, 'font-weight') ?? '400', 10)
    const stor = storlek >= 24 || (storlek >= 18.66 && vikt >= 700)
    const krav = stor ? 3 : 4.5
    for (const bg of bakgrunder(el, sida)) {
      const k = kontrast(over(fg, bg), bg)
      if (k < krav - 0.005) {
        fel.push(`"${text.slice(0, 30)}" ${hex(over(fg, bg))} på ${hex(bg)} = ${k.toFixed(2)}:1 (krav ${krav}:1)`)
        break
      }
    }
  }
  return fel
}

describe('CV-mallarnas kontrast (CVK1)', () => {
  it('läser SIDEBAR_CONFIG ur CVPrintLayout för varje mall', () => {
    expect(Object.keys(PANELER).sort()).toEqual(MALLFORMER.map((m) => m.id).sort())
  })

  for (const mall of MALLFORMER) {
    const Mall = mallkomponent(mall.komponent)
    const panel = PANELER[mall.id]
    // Sidans bakgrund i PDF:en kommer ur print-konfigurationen: helsidesfärgen
    // (width 100 %) eller huvudytans färg (`main`), annars vitt.
    const sida = (panel?.width === '100%' ? tolkaFarg(panel.bg) : panel?.main ? tolkaFarg(panel.main) : null) ?? [255, 255, 255, 1]

    for (const [vad, data] of FIXTURER) {
      it(`${mall.id} — ${vad}: all text ≥ 4,5:1 (stor text ≥ 3:1)`, () => {
        const { container } = render(<Mall data={data} fullName={fullName(data)} />)
        const fel = kontrastfel(container, sida as Rgba)
        cleanup()
        expect(fel, fel.join('\n')).toEqual([])
      })
    }

    if (panel && panel.width !== '100%') {
      it(`${mall.id}: sidopanelens färg i förhandsvisningen = canvasfärgen i PDF:en`, () => {
        const { container } = render(<Mall data={RIKT} fullName="Mikael Glännström" />)
        const aside = container.querySelector('aside')
        expect(aside, 'mallen har ingen <aside>').not.toBeNull()
        const v = deklaration(aside!, 'background-color') ?? deklaration(aside!, 'background') ?? ''
        const farger = fargerI(v).map(hex)
        cleanup()
        expect(farger.length, `${mall.id}: <aside> saknar bakgrund`).toBeGreaterThan(0)
        for (const f of farger) expect(f).toBe(hex(tolkaFarg(panel.bg)!))
      })
    }

    // Mallens egen sidfärg måste vara den PDF:en målar — annars är sidan
    // sandfärgad på skärmen och vit på papperet (så var Berlin före 2026-10-11).
    it(`${mall.id}: sidans färg i förhandsvisningen = sidans färg i PDF:en`, () => {
      const { container } = render(<Mall data={RIKT} fullName="Mikael Glännström" />)
      const rot = container.querySelector('.cv-preview')!
      const v = deklaration(rot, 'background-color') ?? deklaration(rot, 'background')
      cleanup()
      const egen = v ? fargerI(v).map(hex) : ['#FFFFFF']
      expect(egen).toEqual([hex(sida as Rgba)])
    })
  }
})

describe('CV-mallarnas rubrikhierarki (CVK1)', () => {
  for (const mall of MALLFORMER) {
    const Mall = mallkomponent(mall.komponent)

    it(`${mall.id}: i PDF:en är namnet dokumentets enda h1, och nivåerna hoppar inte`, () => {
      const { container } = render(<Mall data={RIKT} fullName="Mikael Glännström" />)
      const rubriker = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      const h1 = rubriker.filter((r) => r.tagName === 'H1')
      expect(h1.map((r) => r.textContent)).toEqual(['Mikael Glännström'])
      expect(rubriker[0]?.tagName).toBe('H1')
      let forra = 1
      for (const r of rubriker) {
        const niva = Number(r.tagName[1])
        expect(niva, `"${r.textContent}" (${r.tagName}) hoppar över en nivå`).toBeLessThanOrEqual(forra + 1)
        forra = niva
      }
      cleanup()
    })

    it(`${mall.id}: i förhandsvisningen (rubrikniva 2) finns ingen h1`, () => {
      const { container } = render(<Mall data={RIKT} fullName="Mikael Glännström" rubrikniva={2} />)
      expect(container.querySelectorAll('h1')).toHaveLength(0)
      expect(container.querySelector('h2')?.textContent).toBe('Mikael Glännström')
      cleanup()
    })

    it(`${mall.id}: dokumentet är märkt som svenska (avstavning)`, () => {
      const { container } = render(<Mall data={TUNT} fullName="Sara Ek" />)
      expect(container.querySelector('.cv-preview')?.getAttribute('lang')).toBe('sv')
      cleanup()
    })
  }
})
