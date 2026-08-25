/**
 * Aktivitetsrapporten (O3, 2026-08-25).
 *
 * Sammanställer de jobb användaren sökt en viss månad, i den ordning
 * Arbetsförmedlingen frågar efter dem på Mina sidor. Underlaget finns redan i
 * ansökningarna — det här är vyn som saknades.
 *
 * Vi skickar ingenting till Arbetsförmedlingen. Det finns inget API att skicka
 * till, och en "skickad"-bekräftelse vi inte kan belägga vore ett påhittat
 * värde. Vyn producerar ett underlag att skriva ut eller kopiera.
 *
 * Uträkningen ligger i `aktivitetsrapport.ts` så att den går att testa utan
 * att rendera.
 */

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Printer, Copy, Check, AlertCircle } from '@/components/ui/icons'
import { Card, Button, EmptyState, ErrorState } from '@/components/ui'
import { notifications } from '@/lib/toast'
import { useApplications } from '@/hooks/useApplications'
import { getStatusLabel, type ApplicationMethod } from '@/types/application.types'
import {
  byggManadsrapport,
  foreslagenManad,
  manadsalternativ,
  type Manadsnyckel,
  type Rapportrad,
} from './aktivitetsrapport'

/** Klassen som utskriftsreglerna i `styles/accessibility.css` hakar på. */
const UTSKRIFTSKLASS = 'aktivitetsrapport-sida'

function manadsetikett(manad: Manadsnyckel, sprak: string): string {
  const [år, mån] = manad.split('-').map(Number)
  // Dag 1 i lokal tid — `new Date('2026-03')` tolkas som UTC och kan hamna i
  // föregående månad väster om Greenwich.
  const datum = new Date(år, mån - 1, 1)
  const formatterad = datum.toLocaleDateString(sprak === 'en' ? 'en-GB' : 'sv-SE', {
    month: 'long',
    year: 'numeric',
  })
  return formatterad.charAt(0).toUpperCase() + formatterad.slice(1)
}

export function ApplicationsActivityReport() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { applications, isLoading, error, refetch } = useApplications()

  const [manad, setManad] = useState<Manadsnyckel>(() => foreslagenManad())
  const [kopierad, setKopierad] = useState(false)

  // Utskriftsreglerna gäller bara medan klassen sitter på body — samma mönster
  // som artikelsidan använder. Måste tas bort vid avmontering, annars skriver
  // nästa sida ut som en aktivitetsrapport.
  useEffect(() => {
    document.body.classList.add(UTSKRIFTSKLASS)
    return () => document.body.classList.remove(UTSKRIFTSKLASS)
  }, [])

  const alternativ = useMemo(() => manadsalternativ(applications), [applications])
  const rapport = useMemo(
    () => byggManadsrapport(applications, manad),
    [applications, manad]
  )

  const metodEtikett = (metod: ApplicationMethod | null): string =>
    metod
      ? t(`applications.form.methods.${metod}`, metod)
      : t('applications.activityReport.notFilledIn', 'Inte ifyllt')

  const somText = (rader: Rapportrad[]): string => {
    const rubrik = t('applications.activityReport.title', 'Underlag för aktivitetsrapport')
    const huvud = [
      t('applications.activityReport.columns.date', 'Datum'),
      t('applications.activityReport.columns.employer', 'Arbetsgivare'),
      t('applications.activityReport.columns.role', 'Tjänst'),
      t('applications.activityReport.columns.method', 'Hur du sökte'),
      t('applications.activityReport.columns.outcome', 'Vad det ledde till'),
    ].join('\t')

    const kroppen = rader.map((r) =>
      [
        r.datum,
        r.arbetsgivare ?? metodEtikett(null),
        r.tjanst ?? metodEtikett(null),
        metodEtikett(r.hurDuSokte),
        getStatusLabel(r.resultat, i18n.language === 'en' ? 'en' : 'sv'),
      ].join('\t')
    )

    return [`${rubrik} — ${manadsetikett(manad, i18n.language)}`, '', huvud, ...kroppen].join('\n')
  }

  const kopiera = async () => {
    try {
      await navigator.clipboard.writeText(somText(rapport.rader))
      setKopierad(true)
      setTimeout(() => setKopierad(false), 2000)
    } catch {
      notifications.error(
        t(
          'applications.activityReport.copyFailed',
          'Kunde inte kopiera. Markera texten i tabellen och kopiera för hand.'
        )
      )
    }
  }

  if (isLoading) {
    return (
      <Card className="p-8">
        <p className="text-sm text-[var(--c-text-muted)]" role="status" aria-live="polite">
          {t('applications.activityReport.loading', 'Hämtar dina ansökningar …')}
        </p>
      </Card>
    )
  }

  if (error) {
    return (
      <ErrorState
        title={t('applications.activityReport.errorTitle', 'Underlaget kunde inte hämtas')}
        message={t(
          'applications.activityReport.errorDescription',
          'Vi når inte dina ansökningar just nu. En ofullständig rapport är sämre än ingen, så vi visar den inte.'
        )}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 sm:p-6 aktivitetsrapport-utskrift">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-prose">
            <h2 className="text-lg font-semibold text-[var(--c-text)]">
              {t('applications.activityReport.title', 'Underlag för aktivitetsrapport')}
            </h2>
            <p className="mt-1 text-sm text-[var(--c-text-muted)]">
              {t(
                'applications.activityReport.intro',
                'Här är de jobb du sökt under månaden, i den ordning Arbetsförmedlingen frågar efter dem. Skriv ut listan eller kopiera den, och fyll i den på Mina sidor.'
              )}
            </p>
            <p className="mt-2 text-xs text-[var(--c-text-muted)]">
              {t(
                'applications.activityReport.noSubmitNote',
                'Jobin skickar ingenting till Arbetsförmedlingen. Du fyller i rapporten själv.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 aktivitetsrapport-atgardsrad">
            <label className="sr-only" htmlFor="aktivitetsrapport-manad">
              {t('applications.activityReport.monthLabel', 'Välj månad')}
            </label>
            <select
              id="aktivitetsrapport-manad"
              value={manad}
              onChange={(e) => setManad(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[var(--c-border)] bg-[var(--surface)] px-3 text-sm text-[var(--c-text)]"
            >
              {alternativ.map((m) => (
                <option key={m} value={m}>
                  {manadsetikett(m, i18n.language)}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={() => window.print()}
              disabled={rapport.rader.length === 0}
            >
              <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('applications.activityReport.print', 'Skriv ut')}
            </Button>

            <Button
              variant="outline"
              onClick={kopiera}
              disabled={rapport.rader.length === 0}
            >
              {kopierad ? (
                <Check className="mr-2 h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {kopierad
                ? t('applications.activityReport.copied', 'Kopierat')
                : t('applications.activityReport.copy', 'Kopiera som text')}
            </Button>
          </div>
        </div>

        {rapport.utanDatum > 0 && (
          <div
            className="mt-4 flex items-start gap-2 rounded-lg border border-[var(--c-border)] bg-[var(--c-bg)] p-3 text-sm text-[var(--c-text)] aktivitetsrapport-atgardsrad"
            role="status"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {t('applications.activityReport.missingDate', {
                count: rapport.utanDatum,
                defaultValue_one:
                  'En sökt ansökan saknar datum och kommer inte med i någon månad. Lägg till ansökningsdatum på kortet så hamnar den rätt.',
                defaultValue_other:
                  '{{count}} sökta ansökningar saknar datum och kommer inte med i någon månad. Lägg till ansökningsdatum på korten så hamnar de rätt.',
              })}
            </span>
          </div>
        )}

        {rapport.rader.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={ClipboardList}
              title={t(
                'applications.activityReport.emptyTitle',
                'Inga sökta jobb registrerade den här månaden'
              )}
              description={t(
                'applications.activityReport.emptyDescription',
                'När du markerar en ansökan som skickad och fyller i datumet hamnar den här.'
              )}
              action={{
                label: t('applications.activityReport.emptyAction', 'Gå till tavlan'),
                onClick: () => navigate('/applications'),
              }}
            />
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm font-medium text-[var(--c-text)]">
              {t('applications.activityReport.summary', {
                count: rapport.rader.length,
                month: manadsetikett(manad, i18n.language),
                defaultValue_one: '1 jobb sökt i {{month}}',
                defaultValue_other: '{{count}} jobb sökta i {{month}}',
              })}
            </p>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <caption className="sr-only">
                  {t('applications.activityReport.tableCaption', {
                    month: manadsetikett(manad, i18n.language),
                    defaultValue: 'Sökta jobb i {{month}}',
                  })}
                </caption>
                <thead>
                  <tr className="border-b border-[var(--c-border)] text-left">
                    <th scope="col" className="py-2 pr-3 font-medium">
                      {t('applications.activityReport.columns.date', 'Datum')}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      {t('applications.activityReport.columns.employer', 'Arbetsgivare')}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      {t('applications.activityReport.columns.role', 'Tjänst')}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      {t('applications.activityReport.columns.method', 'Hur du sökte')}
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      {t('applications.activityReport.columns.outcome', 'Vad det ledde till')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rapport.rader.map((rad) => (
                    <tr key={rad.id} className="border-b border-[var(--c-border)] align-top">
                      <td className="py-2 pr-3 tabular-nums whitespace-nowrap">{rad.datum}</td>
                      <td className="py-2 pr-3">
                        {rad.arbetsgivare ?? (
                          <span className="text-[var(--c-text-muted)]">{metodEtikett(null)}</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {rad.tjanst ?? (
                          <span className="text-[var(--c-text-muted)]">{metodEtikett(null)}</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {rad.hurDuSokte ? (
                          metodEtikett(rad.hurDuSokte)
                        ) : (
                          <span className="text-[var(--c-text-muted)]">{metodEtikett(null)}</span>
                        )}
                      </td>
                      <td className="py-2">
                        {getStatusLabel(rad.resultat, i18n.language === 'en' ? 'en' : 'sv')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default ApplicationsActivityReport
