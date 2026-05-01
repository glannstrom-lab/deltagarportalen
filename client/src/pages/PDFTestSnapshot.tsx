/**
 * Dev-route som direkt genererar PDF för en mall med Mikaels rika test-data
 * (5 jobb, 2 utb, lång summary) — det datasetet som triggar flersidiga
 * exporter och därmed sidbrytnings-problem.
 *
 * URL: /#/pdf-test/:templateId
 *
 * Klicka "Ladda ner" så genereras PDF via samma kodpath som CVBuilder.
 * Playwright triggar nedladdningen och sparar för verifiering.
 *
 * Templates: sidebar | centered | minimal | creative | executive | nordic |
 *            budapest | rotterdam | chicago
 */

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { CVData } from '@/services/supabaseApi'

const MIKAEL: CVData = {
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
    {
      id: '1', school: 'Örebro Universitet', degree: 'Magisterexamen', field: 'Psykologi',
      location: 'Örebro', startDate: '2006-08', endDate: '2011-06', description: '',
    },
    {
      id: '2', school: 'Tingvallaskolan', degree: 'Samhällsvetenskapligt program', field: '',
      location: 'Karlstad', startDate: '1994-08', endDate: '1996-06', description: '',
    },
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

const VALID = ['sidebar', 'centered', 'minimal', 'creative', 'executive', 'nordic', 'budapest', 'rotterdam', 'chicago'] as const

export default function PDFTestSnapshot() {
  const { templateId } = useParams<{ templateId: string }>()
  const tpl = (VALID as readonly string[]).includes(templateId || '') ? templateId! : 'sidebar'
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let createdUrl: string | null = null
    ;(async () => {
      try {
        const [{ pdf }, { CVPDFDocument }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('@/components/cv/CVPDF'),
        ])
        const blob = await pdf(<CVPDFDocument data={{ ...MIKAEL, template: tpl }} />).toBlob()
        if (cancelled) return
        createdUrl = URL.createObjectURL(blob)
        setDownloadUrl(createdUrl)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [tpl])

  if (error) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>Error: {error}</div>
  }

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', minHeight: '100vh', background: '#FFF' }}>
      <h1>PDF-test: {tpl}</h1>
      {downloadUrl ? (
        <a id="download-pdf" href={downloadUrl} download={`mikael-${tpl}.pdf`}>
          Ladda ner mikael-{tpl}.pdf
        </a>
      ) : (
        <p>Genererar PDF…</p>
      )}
    </div>
  )
}
