/**
 * NarvaroIntyg — "Ladda ner närvarointyg" i Min vecka (F5, persona-genomgången
 * 2026-09-12). Deltagarens eget kvitto till handläggaren på försörjningsstöd:
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
import { downloadNarvaroIntygPDF, manadsEtikett, valbaraManader } from '@/services/narvaroIntygPdf'

interface Props {
  plan: ActivityPlan
}

function manadensGranser(manad: string): { from: string; to: string } {
  const [y, m] = manad.split('-').map(Number)
  const sista = new Date(y, m, 0).getDate()
  return { from: `${manad}-01`, to: `${manad}-${String(sista).padStart(2, '0')}` }
}

export function NarvaroIntyg({ plan }: Props) {
  const { t } = useTranslation()
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
      const [sessions, policy] = await Promise.all([
        minVeckaApi.listMySessions(from, to),
        supabase.from('my_ai_policy').select('org_name').limit(1),
      ])
      const orgName = (policy.data?.[0] as { org_name?: string | null } | undefined)?.org_name ?? null
      const namn = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim()
      await downloadNarvaroIntygPDF({ participantName: namn || profile?.email || 'Deltagare', organizationName: orgName, manad, sessions })
      setKlart(t('minVecka.intyg.klart', { defaultValue: 'Intyget för {{manad}} är nedladdat.', manad: manadsEtikett(manad) }))
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
        {t('minVecka.intyg.text', 'Ett intyg för en månad med dina pass och vad konsulenten markerat. Du kan visa det för din handläggare på försörjningsstöd.')}
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
              <option key={m} value={m}>{manadsEtikett(m)}</option>
            ))}
          </select>
        </div>
        <Button className="min-h-11" onClick={laddaNer} disabled={laddar}>
          {laddar ? t('minVecka.intyg.skapar', 'Skapar …') : t('minVecka.intyg.knapp', 'Ladda ner närvarointyg')}
        </Button>
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        {t('minVecka.intyg.forbehall', 'Bara pass som konsulenten markerat som närvarande räknas som närvaro. Pass utan markering står som "ej markerat".')}
      </p>
      {klart && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{klart}</p>}
      {fel && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{fel}</p>}
    </Card>
  )
}
