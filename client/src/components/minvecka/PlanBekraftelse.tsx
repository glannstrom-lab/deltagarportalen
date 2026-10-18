/**
 * KF5 (2026-10-18): "Jag har läst min plan" under Din plan i Min vecka.
 *
 * Tre lägen ur databasen, aldrig ur ett lokalt minne: inte bekräftad, bekräftad
 * (den här versionen), och ändrad sedan bekräftelsen. Laddar/fel visas som
 * sådana — en bekräftelse som inte gick att läsa är inte "inte bekräftad".
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { kortDatum } from '@/lib/datumsprak'
import { planBekraftelseApi, bekraftelseLage } from '@/services/planBekraftelseApi'
import type { ActivityPlan } from '@/services/aktivitetApi'

export function PlanBekraftelse({ plan }: { plan: ActivityPlan }) {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const nyckel = ['min-vecka', 'plan-bekraftelse', plan.id]
  const q = useQuery({ queryKey: nyckel, queryFn: () => planBekraftelseApi.lista(plan.id) })
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState(false)

  const bekrafta = async () => {
    setSparar(true); setFel(false)
    try {
      await planBekraftelseApi.bekrafta(plan)
      await qc.invalidateQueries({ queryKey: nyckel })
    } catch (e) {
      console.error('Planbekräftelsen kunde inte sparas:', e)
      setFel(true)
    } finally { setSparar(false) }
  }

  if (q.isLoading) return <p className="m-0 text-[0.9375rem] text-j-blak-3">…</p>
  if (q.isError || !q.data) return <p className="m-0 mt-3 text-[0.9375rem] text-j-blak-2">{t('minVecka.plan.bekrafta.fel')}</p>

  const lage = bekraftelseLage(plan.updated_at, q.data)
  const datum = lage.lage === 'ej' ? '' : kortDatum(lage.bekraftad, i18n.language)

  return (
    <div className="mt-3 rounded-j-s border border-j-linje p-3 space-y-2">
      {lage.lage === 'aktuell' ? (
        <p className="m-0 text-[0.9375rem] text-j-blak" role="status">{t('minVecka.plan.bekrafta.klart', { datum })}</p>
      ) : (
        <>
          <p className="m-0 text-[0.9375rem] text-j-blak">
            {lage.lage === 'aldre' ? t('minVecka.plan.bekrafta.andrad', { datum }) : t('minVecka.plan.bekrafta.fraga')}
          </p>
          <Button ton="kvarter" variant="secondary" onClick={bekrafta} disabled={sparar}>
            {t('minVecka.plan.bekrafta.knapp')}
          </Button>
          {fel && <p role="alert" className="m-0 text-[0.9375rem] text-red-800 dark:text-red-300">{t('minVecka.plan.bekrafta.fel')}</p>}
        </>
      )}
      <p className="m-0 text-sm text-j-blak-2">{t('minVecka.plan.bekrafta.forklaring')}</p>
    </div>
  )
}
