/**
 * usePageTitle — sidtitlar per rutt (UX34, 2026-08-05)
 *
 * Bakgrund: `document.title` sattes ingenstans i koden. Alla ~45 sidor delade
 * den statiska titeln i `index.html`, vilket bryter WCAG 2.4.2 (Page Titled)
 * och gör SPA-navigering tyst för skärmläsaranvändare — inget säger att sidan
 * bytts. Titeln är dessutom det första en skärmläsare läser upp när fokus
 * ligger kvar i chromet efter ett ruttbyte.
 *
 * Mönster: `<sidnamn> — Jobin`. Namnet hämtas i första hand från de i18n-nycklar
 * navigationen redan använder (`nav.*`), så titeln följer språkvalet; svensk
 * text ligger som `defaultValue` och gäller om nyckeln skulle saknas.
 *
 * Matchningen är longest-prefix, inte URL-prefix-gissning: en regel träffar när
 * pathnamnet är exakt lika eller ligger under regelns path (`/cv/builder` →
 * `/cv`). Reglerna sorteras efter längd vid modulladdning så `/oversikt/historik`
 * vinner över `/oversikt` och `/profile/shared/:code` över `/profile`.
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export const BRAND = 'Jobin'

/** Titeln i index.html — används för landningen och som sista utväg. */
export const DEFAULT_TITLE = 'Jobin — verktyg och stöd för dig som söker jobb'

export interface PageTitleRule {
  /** Path som regeln äger. Matchar exakt eller som förälder till en underrutt. */
  path: string
  /** i18n-nyckel som redan finns i locale-filerna (annars används `sv`). */
  key?: string
  /** Svensk text — defaultValue för nyckeln, eller titeln rakt av. */
  sv: string
  /** Bara exakt match (används för roten). */
  exact?: boolean
}

/**
 * En rad per rutt i `App.tsx`. Håll listan i takt med routertabellen —
 * en rutt som saknas här får varumärkestiteln, alltså exakt den bugg UX34
 * handlar om.
 */
export const PAGE_TITLE_RULES: PageTitleRule[] = [
  // Roten: inloggad omdirigeras direkt till /oversikt, utloggad ser landningen.
  { path: '/', sv: DEFAULT_TITLE, exact: true },

  // Publika sidor
  { path: '/login', sv: 'Logga in' },
  { path: '/register', sv: 'Skapa konto' },
  { path: '/invite', sv: 'Inbjudan' },
  { path: '/privacy', sv: 'Integritetspolicy' },
  { path: '/terms', sv: 'Användarvillkor' },
  { path: '/ai-policy', sv: 'AI-policy' },
  { path: '/tillganglighet', sv: 'Tillgänglighet' },
  { path: '/accessibility', sv: 'Tillgänglighet' },
  { path: '/template-snapshot', sv: 'CV-mall' },
  { path: '/print/cv', sv: 'Utskrift av CV' },
  { path: '/profile/shared', sv: 'Delad profil' },

  // Hubbar
  { path: '/oversikt/historik', sv: 'Din historik' },
  { path: '/oversikt', key: 'nav.hubs.oversikt', sv: 'Översikt' },
  { path: '/jobb', key: 'nav.hubs.jobb', sv: 'Söka jobb' },
  { path: '/karriar', key: 'nav.hubs.karriar', sv: 'Karriär' },
  { path: '/resurser', key: 'nav.hubs.resurser', sv: 'Resurser' },
  { path: '/min-vardag', key: 'nav.hubs.min-vardag', sv: 'Min vardag' },

  // Söka jobb
  { path: '/job-search', key: 'nav.jobSearch', sv: 'Sök jobb' },
  { path: '/applications', key: 'nav.applications', sv: 'Dina jobbansökningar' },
  { path: '/spontanansökan', key: 'nav.spontaneous', sv: 'Spontanansökan' },
  { path: '/cv', key: 'nav.cv', sv: 'CV' },
  { path: '/cover-letter', key: 'nav.coverLetter', sv: 'Personligt brev' },
  { path: '/interview-simulator', key: 'nav.interviewSimulator', sv: 'Intervjuträning' },
  { path: '/salary', key: 'nav.salary', sv: 'Lön och förhandling' },
  { path: '/linkedin-optimizer', key: 'nav.linkedinOptimizer', sv: 'LinkedIn-optimering' },
  { path: '/international', key: 'nav.international', sv: 'Internationell guide' },

  // Karriär
  { path: '/career', key: 'nav.career', sv: 'Karriär' },
  { path: '/interest-guide', key: 'nav.interestGuide', sv: 'Intresseguide' },
  { path: '/skills-gap-analysis', key: 'nav.skillsGap', sv: 'Kompetensanalys' },
  { path: '/personal-brand', key: 'nav.personalBrand', sv: 'Personligt varumärke' },
  { path: '/education', key: 'nav.education', sv: 'Utbildningar' },

  // Resurser
  { path: '/knowledge-base/article', sv: 'Artikel' },
  { path: '/knowledge-base', key: 'nav.knowledgeBase', sv: 'Kunskapsbank' },
  { path: '/resources', key: 'nav.myDocuments', sv: 'Dina dokument' },
  { path: '/print-resources', key: 'nav.printResources', sv: 'Skriv ut resurser' },
  { path: '/externa-resurser', key: 'nav.externalResources', sv: 'Externa resurser' },
  { path: '/ai-team', key: 'nav.aiTeam', sv: 'Ditt AI-team' },
  { path: '/nätverk', key: 'nav.network', sv: 'Nätverk' },
  { path: '/help', key: 'nav.help', sv: 'Hjälp' },

  // Min vardag
  { path: '/wellness', key: 'nav.wellness', sv: 'Hälsa' },
  { path: '/diary', key: 'nav.diary', sv: 'Dagbok' },
  { path: '/calendar', key: 'nav.calendar', sv: 'Kalender' },
  { path: '/exercises', key: 'nav.exercises', sv: 'Övningar' },
  { path: '/my-consultant', key: 'nav.myConsultant', sv: 'Din konsulent' },

  // Konto och administration
  { path: '/profile', key: 'nav.profile', sv: 'Min profil' },
  { path: '/settings', key: 'nav.settings', sv: 'Inställningar' },
  { path: '/consultant', key: 'nav.consultantPortal', sv: 'Konsultportal' },
  { path: '/admin', key: 'nav.adminPanel', sv: 'Administration' },

  // Avaktiverad modul (monteras bara med VITE_STA_ENABLED=true)
  { path: '/steg-till-arbete', sv: 'Steg till arbete' },
]

// Längst path först — annars skulle '/profile' äta '/profile/shared/:code'.
const SORTED_RULES = [...PAGE_TITLE_RULES].sort((a, b) => b.path.length - a.path.length)

function decodePath(pathname: string): string {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}

/** Hitta regeln som äger ett pathnamn. Ren funktion — testbar utan React. */
export function resolvePageTitleRule(pathname: string): PageTitleRule | undefined {
  const decoded = decodePath(pathname)
  const normalized = decoded.length > 1 ? decoded.replace(/\/+$/, '') || '/' : decoded
  return SORTED_RULES.find((rule) =>
    rule.exact
      ? normalized === rule.path
      : normalized === rule.path || normalized.startsWith(`${rule.path}/`)
  )
}

/** `Dagbok` → `Dagbok — Jobin`. Landningens titel bär redan varumärket. */
export function formatDocumentTitle(pageName: string): string {
  if (!pageName || pageName === DEFAULT_TITLE) return DEFAULT_TITLE
  return `${pageName} — ${BRAND}`
}

interface PageTitle {
  /** Sidans namn utan varumärke — används i skärmläsarannonseringen. */
  pageName: string
  /** Det som hamnar i <title>. */
  documentTitle: string
}

/**
 * Räkna ut sidans namn + dokumenttitel för ett pathnamn.
 * Sätter inte `document.title` — det gör `useDocumentTitle` nedan.
 */
export function usePageTitle(pathname: string): PageTitle {
  const { t } = useTranslation()
  const rule = resolvePageTitleRule(pathname)
  const pageName = rule
    ? rule.key
      ? t(rule.key, { defaultValue: rule.sv })
      : rule.sv
    : DEFAULT_TITLE
  return { pageName, documentTitle: formatDocumentTitle(pageName) }
}

/** Sätter `document.title` och returnerar samma värden som `usePageTitle`. */
export function useDocumentTitle(pathname: string): PageTitle {
  const title = usePageTitle(pathname)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = title.documentTitle
    }
  }, [title.documentTitle])
  return title
}
