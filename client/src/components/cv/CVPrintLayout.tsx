/**
 * CVPrintLayout — print-optimerad rendering av CV för PDF-generering.
 *
 * Strategin:
 *  1. Rendera CV som EN sammanhängande sida (inget JS-pre-paginering).
 *  2. Låt Chrome:s print-engine paginera naturligt med break-inside: avoid
 *     på cv-entry och break-after: avoid på rubriker.
 *  3. För sidobar-mallar: använd `background-image: linear-gradient(to right,
 *     <sidebar-bg> 0 <w>, white <w> 100%)` på print-root. Eftersom hela
 *     elementets background renderas och print-engine slicar elementet
 *     i sidor får varje sida samma vertikala "sidobar"-färg från 0→w.
 *
 * Detta är mycket mer robust än JS-pre-paginering (gamla PagedCVPrint),
 * som krashade på templates med icke-uniform struktur, sektionsnumrering
 * som reset:ades på sida 2, och innehåll som föll bort.
 *
 * Försökt och funkar INTE:
 *  - position: fixed för sidebar-bg → överlappades av cv-print-root:s
 *    egna background, syntes bara delvis på sista sidan
 *  - JS-mätning + per-sida-rendering (PagedCVPrint) → fragil, ej universellt
 *  - @page { margin: 12mm 0 } + aside JS-stretch → vita band sidan 2+
 *
 * Funkar:
 *  - background-image linear-gradient on container → upprepas på varje sida
 *    naturligt eftersom det är en background på ETT långt element
 *  - break-inside: avoid på .cv-entry → håller ihop jobb/utbildning
 *  - body * { visibility: hidden } + .cv-print-root * { visibility: visible }
 *    → döljer ev. navbar/sidebar från App.tsx i print
 */

import { useEffect, useLayoutEffect, useRef } from 'react'
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
 * Sidobar-konfiguration per mall.
 *  - width: bredd i px eller % (måste matcha mallens egen aside-bredd)
 *  - bg: CSS-färg (solid — gradient inom sidebar är inte värt komplexiteten)
 *  - divider: optionell tunn linje mellan aside och main (för ljusa sidobar)
 *
 * null = single-column-mall, ingen sidebar-bg behövs.
 *
 * VIKTIGT: width måste matcha mallens egen aside exakt. Annars hamnar
 * text utanför färgfältet.
 */
type SidebarConfig = { width: string; bg: string; divider?: string } | null
const SIDEBAR_CONFIG: Record<string, SidebarConfig> = {
  sidebar:   { width: '240px', bg: '#141414' },                                  // ModernTemplate (mörk gradient → solid medel) — 30% av A4-bredd
  nordic:    { width: '240px', bg: '#F8FAFC', divider: '#E2E8F0' },              // NordicTemplate
  budapest:  { width: '34%',   bg: '#2C3E50' },                                  // BudapestTemplate
  manhattan: { width: '220px', bg: '#0F1B2D' },                                  // ManhattanTemplate
  rotterdam: { width: '220px', bg: '#FFFFFF', divider: '#E5E7EB' },              // RotterdamTemplate
  chicago:   { width: '200px', bg: '#FFFFFF', divider: '#E5E7EB' },              // ChicagoTemplate
  berlin:    { width: '60px',  bg: '#1A1A1A' },                                  // BerlinTemplate
  // Single-column — ingen sidebar-bg
  centered: null,
  minimal: null,
  executive: null,
  creative: null,
  atelier: null,
}

function buildBgImage(cfg: NonNullable<SidebarConfig>): string {
  // linear-gradient to right gör hårda stopp: 0%→sidebar-w är sidebar-bg,
  // sidebar-w→100% är vit. Inga mjuka övergångar (det blir hårda kanter).
  const w = cfg.width
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
  const hasSidebar = cfg !== null
  const bgImage = hasSidebar && cfg ? buildBgImage(cfg) : 'none'

  const rootRef = useRef<HTMLDivElement>(null)
  const fillerRef = useRef<HTMLDivElement>(null)

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

  // Avrunda cv-print-root:s höjd till nästa hela A4-sida så sidobar-bg
  // (background-image på elementet) täcker varje tryckt sida hela vägen ned
  // istället för att klippas mitt på sista sidan. A4 = 297mm = 1123.6px @ 96dpi.
  //
  // Detta är säkert i print eftersom Chrome:s print-engine paginerar
  // element-höjd / page-height — om vi sätter höjden till exakt N pages
  // får vi N tryckta sidor utan extra blank.
  useLayoutEffect(() => {
    const A4_PX = 297 * (96 / 25.4) // 1123.6
    const root = rootRef.current
    if (!root) return
    const sync = () => {
      if (!root) return
      const filler = fillerRef.current
      if (filler) filler.style.height = '0'
      void root.offsetHeight
      const natural = root.scrollHeight
      const pages = Math.max(1, Math.ceil(Math.max(0, natural - 4) / A4_PX))
      // Fyll cv-print-root till slutet av sidan FÖRE natural-page-end så
      // sidobar-bg paintar till botten av varje sida. Chrome:s print-
      // engine renderar ofta tomma sidor om elementet är nästan exakt N*A4
      // — så vi siktar på en sida UNDER (pages-1)*A4 + 285mm = N*A4 - 12mm,
      // som ger sidobar-bg på alla sidor utom de sista 12mm av sista sidan.
      const targetMm = pages * 297 - 30
      const naturalMm = natural / (96 / 25.4)
      if (filler) {
        const fillerMm = Math.max(0, targetMm - naturalMm)
        filler.style.height = `${fillerMm}mm`
      }
      root.setAttribute('data-pages', String(pages))
      root.setAttribute('data-natural', String(natural))
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sync()
        if (document.fonts) document.fonts.ready.then(sync).catch(() => {})
      })
    })
    const ro = new ResizeObserver(sync)
    // Observera mallens cv-preview så vi syncar om innehåll ändras
    const cvPrev = root.querySelector('.cv-preview')
    if (cvPrev) ro.observe(cvPrev)
    window.addEventListener('beforeprint', sync)
    return () => {
      ro.disconnect()
      window.removeEventListener('beforeprint', sync)
    }
  }, [data])

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
            height: auto !important;
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
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Override cv-preview:s min-height: 297mm i print — så att 1-sidors-
             CV:n vars content är nästan exakt A4 inte tippar över till 2 sidor
             pga cv-preview tvingas vara minst A4 (1122.5px) + Chrome:s print-
             safe-zone på ~30mm. Vi vill att cv-preview ska anpassa höjd till
             content. Sidobar-bg på cv-print-root täcker resterande utrymme. */
          .cv-print-root .cv-preview {
            min-height: 0 !important;
          }

          /* Mallens cv-preview ska INTE sätta egen bakgrund som täcker
             print-root:s gradient. Vi nollställer aside:s bg så gradient
             syns igenom. Main:s bg är redan vit i mallarna. */
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

          /* Vi använder INTE ::before för top-safe-zone. Mallarna har redan
             egna 40-56px (10-14mm) padding-top på header/main vilket räcker
             som safe-zone. Om vi adderar extra ::before skulle 1-sidors-CV
             (t.ex. Budapest) tippa över till 2 sidor med mestadels tomt
             innehåll på sida 2 — det är värre än att behålla 0 extra padding. */
        }

        /* Screen-vy: visa CV:t som en lång A4-remsa för förhandsgranskning. */
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
        ref={rootRef}
        className="cv-print-root"
        style={{
          backgroundImage: bgImage,
          backgroundColor: '#FFFFFF',
          backgroundRepeat: 'repeat-y',
          backgroundSize: '100% 297mm',
          backgroundPosition: '0 0',
        }}
      >
        {renderTemplate(data, fullName)}
        <div ref={fillerRef} aria-hidden="true" style={{ width: '100%', height: 0 }} />
      </div>
    </>
  )
}

export default CVPrintLayout
