/**
 * Domänmappning för Deltagarportalen
 * Spec: docs/DESIGN.md (5-pastell, uniform neutral header)
 *
 * Varje route hör till en av FEM semantiska domäner som styr sidans
 * accent-pastell (men aldrig hjältesektionen — den är alltid neutral grå).
 *
 * Aktiveras via tokens.css som modifierar --c-bg, --c-solid, --c-accent, --c-text
 * när PageLayout sätter <div data-domain="...">.
 */

export type ColorDomain =
  | 'action'      // turkos/mint — overview, system, AI
  | 'info'        // sky/blå — informativt material, hjälp, resurser
  | 'activity'    // persika — utåtriktade jobbåtgärder
  | 'wellbeing'   // lavendel — hälsa, reflektion, dagbok
  | 'coaching'    // rosa — utveckling, CV, brev, intervju, karriär

/**
 * Bakåtkompatibel typ — accepterar de gamla 3-domän-namnen ('reflection', 'outbound')
 * från den korta C-pastell-perioden, samt de nya 5-domän-namnen.
 * tokens.css aliaserar 3-namnen till 5-namnen så ingen kodfix krävs.
 */
export type LegacyColorDomain = ColorDomain | 'reflection' | 'outbound'

/**
 * Route-prefix → domän
 * Längre prefix matchas före kortare (mer specifika först).
 */
const ROUTE_DOMAIN_MAP: Array<[string, ColorDomain]> = [
  // === ACTIVITY (Persika) — /jobb-hubben: hela jobbsökningsflödet ===
  ['/job-search',            'activity'],
  ['/applications',          'activity'],
  ['/spontanansökan',        'activity'],
  ['/cv',                    'activity'],
  ['/cover-letter',          'activity'],
  ['/interview-simulator',   'activity'],
  ['/linkedin-optimizer',    'activity'],
  ['/international',         'activity'],
  ['/salary',                'activity'],

  // === COACHING (Rosa) — /karriar-hubben: utveckling och vägval ===
  ['/career',                'coaching'],
  ['/interest-guide',        'coaching'],
  ['/skills-gap-analysis',   'coaching'],
  ['/personal-brand',        'coaching'],
  ['/education',             'coaching'],

  // === WELLBEING (Lavendel) — /min-vardag-hubben: rutiner och mående ===
  ['/wellness',              'wellbeing'],
  ['/diary',                 'wellbeing'],
  ['/calendar',              'wellbeing'],
  ['/exercises',             'wellbeing'],
  ['/my-consultant',         'wellbeing'],

  // === INFO (Sky) — /resurser-hubben: kunskapsbank och stöd ===
  ['/help',                  'info'],
  ['/resources',             'info'],
  ['/externa-resurser',      'info'],
  ['/print-resources',       'info'],
  ['/knowledge-base',        'info'],
  ['/network',               'info'],
  ['/nätverk',               'info'],
  ['/ai-team',               'info'],

  // === ACTION (Mint/Turkos) — Översikt + system (åtkomst via topbar) ===
  // /, /oversikt, /profile, /settings, /consultant, /admin
]

/**
 * Returnerar rätt domän för en given route-pathname.
 * Default = 'action' (mint/turkos) om ingen match.
 */
export function getDomainForPath(pathname: string): ColorDomain {
  // Avkoda URL-encoded tecken (t.ex. /spontanans%C3%B6kan -> /spontanansökan)
  // så att routes med svenska tecken matchar konsekvent.
  let decoded = pathname
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    // ignore invalid encoding
  }
  const path = decoded.toLowerCase().replace(/\/$/, '') || '/'

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
  action:    'Översikt',
  activity:  'Söka jobb',
  coaching:  'Karriär',
  info:      'Resurser',
  wellbeing: 'Min vardag',
}
