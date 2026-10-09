import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  calculateJobMatches,
  type UserProfile,
  type RiasecScores,
  type BigFiveScores
} from '@/services/interestGuideData'
import { useRiasecNamn, useYrken } from '@/services/useIntresseguideInnehall'
import { BigFiveChart } from './BigFiveChart'
import { ICFSection } from './ICFSection'
import { HealthConsentGate } from '@/components/consent/HealthConsentGate'
import { useAuthStore } from '@/stores/authStore'
import { JobCard } from './JobCard'
import { Button } from '@/components/ui/Button'
import {
  GraduationCap,
  Briefcase,
  CheckSquare,
  X,
  BarChart3,
  Target,
  Brain,
  Heart,
  Wrench,
  Search,
  Palette,
  Users,
  Megaphone,
  ClipboardList,
} from '@/components/ui/icons'

interface ResultsViewProps {
  profile: UserProfile
}

/** Ikon per arbetsmiljö (RIASEC). Variation genom ikon, inte färg — en sida, en hubbfärg. */
const RIASEC_IKON: Record<string, typeof Target> = {
  R: Wrench,
  I: Search,
  A: Palette,
  S: Users,
  E: Megaphone,
  C: ClipboardList,
}

const SEKTION = 'bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-5 sm:p-6'

// Pedagogisk information om RIASEC
function riasecInfo(t: TFunction) {
  return {
    description: t('interestGuide.rv.riasec.description', 'RIASEC (även kallad Holland Codes) är en modell som beskriver sex olika personlighetstyper och arbetsmiljöer. Den hjälper dig förstå vilka typer av yrken som kan passa dig baserat på dina intressen och arbetsstil.'),
    types: [
      { key: 'R', name: t('interestGuide.rv.riasec.R.name', 'Realistisk'), desc: t('interestGuide.rv.riasec.R.desc', 'Praktiskt arbete med händerna, maskiner, teknik eller utomhus'), examples: t('interestGuide.rv.riasec.R.examples', 'Mekaniker, elektriker, trädgårdsmästare, kock') },
      { key: 'I', name: t('interestGuide.rv.riasec.I.name', 'Investigativ'), desc: t('interestGuide.rv.riasec.I.desc', 'Analysera, forska, lösa problem och förstå komplexa samband'), examples: t('interestGuide.rv.riasec.I.examples', 'Forskare, programmerare, läkare, civilingenjör') },
      { key: 'A', name: t('interestGuide.rv.riasec.A.name', 'Konstnärlig'), desc: t('interestGuide.rv.riasec.A.desc', 'Kreativt skapande, estetiskt arbete, uttrycka sig'), examples: t('interestGuide.rv.riasec.A.examples', 'Grafisk designer, musiker, journalist, arkitekt') },
      { key: 'S', name: t('interestGuide.rv.riasec.S.name', 'Social'), desc: t('interestGuide.rv.riasec.S.desc', 'Hjälpa, undervisa, vårda och samarbeta med människor'), examples: t('interestGuide.rv.riasec.S.examples', 'Lärare, sjuksköterska, socionom, psykolog') },
      { key: 'E', name: t('interestGuide.rv.riasec.E.name', 'Entreprenöriell'), desc: t('interestGuide.rv.riasec.E.desc', 'Leda, påverka, sälja och driva projekt'), examples: t('interestGuide.rv.riasec.E.examples', 'Försäljare, marknadsförare, chef, mäklare') },
      { key: 'C', name: t('interestGuide.rv.riasec.C.name', 'Konventionell'), desc: t('interestGuide.rv.riasec.C.desc', 'Organisera, strukturera, arbeta med data och detaljer'), examples: t('interestGuide.rv.riasec.C.examples', 'Ekonom, administratör, controller, revisor') },
    ],
  }
}

// Pedagogisk information om Big Five
function bigFiveInfo(t: TFunction) {
  return {
    // "den mest vedertagna modellen" gällde MODELLEN, men stod som rubrik över
    // portalens egen tiofrågorsenkät och läste därför som en kvalitetsstämpel på
    // resultatet. Sista meningen säger nu vad den här versionen är.
    description: t('interestGuide.rv.bigFive.description', 'Femfaktormodellen (Big Five) är en etablerad modell inom personlighetspsykologi. Den beskriver fem drag som påverkar hur vi fungerar i olika situationer, också på jobbet. Frågorna här är våra egna och två per drag — tillräckligt för en fingervisning, inte för en mätning.'),
    traits: [
      { key: 'openness', name: t('interestGuide.rv.bigFive.openness.name', 'Öppenhet'),
        desc: t('interestGuide.rv.bigFive.openness.desc', 'Nyfikenhet, fantasi och vilja att prova nya saker'),
        workImpact: t('interestGuide.rv.bigFive.openness.workImpact', 'Hög öppenhet passar bra för kreativa och varierande yrken. Låg öppenhet passar för strukturerade och förutsägbara arbetsuppgifter.') },
      { key: 'conscientiousness', name: t('interestGuide.rv.bigFive.conscientiousness.name', 'Samvetsgrannhet'),
        desc: t('interestGuide.rv.bigFive.conscientiousness.desc', 'Noggrannhet, organisation och självdisciplin'),
        workImpact: t('interestGuide.rv.bigFive.conscientiousness.workImpact', 'Hög samvetsgrannhet är viktigt för yrken som kräver precision och pålitlighet. De flesta arbetsgivare värdesätter detta drag högt.') },
      { key: 'extraversion', name: t('interestGuide.rv.bigFive.extraversion.name', 'Extraversion'),
        desc: t('interestGuide.rv.bigFive.extraversion.desc', 'Socialt engagemang, energi och utåtriktning'),
        workImpact: t('interestGuide.rv.bigFive.extraversion.workImpact', 'Hög extraversion passar för yrken med mycket social kontakt. Låg extraversion (introversion) kan passa bra för självständigt arbete.') },
      { key: 'agreeableness', name: t('interestGuide.rv.bigFive.agreeableness.name', 'Vänlighet'),
        desc: t('interestGuide.rv.bigFive.agreeableness.desc', 'Empati, samarbetsvilja och omtanke om andra'),
        workImpact: t('interestGuide.rv.bigFive.agreeableness.workImpact', 'Hög vänlighet är viktigt i vårdyrken och service. Mycket låg vänlighet kan passa för konkurrensutsatta yrken som kräver hårdhet.') },
      { key: 'stability', name: t('interestGuide.rv.bigFive.stability.name', 'Emotionell stabilitet'),
        desc: t('interestGuide.rv.bigFive.stability.desc', 'Förmåga att hantera stress och behålla lugnet'),
        workImpact: t('interestGuide.rv.bigFive.stability.workImpact', 'Hög stabilitet hjälper i pressade situationer. Lägre stabilitet kan innebära större känslighet, men också större empati.') },
    ],
  }
}

// Tolkning av resultat
function interpretRiasec(scores: RiasecScores, t: TFunction): string {
  const entries = Object.entries(scores).sort(([, a], [, b]) => b - a)
  const [top1] = entries[0]
  const [top2] = entries[1]

  const combinations: Record<string, string> = {
    'RI': t('interestGuide.rv.riasecCombo.RI', 'Du trivs med att lösa praktiska problem på ett analytiskt sätt. Tekniska yrken kan passa dig.'),
    'RA': t('interestGuide.rv.riasecCombo.RA', 'Du gillar att skapa saker med händerna. Yrken inom design, hantverk eller konstnärligt teknik kan passa.'),
    'RS': t('interestGuide.rv.riasecCombo.RS', 'Du vill hjälpa andra på ett praktiskt sätt. Vårdyrken med praktiska uppgifter kan passa.'),
    'IA': t('interestGuide.rv.riasecCombo.IA', 'Du kombinerar analytisk förmåga med kreativitet. Forskar- eller utvecklingsyrken kan passa.'),
    'IS': t('interestGuide.rv.riasecCombo.IS', 'Du vill förstå och hjälpa människor. Psykologi, medicin eller pedagogik kan passa.'),
    'AS': t('interestGuide.rv.riasecCombo.AS', 'Du vill uttrycka dig och kommunicera med andra. Yrken inom media, konst eller undervisning kan passa.'),
    'SE': t('interestGuide.rv.riasecCombo.SE', 'Du vill leda och hjälpa människor samtidigt. Chefsroller inom vård eller utbildning kan passa.'),
    'EC': t('interestGuide.rv.riasecCombo.EC', 'Du vill organisera och driva verksamheter framåt. Administrativa ledarroller kan passa.'),
  }

  const key = `${top1}${top2}`
  const key2 = `${top2}${top1}`
  return combinations[key] || combinations[key2] || t('interestGuide.rv.riasecCombo.fallback', 'Du har en unik kombination av intressen som ger dig många möjligheter!')
}

/**
 * Referat av svaren — inte omdömen om personen.
 *
 * Stod tidigare: *"Dina främsta personlighetsdrag är att du är noggrann och
 * pålitlig. Detta ger dig goda förutsättningar för yrken som värdesätter
 * dessa egenskaper."* Varje drag vilar på TVÅ likert-svar. Två items ger
 * ingen reliabilitet, och formuleringen är ett påstående om vem användaren
 * ÄR.
 *
 * Värre var fallgrenen: fick inget drag ≥ 60 sa vyn *"Din personlighet är mer
 * återhållsam"* — en negativ karaktärsbeskrivning som utlöstes av NEUTRALA
 * svar (alla 3 → alla drag = 50). Den grenen är borttagen.
 *
 * Nu: "du svarade att…", och en rad som säger vad underlaget är.
 */
function interpretBigFive(scores: BigFiveScores, t: TFunction): string {
  const traits: string[] = []
  if (scores.openness >= 60) traits.push(t('interestGuide.rv.bigFiveTrait.openness', 'gillar att prova nytt'))
  if (scores.conscientiousness >= 60) traits.push(t('interestGuide.rv.bigFiveTrait.conscientiousness', 'är noggrann och håller ordning'))
  if (scores.extraversion >= 60) traits.push(t('interestGuide.rv.bigFiveTrait.extraversion', 'trivs med människor omkring dig'))
  if (scores.agreeableness >= 60) traits.push(t('interestGuide.rv.bigFiveTrait.agreeableness', 'gärna hjälper andra'))
  if (scores.stability >= 60) traits.push(t('interestGuide.rv.bigFiveTrait.stability', 'håller dig lugn under press'))

  if (traits.length === 0) {
    return t('interestGuide.rv.bigFiveMiddle', 'Du svarade ganska mitt på skalan på de flesta frågorna. Det säger inte att du saknar de här dragen — bara att du inte lade dig i någon ytterkant den här gången.')
  }

  return t('interestGuide.rv.bigFiveSummary', 'Du svarade att du {{traits}}. Det bygger på två frågor per drag, så se det som en öppning för ett samtal — inte som en personlighetsbedömning.', { traits: traits.join(', ') })
}

export function ResultsView({ profile }: ResultsViewProps) {
  const { t } = useTranslation()
  const [filterUni, setFilterUni] = useState<boolean | null>(null)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [showComparison, setShowComparison] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'jobs'>('profile')
  const riasecNames = useRiasecNamn()
  // Samma källa som HealthConsentGate läser.
  const harHalsosamtycke = !!useAuthStore((s) => s.profile?.health_consent_at)
  const riasecText = riasecInfo(t)
  const bigFiveText = bigFiveInfo(t)
  const yrken = useYrken()

  /*
    `useJobbmatchningar` (services/useIntresseguideInnehall.ts) skulle ha gjort
    det här, men den skickar `yrken` som ett TREDJE argument till
    `calculateJobMatches`, som bara har två parametrar — extra argument
    ignoreras tyst i JS, och `npx tsc --noEmit` flaggar redan TS2554 på den
    raden. Hooken översätter alltså inte matchningarna i praktiken. Tills
    `calculateJobMatches` får sin tredje parameter görs översättningen här:
    beräkna som vanligt, byt sedan ut varje `occupation` mot den översatta
    posten med samma id.
  */
  const matches = useMemo(() => {
    const yrkeOversattPerId = new Map(yrken.map(o => [o.id, o]))
    return calculateJobMatches(profile, filterUni).map(m => ({
      ...m,
      occupation: yrkeOversattPerId.get(m.occupation.id) ?? m.occupation,
    }))
  }, [profile, filterUni, yrken])
  const topMatches = matches.slice(0, 10)

  const toggleJobSelection = (jobId: string) => {
    const newSelected = new Set(selectedJobs)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedJobs(newSelected)
  }

  const selectedMatches = matches.filter(m => selectedJobs.has(m.occupation.id))

  // RIASEC sorterat, högst först. De tre översta markeras i rutorna.
  const riasecSorterad = Object.entries(profile.riasec).sort(([, a], [, b]) => b - a)
  const topRiasec = riasecSorterad.slice(0, 3)
  const toppNycklar = new Set(topRiasec.map(([k]) => k))

  /*
    Designpasset 2026-10-09 ("för texttungt"). Vyn var ~750 ord och 7 000 px:
    en egen hjälte ("Din unika profil" + ett stycke), tre färgade
    sammanfattningskort som upprepade det som stod längre ner, en knapprad som
    dubblerade resultatfliken (och vars "Dela" kopierade en länk till
    /interest-guide/shared, en sökväg som inte finns), fyra hubbfärger på samma
    sida och en tolkningsruta per avsnitt.

    Nu: de sex arbetsmiljöerna som rutor med ikon och värde — "sex världar" i
    stället för ett spindeldiagram med bokstäver — och förklaringarna bakom
    klick. Allt räknas och visas som förut; ingenting nytt påstås.
  */
  return (
    <div className="space-y-6">
      {/* Flikar: profil / yrkesförslag */}
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('interestGuide.rv.viewLabel', 'Visa')}>
        {([
          { id: 'profile' as const, ikon: BarChart3, text: t('interestGuide.rv.exploreProfile', 'Utforska din profil') },
          { id: 'jobs' as const, ikon: Briefcase, text: t('interestGuide.rv.seeSuggestions', 'Se yrkesförslag') },
        ]).map(({ id, ikon: Ikon, text }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            aria-pressed={activeTab === id}
            className={`px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 border ${
              activeTab === id
                ? 'bg-[var(--c-solid)] text-white dark:text-stone-900 border-[var(--c-solid)]'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-[var(--c-accent)]'
            }`}
          >
            <Ikon className="w-5 h-5" aria-hidden="true" />
            {text}
            {id === 'jobs' && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-black/10 dark:bg-white/20">
                {topMatches.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* RIASEC — de sex arbetsmiljöerna */}
          <section className={SEKTION} aria-labelledby="rv-riasec">
            <h2 id="rv-riasec" className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
              {t('interestGuide.rv.sexVarldar', 'Sex sorters arbete — så svarade du')}
            </h2>

            <ul className="mt-4 grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 m-0">
              {riasecSorterad.map(([key, value]) => {
                const typ = riasecText.types.find(x => x.key === key)
                const Ikon = RIASEC_IKON[key] ?? Target
                const topp = toppNycklar.has(key)
                return (
                  <li
                    key={key}
                    className={`p-3 rounded-xl border ${
                      topp
                        ? 'bg-[var(--c-bg)] border-[var(--c-accent)]'
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        topp ? 'bg-white dark:bg-stone-900/40' : 'bg-stone-100 dark:bg-stone-700'
                      }`}>
                        <Ikon className={`w-5 h-5 ${topp ? 'text-[var(--c-solid)]' : 'text-stone-500 dark:text-stone-400'}`} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-900 dark:text-stone-100 leading-tight">
                          {riasecNames[key] ?? typ?.name ?? key}
                        </p>
                        <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">{typ?.desc}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden" aria-hidden="true">
                        <div
                          className={`h-full rounded-full ${topp ? 'bg-[var(--c-solid)]' : 'bg-stone-400 dark:bg-stone-500'}`}
                          style={{ width: `${(value / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-stone-700 dark:text-stone-300">
                        {t('interestGuide.rv.avFem', '{{value}} av 5', { value })}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>

            <p className="mt-4 text-sm text-stone-700 dark:text-stone-300">
              {interpretRiasec(profile.riasec, t)}
            </p>

            <details className="mt-3 text-sm">
              <summary className="cursor-pointer w-fit text-[var(--c-text)] hover:underline">
                {t('interestGuide.results.howToReadRiasec')}
              </summary>
              <div className="mt-3 space-y-3 text-stone-700 dark:text-stone-300">
                <p>{riasecText.description}</p>
                <p>
                  {t('interestGuide.rv.riasecMeaning', 'De områden där du har högst poäng ({{areas}}) är de miljöer där du troligen trivs bäst. Ju högre poäng, desto starkare är ditt intresse för den miljön.', { areas: topRiasec.map(([k]) => riasecNames[k]).join(', ') })}
                </p>
                <ul className="space-y-1 list-none p-0 m-0">
                  {riasecText.types.map(type => (
                    <li key={type.key}>
                      <span className="font-medium text-stone-900 dark:text-stone-100">{type.name}:</span>{' '}
                      {t('interestGuide.rv.examples', 'Exempel: {{examples}}', { examples: type.examples })}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </section>

          {/* Big Five */}
          <section className={SEKTION} aria-labelledby="rv-bigfive">
            <h2 id="rv-bigfive" className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Brain className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
              {t('interestGuide.rv.bigFiveHeading', 'Big Five - Din personlighetsprofil')}
            </h2>

            <div className="mt-4 max-w-2xl">
              <BigFiveChart scores={profile.bigFive} />
            </div>

            {/* Referatet bär sin egen reservation ("två frågor per drag") och
                står därför kvar synligt. */}
            <p className="mt-4 text-sm text-stone-700 dark:text-stone-300">
              {interpretBigFive(profile.bigFive, t)}
            </p>

            <details className="mt-3 text-sm">
              <summary className="cursor-pointer w-fit text-[var(--c-text)] hover:underline">
                {t('interestGuide.results.understandTraits')}
              </summary>
              <div className="mt-3 space-y-3 text-stone-700 dark:text-stone-300">
                <p>{bigFiveText.description}</p>
                <ul className="space-y-2 list-none p-0 m-0">
                  {bigFiveText.traits.map(trait => (
                    <li key={trait.key}>
                      <span className="font-medium text-stone-900 dark:text-stone-100">{trait.name}</span>
                      {' — '}{trait.desc}. <span className="text-stone-600 dark:text-stone-400">{trait.workImpact}</span>
                    </li>
                  ))}
                </ul>
                <p>{t('interestGuide.rv.bigFiveNoBetter', 'Ingen profil är "bättre" än en annan - olika yrken kräver olika egenskaper. Det viktiga är att hitta ett yrke som passar just dig.')}</p>
              </div>
            </details>
          </section>

          {/* ICF — omsluten av samtyckesgrinden för hälsodata (GDPR art. 9) */}
          <section className={SEKTION} aria-labelledby="rv-icf">
            <h2 id="rv-icf" className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Heart className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
              {t('interestGuide.rv.icfHeading', 'ICF - Dina funktionsförutsättningar')}
            </h2>

            {/* Utan samtycke visar grinden en hel samtyckesruta (~150 ord).
                Den står nu bakom ett klick — samma grind, samma val, men den
                tar inte över sidan för den som inte bett om den. */}
            {harHalsosamtycke ? (
              <div className="mt-4">
                <HealthConsentGate>
                  <div className="max-w-2xl">
                    <ICFSection scores={profile.icf} />
                  </div>
                </HealthConsentGate>
              </div>
            ) : (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer w-fit text-[var(--c-text)] hover:underline">
                  {t('interestGuide.rv.icfKraverSamtycke', 'Den här delen visas bara om du samtycker till hälsodata — läs mer')}
                </summary>
                <div className="mt-3">
                  <HealthConsentGate>
                    <div className="max-w-2xl">
                      <ICFSection scores={profile.icf} />
                    </div>
                  </HealthConsentGate>
                </div>
              </details>
            )}

            <details className="mt-4 text-sm">
              <summary className="cursor-pointer w-fit text-[var(--c-text)] hover:underline">
                {t('interestGuide.rv.icfAbout', 'Om ICF och arbetsanpassningar')}
              </summary>
              <div className="mt-3 space-y-3 text-stone-700 dark:text-stone-300">
                <p>
                  <strong>{t('interestGuide.rv.icfTerm', 'ICF (International Classification of Functioning)')}</strong>{' '}
                  {t('interestGuide.rv.icfDesc', 'är WHO:s ramverk för att beskriva hälsa och funktionsförmåga. Det fokuserar på vad du kan göra, inte på eventuella begränsningar.')}
                </p>
                <p>
                  <strong>{t('interestGuide.results.greenAreasHeading')}</strong>{' '}
                  {t('interestGuide.results.greenAreasDesc')}
                </p>
                <p>
                  <strong>{t('interestGuide.results.yellowRedAreasHeading')}</strong>{' '}
                  {t('interestGuide.results.yellowRedAreasDesc')}
                </p>
                <p>
                  <strong>{t('interestGuide.rv.tipLabel', 'Tips:')}</strong>{' '}
                  {t('interestGuide.rv.icfTip', 'Prata med en arbetskonsulent om vilka stöd och anpassningar som finns tillgängliga för det yrke du är intresserad av. Många arbetsgivare är positiva till anpassningar som gör att du kan prestera ditt bästa.')}
                </p>
                <p>
                  <strong>{t('interestGuide.results.rememberHeading')}</strong>{' '}
                  {t('interestGuide.rv.icfRemember', 'Dina förutsättningar är inte statiska - de kan förändras över tid och variera beroende på situation. Det viktiga är att hitta ett yrke där du kan använda dina styrkor och få stöd där det behövs. Med rätt anpassningar kan de flesta yrken fungera för de flesta människor.')}
                </p>
              </div>
            </details>
          </section>
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <p className="text-sm text-stone-700 dark:text-stone-300">
            {t('interestGuide.rv.matchesLead', 'Här är yrken som ligger nära din profil, med det yrke som ligger närmast dina svar överst. Kom ihåg att detta är förslag - utforska de yrken som känns intressanta för dig!')}
          </p>

          {/* Filter */}
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('interestGuide.explore.filters.educationLevel')}>
            {([
              { varde: null, text: t('interestGuide.rv.allOccupations', 'Alla yrken'), ikon: null },
              { varde: true, text: t('interestGuide.rv.requiresUniversity', 'Kräver högskola'), ikon: GraduationCap },
              { varde: false, text: t('interestGuide.rv.upperSecondary', 'Gymnasium/YH'), ikon: Briefcase },
            ] as const).map(({ varde, text, ikon: Ikon }) => (
              <Button
                key={String(varde)}
                variant={filterUni === varde ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterUni(varde)}
                aria-pressed={filterUni === varde}
                className={filterUni === varde ? 'bg-[var(--c-solid)] text-white dark:text-stone-900' : ''}
              >
                {Ikon && <Ikon className="w-4 h-4 mr-1" aria-hidden="true" />}
                {text}
              </Button>
            ))}
          </div>

          {/* Compare bar */}
          {selectedJobs.size > 0 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 p-4 flex items-center gap-4 z-50 max-w-md w-full mx-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
                <span className="font-medium text-stone-900 dark:text-stone-100">{t('interestGuide.rv.selectedCount', '{{count}} valda', { count: selectedJobs.size })}</span>
              </div>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={() => setSelectedJobs(new Set())}>
                <X className="w-4 h-4 mr-1" aria-hidden="true" />
                {t('common.clear')}
              </Button>
              <Button
                size="sm"
                onClick={() => setShowComparison(true)}
                disabled={selectedJobs.size < 2}
                className="bg-[var(--c-solid)] text-white dark:text-stone-900 hover:brightness-110"
              >
                {t('interestGuide.rv.compare', 'Jämför')}
              </Button>
            </div>
          )}

          {/* Job list */}
          <div className="space-y-3">
            {topMatches.map((match) => (
              <JobCard
                key={match.occupation.id}
                match={match}
                place={matches.indexOf(match) + 1}
                total={matches.length}
                isSelected={selectedJobs.has(match.occupation.id)}
                onSelect={() => toggleJobSelection(match.occupation.id)}
                showCompare={true}
              />
            ))}
          </div>

          <p className="text-center text-sm text-stone-600 dark:text-stone-400">
            {t('interestGuide.rv.showingTop', 'Visar de {{shown}} yrken som ligger närmast dina svar av {{total}} möjliga yrken', { shown: topMatches.length, total: matches.length })}
          </p>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && selectedMatches.length >= 2 && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowComparison(false)}
        >
          <div
            className="bg-white dark:bg-stone-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{t('interestGuide.results.compareOccupations')}</h2>
              <button aria-label={t('common.close')} onClick={() => setShowComparison(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg">
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-stone-800 dark:text-stone-200">
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-stone-50 dark:bg-stone-900/50 rounded-tl-lg">{t('interestGuide.rv.property', 'Egenskap')}</th>
                    {selectedMatches.map(m => (
                      <th key={m.occupation.id} className="p-3 bg-stone-50 dark:bg-stone-900/50 text-center min-w-[150px]">
                        {m.occupation.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border-b border-stone-200 dark:border-stone-700 font-medium">{t('interestGuide.rv.placeRow', 'Plats utifrån dina svar')}</td>
                    {selectedMatches.map(m => (
                      <td key={m.occupation.id} className="p-3 border-b border-stone-200 dark:border-stone-700 text-center text-sm">
                        {t('interestGuide.rv.placeShort', 'Nr {{place}} av {{total}}', { place: matches.indexOf(m) + 1, total: matches.length })}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-stone-200 dark:border-stone-700 font-medium">{t('career.explore.salary')}</td>
                    {selectedMatches.map(m => (
                      <td key={m.occupation.id} className="p-3 border-b border-stone-200 dark:border-stone-700 text-center text-sm">
                        {m.occupation.salary}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-stone-200 dark:border-stone-700 font-medium">{t('interestGuide.jobCard.education', 'Utbildning')}</td>
                    {selectedMatches.map(m => (
                      <td key={m.occupation.id} className="p-3 border-b border-stone-200 dark:border-stone-700 text-center text-sm">
                        {m.occupation.education.length}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-stone-200 dark:border-stone-700 font-medium">{t('interestGuide.rv.prognosis', 'Prognos')}</td>
                    {selectedMatches.map(m => (
                      <td key={m.occupation.id} className="p-3 border-b border-stone-200 dark:border-stone-700 text-center text-sm">
                        {m.occupation.prognosis === 'growing' ? t('interestGuide.jobCard.prognosis.growing', 'Växande') :
                         m.occupation.prognosis === 'declining' ? t('interestGuide.jobCard.prognosis.declining', 'Krympande') : t('interestGuide.jobCard.prognosis.stable', 'Stabil')}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
