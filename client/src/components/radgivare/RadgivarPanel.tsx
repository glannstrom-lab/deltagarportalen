/**
 * Rådgivarna som kolumn i stället för flytande cirkel.  (Steg 4, 2026-08-17)
 *
 * Före: `CoachWidget` låg som en FAB längst ner till höger och täckte innehåll
 * på 17 av 19 verktygssidor, inklusive GDPR-kontrollerna i Inställningar
 * (fynd F25). Innehållet bakom den är inte magert — **25 sidnycklar har
 * rådgivarinnehåll, mappade från 29 routes, noll routes saknar det**: fem
 * rådgivare med tips, vanliga frågor och länkar per sida. Mycket att gömma
 * bakom en ring.
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

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { COACHES, type CoachId } from '@/data/coaches'
import { radgivareForPath } from './radgivarData'

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
  const innehall = radgivareForPath(pathname)
  const coachId = innehall?.coachIds?.[0]
  const tips = coachId ? innehall?.byCoach?.[coachId]?.tips ?? [] : []
  const rad = tips[index]
  if (!coachId || !rad) return null

  const coach = COACHES[coachId]
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

/** Rådgivarkolumnen. Renderar null när sidan saknar innehåll. */
export default function RadgivarPanel({ pathname }: { pathname: string }) {
  const { t } = useTranslation()
  const innehall = radgivareForPath(pathname)
  // Första rådgivaren är utfälld från början. Med båda kollapsade ser panelen
  // tom ut — man möts av två namn utan innehåll, och råden är hela poängen.
  const [oppenCoach, setOppenCoach] = useState<CoachId | null>(
    innehall?.coachIds?.[0] ?? null
  )

  if (!innehall || innehall.coachIds.length === 0) return null

  return (
    <aside
      aria-label={t('radgivare.panelLabel', 'Råd för den här sidan')}
      className="space-y-3"
    >
      {innehall.coachIds.map((id) => {
        const coach = COACHES[id]
        const c = innehall.byCoach[id]
        if (!c) return null
        const utfalld = oppenCoach === id || innehall.coachIds.length === 1

        return (
          <section
            key={id}
            data-domain={coach.accent}
            className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOppenCoach(utfalld && innehall.coachIds.length > 1 ? null : id)}
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
              {innehall.coachIds.length > 1 && (
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
                <ul className="space-y-2 m-0 p-0 list-none">
                  {c.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="text-[12.5px] leading-relaxed text-stone-700 dark:text-stone-300"
                    >
                      {tip}
                    </li>
                  ))}
                </ul>

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
