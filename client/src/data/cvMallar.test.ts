/**
 * Mallregistret mot verkligheten (O4, 2026-08-25).
 *
 * ## Driften som testet finns för
 *
 * Mallarnas id:n bor på tre ställen: `TEMPLATES` i `pages/CVBuilder.tsx`
 * (korten användaren väljer bland), `switch (data.template)` i
 * `components/cv/CVPreview.tsx` (vilken komponent som renderas) och nu
 * `MALLFORMER` i `data/cvMallar.ts` (spaltformen vi påstår).
 *
 * Går de isär får användaren en etikett som beskriver fel mall — vilket är
 * värre än ingen etikett alls, eftersom den ser ut att vara kontrollerad.
 * Testet läser källfilerna i stället för att lita på en kopierad lista, så en
 * ny mall som läggs till på ett ställe men inte de andra fäller bygget.
 *
 * Testet kan falla: tar man bort en rad ur MALLFORMER faller det första
 * testet, och stavar man fel på ett komponentnamn faller det tredje.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MALLFORMER, spaltformFor, normaliseraMallId, arKantMallId, STANDARDMALL } from './cvMallar'

function las(relativ: string): string {
  return readFileSync(resolve(__dirname, '..', relativ), 'utf-8')
}

const cvBuilder = las('pages/CVBuilder.tsx')
const cvPreview = las('components/cv/CVPreview.tsx')

/** Id:n ur `TEMPLATES`-listan i CV-byggaren. */
function idnIByggaren(): string[] {
  const block = cvBuilder.slice(cvBuilder.indexOf('const TEMPLATES = ['))
  const slut = block.indexOf('\n]')
  return [...block.slice(0, slut).matchAll(/^\s+id: '([a-z-]+)'/gm)].map((m) => m[1])
}

/** `case '<id>':` ur CVPreviews switch. */
function idnIPreview(): string[] {
  // Mönstret följde `switch (data.template)`. Sedan 2026-09-18 normaliseras
  // id:t i uttrycket, och vakten hittade då noll grenar — den slutade mäta.
  const start = cvPreview.indexOf('switch (normaliseraMallId(data.template))')
  const block = cvPreview.slice(start, start + 2500)
  return [...block.matchAll(/case '([a-z-]+)':/g)].map((m) => m[1])
}

describe('MALLFORMER', () => {
  it('täcker exakt de mallar CV-byggaren erbjuder', () => {
    const byggaren = idnIByggaren()
    expect(byggaren.length).toBeGreaterThan(0)
    expect([...MALLFORMER.map((m) => m.id)].sort()).toEqual([...byggaren].sort())
  })

  it('täcker exakt de mallar förhandsvisningen kan rendera', () => {
    const preview = idnIPreview()
    expect(preview.length).toBeGreaterThan(0)
    // 'sidebar' ligger i CVPreview som `case 'sidebar': default:` — den räknas.
    expect([...MALLFORMER.map((m) => m.id)].sort()).toEqual([...preview].sort())
  })

  it('pekar på komponenter som finns och renderas', () => {
    for (const mall of MALLFORMER) {
      expect(cvPreview, `${mall.id} → ${mall.komponent}`).toContain(`<${mall.komponent} `)
    }
  })

  it('har ingen dubblett', () => {
    const idn = MALLFORMER.map((m) => m.id)
    expect(new Set(idn).size).toBe(idn.length)
  })
})

describe('spaltformen stämmer med mallfilerna', () => {
  it('två-spaltsmallar har en sidopanel, en-spaltsmallar har ingen', () => {
    for (const mall of MALLFORMER) {
      const kalla = las(`components/cv/templates/${mall.komponent}.tsx`)
      const harAside = kalla.includes('<aside')

      if (mall.spaltform === 'en-spalt') {
        expect(harAside, `${mall.id} påstås vara en spalt men har <aside>`).toBe(false)
      } else {
        expect(harAside, `${mall.id} påstås ha en sidopanel men har ingen <aside>`).toBe(true)
      }
    }
  })

  it('Berlins spalt är dekorativ — den bär inga uppgifter', () => {
    const berlin = las('components/cv/templates/BerlinTemplate.tsx')
    // Panelen är 60 px bred och dess text är aria-hidden. Bär den plötsligt
    // kontaktuppgifter är etiketten "dekorativ" inte längre sann.
    expect(berlin).toContain("width: '60px'")
    expect(berlin).toContain('aria-hidden="true"')
  })
})

describe('spaltformFor', () => {
  it('svarar för kända mallar', () => {
    expect(spaltformFor('minimal')).toBe('en-spalt')
    expect(spaltformFor('nordic')).toBe('tva-spalter')
    expect(spaltformFor('berlin')).toBe('dekorativ-spalt')
  })

  it('gissar aldrig för okänt id', () => {
    expect(spaltformFor('finns-inte')).toBeNull()
    expect(spaltformFor('')).toBeNull()
    expect(spaltformFor(null)).toBeNull()
    expect(spaltformFor(undefined)).toBeNull()
  })
})

/**
 * Mall-id:na hade glidit isär på SEX ställen (mätt 2026-09-18).
 *
 * Testet ovan vaktade `CVBuilder` och `CVPreview`. Under tiden bar
 * `CVPrintLayout`, `pdfExportService`, `TemplateSnapshot` och `MyCVs` var sin
 * egen lista — och tre generationer av id hade hunnit skrivas till
 * `cvs.template` i prod. Följden i drift: 7 av 33 CV:n renderades av
 * default-grenen (ModernTemplate, som har en sidopanel) medan panelens
 * bakgrund aldrig målades, eftersom uppslaget gav `undefined`.
 *
 * Grinden nedan kräver att varje lista täcker registret. En ny mall som läggs
 * till på ett ställe men inte de andra fäller bygget.
 */
describe('mall-id:na är samma lista överallt', () => {
  const kanoniska = MALLFORMER.map((m) => m.id)
  const printLayout = las('components/cv/CVPrintLayout.tsx')
  const pdfExport = las('services/pdfExportService.ts')
  const snapshot = las('pages/TemplateSnapshot.tsx')
  const myCvs = las('components/cv/MyCVs.tsx')

  it('CVPrintLayout kan rendera varje mall', () => {
    const start = printLayout.indexOf('function renderTemplate')
    const grenar = [...printLayout.slice(start, start + 2000).matchAll(/case '([a-z-]+)':/g)].map((m) => m[1])
    expect([...grenar].sort()).toEqual([...kanoniska].sort())
  })

  it('CVPrintLayout slår upp på normaliserat id, inte på det råa', () => {
    // Det var precis det här uppslaget som gav `undefined` och släckte
    // sidopanelens bakgrund för 7 av 33 CV:n i prod.
    expect(printLayout).toContain('const mall = normaliseraMallId(data.template)')
    expect(printLayout).toContain('SIDEBAR_CONFIG[mall]')
    expect(printLayout).not.toContain("SIDEBAR_CONFIG[data.template")
  })

  it('SIDEBAR_CONFIG har en post för varje mall — annars blir uppslaget undefined', () => {
    const start = printLayout.indexOf('const SIDEBAR_CONFIG')
    const block = printLayout.slice(start, printLayout.indexOf('\n}', start))
    const nycklar = [...block.matchAll(/^\s{2}([a-z-]+):\s/gm)].map((m) => m[1])
    expect([...nycklar].sort()).toEqual([...kanoniska].sort())
  })

  it('TemplateSnapshot härleder sin lista ur registret i stället för att skriva av den', () => {
    // Den handskrivna `VALID` saknade `berlin`. Listan ska inte finnas alls.
    expect(snapshot).not.toContain('const VALID =')
    expect(snapshot).toContain('arKantMallId(templateId)')
  })

  it('MyCVs filtrerar på normaliserat id', () => {
    expect(myCvs).toContain('normaliseraMallId(cv.data?.template) === selectedTemplate')
  })

  it('pdfExportService slår upp normaliserat id, och dess varianter är kanoniska', () => {
    expect(pdfExport).toContain('const mallId = normaliseraMallId(data.template)')
    expect(pdfExport).toContain('TEMPLATES[mallId]')
    // Varje nyckel i TEMPLATES ska vara ett kanoniskt id. De gamla svenska
    // (`sidokolumn`, `nordisk`) hör hemma i ARVDA_MALL_ID, inte här.
    const start = pdfExport.indexOf('const TEMPLATES')
    const block = pdfExport.slice(start, pdfExport.indexOf('\n}\n', start))
    const nycklar = [...block.matchAll(/^\s{2}([a-z-]+):\s*\{/gm)].map((m) => m[1])
    const okanda = nycklar.filter((n) => !kanoniska.includes(n))
    expect(okanda, `${okanda.join(', ')} är inte kanoniska mall-id`).toEqual([])
  })
})

describe('normaliseraMallId', () => {
  it('lämnar kanoniska id orörda', () => {
    for (const id of MALLFORMER.map((m) => m.id)) {
      expect(normaliseraMallId(id)).toBe(id)
    }
  })

  it('översätter de arvda id som finns i prod', () => {
    expect(normaliseraMallId('modern')).toBe('sidebar')
    expect(normaliseraMallId('sidokolumn')).toBe('sidebar')
    expect(normaliseraMallId('centrerad')).toBe('centered')
    expect(normaliseraMallId('classic')).toBe('centered')
    expect(normaliseraMallId('nordisk')).toBe('nordic')
  })

  it('faller på standardmallen för tomt och okänt', () => {
    expect(normaliseraMallId(null)).toBe(STANDARDMALL)
    expect(normaliseraMallId(undefined)).toBe(STANDARDMALL)
    expect(normaliseraMallId('')).toBe(STANDARDMALL)
    expect(normaliseraMallId('finns-inte')).toBe(STANDARDMALL)
  })

  it('ger alltid ett id registret känner igen', () => {
    for (const id of ['modern', 'classic', 'centrerad', 'sidokolumn', 'nordisk', 'skräp', '', null]) {
      expect(arKantMallId(normaliseraMallId(id)), `${id}`).toBe(true)
    }
  })

  it('CV-byggaren startar på standardmallen, inte på ett id som inte finns', () => {
    expect(cvBuilder).toContain('template: STANDARDMALL')
    expect(cvBuilder).not.toContain("template: 'modern'")
  })
})
