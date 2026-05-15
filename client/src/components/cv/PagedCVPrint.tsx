/**
 * Page-by-page CV print rendering — full edge-to-edge sidobar på ALLA
 * sidor + 12mm content topp-luft på alla sidor utan @page margin.
 *
 * Roten till problemet med vanlig flex-rendering över page-breaks:
 *  - @page margin: 0 → edge-to-edge bg men content mot kanten på sida 2+
 *  - @page margin: 12mm → content-luft men vit topp ovanför sidobar
 *  - JS-mätt aside.minHeight → löser bara vita band mitt-i-sidan, inte
 *    @page-margin-bandet
 *
 * Lösning som Resume.io/Kickresume använder och som vi implementerar här:
 *  - Splitta CV-data i N "page-data-subset"
 *  - Rendera varje subset i en separat 210×297mm container
 *  - @page margin: 0 (container ger sin egen safe-zone via template-padding)
 *  - page-break-after: always mellan containers
 *
 * Resultat per sida:
 *  - Sidobar går EDGE-TO-EDGE från topp till botten
 *  - Main har 12mm topp-luft via template-internal padding (existing)
 *  - Inga vita band någonstans
 *
 * Splittingstrategi:
 *  - Sida 1 har full aside-data (kontakt, kompetenser, språk) + första
 *    chunk av main-content
 *  - Sida 2+ har TOM aside-content (bara bg + initialer från template-
 *    design) + remaining main-content
 *  - Antal items per sida bestäms av measurement (useLayoutEffect)
 */

import { useEffect, useState } from 'react'
import type { CVData } from '@/services/supabaseApi'
import {
  MinimalTemplate, ExecutiveTemplate, ModernTemplate, CreativeTemplate,
  NordicTemplate, CenteredTemplate, BudapestTemplate, RotterdamTemplate,
  ChicagoTemplate, AtelierTemplate, ManhattanTemplate, BerlinTemplate,
} from './templates'

interface PagedCVPrintProps {
  data: CVData
}

// A4 height i px @ 96dpi minus internal padding. Templates har typiskt
// 40-56px padding-top och 48-56px padding-bottom = ~100px total. För
// safe measurement, vi använder 1080px (~286mm) som "main content capacity"
// per sida — lite mindre än 297mm för att lämna utrymme för template-padding.
const PAGE_CONTENT_PX = 1080

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

// Producerar tom version av aside-content. Används på sida 2+ så aside
// visar bara design (bg + initialer + ev. accent-element) utan att
// repetera kontakt/kompetenser/språk.
function withEmptyAside(data: CVData): CVData {
  return {
    ...data,
    summary: '',
    skills: [],
    languages: [],
    certificates: [],
    links: [],
    profileImage: null,
  }
}

/**
 * Mäter content per sida och returnerar en array av CVData där varje
 * element representerar en sida med subset av main-content. Sida 1 har
 * full aside-data, sida 2+ har tomt aside.
 *
 * Strategi:
 *  1. Rendera full CV i en hidden div
 *  2. Mät offsetTop för varje cv-entry i main
 *  3. Beräkna page-boundaries baserat på available height per sida
 *  4. Mappa cv-entries till respektive page baserat på offset
 *  5. Splitta workExperience + education arrayer baserat på mappningen
 *
 * Detta ger optimal pagination utan hardcoded item-thresholds.
 */
function usePaginatedCV(data: CVData): CVData[] {
  const [pages, setPages] = useState<CVData[]>([data])

  useEffect(() => {
    const measure = () => {
      const fullCv = document.querySelector<HTMLElement>('[data-cv-measure="true"]')
      if (!fullCv) {
        setPages([data])
        return
      }
      // cv-preview > main — main är inom cv-preview, inte direkt child av measure-wrapper
      const main = fullCv.querySelector<HTMLElement>('.cv-preview > main')
      if (!main) {
        setPages([data])
        return
      }

      // Hämta alla cv-entries + sektion-rubriker som potentiella break-points
      const entries = Array.from(main.querySelectorAll<HTMLElement>('.cv-entry, .cv-keep, section, h2'))
      if (entries.length === 0) {
        setPages([data])
        return
      }

      // Mät offset från main-topp för varje entry
      const mainRect = main.getBoundingClientRect()

      // Total main height i px
      const totalHeight = main.scrollHeight
      if (totalHeight <= PAGE_CONTENT_PX) {
        setPages([data])
        return
      }

      // Mappa workExperience + education till individuella .cv-entry DOM-element
      // genom att läsa data-index eller liknande attribut. Eftersom templates
      // inte sätter explicit data-idx, vi bygger en heuristic: räkna antalet
      // jobs+edus + identifiera vilka som hamnar på vilken sida baserat på
      // offset.
      //
      // Förenklad heuristic: räkna cv-entry på main, mappa till data items
      // i ordning (jobs först, sedan edus — beroende på template-layout).
      // Eftersom templates renderar Erfarenhet sektion FÖRE Utbildning,
      // de första `workExperience.length` cv-entry är jobs, resten är edus.

      const jobCount = data.workExperience?.length || 0
      const allItemEntries = entries.filter(el => el.classList.contains('cv-entry'))

      // Splitta items i pages baserat på offset
      const pageBreaks: number[] = [0]  // First page starts at 0
      let currentPageStart = 0
      for (const entry of allItemEntries) {
        const rect = entry.getBoundingClientRect()
        const top = rect.top - mainRect.top
        const bottom = rect.bottom - mainRect.top
        // Om denna entry skulle korsa page-boundary, börja ny sida vid dess top
        if (bottom - currentPageStart > PAGE_CONTENT_PX) {
          pageBreaks.push(top)
          currentPageStart = top
        }
      }

      // För each page, bestäm vilka jobs och edus som hör hit
      // Vi måste mappa cv-entry → data item. Antag ordning: jobs[0..N-1] sedan edus[0..M-1]
      const itemIndexByEntry = allItemEntries.map((_, i) => {
        if (i < jobCount) return { kind: 'job' as const, idx: i }
        return { kind: 'edu' as const, idx: i - jobCount }
      })

      // För varje page-break, hitta sista item som passar på sidan
      const pageData: CVData[] = []
      let cursor = 0
      for (let p = 0; p < pageBreaks.length; p++) {
        const pageEnd = p < pageBreaks.length - 1 ? pageBreaks[p + 1] : Infinity

        const pageJobs: number[] = []
        const pageEdus: number[] = []
        while (cursor < allItemEntries.length) {
          const entry = allItemEntries[cursor]
          const rect = entry.getBoundingClientRect()
          const top = rect.top - mainRect.top
          if (top >= pageEnd) break
          const item = itemIndexByEntry[cursor]
          if (item.kind === 'job') pageJobs.push(item.idx)
          else pageEdus.push(item.idx)
          cursor++
        }

        // Bygg page-data — filtrera bort undefined (skydd mot misalignment
        // mellan DOM-entries och data-arrayer för olika template-layouter).
        const isFirstPage = p === 0
        const base = isFirstPage ? data : withEmptyAside(data)
        pageData.push({
          ...base,
          workExperience: pageJobs.map(i => data.workExperience![i]).filter(Boolean),
          education: pageEdus.map(i => data.education![i]).filter(Boolean),
        })
      }

      setPages(pageData.length > 0 ? pageData : [data])
    }

    // Vänta tills hidden measurer är renderad. setTimeout 100ms +
    // requestAnimationFrame ger React tid att rendera + layout att stabilisera.
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(measure)
      })
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [data])

  return pages
}

export function PagedCVPrint({ data: rawData }: PagedCVPrintProps) {
  const data = sanitize(rawData)
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'CV'
  const pages = usePaginatedCV(data)

  return (
    <>
      <style>{`
        /* Page-by-page rendering: @page margin: 0 ger fullt edge-to-edge
           bakgrund på varje sida. Content-säkerhet hanteras av template-
           internal padding-top (40-56px = ~10-15mm) som är inom container. */
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
          }
          /* Hide allt utom våra .cv-print-page (göm cookie-banner, navbar etc.) */
          body * {
            visibility: hidden;
          }
          .cv-print-page,
          .cv-print-page * {
            visibility: visible;
          }
          .cv-print-page {
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            overflow: hidden !important;
            position: relative !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .cv-print-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          /* Inom page-container fyller cv-preview hela 297mm via flex-stretch.
             Aside spans full height = edge-to-edge sidobar bakgrund. */
          .cv-print-page .cv-preview {
            min-height: 100% !important;
            height: 100% !important;
            box-shadow: none !important;
          }
          /* Dölj header (namn + contact) på sida 2+ — den ska bara visas
             på sida 1 som "cover", inte upprepas. Brett selector eftersom
             vissa templates har header som child av main, andra direkt
             under cv-preview. */
          .cv-print-page[data-page-index]:not([data-page-index="0"]) .cv-preview header {
            display: none !important;
          }
          .cv-print-measure-only {
            display: none !important;
          }
        }
        @media screen {
          .cv-print-page {
            width: 210mm;
            height: 297mm;
            margin: 16px auto;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
            overflow: hidden;
            position: relative;
            background: white;
          }
          .cv-print-measure-only {
            position: absolute;
            left: -99999px;
            top: 0;
            width: 210mm;
            visibility: hidden;
            pointer-events: none;
          }
        }
      `}</style>

      {/* Hidden measurement-renderering: full CV i en kontainer som vi
          mäter offset av varje cv-entry från. Detta används av usePaginatedCV
          för att bestämma optimal page-splitting. */}
      <div className="cv-print-measure-only" data-cv-measure="true">
        {renderTemplate(data, fullName)}
      </div>

      {/* Synliga pages */}
      {pages.map((pageData, idx) => (
        <div key={idx} className="cv-print-page" data-page-index={idx}>
          {renderTemplate(pageData, fullName)}
        </div>
      ))}
    </>
  )
}

export default PagedCVPrint
