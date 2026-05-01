/**
 * Print-route — renderar CVPreview med användarens (eller test-user's) CV-data
 * och triggar window.print() automatiskt så browsern öppnar print-dialogen
 * → "Spara som PDF". Detta är hur seriösa CV-byggare som Resume.io och
 * Kickresume internt genererar PDF: HTML-render i Chrome headless +
 * page.pdf() via Puppeteer (server-side) eller window.print() (client-side).
 *
 * Två lägen:
 *   /#/print/cv               — laddar inloggad användares CV
 *   /#/print/cv?template=ID   — bygger på inloggad data men byter mall
 *   /#/print/cv?demo=mikael   — använder Mikael-test-fixture (för iterativ
 *                                utveckling utan login)
 *
 * Auto-print kan stängas av med ?manual=1 så Playwright (som använder
 * page.pdf() direkt) inte triggar print-dialog som blockar.
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CVPreview } from '@/components/cv/CVPreview'
import { cvApi } from '@/services/supabaseApi'
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

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let data: CVData
        if (demo === 'mikael') {
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
  }, [demo, templateOverride])

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
      {/* Skärmläge: visa CV centrerat med stand-in styling. Print-läge:
          @media print i CVPreview tar över och dölja allt utom .cv-preview. */}
      <div style={{ maxWidth: '794px', margin: '0 auto', boxShadow: '0 0 12px rgba(0,0,0,0.08)' }}>
        <CVPreview data={cv} />
      </div>
    </div>
  )
}
