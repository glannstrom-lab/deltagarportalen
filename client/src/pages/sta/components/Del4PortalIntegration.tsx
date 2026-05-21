/**
 * Del4PortalIntegration — kopplar STA Del 4 till jobbsöknings-funktioner.
 *
 * Visar genvägar till jobbsökning (med fokusyrke som sökterm), spontanansökan,
 * personligt brev, LinkedIn-optimerare och intervjuträning.
 */

import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import {
  Briefcase,
  Mail,
  Sparkles,
  Mic,
  ChevronRight,
  FileUser,
  Linkedin,
} from '@/components/ui/icons'

interface Props {
  focusOccupation: string | null
}

export function Del4PortalIntegration({ focusOccupation }: Props) {
  const focusQuery = focusOccupation ? `?q=${encodeURIComponent(focusOccupation)}` : ''

  const tools: Array<{
    title: string
    description: string
    icon: React.ReactNode
    href: string
    primary?: boolean
  }> = [
    {
      title: focusOccupation ? `Sök jobb som ${focusOccupation}` : 'Sök jobb',
      description: focusOccupation
        ? 'Filtrerat på ditt fokusyrke'
        : 'Bläddra bland aktuella jobb',
      icon: <Briefcase size={18} />,
      href: `/jobsearch${focusQuery}`,
      primary: true,
    },
    {
      title: 'Spontanansökan',
      description: 'Hitta företag i din bransch och skicka spontant',
      icon: <Sparkles size={18} />,
      href: `/spontanansokan${focusQuery}`,
    },
    {
      title: 'Personligt brev',
      description: 'Generera brev anpassat efter jobbet',
      icon: <Mail size={18} />,
      href: '/personligt-brev',
    },
    {
      title: 'LinkedIn-optimerare',
      description: 'Få din LinkedIn-profil hittad av rekryterare',
      icon: <Linkedin size={18} />,
      href: '/linkedin-optimizer',
    },
    {
      title: 'Intervjuträning',
      description: 'Öva med tal-till-text inför arbetsintervjun',
      icon: <Mic size={18} />,
      href: '/interview-simulator',
    },
    {
      title: 'CV',
      description: 'Uppdatera ditt CV inför ansökan',
      icon: <FileUser size={18} />,
      href: '/cv',
    },
  ]

  return (
    <Card variant="flat" padding="lg">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-stone-900">Verktyg för jobbsökning</h3>
        <p className="text-xs text-stone-500">
          {focusOccupation
            ? `Genvägar anpassade efter ditt fokusyrke: ${focusOccupation}`
            : 'Allt du behöver för att söka jobb — välj fokusyrke i inställningar för bättre matchning'}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {tools.map((t) => (
          <Link
            key={t.title}
            to={t.href}
            className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm transition-all"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
            >
              {t.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-stone-900 text-sm">{t.title}</div>
              <div className="text-xs text-stone-500 mt-0.5">{t.description}</div>
            </div>
            <ChevronRight size={14} className="text-stone-400 mt-1 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </Card>
  )
}
