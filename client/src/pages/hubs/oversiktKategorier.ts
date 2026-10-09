/**
 * Översiktens kategorier — datan bakom platskorten och platsrutan i staden.
 * Utbrutet ur OversiktPanel.tsx 2026-10-09 (spår JS) så att staden kan läsa
 * samma rader som korten. Reglerna (B31, laddar/fel/klart) står i panelens huvud.
 */
import type { TFunction } from 'i18next'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'
import { getDomainForPath } from '@/lib/domains'
import { platsForDomain, type HubbPlatsId } from '@/data/varld'
import { valjNastaSteg } from './nastaStegRegler'
import { narText } from './oversiktTid'

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
  /** Tal eller tidsangivelse till höger. `null` när raden är en ingång eller invit. */
  varde?: string | null
  till: string
  /**
   * Bär raden ett faktum om just den här användaren?
   *
   * Styr hela radens vikt: titel i full färg och värde i hubbfärg när det
   * finns något; dämpad titel och en pil när raden är en invit. Det är
   * skillnaden mellan "du har gjort det här" och "det här finns att göra" —
   * utan den läses fyra rader som fyra ogjorda uppgifter.
   */
  harData: boolean
}

export interface Kategori {
  id: string
  /** Sätts som `data-domain` → styr --c-* för hela kolumnen. */
  domain: 'activity' | 'coaching' | 'info' | 'wellbeing'
  namn: string
  rader: Rad[]
  /** Hubben där resten av kategorins verktyg finns. */
  till: string
}

/** Kortar fritext vid ordgräns så en rad inte spränger layouten. */
function kortaTitel(text: string, max = 38): string {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  const kap = t.slice(0, max)
  const brytpunkt = kap.lastIndexOf(' ')
  return (brytpunkt > max * 0.5 ? kap.slice(0, brytpunkt) : kap).replace(/[\s,.;:–—-]+$/, '') + '…'
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

export function byggKategorier(
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
  const cvNar = narText(jobsok?.cv?.updated_at, t, sprak)
  const brev = jobsok?.coverLetters?.length ?? 0
  const ovningar = jobsok?.interviewSessions?.length ?? 0

  const sokaJobb: Kategori = {
    id: 'jobb',
    domain: 'activity',
    namn: t('nav.hubs.jobb', 'Söka jobb'),
    till: '/jobb',
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
  const analysNar = narText(analys?.created_at, t, sprak)
  const varumarke = karriar?.latestBrandAudit ?? null
  const malUppdaterat = narText(karriar?.careerGoals?.updatedAt, t, sprak)

  const karriarKat: Kategori = {
    id: 'karriar',
    domain: 'coaching',
    namn: t('nav.hubs.karriar', 'Karriär'),
    till: '/karriar',
    rader: [
      // Titeln är verktygets namn; drömjobbet står på underraden. Fram till
      // 2026-09-10 hette raden "Kompetenser mot <annonstitel>", och eftersom
      // fältet i prod ibland är en hel jobbannons blev det "Kompetenser mot
      // Vi söker en lagermeda…" — annonsen läckte in i rubriken.
      rad({
        titel: t('hubOverview.panel.skillsGap', 'Kompetensanalys'),
        under: analys
          ? t('hubOverview.panel.skillsSubFor', { defaultValue: 'mot {{jobb}}', jobb: kortaTitel(analys.dream_job) })
          : t('hubOverview.panel.skillsInvite', 'jämför ditt CV med ett drömjobb'),
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
        varde: narText(varumarke?.created_at, t, sprak),
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
    till: '/resurser',
    rader: [
      rad({
        titel: t('hubOverview.panel.aiTeam', 'Ditt AI-team'),
        under: aiSessioner > 0 ? t('hubOverview.panel.aiTeamSub', 'samtal du haft') : t('hubOverview.panel.aiTeamInvite', 'fem att fråga'),
        varde: aiSessioner > 0 ? String(aiSessioner) : null,
        till: '/ai-team',
        harData: aiSessioner > 0,
      }),
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
        titel: t('hubOverview.panel.network', 'Nätverk'),
        under: kontakter > 0 ? t('hubOverview.panel.networkSub', 'kontakter') : t('hubOverview.panel.networkInvite', 'lägg till en kontakt'),
        varde: kontakter > 0 ? String(kontakter) : null,
        till: '/nätverk',
        harData: kontakter > 0,
      }),
    ],
  }

  // ── Din vardag ───────────────────────────────────────────────────────────
  const dagbokNar = narText(vardag?.latestDiaryEntry?.created_at, t, sprak)
  const mood = vardag?.recentMoodLogs ?? []
  const nastaHandelse = vardag?.upcomingEvents?.[0] ?? null
  const konsulent = vardag?.consultant ?? null

  const vardagKat: Kategori = {
    id: 'vardag',
    domain: 'wellbeing',
    namn: t('nav.hubs.min-vardag', 'Din vardag'),
    till: '/min-vardag',
    rader: [
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
        titel: t('hubOverview.panel.diary', 'Din dagbok'),
        under: dagbokNar ? t('hubOverview.panel.diarySub', 'Senaste anteckningen') : t('hubOverview.panel.diaryInvite', 'skriv några rader'),
        varde: dagbokNar,
        till: '/diary',
        harData: !!dagbokNar,
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


/** Vilken plats nästa steg pekar på — staden och korten markerar den med "!". */
export function uppdragsplats(summary: OversiktSummary | undefined): HubbPlatsId | null {
  const till = valjNastaSteg(summary)?.primar.till
  if (!till) return null
  const p = platsForDomain(getDomainForPath(till)).id
  return p === 'stad' ? null : (p as HubbPlatsId)
}
