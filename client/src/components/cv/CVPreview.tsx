/**
 * CV Preview Component - Premium Design System
 *
 * Each template has a distinct visual personality:
 * - Minimal: Swiss precision, Helvetica-style, extreme whitespace
 * - Executive: Classic elegance, serif typography, gold accents
 * - Creative: Bold asymmetry, color blocking, design-forward
 * - Nordic: Light, airy, Scandinavian minimalism
 * - Modern: Dark, tech-forward, Vercel/Linear inspired
 * - Centered: Elegant gradient, balanced, professional
 */

import { useLayoutEffect } from 'react'
import { Sparkles } from '@/components/ui/icons'
import type { CVData } from '@/services/supabaseApi'
import {
  MinimalTemplate,
  ExecutiveTemplate,
  ModernTemplate,
  CreativeTemplate,
  NordicTemplate,
  CenteredTemplate,
  BudapestTemplate,
  RotterdamTemplate,
  ChicagoTemplate,
  AtelierTemplate,
  ManhattanTemplate,
  BerlinTemplate,
} from './templates'

interface CVPreviewProps {
  data: CVData
}

// Sidobars-bredd per template. Bredden måste matcha template-koden så att
// preview och print ser likadana ut. Mallar utan sidobar listas inte.
const SIDEBAR_WIDTHS: Record<string, string> = {
  sidebar: '320px',
  nordic: '280px',
  budapest: '34%',
  manhattan: '220px',
  rotterdam: '220px',
  chicago: '200px',
  berlin: '60px',
}

// Filtrera bort halvtomma entries så preview matchar PDF — annars syns
// "• -" eller bara datum för en oifylld erfarenhet.
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

export function CVPreview({ data: rawData }: CVPreviewProps) {
  const data = sanitize(rawData)
  const fullName = `${data.firstName} ${data.lastName}`.trim() || 'Ditt Namn'

  // Tvinga aside att matcha main:s scrollHeight så sidobar-bakgrunden
  // spans EXAKT alla sidor som main:s content flödar över. Detta löser
  // "vita band mitt på sida 2" där flex-layout annars stoppar aside-bg
  // efter sista aside-child slutar. CSS-only kan inte göra detta —
  // Chrome:s flex-print-engine respekterar inte min-height: 100% på
  // flex-children över page-breaks. JS-mätning är robusta.
  useLayoutEffect(() => {
    // A4-sida-höjd i pixlar @ 96dpi. Vi använder safeZone = 297mm - 12mm
    // top - 10mm bottom = 275mm content area per sida.
    const PAGE_SAFE_PX = (297 - 22) * (96 / 25.4) // ≈ 1040.5 px
    const sync = () => {
      const previews = document.querySelectorAll<HTMLElement>('.cv-preview')
      previews.forEach(preview => {
        const aside = preview.querySelector<HTMLElement>(':scope > aside')
        const main = preview.querySelector<HTMLElement>(':scope > main')
        if (!main) return
        // Räkna antal sidor som main:s content behöver, avrunda uppåt
        const pages = Math.max(1, Math.ceil(main.scrollHeight / PAGE_SAFE_PX))
        const fullHeight = pages * PAGE_SAFE_PX
        preview.style.minHeight = `${fullHeight}px`
        // Aside stretchar till samma höjd så sidobar-bg täcker alla sidor
        if (aside) aside.style.minHeight = `${fullHeight}px`
      })
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sync()
        if (document.fonts) document.fonts.ready.then(sync)
      })
    })
    const ro = new ResizeObserver(sync)
    document.querySelectorAll('.cv-preview > main').forEach(m => ro.observe(m))
    window.addEventListener('beforeprint', sync)
    return () => {
      ro.disconnect()
      window.removeEventListener('beforeprint', sync)
    }
  }, [data])

  // Check for content
  const hasContent = !!(
    data.firstName ||
    data.lastName ||
    data.email ||
    data.phone ||
    data.summary ||
    (data.workExperience && data.workExperience.length > 0) ||
    (data.education && data.education.length > 0) ||
    (data.skills && data.skills.length > 0)
  )

  // Empty state
  if (!hasContent) {
    return (
      <div
        className="cv-preview"
        style={{
          minHeight: '500px',
          background: 'linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px',
          textAlign: 'center',
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            background: '#E5E5E5',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <Sparkles style={{ width: '40px', height: '40px', color: '#A3A3A3' }} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#525252', marginBottom: '8px' }}>
          Förhandsvisning
        </h3>
        <p style={{ fontSize: '15px', color: '#A3A3A3', maxWidth: '280px' }}>
          Börja fylla i dina uppgifter för att se hur ditt CV kommer att se ut
        </p>
      </div>
    )
  }

  // Route to correct template
  let template: React.ReactElement
  switch (data.template) {
    case 'minimal':
      template = <MinimalTemplate data={data} fullName={fullName} />
      break
    case 'executive':
      template = <ExecutiveTemplate data={data} fullName={fullName} />
      break
    case 'creative':
      template = <CreativeTemplate data={data} fullName={fullName} />
      break
    case 'nordic':
      template = <NordicTemplate data={data} fullName={fullName} />
      break
    case 'centered':
      template = <CenteredTemplate data={data} fullName={fullName} />
      break
    case 'budapest':
      template = <BudapestTemplate data={data} fullName={fullName} />
      break
    case 'rotterdam':
      template = <RotterdamTemplate data={data} fullName={fullName} />
      break
    case 'chicago':
      template = <ChicagoTemplate data={data} fullName={fullName} />
      break
    case 'atelier':
      template = <AtelierTemplate data={data} fullName={fullName} />
      break
    case 'manhattan':
      template = <ManhattanTemplate data={data} fullName={fullName} />
      break
    case 'berlin':
      template = <BerlinTemplate data={data} fullName={fullName} />
      break
    case 'sidebar':
    default:
      template = <ModernTemplate data={data} fullName={fullName} />
  }

  return (
    <>
      {/* Print-CSS: gör det möjligt att printa CV via window.print() med
          korrekt sidbrytning. Samma rules som de stora aktörerna (resume.io,
          kickresume) använder för Chrome headless print → PDF. */}
      <style>{`
        /* @page margin: 12mm topp + 10mm botten ger content-säkerhet på
           ALLA sidor (text aldrig mot kanten). aside-höjd sätts via JS-
           mätning (useLayoutEffect) så sidobar-bg spans alla sidor utan
           vita band mitt på sidan. */
        @page {
          size: A4;
          margin: 12mm 0 10mm 0;
        }
        @media print {
          html, body {
            background: #FFFFFF !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden;
          }
          .cv-preview, .cv-preview * {
            visibility: visible;
          }
          /* Page-background-fill: två position:fixed-element som ritar
             sidobar-färg + main-färg edge-to-edge. Position:fixed repeteras
             på VARJE paginerad sida i Chrome — det är hur Resume.io och
             Kickresume får sidobaren att gå edge-to-edge på sida 2+. CSS-
             variabler (--cv-bg-sidebar, --cv-bg-main, --cv-bg-sidebar-w)
             sätts via useEffect i CVPreview baserat på template. */
          /* aside:s minHeight sätts via JS (useLayoutEffect i CVPreview) så
             den spans alla paginerade sidor utan vita band på sida 2+.
             Detta är det enda som faktiskt fungerar — CSS-only kan inte
             tvinga flex-children att stretcha över page-breaks i Chrome. */
          .cv-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            min-height: auto !important;
            box-shadow: none !important;
            border: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Sidobar-mallar (Modern, Nordic, Budapest, Atelier, Manhattan,
             Chicago, Rotterdam): tidigare användes position:fixed på <aside>
             för att "repetera" sidobaren på varje sida. Men Chrome:s
             print-engine har en känd bug — fixerade element renderar
             korrekt på varje sida MEN deras overflowing children flödar
             ÄVEN i normal flow på efterföljande sidor, vilket skapar
             ghost-rendering (t.ex. "Tyska" hamnade utanför mörka sidobaren
             överst på sida 2).

             Ny strategi: låt cv-preview vara en helt vanlig flex-container
             med två kolumner som flödar genom alla sidor som ett vanligt
             tvåkolumns-dokument. Aside stretchar (default flex-align)
             till parent-höjd, vilket gör att den mörka bakgrunden täcker
             hela cv-preview på alla sidor. Main flödar parallellt på
             höger sida. Detta är samma teknik som akademiska papers och
             de flesta tryck-CV:n.

             Vi tvingar break-inside: auto på cv-preview och dess children
             så Chrome tillåter naturliga sidbrytningar mitt i kolumnerna. */
          /* Reglerna nedan gäller ENDAST mallar som har en <aside>
             (sidobar-mallar). Single-kolumn-mallar (Centered, Executive,
             Creative, Minimal) behåller sin egen layout — de behöver inte
             flex eftersom de bara har en kolumn. */
          [data-template-wrapper] .cv-preview:has(> aside) {
            display: flex !important;
            min-height: auto !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          [data-template-wrapper] .cv-preview:has(> aside) > aside {
            width: var(--sidebar-width, 280px) !important;
            flex-shrink: 0 !important;
            box-sizing: border-box !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          [data-template-wrapper] .cv-preview:has(> aside) > main {
            flex: 1 !important;
            box-sizing: border-box !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          /* Rubriker (h1, h2, h3) får inte vara sista raden på en sida
             — annars hamnar rubriken ensam i botten och innehållet på
             nästa sida. Vi använder ENDAST break-after på rubriken (Word:s
             "Keep with next"). Vi använder INTE break-before på följande
             element — det skulle pusha hela sektioner till nästa sida när
             rubriken+första entry inte ryms, vilket skapar massiv whitespace
             på föregående sida (t.ex. SPRÅK-sektionen hamnar ensam på sida 3).
             Lösningen: rubriken får följa med till nästa sida när den inte
             ryms ihop med sin första content-rad, men sektioner kan annars
             börja vart som helst. */
          .cv-preview h1,
          .cv-preview h2,
          .cv-preview h3 {
            page-break-after: avoid;
            break-after: avoid-page;
          }

          /* cv-entry: enskilda jobb/utbildningsposter måste hållas ihop
             (break-inside: avoid). display: block tvingas eftersom flex
             annars blockerar break-inside i Chrome headless (puppeteer
             #6366). */
          .cv-preview .cv-entry,
          .cv-preview .cv-keep {
            display: block !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
          }

          /* Prevent orphan/widow lines i textstycken — minst 3 rader
             tillsammans i bottom/top av en sida, så sista raden av en
             paragraph aldrig hamnar ensam. */
          .cv-preview p, .cv-preview li {
            orphans: 3;
            widows: 3;
          }
        }
      `}</style>
      {/* data-template på en wrapper så CSS kan target template-specifika
          regler (t.ex. sidebar-bredd för print). --sidebar-width sätts per
          template här så template-koden själv inte behöver synka mot
          print-CSS. För mallar utan sidobar har det ingen effekt. */}
      <div
        data-template-wrapper={data.template || 'sidebar'}
        style={{
          display: 'contents',
          ['--sidebar-width' as string]: SIDEBAR_WIDTHS[data.template || 'sidebar'] || '280px',
        } as React.CSSProperties}
      >
        {template}
      </div>
    </>
  )
}

export default CVPreview
