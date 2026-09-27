/**
 * MinPlan — "Din plan" i Min vecka (RD25, rollspelet 2026-09-27).
 *
 * Sara, som är i Rusta och matcha, såg bara "Demo Coach" och ett projektnamn
 * gömt i Inställningar. Hon visste inte vem hon var hos, vem som bestämt det,
 * att aktivitetsrapporten till Arbetsförmedlingen fortfarande är hennes sak,
 * eller att Demobageriet var hennes praktikplats och vem hon frågar där.
 *
 * Texterna väljs av planens regelverk (planensRegelverk.ts) — och det är samma
 * regel som för kravrutan: **utan belägg nämns ingen myndighet.** Ett okänt
 * regelverk visar bara organisationens namn och vad som räknas.
 *
 * Varje påstående här är belagt: Rusta och matcha ersätter inte
 * aktivitetsrapporten (kunskapsbankens artikel rusta-och-matcha), rapporten
 * lämnas i början av varje månad för månaden innan (aktivitetsrapport-guide),
 * och beslut om försörjningsstöd fattas av socialnämnden (samma mening som
 * närvarointygets sidfot). Ton: lugn vän, en sak i taget (DESIGN.md §1–2).
 */

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { MapPin, Phone } from '@/components/ui/icons'
import { minPraktikApi, type MinPraktik, type PraktikTyp } from '@/services/minPraktikApi'
import type { PlanensRegelverk } from './planensRegelverk'

interface Props {
  regelverk: PlanensRegelverk | null
  orgNamn: string | null
}

/** Hela nycklar som literaler — grinden för döda nycklar ska se dem. */
const PRAKTIK_RUBRIK: Record<PraktikTyp, string> = {
  praktik: 'minVecka.plan.praktik.rubrik.praktik',
  arbetstraning: 'minVecka.plan.praktik.rubrik.arbetstraning',
  arbetsprovning: 'minVecka.plan.praktik.rubrik.arbetsprovning',
  subventionerad_anstallning: 'minVecka.plan.praktik.rubrik.subventionerad_anstallning',
}

export function MinPlan({ regelverk, orgNamn }: Props) {
  const { t } = useTranslation()
  const praktik = useQuery({
    queryKey: ['min-vecka', 'min-praktik'],
    queryFn: () => minPraktikApi.hamtaAktuell(),
    staleTime: 10 * 60_000,
  })

  const hos =
    regelverk === 'leverantor'
      ? orgNamn
        ? t('minVecka.plan.leverantor.hos', { defaultValue: 'Du är hos {{org}}. Det är en leverantör i Rusta och matcha.', org: orgNamn })
        : t('minVecka.plan.leverantor.hosUtanNamn', 'Du är hos en leverantör i Rusta och matcha.')
      : orgNamn
        ? t('minVecka.plan.hos', { defaultValue: 'Du har din plan hos {{org}}.', org: orgNamn })
        : null

  return (
    <Card className="p-5 space-y-3" aria-labelledby="min-plan-rubrik">
      <h2 id="min-plan-rubrik" className="text-base font-semibold text-stone-900 dark:text-stone-100">
        {t('minVecka.plan.rubrik', 'Din plan')}
      </h2>

      {hos && <p className="text-stone-800 dark:text-stone-200">{hos}</p>}

      {regelverk === 'leverantor' && (
        <>
          <p className="text-sm text-stone-700 dark:text-stone-300">
            {t('minVecka.plan.leverantor.beslut', 'Det är Arbetsförmedlingen som har bestämt att du ska vara med i Rusta och matcha. Frågor om din ersättning ställer du till Arbetsförmedlingen.')}
          </p>
          <div>
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              {t('minVecka.plan.rapport.rubrik', 'Aktivitetsrapporten')}
            </h3>
            <p className="text-sm text-stone-700 dark:text-stone-300">
              {t('minVecka.plan.rapport.text', 'Du lämnar din aktivitetsrapport till Arbetsförmedlingen som vanligt, i början av varje månad för månaden innan. Din konsulent här kan hjälpa dig, men det är du som skickar in den.')}
            </p>
            <a href="/guider/aktivitetsrapport-guide/" className="text-sm underline underline-offset-2 text-[var(--c-text)]">
              {t('minVecka.plan.rapport.lank', 'Så gör du med aktivitetsrapporten')}
            </a>
          </div>
        </>
      )}

      {regelverk === 'kommun' && (
        <p className="text-sm text-stone-700 dark:text-stone-300">
          {t('minVecka.plan.kommun.beslut', 'Planen hör ihop med ditt försörjningsstöd. Det är socialnämnden i kommunen som beslutar om försörjningsstöd. Frågor om pengar ställer du till din handläggare där.')}
        </p>
      )}

      <p className="text-sm text-stone-700 dark:text-stone-300">
        {regelverk === 'leverantor'
          ? t('minVecka.plan.raknas.leverantor', 'Det som räknas här är passen i din plan. Din konsulent markerar när du har varit där. Ditt eget jobbsökande skriver du själv i aktivitetsrapporten.')
          : t('minVecka.plan.raknas.vanlig', 'Det som räknas här är passen i din plan. Din konsulent markerar när du har varit där.')}
      </p>

      {praktik.isError && (
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {t('minVecka.plan.praktik.fel', 'Din arbetsplats kunde inte hämtas just nu. Fråga din konsulent om du undrar något.')}
        </p>
      )}
      {praktik.data && <Praktikplats plats={praktik.data} />}
    </Card>
  )
}

function Praktikplats({ plats }: { plats: MinPraktik }) {
  const { t } = useTranslation()
  const tider = [plats.schedule_days?.trim(), plats.hours_per_week ? t('minVecka.plan.praktik.timmar', { defaultValue: '{{count}} timmar i veckan', count: Number(plats.hours_per_week) }) : null]
    .filter(Boolean)
    .join(' · ')
  const sjuk = plats.sick_call_instructions?.trim()
  return (
    <div className="rounded-lg border border-stone-200 dark:border-stone-700 p-3 space-y-1">
      <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">{t(PRAKTIK_RUBRIK[plats.placement_type] ?? PRAKTIK_RUBRIK.praktik)}</h3>
      <p className="text-stone-900 dark:text-stone-100">
        {plats.company_name}
        {plats.occupation ? ` · ${plats.occupation}` : ''}
      </p>
      {plats.address && (
        <p className="flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
          <MapPin className="w-4 h-4" aria-hidden="true" />
          {plats.address}
        </p>
      )}
      {tider && <p className="text-sm text-stone-600 dark:text-stone-400">{tider}</p>}
      {plats.contact_name && (
        <p className="text-sm text-stone-700 dark:text-stone-300">
          {t('minVecka.plan.praktik.kontakt', { defaultValue: 'Din kontakt på arbetsplatsen: {{namn}}', namn: plats.contact_name })}
          {plats.contact_phone && (
            <>
              {' · '}
              <a href={`tel:${plats.contact_phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 underline underline-offset-2 text-[var(--c-text)]">
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                {plats.contact_phone}
              </a>
            </>
          )}
        </p>
      )}
      {(sjuk || plats.sick_call_phone) && (
        <p className="text-sm text-stone-700 dark:text-stone-300">
          {sjuk
            ? t('minVecka.plan.praktik.sjuk', { defaultValue: 'Om du blir sjuk: {{text}}', text: sjuk })
            : t('minVecka.plan.praktik.sjukRing', { defaultValue: 'Om du blir sjuk: ring {{tel}}.', tel: plats.sick_call_phone })}
        </p>
      )}
      <p className="text-xs text-stone-600 dark:text-stone-400">
        {t('minVecka.plan.praktik.raknas', 'Tiden på arbetsplatsen räknas när den ligger som pass i din vecka här nedanför.')}
      </p>
    </div>
  )
}
