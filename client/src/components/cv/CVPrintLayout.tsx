/**
 * CVPrintLayout — print-optimerad rendering av CV för PDF-generering.
 *
 * Strategin:
 *  1. Rendera CV som EN sammanhängande sida (inget JS-pre-paginering).
 *  2. Låt Chrome:s print-engine paginera naturligt med break-inside: avoid
 *     på cv-entry och break-after: avoid på rubriker.
 *  3. Sidobar-/sidbakgrund: lägg gradienten som CANVAS-bakgrund (html-
 *     elementet) i print. Canvas-bakgrunden målas om på VARJE tryckt sida,
 *     kant till kant — även på sista sidan där innehållet slutar mitt på
 *     sidan. Därmed behövs ingen filler/höjdmätning alls.
 *  4. Säkerhetszoner på sida 2+: .cv-print-flow har padding 12mm topp /
 *     10mm botten med box-decoration-break: clone — paddingen klonas vid
 *     varje sidbrytning så innehållet aldrig ligger dikt an mot papperets
 *     kant. Negativa marginaler nollar ut paddingen på första/sista sidan,
 *     så ensidiga CV:n behåller exakt sin naturliga höjd (inget "tippar
 *     över till 2 sidor"-problem). Kräver Chromium ≥ 130 (prod kör
 *     @sparticuz/chromium 148, lokal dev modern Chrome).
 *
 * Försökt och funkar INTE:
 *  - position: fixed för sidebar-bg → överlappades av cv-print-root:s
 *    egna background, syntes bara delvis på sista sidan
 *  - JS-mätning + per-sida-rendering (PagedCVPrint) → fragil, ej universellt
 *  - @page { margin: 12mm 0 } + aside JS-stretch → vita band sidan 2+
 *  - background-image-tile + JS-filler som sträcker root-höjden → vit
 *    remsa 20-50mm på sista sidan (höjden kunde aldrig mätas exakt utan
 *    risk för en extra blank sida)
 *
 * Funkar:
 *  - canvas-bakgrund (html) i print → full täckning på alla sidor
 *  - box-decoration-break: clone → per-sida-marginaler utan @page-margin
 *    (som hade gett vita band i sidobar-färgen)
 *  - break-inside: avoid på .cv-entry → håller ihop jobb/utbildning
 *  - body * { visibility: hidden } + .cv-print-root * { visibility: visible }
 *    → döljer ev. navbar/sidebar från App.tsx i print
 */

import { useEffect } from 'react'
import type { CVData } from '@/services/supabaseApi'
import {
  MinimalTemplate, ExecutiveTemplate, ModernTemplate, CreativeTemplate,
  NordicTemplate, CenteredTemplate, BudapestTemplate, RotterdamTemplate,
  ChicagoTemplate, AtelierTemplate, ManhattanTemplate, BerlinTemplate,
} from './templates'

interface PrintLayoutProps {
  data: CVData
}

/**
 * Bakgrundskonfiguration per mall.
 *  - width: sidobar-bredd i px eller % — '100%' betyder att HELA sidan
 *    tonas i bg-färgen (mallar med tonad helsidesbakgrund)
 *  - bg: CSS-färg (solid — gradient inom sidebar är inte värt komplexiteten)
 *  - divider: optionell tunn linje mellan aside och main (för ljusa sidobar)
 *
 * null = single-column-mall med vit bakgrund, ingen canvas-bg behövs.
 *
 * VIKTIGT: width måste matcha mallens egen aside exakt. Annars hamnar
 * text utanför färgfältet.
 */
type SidebarConfig = { width: string; bg: string; divider?: string } | null
const SIDEBAR_CONFIG: Record<string, SidebarConfig> = {
  sidebar:   { width: '240px', bg: '#141414' },                                  // ModernTemplate (mörk gradient → solid medel) — 30% av A4-bredd
  nordic:    { width: '240px', bg: '#F8FAFC', divider: '#E2E8F0' },              // NordicTemplate
  budapest:  { width: 'calc(34% - 2px)', bg: '#2C3E50' },                        // BudapestTemplate — 2px smalare än aside så main:s vita bg alltid täcker skarven (34% rasteriseras olika i canvas-bg vs flex-layout)
  manhattan: { width: '220px', bg: '#0F1B2D' },                                  // ManhattanTemplate
  rotterdam: { width: '220px', bg: '#FFFFFF', divider: '#E5E7EB' },              // RotterdamTemplate
  chicago:   { width: '200px', bg: '#FFFFFF', divider: '#E5E7EB' },              // ChicagoTemplate
  berlin:    { width: '60px',  bg: '#1A1A1A' },                                  // BerlinTemplate
  // Tonad helsidesbakgrund — canvas-bg i mallens egen sidfärg
  atelier:   { width: '100%',  bg: '#FAF8F4' },                                  // AtelierTemplate (cream)
  executive: { width: '100%',  bg: '#FDFCFA' },                                  // ExecutiveTemplate (varm off-white)
  creative:  { width: '100%',  bg: '#FAFAFA' },                                  // CreativeTemplate (ljusgrå)
  // Single-column på vitt — ingen canvas-bg
  centered: null,
  minimal: null,
}

function buildBgImage(cfg: NonNullable<SidebarConfig>): string {
  const w = cfg.width
  if (w === '100%') {
    // Helsidesfärg — solid gradient utan vit del
    return `linear-gradient(${cfg.bg}, ${cfg.bg})`
  }
  // linear-gradient to right gör hårda stopp: 0%→sidebar-w är sidebar-bg,
  // sidebar-w→100% är vit. Inga mjuka övergångar (det blir hårda kanter).
  if (cfg.divider) {
    // Med divider: smal 1px linje i divider-färg mellan sidebar och vit
    return `linear-gradient(to right, ${cfg.bg} 0, ${cfg.bg} calc(${w} - 1px), ${cfg.divider} calc(${w} - 1px), ${cfg.divider} ${w}, #FFFFFF ${w}, #FFFFFF 100%)`
  }
  return `linear-gradient(to right, ${cfg.bg} 0, ${cfg.bg} ${w}, #FFFFFF ${w}, #FFFFFF 100%)`
}

function sanitize(data: CVData): CVData {
  return {
    ...data,
    workExperience: (data.workExperience || []).filter(
      (e) => (e?.title?.trim() || e?.company?.trim()),
    ),
    education: (data.education || []).filter(
      (e) => (e?.degree?.trim() || e?.school?.trim()),
    ),
    skills: (data.skills || []).filter((s) => {
      const name = typeof s === 'string' ? s : s?.name
      return !!name?.trim()
    }),
    languages: (data.languages || []).filter((l) => {
      const name = (l as { language?: string; name?: string })?.language || (l as { name?: string })?.name
      return !!name?.trim()
    }),
    certificates: (data.certificates || []).filter((c) => c?.name?.trim()),
    links: (data.links || []).filter((l) => l?.url?.trim()),
  }
}

function renderTemplate(data: CVData, fullName: string) {
  switch (data.template) {
    case 'minimal': return <MinimalTemplate data={data} fullName={fullName} />
    case 'executive': return <ExecutiveTemplate data={data} fullName={fullName} />
    case 'creative': return <CreativeTemplate data={data} fullName={fullName} />
    case 'nordic': return <NordicTemplate data={data} fullName={fullName} />
    case 'centered': return <CenteredTemplate data={data} fullName={fullName} />
    case 'budapest': return <BudapestTemplate data={data} fullName={fullName} />
    case 'rotterdam': return <RotterdamTemplate data={data} fullName={fullName} />
    case 'chicago': return <ChicagoTemplate data={data} fullName={fullName} />
    case 'atelier': return <AtelierTemplate data={data} fullName={fullName} />
    case 'manhattan': return <ManhattanTemplate data={data} fullName={fullName} />
    case 'berlin': return <BerlinTemplate data={data} fullName={fullName} />
    case 'sidebar':
    default: return <ModernTemplate data={data} fullName={fullName} />
  }
}

export function CVPrintLayout({ data: rawData }: PrintLayoutProps) {
  const data = sanitize(rawData)
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'CV'
  const cfg = SIDEBAR_CONFIG[data.template || 'sidebar']
  const hasSidebar = cfg !== null && cfg !== undefined
  const bgImage = hasSidebar && cfg ? buildBgImage(cfg) : 'none'

  useEffect(() => {
    document.documentElement.style.background = '#FFFFFF'
    document.documentElement.style.margin = '0'
    document.documentElement.style.padding = '0'
    document.body.style.background = '#FFFFFF'
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    // React-app:s root-div har ofta default-styling som kan adda subpixel-
    // offset. Hitta första div under body och nollställ.
    const root = document.getElementById('root')
    if (root) {
      root.style.margin = '0'
      root.style.padding = '0'
    }
  }, [])

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          /* Canvas-bakgrund: html-elementets background målas om på VARJE
             tryckt sida, kant till kant (även sista sidan, oavsett var
             innehållet slutar). !important vinner över inline-white som
             sätts för screen-läget. */
          html {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            background: ${hasSidebar ? bgImage : '#FFFFFF'} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Body/root/print-root måste vara transparenta så canvas-bg
             syns igenom — annars täcker deras vita bakgrund gradienten
             precis som gamla filler-lösningen. */
          body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            background: transparent !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* React-root och PrintCV-wrapper får 0 margin/padding så html-
             höjden matchar cv-print-root exakt — annars adderas ~32px från
             default-styling vilket triggar extra blank tryck-sida. */
          #root, #root > div {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
          }
          /* Dölj allt utom print-root (App.tsx kan ha andra root-element) */
          body * { visibility: hidden; }
          .cv-print-root, .cv-print-root * { visibility: visible; }

          .cv-print-root {
            position: relative !important;
            width: 210mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
            /* flow-root: hindra att .cv-print-flow:s negativa topp-marginal
               kollapsar genom root och skjuter upp hela dokumentet */
            display: flow-root;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Per-sida-säkerhetszoner: box-decoration-break: clone gör att
             paddingen appliceras på VARJE sidfragment — 12mm ovanför och
             10mm nedanför varje sidbrytning. De negativa marginalerna
             nollar ut paddingen i dokumentets absoluta början/slut, så
             sida 1 behåller mallens egen header-padding och ensidiga CV:n
             inte växer med 22mm (vilket hade tippat nästan-fulla CV:n
             över till 2 sidor). */
          .cv-print-flow {
            -webkit-box-decoration-break: clone;
            box-decoration-break: clone;
            padding: 12mm 0 10mm;
            margin: -12mm 0 -10mm;
          }

          /* Override cv-preview:s min-height: 297mm i print — så att 1-sidors-
             CV:n vars content är nästan exakt A4 inte tippar över till 2 sidor
             pga cv-preview tvingas vara minst A4 (1122.5px) + Chrome:s print-
             safe-zone på ~30mm. Vi vill att cv-preview ska anpassa höjd till
             content. Canvas-bg täcker resterande utrymme. */
          .cv-print-root .cv-preview {
            min-height: 0 !important;
          }

          /* Mallens cv-preview ska INTE sätta egen bakgrund som täcker
             canvas-gradienten. Vi nollställer även aside:s bg så gradienten
             syns igenom. Main:s bg är redan vit i sidobar-mallarna. */
          ${hasSidebar ? `
          .cv-print-root .cv-preview {
            background: transparent !important;
          }
          .cv-print-root .cv-preview > aside {
            background: transparent !important;
            background-image: none !important;
            border-right: none !important;
          }
          ` : ''}

          /* Page-break-hints: håll ihop varje jobb/utbildning/cert. */
          .cv-print-root .cv-entry,
          .cv-print-root .cv-keep {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
          }
          .cv-print-root h1,
          .cv-print-root h2,
          .cv-print-root h3 {
            page-break-after: avoid !important;
            break-after: avoid-page !important;
          }
          .cv-print-root p,
          .cv-print-root li {
            orphans: 3;
            widows: 3;
          }
        }

        /* Screen-vy: visa CV:t som en lång A4-remsa för förhandsgranskning.
           Här ligger gradienten kvar som element-bg (tile per 297mm). */
        @media screen {
          .cv-print-root {
            width: 210mm;
            margin: 16px auto;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
            position: relative;
          }
        }
      `}</style>

      <div
        className="cv-print-root"
        style={{
          backgroundImage: bgImage,
          backgroundColor: '#FFFFFF',
          backgroundRepeat: 'repeat-y',
          backgroundSize: '100% 297mm',
          backgroundPosition: '0 0',
        }}
      >
        <div className="cv-print-flow">
          {renderTemplate(data, fullName)}
        </div>
      </div>
    </>
  )
}

export default CVPrintLayout
