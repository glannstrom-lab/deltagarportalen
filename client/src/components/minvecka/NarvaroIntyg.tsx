/**
 * NarvaroIntyg — "Ladda ner närvarointyg" i Min vecka (F5, persona-genomgången
 * 2026-09-12). Deltagarens eget kvitto — till handläggaren på försörjningsstöd
 * eller, för Rusta och matcha, till Arbetsförmedlingen (RD3, 2026-09-27):
 * väljer månad, hämtar månadens pass (RLS: bara egna), organisationens namn ur
 * vyn my_ai_policy, och laddar ner via jsPDF `save()` — aldrig window.open efter
 * ett await (popup-spärren, lärdom 2026-08-23).
 */

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { minVeckaApi, type ActivityPlan } from '@/services/aktivitetApi'
import { downloadNarvaroIntygPDF, valbaraManader, type IntygInput } from '@/services/narvaroIntygPdf'
import { manadOchAr } from '@/lib/datumsprak'
import { regelverkNycklar, type PlanensRegelverk } from './planensRegelverk'
// RD29: hennes egna incheckningar och eget jobbsökande, som egen redovisning
import {
  INTYG_HAR_EGEN_REDOVISNING,
  egenRedovisningAvsnitt,
  egnaIncheckningar,
  hamtaManadensJobbsok,
  type EgenRedovisning,
  type EgenRedovisningAvsnitt,
} from './egenRedovisning'

/**
 * RD29: intyget får deltagarens egen redovisning. Fälten finns inte i
 * `IntygInput` förrän narvaroIntygPdf.ts ritar avsnittet; de skickas med redan
 * nu (en subtyp är tilldelningsbar) så att PDF-sidan bara behöver läsa dem.
 */
type IntygMedEgenRedovisning = IntygInput & {
  egenRedovisning?: EgenRedovisning
  egenRedovisningAvsnitt?: EgenRedovisningAvsnitt
}

interface Props {
  plan: ActivityPlan
  /**
   * RD3: vem intyget visas för. `kommun` → handläggaren på försörjningsstöd,
   * `leverantor` → Arbetsförmedlingen, `null` (okänt) → neutral text.
   */
  regelverk?: PlanensRegelverk | null
}

function manadensGranser(manad: string): { from: string; to: string } {
  const [y, m] = manad.split('-').map(Number)
  const sista = new Date(y, m, 0).getDate()
  return { from: `${manad}-01`, to: `${manad}-${String(sista).padStart(2, '0')}` }
}

export function NarvaroIntyg({ plan, regelverk = null }: Props) {
  const { t, i18n } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  const manader = useMemo(() => valbaraManader(plan.start_date), [plan.start_date])
  const [manad, setManad] = useState(manader[0])
  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [klart, setKlart] = useState<string | null>(null)

  const laddaNer = async () => {
    setLaddar(true)
    setFel(null)
    setKlart(null)
    try {
      const { from, to } = manadensGranser(manad)
      const [sessions, policy, jobbsok] = await Promise.all([
        minVeckaApi.listMySessions(from, to),
        supabase.from('my_ai_policy').select('org_name').limit(1),
        // Ett läsfel stoppar inte intyget — avsnittet säger då att uppgiften saknas.
        hamtaManadensJobbsok(manad).catch((e: unknown) => {
          console.warn('[NarvaroIntyg] eget jobbsökande kunde inte hämtas', e)
          return null
        }),
      ])
      const orgName = (policy.data?.[0] as { org_name?: string | null } | undefined)?.org_name ?? null
      const namn = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim()
      const egenRedovisning: EgenRedovisning = { incheckningar: egnaIncheckningar(sessions, manad), jobbsok }
      const input: IntygMedEgenRedovisning = {
        participantName: namn || profile?.email || 'Deltagare',
        organizationName: orgName,
        manad,
        sessions,
        regelverk,
        egenRedovisning,
        egenRedovisningAvsnitt: egenRedovisningAvsnitt(egenRedovisning),
        // RK40: planens ärendenummer på intyget, så handläggaren kan matcha utan personnummer.
        caseReference: (plan as { case_reference?: string | null }).case_reference ?? null,
      }
      await downloadNarvaroIntygPDF(input)
      setKlart(t('minVecka.intyg.klart', { defaultValue: 'Intyget för {{manad}} är nedladdat.', manad: manadOchAr(manad, i18n.language) }))
    } catch {
      setFel(t('minVecka.intyg.fel', 'Intyget kunde inte skapas just nu. Försök igen om en stund.'))
    } finally {
      setLaddar(false)
    }
  }

  return (
    <Card className="p-5 space-y-3">
      <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">{t('minVecka.intyg.rubrik', 'Närvarointyg')}</h2>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        {t(regelverkNycklar(regelverk).intyg)}
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="intyg-manad" className="block text-sm font-medium text-stone-800 dark:text-stone-200 mb-1">
            {t('minVecka.intyg.manad', 'Månad')}
          </label>
          <select
            id="intyg-manad"
            value={manad}
            onChange={(e) => setManad(e.target.value)}
            className="min-h-11 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 text-sm text-stone-900 dark:text-stone-100"
          >
            {manader.map((m) => (
              <option key={m} value={m}>{manadOchAr(m, i18n.language)}</option>
            ))}
          </select>
        </div>
        <Button className="min-h-11" onClick={laddaNer} disabled={laddar}>
          {laddar ? t('minVecka.intyg.skapar', 'Skapar …') : t('minVecka.intyg.knapp', 'Ladda ner närvarointyg')}
        </Button>
      </div>
      {INTYG_HAR_EGEN_REDOVISNING && (
        <p className="text-xs text-stone-600 dark:text-stone-400">
          {t('minVecka.intyg.egenRedovisning', 'Intyget visar också dina egna incheckningar och ditt jobbsökande i Jobin, som din egen redovisning.')}
        </p>
      )}
      <p className="text-xs text-stone-500 dark:text-stone-400">
        {t('minVecka.intyg.forbehall', 'Bara pass som konsulenten markerat som närvarande räknas som närvaro. Pass utan markering står som "ej markerat".')}
      </p>
      {klart && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{klart}</p>}
      {fel && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{fel}</p>}
    </Card>
  )
}
