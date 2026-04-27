/**
 * Domänmappning för Deltagarportalen
 * Spec: docs/DESIGN.md (C-Pastell, 3 domäner)
 *
 * Varje route hör till en av tre semantiska domäner som styr sidans accentfärg.
 * Används av PageLayout som sätter <div data-domain="..."> automatiskt.
 *
 * Aktiveras via tokens.css som modifierar --c-bg, --c-solid, --c-accent, --c-text.
 */

export type ColorDomain = 'action' | 'reflection' | 'outbound'

/**
 * Bakåtkompatibel typ — accepterar både nya 3-domänsnamn och gamla 5-domänsnamn.
 * tokens.css aliaserar de gamla till de nya (wellbeing→reflection, info→outbound, etc.)
 */
export type LegacyColorDomain = ColorDomain | 'info' | 'activity' | 'wellbeing' | 'coaching'

/**
 * Route-prefix → domän
 * Längre prefix matchas före kortare (mer specifika först).
 */
const ROUTE_DOMAIN_MAP: Array<[string, ColorDomain]> = [
  // === REFLEKTION (lila) — skapande, självkännedom, hälsa ===
  ['/cv',                    'reflection'],
  ['/cover-letter',          'reflection'],
  ['/wellness',              'reflection'],
  ['/diary',                 'reflection'],
  ['/career',                'reflection'],
  ['/interest-guide',        'reflection'],
  ['/skills-gap-analysis',   'reflection'],
  ['/personal-brand',        'reflection'],
  ['/education',             'reflection'],
  ['/interview-simulator',   'reflection'],
  ['/calendar',              'reflection'],
  ['/exercises',             'reflection'],

  // === UTÅTRIKTAT (persika) — handling utåt mot arbetsmarknaden ===
  ['/job-search',            'outbound'],
  ['/applications',          'outbound'],
  ['/spontanansökan',        'outbound'],
  ['/linkedin-optimizer',    'outbound'],
  ['/international',         'outbound'],
  ['/salary',                'outbound'],
  ['/externa-resurser',      'outbound'],
  ['/print-resources',       'outbound'],

  // === ACTION (turkos) — overview, system, support ===
  // Default — täcker /, /ai-team, /settings, /help, /resources,
  // /knowledge-base, /nätverk, /profile, /my-consultant, /consultant, /admin
]

/**
 * Returnerar rätt domän för en given route-pathname.
 * Default = 'action' (turkos) om ingen match.
 */
export function getDomainForPath(pathname: string): ColorDomain {
  // Normalisera: lowercase + trim trailing slash
  const path = pathname.toLowerCase().replace(/\/$/, '') || '/'

  for (const [prefix, domain] of ROUTE_DOMAIN_MAP) {
    if (path === prefix || path.startsWith(prefix + '/')) {
      return domain
    }
  }
  return 'action'
}

/**
 * Mänsklig etikett per domän — för domain-tag, breadcrumbs etc.
 */
export const DOMAIN_LABELS: Record<ColorDomain, string> = {
  action:     'Action',
  reflection: 'Reflektion',
  outbound:   'Utåtriktat',
}
