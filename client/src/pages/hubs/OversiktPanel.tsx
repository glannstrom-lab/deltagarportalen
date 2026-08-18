/**
 * Översiktens fyra kategorier.  (Förslag A, 2026-08-18, beslut Mikael)
 *
 * Ersätter instrumentpanelen från 17 augusti — nyckeltalsremsa, "Fortsätt där
 * du var", pipelinekort, "Framöver", måendekurva och konsulentkort. Allt det
 * innehållet finns kvar, men sorterat under den kategori det hör till i stället
 * för utspritt över sex ytor. Skälet: samma fyra objekt visades i tre
 * representationer, och en deltagare möttes av tolv likvärdiga länkar utan
 * någon ordning.
 *
 * ── Fyra regler som styrt varje rad ────────────────────────────────────────
 *
 * 1. **Ingen siffra utan underlag** (ROADMAP B31). En rad utan data visar en
 *    INVIT — "skriv ditt första" — aldrig `0`, aldrig ett tankstreck, aldrig
 *    ett påhittat exempel. Nollan är det värsta av de tre: den ser ut som ett
 *    resultat.
 *
 * 2. **Laddning och fel är inte tomhet.** Innan svaret är inne får ingen rad
 *    påstå något om användaren. Se `PanelTillstand`.
 *
 * 3. **Inga prestationsmätningar i hjälteposition** (DESIGN.md §1). Talen
 *    beskriver vad som FINNS ("5 jobb du följer"), aldrig hur väl man
 *    presterar mot ett mål. Ingen rad blir röd för att ett tal är lågt.
 *
 * 4. **En kategori = en hubbfärg.** Färgen sätts med `data-domain` på
 *    kolumnen, så `--c-bg`/`--c-solid`/`--c-text` löser ut per kategori. Aldrig
 *    en hårdkodad hub-token — grinden `lint:design` fäller det. Att fyra
 *    pasteller får stå bredvid varandra är Översiktens uttryckliga undantag i
 *    DESIGN.md §4, och de sitter bara i kolumnhuvudet och radernas strimma.
 *
 * Verktygsraderna speglar `navHubs[].items` i navigation.ts, men listar inte
 * alla — bara de fyra som har något att säga om just den här användaren, plus
 * en fot till hubben där resten finns.
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'
import { HUB_ICON_SRC } from '@/components/layout/hubIcons'
import { datumSprak } from '@/lib/datumsprak'

/**
 * Vad panelen vet just nu.
 *
 *   'laddar'  — svaret är inte inne. Visa raderna, men INGA påståenden.
 *   'fel'     — vi kunde inte hämta. Säg det; skyll inte på användaren.
 *   'klart'   — nu, och först nu, betyder ett tomt fält att det är tomt.
 *
 * Skillnaden fanns inte fram till 2026-08-18. `HubOverview` plockade bara
 * `data` ur hooken och kastade `isLoading`, så alla tre lägena renderades
 * likadant: "Du har inte börjat söka jobb än". Uppmätt mot prod tog det
 * 1 369 → 2 069 ms på bredband och 13,8 → 21,2 s på 3G — hela den tiden sa
 * startsidan till en användare med fem ansökningar att hen inte gjort något.
 */
export type PanelTillstand = 'laddar' | 'fel' | 'klart'

/** En rad i en kategori. */
interface Rad {
  titel: string
  /** Under titeln. Bär antingen ett faktum eller en invit — aldrig en nolla. */
  under: string
  /** Tal eller relativ tid till höger. `null` när raden är en ingång eller invit. */
  varde?: string | null
  till: string
  /**
   * Bär raden ett faktum om just den här användaren?
   *
   * Styr strimmans färg: hubbfärg när det finns något, grå när raden är en
   * invit eller en ren ingång. Det är den enda visuella skillnaden mellan
   * "du har gjort det här" och "det här finns att göra" — och den behövs, för
   * annars läses fyra rader som fyra ogjorda uppgifter.
   */
  harData: boolean
}

interface Kategori {
  id: string
  /** Sätts som `data-domain` → styr --c-* för hela kolumnen. */
  domain: 'activity' | 'coaching' | 'info' | 'wellbeing'
  namn: string
  /** Kort status i kolumnhuvudet. `null` när det inte finns något att säga. */
  bricka: string | null
  rader: Rad[]
  /** Hubben där resten av kategorins verktyg finns. */
  till: string
  fotText: string
}

/** Kortar fritext vid ordgräns så en rad inte spränger layouten. */
function kortaTitel(text: string, max = 38): string {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  const kap = t.slice(0, max)
  const brytpunkt = kap.lastIndexOf(' ')
  return (brytpunkt > max * 0.5 ? kap.slice(0, brytpunkt) : kap).replace(/[\s,.;:–—-]+$/, '') + '…'
}

function dagarSedan(iso: string | null | undefined): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / 86_400_000)
}

function narText(iso: string | null | undefined, t: TFunction): string | null {
  const d = dagarSedan(iso)
  if (d === null) return null
  if (d <= 0) return t('hubOverview.panel.today', 'i dag')
  if (d === 1) return t('hubOverview.panel.yesterday', 'i går')
  if (d < 7) return t('hubOverview.panel.daysAgo', { defaultValue: '{{count}} dagar sedan', count: d })
  if (d < 30) return t('hubOverview.panel.weeksAgo', { defaultValue: '{{count}} veckor sedan', count: Math.floor(d / 7) })
  return t('hubOverview.panel.longAgo', 'för länge sedan')
}

/**
 * Etikett för ett pipeline-segment. Nyckeln kommer ur datalagret; texten hör
 * hemma här, i vyn, så att den går att översätta.
 */
function segmentEtikett(key: string, t: TFunction): string {
  const standard: Record<string, string> = {
    saved: 'sparade',
    awaiting: 'väntar på svar',
    interview: 'intervju',
    offer: 'erbjudande',
    closed: 'avslutade',
    other: 'övriga',
  }
  return t(`hubOverview.panel.segment.${key}`, standard[key] ?? key)
}

/**
 * Sammanfattar pipelinen i en mening: "4 sparade, 1 väntar på svar".
 *
 * Byggs ur samma segment som talet, så de två kan inte säga emot varandra —
 * felet som fanns fram till 2026-08-18, då "ANSÖKNINGAR 5" stod över
 * "2 + 1 + 0 + 0". Nollsegment utelämnas: en nolla i en uppräkning är brus.
 */
function pipelineMening(
  segments: Array<{ key: string; count: number }> | undefined,
  t: TFunction
): string | null {
  const med = (segments ?? []).filter((s) => s.count > 0)
  if (med.length === 0) return null
  return med.map((s) => `${s.count} ${segmentEtikett(s.key, t)}`).join(', ')
}

function byggKategorier(
  s: OversiktSummary | undefined,
  t: TFunction,
  tillstand: PanelTillstand,
  sprak: string
): Kategori[] {
  /**
   * Underraden när vi inte vet. Under laddning och vid fel säger den vad
   * SYSTEMET gör, inte vad personen inte har gjort.
   */
  const okant =
    tillstand === 'laddar'
      ? t('hubOverview.panel.loading', 'hämtar …')
      : tillstand === 'fel'
        ? t('hubOverview.panel.unknown', 'kunde inte hämtas')
        : null

  /** Bygger en rad. `okant` slår alltid igenom — då är inget känt om raden. */
  const rad = (r: Rad): Rad =>
    okant ? { ...r, under: okant, varde: null, harData: false } : r

  const jobsok = s?.jobsok
  const karriar = s?.karriar
  const resurser = s?.resurser
  const vardag = s?.minVardag

  // ── Söka jobb ────────────────────────────────────────────────────────────
  const appsTotalt = jobsok?.applicationStats?.total ?? 0
  const appsMening = pipelineMening(jobsok?.applicationStats?.segments, t)
  const cvNar = narText(jobsok?.cv?.updated_at, t)
  const brev = jobsok?.coverLetters?.length ?? 0
  const ovningar = jobsok?.interviewSessions?.length ?? 0

  const sokaJobb: Kategori = {
    id: 'jobb',
    domain: 'activity',
    namn: t('nav.hubs.jobb', 'Söka jobb'),
    bricka: okant || appsTotalt === 0 ? null : t('hubOverview.panel.badgeActive', { defaultValue: '{{count}} aktiva', count: appsTotalt }),
    till: '/jobb',
    fotText: t('hubOverview.panel.allIn', { defaultValue: 'Allt i {{namn}}', namn: t('nav.hubs.jobb', 'Söka jobb') }),
    rader: [
      rad({
        titel: t('hubOverview.panel.pipeline', 'Dina ansökningar'),
        under: appsMening ?? t('hubOverview.panel.applicationsInvite', 'hitta ditt första jobb'),
        varde: appsTotalt > 0 ? String(appsTotalt) : null,
        till: '/applications',
        harData: appsTotalt > 0,
      }),
      rad({
        titel: t('hubOverview.panel.yourCv', 'Ditt CV'),
        under: cvNar ? t('hubOverview.panel.cvSub2', 'Öppna och fyll på') : t('hubOverview.panel.cvInvite', 'skapa ditt CV'),
        varde: cvNar,
        till: '/cv',
        harData: !!cvNar,
      }),
      rad({
        titel: t('hubOverview.panel.letters', 'Personligt brev'),
        under: brev > 0 ? t('hubOverview.panel.lettersSub', 'sparade') : t('hubOverview.panel.lettersInvite', 'skriv ditt första'),
        varde: brev > 0 ? String(brev) : null,
        till: '/cover-letter',
        harData: brev > 0,
      }),
      rad({
        titel: t('hubOverview.panel.interviews', 'Intervjuträning'),
        under: ovningar > 0 ? t('hubOverview.panel.interviewsSub', 'genomförda') : t('hubOverview.panel.interviewsInvite', 'öva när du orkar'),
        varde: ovningar > 0 ? String(ovningar) : null,
        till: '/interview-simulator',
        harData: ovningar > 0,
      }),
    ],
  }

  // ── Karriär ──────────────────────────────────────────────────────────────
  const analys = karriar?.latestSkillsAnalysis ?? null
  const analysNar = narText(analys?.created_at, t)
  const varumarke = karriar?.latestBrandAudit ?? null
  const malUppdaterat = narText(karriar?.careerGoals?.updatedAt, t)

  const karriarKat: Kategori = {
    id: 'karriar',
    domain: 'coaching',
    namn: t('nav.hubs.karriar', 'Karriär'),
    bricka: okant || !analys ? null : t('hubOverview.panel.badgeAnalysis', '1 analys'),
    till: '/karriar',
    fotText: t('hubOverview.panel.allIn', { defaultValue: 'Allt i {{namn}}', namn: t('nav.hubs.karriar', 'Karriär') }),
    rader: [
      rad({
        titel: analys
          ? t('hubOverview.panel.skillsFor', { defaultValue: 'Kompetenser mot {{jobb}}', jobb: kortaTitel(analys.dream_job) })
          : t('hubOverview.panel.skillsGap', 'Kompetensanalys'),
        under: analys ? t('hubOverview.panel.skillsSub', 'Din senaste analys') : t('hubOverview.panel.skillsInvite', 'jämför ditt CV med ett drömjobb'),
        varde: analysNar,
        till: '/skills-gap-analysis',
        harData: !!analys,
      }),
      rad({
        titel: t('hubOverview.panel.careerPlan', 'Din karriärplan'),
        under: malUppdaterat ? t('hubOverview.panel.careerPlanSub', 'senast ändrad') : t('hubOverview.panel.careerPlanInvite', 'vad vill du på sikt?'),
        varde: malUppdaterat,
        till: '/career',
        harData: !!malUppdaterat,
      }),
      rad({
        titel: t('hubOverview.panel.brand', 'Personligt varumärke'),
        under: varumarke ? t('hubOverview.panel.brandSub', 'senaste genomgången') : t('hubOverview.panel.brandInvite', 'inte påbörjat'),
        varde: narText(varumarke?.created_at, t),
        till: '/personal-brand',
        harData: !!varumarke,
      }),
      rad({
        titel: t('hubOverview.panel.education', 'Utbildningar'),
        under: t('hubOverview.panel.educationSub', 'sök i hela Sverige'),
        varde: null,
        till: '/education',
        harData: false,
      }),
    ],
  }

  // ── Resurser ─────────────────────────────────────────────────────────────
  const lasta = resurser?.articleCompletedCount ?? 0
  const aiSessioner = resurser?.aiTeamSessionCount ?? 0
  const egnaSaker =
    (resurser?.coverLetters?.length ?? 0) + (resurser?.cv ? 1 : 0)
  // `networkContactsCount` bor i Min vardag-skivan men Nätverk ligger i
  // Resurser-hubben (navigation.ts). Läses härifrån hellre än att hämtas igen.
  const kontakter = vardag?.networkContactsCount ?? 0

  const resurserKat: Kategori = {
    id: 'resurser',
    domain: 'info',
    namn: t('nav.hubs.resurser', 'Resurser'),
    bricka: okant || lasta === 0 ? null : t('hubOverview.panel.badgeRead', { defaultValue: '{{count}} lästa', count: lasta }),
    till: '/resurser',
    fotText: t('hubOverview.panel.allIn', { defaultValue: 'Allt i {{namn}}', namn: t('nav.hubs.resurser', 'Resurser') }),
    rader: [
      rad({
        titel: t('hubOverview.panel.knowledgeBase', 'Kunskapsbank'),
        under: lasta > 0 ? t('hubOverview.panel.knowledgeSub', 'artiklar du läst') : t('hubOverview.panel.knowledgeInvite', 'sök svar på en fråga'),
        varde: lasta > 0 ? String(lasta) : null,
        till: '/knowledge-base',
        harData: lasta > 0,
      }),
      rad({
        titel: t('hubOverview.panel.saved', 'Dina sparade'),
        under: egnaSaker > 0 ? t('hubOverview.panel.savedSub', 'dokument och CV') : t('hubOverview.panel.savedInvite', 'inget sparat än'),
        varde: egnaSaker > 0 ? String(egnaSaker) : null,
        till: '/resources',
        harData: egnaSaker > 0,
      }),
      rad({
        titel: t('hubOverview.panel.aiTeam', 'Ditt AI-team'),
        under: aiSessioner > 0 ? t('hubOverview.panel.aiTeamSub', 'samtal du haft') : t('hubOverview.panel.aiTeamInvite', 'fem att fråga'),
        varde: aiSessioner > 0 ? String(aiSessioner) : null,
        till: '/ai-team',
        harData: aiSessioner > 0,
      }),
      rad({
        titel: t('hubOverview.panel.network', 'Nätverk'),
        under: kontakter > 0 ? t('hubOverview.panel.networkSub', 'kontakter') : t('hubOverview.panel.networkInvite', 'lägg till en kontakt'),
        varde: kontakter > 0 ? String(kontakter) : null,
        till: '/nätverk',
        harData: kontakter > 0,
      }),
    ],
  }

  // ── Din vardag ───────────────────────────────────────────────────────────
  const dagbokNar = narText(vardag?.latestDiaryEntry?.created_at, t)
  const mood = vardag?.recentMoodLogs ?? []
  const nastaHandelse = vardag?.upcomingEvents?.[0] ?? null
  const konsulent = vardag?.consultant ?? null

  const vardagKat: Kategori = {
    id: 'vardag',
    domain: 'wellbeing',
    namn: t('nav.hubs.min-vardag', 'Din vardag'),
    bricka:
      okant || !konsulent
        ? null
        : konsulent.full_name ?? t('hubOverview.panel.consultantUnnamed', 'Din konsulent'),
    till: '/min-vardag',
    fotText: t('hubOverview.panel.allIn', { defaultValue: 'Allt i {{namn}}', namn: t('nav.hubs.min-vardag', 'Din vardag') }),
    rader: [
      rad({
        titel: t('hubOverview.panel.diary', 'Din dagbok'),
        under: dagbokNar ? t('hubOverview.panel.diarySub', 'Senaste anteckningen') : t('hubOverview.panel.diaryInvite', 'skriv några rader'),
        varde: dagbokNar,
        till: '/diary',
        harData: !!dagbokNar,
      }),
      rad({
        titel: t('hubOverview.panel.mood', 'Hur du mår'),
        under:
          mood.length > 0
            ? t('hubOverview.panel.moodSub', { defaultValue: 'Senaste {{count}} loggningarna', count: mood.length })
            : t('hubOverview.panel.moodInvite', 'logga hur dagen känns'),
        varde: mood.length > 0 ? String(mood.length) : null,
        till: '/wellness',
        harData: mood.length > 0,
      }),
      rad({
        titel: t('hubOverview.panel.calendar', 'Kalender'),
        under: nastaHandelse
          ? nastaHandelse.title
          : t('hubOverview.panel.calendarInvite', 'inget inbokat'),
        varde: nastaHandelse
          ? new Date(nastaHandelse.date).toLocaleDateString(sprak, { weekday: 'short', day: 'numeric', month: 'short' })
          : null,
        till: '/calendar',
        harData: !!nastaHandelse,
      }),
      rad({
        titel: t('hubOverview.panel.consultant', 'Din konsulent'),
        under: konsulent
          ? konsulent.full_name ?? t('hubOverview.panel.consultantUnnamed', 'Din konsulent')
          : t('hubOverview.panel.consultantNone', 'ingen kopplad än'),
        varde: null,
        till: '/my-consultant',
        harData: !!konsulent,
      }),
    ],
  }

  return [sokaJobb, karriarKat, resurserKat, vardagKat]
}

export default function OversiktPanel({
  summary,
  tillstand = 'klart',
  vidForsokIgen,
}: {
  summary: OversiktSummary | undefined
  tillstand?: PanelTillstand
  vidForsokIgen?: () => void
}) {
  const { t, i18n } = useTranslation()
  const laddar = tillstand === 'laddar'
  const fel = tillstand === 'fel'
  const kategorier = byggKategorier(summary, t, tillstand, datumSprak(i18n.language))

  return (
    <div className="space-y-4" aria-busy={laddar || undefined}>
      {/* WCAG 4.1.3: talen byts ut när svaret kommer. Utan en levande region
          hände det tyst för den som inte ser skärmen. */}
      <p role="status" aria-live="polite" className="sr-only">
        {laddar
          ? t('hubOverview.panel.statusLoading', 'Hämtar din översikt.')
          : fel
            ? t('hubOverview.panel.statusError', 'Översikten kunde inte hämtas.')
            : t('hubOverview.panel.statusReady', 'Översikten är uppdaterad.')}
      </p>

      {fel && (
        <section className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3.5">
          <p className="m-0 text-[13.5px] text-stone-700 dark:text-stone-200">
            {t(
              'hubOverview.panel.errorBody',
              'Vi kunde inte hämta dina uppgifter just nu. Det är portalen som strular — inget du har gjort.'
            )}
          </p>
          {vidForsokIgen && (
            <button
              type="button"
              onClick={vidForsokIgen}
              className="mt-2.5 rounded-lg bg-[var(--c-solid)] px-3 py-1.5 text-[13px] font-medium text-white transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2"
            >
              {t('hubOverview.panel.retry', 'Försök igen')}
            </button>
          )}
        </section>
      )}

      {/*
        Ett enda rutnät med delad hårlinje: `gap-px` på en stone-200-yta, som
        nyckeltalsremsan gjorde före omläggningen. Fyra kolumner på lg, två på
        sm, en på telefon — i ordningen Söka jobb, Karriär, Resurser, Din vardag.
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-200 dark:bg-stone-700">
        {kategorier.map((kat) => (
          <section
            key={kat.id}
            data-domain={kat.domain}
            aria-labelledby={`kat-${kat.id}`}
            className="bg-white dark:bg-stone-900 flex flex-col"
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-stone-200 dark:border-stone-700 bg-[var(--c-bg)]">
              {HUB_ICON_SRC[kat.domain] && (
                <img
                  src={HUB_ICON_SRC[kat.domain]}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="w-[22px] h-[22px] object-contain shrink-0"
                />
              )}
              <h2
                id={`kat-${kat.id}`}
                className="m-0 text-[13.5px] font-semibold tracking-tight text-stone-900 dark:text-stone-100"
              >
                {kat.namn}
              </h2>
              {kat.bricka && (
                <span className="ml-auto shrink-0 rounded bg-white/80 dark:bg-stone-900/60 px-1.5 py-0.5 text-[10.5px] font-mono text-[var(--c-text)] max-w-[52%] truncate">
                  {kat.bricka}
                </span>
              )}
            </div>

            <ul className="m-0 p-0 list-none">
              {kat.rader.map((r) => (
                <li key={r.till} className="border-b border-stone-100 dark:border-stone-800">
                  <Link
                    to={r.till}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--c-solid)] no-underline"
                  >
                    {/* Färgad strimma = raden bär ett faktum om dig. Grå = en
                        väg in. Skillnaden gör att fyra rader inte läses som
                        fyra ogjorda uppgifter. */}
                    <span
                      aria-hidden="true"
                      className={
                        r.harData
                          ? 'w-[3px] self-stretch min-h-[26px] rounded-full shrink-0 bg-[var(--c-solid)]'
                          : 'w-[3px] self-stretch min-h-[26px] rounded-full shrink-0 bg-stone-200 dark:bg-stone-700'
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-stone-900 dark:text-stone-100 truncate">
                        {r.titel}
                      </span>
                      <span className="block text-[11.5px] leading-snug text-stone-500 dark:text-stone-400 truncate">
                        {r.under}
                      </span>
                    </span>
                    {/* B31: raden visar ett tal bara när det finns ett. Ingen
                        nolla, inget tankstreck — underraden bär beskedet. */}
                    {r.varde && (
                      <span
                        className={
                          /^\d+$/.test(r.varde)
                            ? 'shrink-0 text-[15px] font-semibold tabular-nums text-stone-900 dark:text-stone-100'
                            : 'shrink-0 text-[10.5px] font-mono text-stone-400 dark:text-stone-500'
                        }
                      >
                        {r.varde}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              to={kat.till}
              className="mt-auto block px-3 py-2 border-t border-stone-200 dark:border-stone-700 text-[12px] font-medium text-[var(--c-text)] dark:text-[var(--c-solid)] no-underline hover:bg-[var(--c-bg)]"
            >
              {kat.fotText} <span aria-hidden="true">→</span>
            </Link>
          </section>
        ))}
      </div>
    </div>
  )
}
