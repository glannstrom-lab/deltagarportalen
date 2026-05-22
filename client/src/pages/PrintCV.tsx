/**
 * Print-route — renderar CVPreview med användarens (eller test-user's) CV-data
 * och triggar window.print() automatiskt så browsern öppnar print-dialogen
 * → "Spara som PDF". Detta är hur seriösa CV-byggare som Resume.io och
 * Kickresume internt genererar PDF: HTML-render i Chrome headless +
 * page.pdf() via Puppeteer (server-side) eller window.print() (client-side).
 *
 * Fyra lägen:
 *   /#/print/cv               — laddar inloggad användares CV
 *   /#/print/cv?template=ID   — bygger på inloggad data men byter mall
 *   /#/print/cv?demo=mikael   — använder Mikael-test-fixture (för iterativ
 *                                utveckling utan login)
 *   /#/print/cv?data=<base64> — CV-data injicerad via query (används av
 *                                api/cv-pdf.js Puppeteer-flödet)
 *
 * Auto-print kan stängas av med ?manual=1 så Playwright (som använder
 * page.pdf() direkt) inte triggar print-dialog som blockar.
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CVPrintLayout } from '@/components/cv/CVPrintLayout'
import { cvApi } from '@/services/cvApi'
import type { CVData } from '@/services/supabaseApi'

const MIKAEL_DEMO: CVData = {
  firstName: 'Mikael',
  lastName: 'Glännström',
  title: 'Arbetskonsulent',
  email: 'glannstrom@gmail.com',
  phone: '0738290860',
  location: 'Lindesberg',
  summary:
    'Arbetskonsulent med gedigen erfarenhet av arbetsmarknadsintegration och stödinsatser. Jag har lett och genomfört föreläsningar, individuella samtal samt etablerat samarbeten med arbetsgivare i projektet Steg till arbete, och tidigare coachat deltagare i flera Arcus program som Stöd och matchning och Rusta och matcha. Min bakgrund som boendepedagog på ett HVB hem för ensamkommande och som magister i psykologi ger mig stark kompetens inom KBT, Motivational Interviewing och sociala medier, vilket stärker mina insatser för målgruppsanpassat stöd. Jag söker nu en ledande roll där jag kan utveckla och implementera effektiva arbetsintegrationsprogram på nationell nivå.',
  skills: [
    { id: '1', name: 'B-körkort', level: 5, category: 'technical' },
    { id: '2', name: 'MI', level: 5, category: 'technical' },
    { id: '3', name: 'KBT', level: 5, category: 'technical' },
    { id: '4', name: 'Sociala medier', level: 4, category: 'soft' },
  ],
  workExperience: [
    {
      id: '1', company: 'Arbetslivsresurs', title: 'Arbetskonsulent', location: 'Lindesberg',
      startDate: '2025-12', endDate: '', current: true,
      description: 'Jobbar som arbetskonsulent i projektet Steg till arbete. Arbetsuppgifter inkluderar föreläsningar, individuella samtal och kontakt med arbetsgivare.',
    },
    {
      id: '2', company: 'Arcus', title: 'Jobbcoach', location: 'Lindesberg',
      startDate: '2020-12', endDate: '2025-11', current: false,
      description: 'Jobbade som jobbcoach i olika projekt som Stöd och matchning, Rusta och matcha, Introduktion till arbete och Steg till arbete.',
    },
    {
      id: '3', company: 'Lindesbergs Kommun', title: 'Boendepedagog', location: 'Lindesberg',
      startDate: '2017-06', endDate: '2020-08', current: false,
      description: 'Boendepedagog på ett HVB-hem för ensamkommande. Boendestöd inom LSS. Jobbade både med ensamkommande ungdomar samt vuxna med psykologiska utmaningar.',
    },
    {
      id: '4', company: 'Custice', title: 'Marknadsansvarig', location: 'Örebro',
      startDate: '2014-01', endDate: '2017-05', current: false,
      description: 'Byggde och skötte hemsidan. Anordnade kampanjer och marknadsföringsmaterial. Hade hand om sociala medier och utvecklade strategier kring marknadsföring.',
    },
  ],
  education: [
    { id: '1', school: 'Örebro Universitet', degree: 'Magisterexamen', field: 'Psykologi', location: 'Örebro', startDate: '2006-08', endDate: '2011-06', description: '' },
    { id: '2', school: 'Tingvallaskolan', degree: 'Samhällsvetenskapligt program', field: '', location: 'Karlstad', startDate: '1994-08', endDate: '1996-06', description: '' },
  ],
  languages: [
    { id: '1', language: 'Svenska', level: 'native' },
    { id: '2', language: 'Engelska', level: 'fluent' },
  ],
  certificates: [],
  links: [],
  template: 'sidebar',
  colorScheme: 'indigo',
  font: 'inter',
  profileImage: null,
}

export default function PrintCV() {
  const [params] = useSearchParams()
  const [cv, setCv] = useState<CVData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const demo = params.get('demo')
  const templateOverride = params.get('template')
  const manual = params.get('manual') === '1'
  // ?data=<base64-encoded-JSON>: server-side Puppeteer (api/cv-pdf.js)
  // injicerar CV-data direkt så vi slipper auth + Supabase-fetch i headless
  // Chrome. Bearer-verifiering sker innan i Vercel-funktionen.
  const dataParam = params.get('data')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let data: CVData
        if (dataParam) {
          try {
            // atob = base64 decode. Decoder stödjer URL-safe variant via
            // padding-fix om så behövs. CV-JSON är typiskt 5-50 kB —
            // ryms gott i URL-query.
            const json = decodeURIComponent(escape(atob(dataParam.replace(/-/g, '+').replace(/_/g, '/'))))
            data = JSON.parse(json) as CVData
          } catch (decodeErr) {
            throw new Error('Kunde inte avkoda CV-data: ' + (decodeErr instanceof Error ? decodeErr.message : String(decodeErr)))
          }
        } else if (demo === 'mikael') {
          data = MIKAEL_DEMO
        } else {
          const fromApi = await cvApi.getCV()
          if (!fromApi) throw new Error('Inget CV hittades')
          data = fromApi
        }
        if (templateOverride) data = { ...data, template: templateOverride }
        if (!cancelled) setCv(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => { cancelled = true }
  }, [demo, templateOverride, dataParam])

  // Demo-overrides för testing av många-jobb-CV (?demo=mikael&jobs=12).
  // Används av e2e/cv-pdf-3pages.cjs för att verifiera 3-sidors-pagination
  // utan att modifiera produktionsdata. Re-run när cv eller params ändras.
  // Idempotent via id-check: applicerar bara om antal workExperience inte
  // redan matchar requested count.
  useEffect(() => {
    if (!cv || demo !== 'mikael') return
    const jobsParam = params.get('jobs')
    if (!jobsParam) return
    const n = parseInt(jobsParam, 10)
    if (Number.isNaN(n) || n < 1 || n > 20) return
    if (cv.workExperience?.length === n) return  // redan applicerad
    const base = cv.workExperience?.[0]
    if (!base) return
    const expanded = Array.from({ length: n }, (_, i) => ({
      ...base,
      id: `demo-${i + 1}`,
      title: `${base.title} #${i + 1}`,
    }))
    setCv((prev) => prev ? { ...prev, workExperience: expanded } : prev)
  }, [cv, demo, params])

  // Trigga print när content är renderat (om inte manual-flag)
  useEffect(() => {
    if (!cv || manual) return
    const timer = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timer)
  }, [cv, manual])

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#991B1B' }}>
        Kunde inte ladda CV: {error}
      </div>
    )
  }

  if (!cv) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#666' }}>
        Laddar CV…
      </div>
    )
  }

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      {/* CVPrintLayout renderar CV som EN sammanhängande sida. Chrome:s
          print-engine paginerar naturligt via break-inside-hints. Sidobar-
          mallar får sin bakgrund via position:fixed som upprepas på alla
          sidor — mycket robustare än JS-pre-paginering. */}
      <CVPrintLayout data={cv} />
    </div>
  )
}
