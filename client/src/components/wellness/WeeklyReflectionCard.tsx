/**
 * WeeklyReflectionCard — veckoreflektion för deltagare utanför STA (G12)
 *
 * STA-deltagare får en veckosammanställning via `sta-week-summary` (skriven
 * till konsulenten). Den här ytan ger samma sorts återblick till alla andra —
 * men skriven TILL deltagaren, av deltagarens egna dagboksanteckningar och
 * måendeloggar från de senaste 7 dagarna.
 *
 * Designval som är medvetna, inte tillfälligheter:
 *
 *  - **Ingen automatisk generering.** Deltagaren trycker själv. Dagbok och
 *    mående är art. 9-data; att skicka det till en AI-leverantör i USA utan
 *    att personen bett om det vore fel, och en oombedd analys av någons
 *    mående är påträngande även när den är välmenande.
 *  - **Ingen knapp när det inte finns underlag.** Ett tomt tillstånd som
 *    lovar en reflektion och sedan levererar "inget att säga" är sämre än
 *    ett ärligt "här samlas din vecka när du skrivit något".
 *  - **Art 50-märkning** på det genererade innehållet.
 *  - **Inga siffror, ingen streak, ingen bedömning.** DESIGN.md §1.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, RefreshCw, NotebookPen } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AIGeneratedWatermark } from '@/components/ai/AIBadge'
import { callAI } from '@/services/aiApi'
import { safeParseAiResponse, VeckoReflektionSchema, type VeckoReflektion } from '@/services/aiSchemas'
import { diaryEntriesApi, moodLogsApi } from '@/services/diaryApi'

/** ISO-datum (YYYY-MM-DD) för dagens datum minus n dagar. */
function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

export function WeeklyReflectionCard() {
  const { t } = useTranslation()
  const [reflection, setReflection] = useState<VeckoReflektion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = isoDaysAgo(7)
  const to = isoDaysAgo(0)

  // Underlaget hämtas oavsett — vi behöver veta OM det finns något innan vi
  // erbjuder knappen. Cachat i 5 min; samma data som dagbokssidan läser.
  const { data: week, isLoading: weekLoading } = useQuery({
    queryKey: ['weekly-reflection-source', from, to],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [diary, moods] = await Promise.all([
        diaryEntriesApi.getByDateRange(from, to),
        moodLogsApi.getByDateRange(from, to),
      ])
      return { diary, moods }
    },
  })

  const hasSource = (week?.diary.length ?? 0) > 0 || (week?.moods.length ?? 0) > 0

  const generate = useCallback(async () => {
    if (!week) return
    setLoading(true)
    setError(null)
    try {
      const response = await callAI<unknown>('vecko-reflektion', {
        diary: week.diary.map(d => ({
          date: d.entry_date,
          content: d.content,
          tags: d.tags,
        })),
        moods: week.moods.map(m => ({
          date: m.log_date,
          mood: m.mood_level,
          energy: m.energy_level,
          note: m.note,
        })),
      })

      const parsed = safeParseAiResponse(
        VeckoReflektionSchema,
        (response as { reflektion?: unknown }).reflektion
      )
      if (!parsed.success || !parsed.data) {
        setError(t('weeklyReflection.failed', 'Vi kunde inte skapa en reflektion just nu. Dina anteckningar är orörda.'))
        return
      }
      setReflection(parsed.data)
    } catch {
      setError(t('weeklyReflection.failed', 'Vi kunde inte skapa en reflektion just nu. Dina anteckningar är orörda.'))
    } finally {
      setLoading(false)
    }
  }, [week, t])

  if (weekLoading) return null

  return (
    <section aria-labelledby="weekly-reflection-heading">
      <div className="flex items-center gap-2.5 mb-3.5">
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[var(--c-solid)] flex-shrink-0" />
        <h2
          id="weekly-reflection-heading"
          className="text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--c-text)] m-0"
        >
          {t('weeklyReflection.heading', 'Din vecka')}
        </h2>
        <div className="flex-1 h-px bg-[var(--c-accent)] opacity-60" />
      </div>

      <Card className="p-5 sm:p-6">
        {!hasSource ? (
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="w-10 h-10 rounded-[10px] bg-[var(--c-bg)] text-[var(--c-text)] flex items-center justify-center flex-shrink-0"
            >
              <NotebookPen className="w-[18px] h-[18px]" />
            </span>
            <p className="text-[14px] text-[var(--stone-600)] leading-relaxed m-0">
              {t(
                'weeklyReflection.empty',
                'Här samlas en tillbakablick på din vecka när du har skrivit i dagboken eller loggat ditt mående.'
              )}
            </p>
          </div>
        ) : reflection ? (
          <div data-ai-generated="true">
            <p className="text-[15px] text-[var(--stone-900)] leading-relaxed m-0">
              {reflection.summary}
            </p>

            {!!reflection.noticed?.length && (
              <ul className="mt-4 space-y-1.5 list-disc list-inside text-[14px] text-[var(--stone-700)]">
                {reflection.noticed.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            )}

            {reflection.gentleSuggestion && (
              <p className="mt-4 text-[14px] text-[var(--c-text)] leading-relaxed m-0">
                {reflection.gentleSuggestion}
              </p>
            )}

            <AIGeneratedWatermark contentType="innehåll" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-[14px] text-[var(--stone-600)] leading-relaxed m-0">
              {t(
                'weeklyReflection.prompt',
                'Vill du se en kort tillbakablick på veckan, utifrån det du själv har skrivit?'
              )}
            </p>
            <Button onClick={generate} disabled={loading} className="flex-shrink-0">
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  {t('weeklyReflection.loading', 'Läser din vecka …')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                  {t('weeklyReflection.cta', 'Visa min vecka')}
                </>
              )}
            </Button>
          </div>
        )}

        {error && (
          <p role="status" className="mt-4 text-[14px] text-amber-700 dark:text-amber-300 m-0">
            {error}
          </p>
        )}
      </Card>
    </section>
  )
}

export default WeeklyReflectionCard
