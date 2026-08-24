/**
 * Rådgivarna som kolumn i stället för flytande cirkel.  (Steg 4, 2026-08-17)
 *
 * Före: `CoachWidget` låg som en FAB längst ner till höger och täckte innehåll
 * på 17 av 19 verktygssidor, inklusive GDPR-kontrollerna i Inställningar
 * (fynd F25). Innehållet bakom den är inte magert — **25 sidnycklar med
 * rådgivarinnehåll, mappade från 29 rutter**: fem rådgivare med tips, vanliga
 * frågor och länkar per sida. Mycket att gömma bakom en ring.
 *
 * Rättat 2026-08-17: den här raden påstod tidigare att *noll* rutter saknar
 * innehåll. Uppmätt mot `navHubs[].memberPaths` saknar **tre** det — `/`,
 * `/help` och `/nätverk`. På dem renderar panelen null, vilket är rätt
 * beteende men värt att veta innan man felsöker en tom högerkolumn.
 *
 * `/nätverk` var dessutom dubbelt drabbad: den nåddes procentkodad och kunde
 * inte matcha sin literal ens om innehållet hade funnits. Se `lib/sokvag.ts`.
 *
 * Efter: en kolumn till höger på breda skärmar, i dokumentflödet. Den täcker
 * ingenting och försvinner inte när man skrollar förbi.
 *
 * ── Två nivåer med olika uppgift ───────────────────────────────────────────
 *
 *   `RadgivarPanel`  — rådgivaren som person. Namn, roll, alla tips och
 *                      frågor. Alltid nåbar, aldrig i vägen.
 *   `RadgivarTips`   — ETT råd, infogat där arbetet sker. Skillnaden mot en
 *                      ring i hörnet: rådet kommer till användaren i stället
 *                      för att vänta på att bli klickat.
 *
 * Panelen är fällbar och minns valet (`showCoachWidget` i settingsStore, samma
 * inställning som styrde FAB:en). Den som stängt av rådgivaren ska inte få
 * tillbaka den av en omdesign.
 *
 * Innehållet kommer ur `data/coaches.ts` — samma källa som FAB:en använde.
 * Ingen text är omskriven, ingen är påhittad.
 */

import { useLayoutEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { COACHES, getPageKeyForPath, type CoachId } from '@/data/coaches'
import { useInnehall } from '@/data/oversattningar'
import { radgivareForPath } from './radgivarData'
import { useRadgivarTipsApi, useVisadeTips } from './radgivarKontext'

function Avatar({ id, stor = false }: { id: CoachId; stor?: boolean }) {
  const c = COACHES[id]
  return (
    <img
      src={stor ? c.avatar : c.avatarSm}
      alt=""
      aria-hidden="true"
      className={cn('rounded-full object-cover shrink-0', stor ? 'w-10 h-10' : 'w-7 h-7')}
      loading="lazy"
    />
  )
}

/**
 * ETT råd, infogat i sidans flöde.
 *
 * Används där en sektion har ett tips som hör just dit — som kompetensdelen i
 * CV-byggaren. Visar första tipset från den första rådgivare sidan har, och
 * pekar vidare till panelen för resten.
 */
export function RadgivarTips({ pathname, index = 0 }: { pathname: string; index?: number }) {
  const { t } = useTranslation()
  const sidnyckel = getPageKeyForPath(pathname)
  const raInnehall = radgivareForPath(pathname)
  // Råden och FAQ:erna är innehåll, inte gränssnittstext — de bor i
  // `data/coaches.ts` och översätts genom overlayen, inte genom i18next.
  const innehall = useInnehall('coaches', raInnehall, `PAGE_COACH_CONTENT.${sidnyckel ?? ''}`)
  const COACHES_T = useInnehall('coaches', COACHES, 'COACHES')
  const coachId = innehall?.coachIds?.[0]
  const tips = coachId ? innehall?.byCoach?.[coachId]?.tips ?? [] : []
  const rad = tips[index]

  // Tala om för kolumnen att det här rådet redan är sagt, så att den inte
  // upprepar det. Hooken ligger före den tidiga returen nedan — hookordningen
  // måste vara densamma varje rendering.
  //
  // Beroendelistan är avsiktligt bara stabila värden. Ett tidigare utkast
  // hade hela kontextobjektet här och loopade sönder sidan; se radgivarKontext.ts.
  const tipsApi = useRadgivarTipsApi()
  useLayoutEffect(() => {
    if (!rad || !tipsApi) return
    tipsApi.registrera(rad)
    return () => tipsApi.avregistrera(rad)
  }, [rad, tipsApi])

  if (!coachId || !rad) return null

  const coach = COACHES_T[coachId]
  return (
    <aside
      data-domain={coach.accent}
      aria-label={t('radgivare.tipFrom', { defaultValue: 'Råd från {{namn}}', namn: coach.name })}
      className="my-4 rounded-lg border border-stone-200 dark:border-stone-700 border-l-[3px] border-l-[var(--c-solid)] bg-stone-50 dark:bg-stone-800/50 px-4 py-3"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Avatar id={coachId} />
        <span className="text-[12.5px] font-semibold text-stone-900 dark:text-stone-100">
          {coach.name}, {coach.role.toLowerCase()}
        </span>
        {tips.length > 1 && (
          <span className="ml-auto text-[11px] text-stone-500 dark:text-stone-400">
            {t('radgivare.moreTips', { defaultValue: '{{count}} råd till', count: tips.length - 1 })}
          </span>
        )}
      </div>
      <p className="m-0 text-[12.5px] leading-relaxed text-stone-700 dark:text-stone-300 max-w-[58ch]">
        {rad}
      </p>
    </aside>
  )
}

/**
 * Rådgivarkolumnen. Renderar null när sidan saknar innehåll.
 *
 * `iKolumn` skiljer de två platserna panelen kan hamna på:
 *
 *   true  — egen kolumn till höger (xl+). Första rådgivaren är utfälld: med
 *           båda kollapsade ser kolumnen tom ut, och råden är hela poängen.
 *   false — sist i flödet, under sidans innehåll (under xl). Här är allt
 *           kollapsat, eftersom sidan då oftast redan visat samma rådgivares
 *           första tips infogat via `RadgivarTips`. Uppmätt på /resources vid
 *           390 px: Daniels råd stod ordagrant två gånger på samma sida.
 */
export default function RadgivarPanel({
  pathname,
  iKolumn = true,
}: {
  pathname: string
  iKolumn?: boolean
}) {
  const { t } = useTranslation()
  const sidnyckel = getPageKeyForPath(pathname)
  const raInnehall = radgivareForPath(pathname)
  const innehall = useInnehall('coaches', raInnehall, `PAGE_COACH_CONTENT.${sidnyckel ?? ''}`)
  const COACHES_T = useInnehall('coaches', COACHES, 'COACHES')
  const visadeRad = useVisadeTips()
  const forstaCoach = innehall?.coachIds?.[0] ?? null
  const [oppenCoach, setOppenCoach] = useState<CoachId | null>(iKolumn ? forstaCoach : null)

  /**
   * Nollställ vid sidbyte.
   *
   * Panelen monteras inte om vid klientnavigering — bara `pathname`-propen
   * ändras. `oppenCoach` låg därför kvar från förra sidan, och eftersom
   * varje sida har sin egen uppsättning rådgivare pekade den ofta på någon
   * som inte finns här. Uppmätt 2026-08-18 med en navigering /jobb → /karriar
   * → /resurser → /min-vardag:
   *
   *   /jobb        Andreas utfälld     (råkade vara först)
   *   /karriar     ANDRA posten utfälld — 'jobbcoach' låg kvar
   *   /resurser    ingen utfälld       — 'jobbcoach' finns inte här
   *   /min-vardag  ingen utfälld
   *
   * En helt hopfälld kolumn är samma fel som den tomma kolumnen: 324 px som
   * ser ut som marginal. Direktladdning av samma sida såg däremot rätt ut, så
   * felet fanns bara på den väg riktiga användare tar.
   *
   * Justering under render i stället för `useEffect` — React dokumenterar det
   * som rätt mönster när tillstånd ska följa en prop, och det slipper en extra
   * rendering med fel innehåll.
   */
  const [senastePath, setSenastePath] = useState(pathname)
  if (pathname !== senastePath) {
    setSenastePath(pathname)
    setOppenCoach(iKolumn ? forstaCoach : null)
  }

  if (!innehall || innehall.coachIds.length === 0) return null

  return (
    <aside
      aria-label={t('radgivare.panelLabel', 'Råd för den här sidan')}
      className="space-y-3"
    >
      {innehall.coachIds.map((id) => {
        const coach = COACHES_T[id]
        const c = innehall.byCoach[id]
        if (!c) return null
        // Hoppa över råd som redan står infogade i sidans flöde — annars
        // säger de två ytorna samma sak inom samma vy.
        const kvarvarandeTips = c.tips.filter((tip) => !visadeRad.has(tip))
        // I kolumnen med bara en rådgivare finns inget att växla mellan — då
        // står den öppen. Sist i flödet ska den däremot alltid gå att fälla
        // ihop, även om den är ensam, annars upprepar den det infogade rådet.
        const kanFallas = innehall.coachIds.length > 1 || !iKolumn
        const utfalld = oppenCoach === id || !kanFallas

        return (
          <section
            key={id}
            data-domain={coach.accent}
            className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOppenCoach(utfalld && kanFallas ? null : id)}
              aria-expanded={utfalld}
              className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--c-solid)]"
            >
              <Avatar id={id} stor />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-stone-900 dark:text-stone-100">
                  {coach.name}
                </span>
                <span className="block text-[11.5px] text-stone-500 dark:text-stone-400 truncate">
                  {coach.role}
                </span>
              </span>
              {kanFallas && (
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'w-4 h-4 text-stone-400 shrink-0 transition-transform',
                    utfalld && 'rotate-180'
                  )}
                />
              )}
            </button>

            {utfalld && (
              <div className="px-3.5 pb-3.5 space-y-3">
                {kvarvarandeTips.length > 0 && (
                <ul className="space-y-2 m-0 p-0 list-none">
                  {kvarvarandeTips.map((tip, i) => (
                    <li
                      key={i}
                      className="text-[12.5px] leading-relaxed text-stone-700 dark:text-stone-300"
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
                )}

                {c.faqs && c.faqs.length > 0 && (
                  <div className="pt-2.5 border-t border-stone-200 dark:border-stone-700">
                    <p className="m-0 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      {t('radgivare.faq', 'Vanliga frågor')}
                    </p>
                    {c.faqs.map((f, i) => (
                      <details key={i} className="group">
                        <summary className="cursor-pointer list-none text-[12.5px] font-medium text-stone-800 dark:text-stone-200 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] rounded">
                          {f.question}
                        </summary>
                        <p className="mt-1 mb-2 text-[12px] leading-relaxed text-stone-600 dark:text-stone-400">
                          {f.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                )}

                {c.links && c.links.length > 0 && (
                  <div className="pt-2.5 border-t border-stone-200 dark:border-stone-700 flex flex-wrap gap-2">
                    {c.links.map((l) => (
                      <Link
                        key={l.href}
                        to={l.href}
                        className="text-[12px] font-medium text-[var(--c-text)] dark:text-[var(--c-solid)] underline underline-offset-2"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )
      })}
    </aside>
  )
}
