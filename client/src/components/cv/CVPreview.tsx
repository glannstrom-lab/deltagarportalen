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
        @page {
          size: A4;
          margin: 0;
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
          /* Sidebar-mallar (Modern, Nordic, Budapest): gör <aside> position
             fixed så Chrome upprepar den på varje sida. Main får margin-left
             lika med sidebar-bredden så det inte överlappar. Bredder är
             template-specifika. */
          /* Generisk regel för alla sidobar-mallar (cv-preview > aside).
             Bredden styrs av CSS-variabeln --sidebar-width som sätts på
             data-template-wrapper-noden, vilket gör att template-koden är
             single source of truth för sin sidobars-bredd. */
          [data-template-wrapper] .cv-preview > aside {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            height: 297mm !important;
            width: var(--sidebar-width, 280px) !important;
          }
          [data-template-wrapper] .cv-preview > main {
            margin-left: var(--sidebar-width, 280px) !important;
          }
          /* h1 (CV-namn) hålls ihop med rubrik direkt under — gäller bara
             första rubriken någonsin, så ingen sidbrott-risk. */
          .cv-preview h1 {
            page-break-after: avoid;
            break-after: avoid-page;
          }
          /* KRITISKT: display: flex blockerar break-inside: avoid i Chrome
             headless print (puppeteer issue #6366). Force block på cv-entry
             och cv-keep så break-inside faktiskt respekteras. Eventuell
             flex-layout för "title left, date right" måste leva i en INNER
             div. */
          .cv-preview .cv-entry,
          .cv-preview .cv-keep {
            display: block !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
          }
          /* Notera: vi BINDER INTE sektion-rubrik (h2/h3) till första entry.
             Det skapade ett värre problem än det löste — om rubrik + entry
             tillsammans inte fick plats på sidans rest, page-breakade HELA
             paret till nästa sida och lämnade stor whitespace.
             Resultatet: rubrik kan hamna ensam i botten ("orphan header").
             Det är bättre än whitespace eftersom det signalerar "fortsättning
             följer" snarare än "CV är trasigt". Användarna förväntar sig
             multi-page-CV att flöda — de förväntar sig inte hål. */

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
