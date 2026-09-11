/**
 * IvoUnderlagSektion — kvartalsunderlag till IVO + AF-checklista (KM7).
 *
 * Kommunen ska från januari 2027 rapportera kvartalsvis till IVO hur många
 * som anvisats aktivitet och hur många som nekats eller fått nedsatt stöd,
 * per försörjningshinder. Det här kortet räknar ur portalens planer och pass
 * (`ivoKvartal.ts`). Det är ett UNDERLAG: beslut om nekande/nedsättning
 * fattas av socialnämnden och registreras i kommunens verksamhetssystem;
 * IVO:s e-tjänst matas för hand. Inget API finns mot IVO eller
 * Arbetsförmedlingen — därför en checklista i stället för en synk.
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */

import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Download, FileText, CheckCircle2 } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { aktivitetsplanApi, type ActivityPlan, type ActivitySession } from '@/services/aktivitetApi'
import { ivoKvartalsunderlag, kvartalForDatum, kvartalGranser, tillTsv, type Kvartal } from '@/services/ivoKvartal'
import { formatLocalDate } from '@/services/aktivitetSchema'
import { fetchCachedConsultantParticipants } from '@/pages/consultant/consultantParticipantsQuery'
import { langtDatum } from './aktivitetEtiketter'

type Lage =
  | { status: 'laddar' }
  | { status: 'fel'; fel: string }
  | { status: 'klart'; plans: ActivityPlan[]; sessions: ActivitySession[]; namn: Map<string, string> }

/**
 * AF-checklistan sparas per webbläsare i localStorage — det finns ingen
 * kolumn för "registrerad hos AF" ännu. Nästa steg är en kolumn på
 * activity_plans så att bocken följer planen, inte datorn.
 */
const AF_NYCKEL = (planId: string) => `af-anvisning-registrerad:${planId}`

function lasAfBock(planId: string): boolean {
  try {
    return localStorage.getItem(AF_NYCKEL(planId)) === '1'
  } catch {
    return false
  }
}

function skrivAfBock(planId: string, varde: boolean) {
  try {
    if (varde) localStorage.setItem(AF_NYCKEL(planId), '1')
    else localStorage.removeItem(AF_NYCKEL(planId))
  } catch {
    /* privat läge eller blockerad lagring — bocken visas ändå tills sidan laddas om */
  }
}

export function IvoUnderlagSektion() {
  const queryClient = useQueryClient()
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })
  const [omgang, setOmgang] = useState(0)
  const [val, setVal] = useState(() => kvartalForDatum(formatLocalDate(new Date())))
  const [afBockar, setAfBockar] = useState<Record<string, boolean>>({})

  const { from, to } = kvartalGranser(val.ar, val.kvartal)

  useEffect(() => {
    let aktiv = true
    ;(async () => {
      try {
        const [plans, sessions, deltagare] = await Promise.all([
          aktivitetsplanApi.listAll(),
          aktivitetsplanApi.listSessionsBetween(from, to),
          fetchCachedConsultantParticipants(queryClient).catch(() => []),
        ])
        if (!aktiv) return
        const namn = new Map<string, string>()
        for (const d of deltagare) {
          namn.set(d.participant_id, `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim())
        }
        const bockar: Record<string, boolean> = {}
        for (const p of plans) bockar[p.id] = lasAfBock(p.id)
        setAfBockar(bockar)
        setLage({ status: 'klart', plans, sessions, namn })
      } catch (err) {
        if (aktiv) setLage({ status: 'fel', fel: err instanceof Error ? err.message : 'Underlaget kunde inte hämtas.' })
      }
    })()
    return () => { aktiv = false }
  }, [from, to, omgang, queryClient])

  const underlag = useMemo(
    () => (lage.status === 'klart' ? ivoKvartalsunderlag(lage.plans, lage.sessions, val) : null),
    [lage, val],
  )

  const laddaNer = () => {
    if (!underlag) return
    const blob = new Blob(['﻿' + tillTsv(underlag)], { type: 'text/tab-separated-values;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ivo-underlag-${val.ar}-Q${val.kvartal}.tsv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const arAlternativ = useMemo(() => {
    const iAr = new Date().getFullYear()
    return [iAr - 1, iAr, iAr + 1].map((a) => ({ value: String(a), label: String(a) }))
  }, [])

  const aktivaPlaner = lage.status === 'klart' ? lage.plans.filter((p) => p.status === 'active') : []

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Aktivitetskravet — kvartalsunderlag till IVO</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Anvisade planer, ogiltig frånvaro och lämnat underlag, per försörjningshinder.
          </p>
        </div>
        <FileText className="w-5 h-5 text-stone-500 dark:text-stone-400" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
        <Select
          id="ivo-ar"
          label="År"
          options={arAlternativ}
          value={String(val.ar)}
          onChange={(e) => setVal((v) => ({ ...v, ar: Number(e.target.value) }))}
        />
        <Select
          id="ivo-kvartal"
          label="Kvartal"
          options={[1, 2, 3, 4].map((k) => ({ value: String(k), label: `Q${k}` }))}
          value={String(val.kvartal)}
          onChange={(e) => setVal((v) => ({ ...v, kvartal: Number(e.target.value) as Kvartal }))}
        />
        <p className="text-sm text-stone-500 dark:text-stone-400 sm:col-span-2">
          {langtDatum(from)} – {langtDatum(to)}
        </p>
      </div>

      {lage.status === 'laddar' && <LoadingState message="Räknar underlaget…" size="sm" />}
      {lage.status === 'fel' && (
        <ErrorState title="Underlaget kunde inte hämtas" message={lage.fel} onRetry={() => { setLage({ status: 'laddar' }); setOmgang((n) => n + 1) }} />
      )}

      {lage.status === 'klart' && underlag && (
        <>
          {underlag.summa.antal_anvisade === 0 ? (
            <p className="text-sm text-stone-600 dark:text-stone-300" role="status">
              Inga anvisade planer i kvartalet — underlaget visar <span aria-hidden="true">—</span><span className="sr-only">inget värde</span>.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-700">
                    <th className="py-2 pr-3 font-medium">Försörjningshinder</th>
                    <th className="py-2 px-3 font-medium text-right">Anvisade</th>
                    <th className="py-2 px-3 font-medium text-right">Med ogiltig frånvaro</th>
                    <th className="py-2 pl-3 font-medium text-right">Underlag lämnat</th>
                  </tr>
                </thead>
                <tbody>
                  {underlag.rader.filter((r) => r.antal_anvisade > 0).map((r) => (
                    <tr key={r.nyckel} className="border-b border-stone-100 dark:border-stone-800">
                      <td className="py-2 pr-3 text-stone-800 dark:text-stone-100">{r.etikett}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{r.antal_anvisade}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{r.antal_med_ogiltig_franvaro}</td>
                      <td className="py-2 pl-3 text-right tabular-nums">{r.antal_underlag_lamnat}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-2 pr-3">Summa</td>
                    <td className="py-2 px-3 text-right tabular-nums">{underlag.summa.antal_anvisade}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{underlag.summa.antal_med_ogiltig_franvaro}</td>
                    <td className="py-2 pl-3 text-right tabular-nums">{underlag.summa.antal_underlag_lamnat}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-prose">
              Underlaget är en räkning ur portalen. Beslut om nekande/nedsättning registreras i kommunens
              verksamhetssystem och rapporteras till IVO via deras e-tjänst (öppnar januari 2027). Det finns inget API
              mot IVO eller Arbetsförmedlingen.
            </p>
            <Button size="sm" variant="outline" onClick={laddaNer} disabled={underlag.summa.antal_anvisade === 0}>
              <Download className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Ladda ner som TSV
            </Button>
          </div>

          <section aria-labelledby="af-checklista-rubrik" className="border-t border-stone-200 dark:border-stone-700 pt-4 space-y-2">
            <h4 id="af-checklista-rubrik" className="font-semibold text-stone-900 dark:text-stone-100">
              AF-checklista: anvisning registrerad i Mina sidor för kommuner
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Kommunen ska registrera varje anvisning hos Arbetsförmedlingen. Bocken sparas bara i den här webbläsaren.
            </p>
            {aktivaPlaner.length === 0 ? (
              <p className="text-sm text-stone-600 dark:text-stone-300">Inga aktiva planer att registrera.</p>
            ) : (
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {aktivaPlaner.map((p) => {
                  const namn = lage.namn.get(p.participant_id) || `Deltagare ${p.participant_id.slice(0, 8)}`
                  const bockad = afBockar[p.id] ?? false
                  return (
                    <li key={p.id} className="py-2 flex items-center gap-3">
                      <input
                        id={`af-${p.id}`}
                        type="checkbox"
                        className="w-5 h-5 rounded border-stone-300 text-[var(--c-solid)] focus:ring-[var(--c-solid)]"
                        checked={bockad}
                        onChange={(e) => {
                          skrivAfBock(p.id, e.target.checked)
                          setAfBockar((prev) => ({ ...prev, [p.id]: e.target.checked }))
                        }}
                      />
                      <label htmlFor={`af-${p.id}`} className="flex-1 text-sm text-stone-800 dark:text-stone-100">
                        {namn}
                        <span className="text-stone-500 dark:text-stone-400"> · plan från {langtDatum(p.start_date)}</span>
                      </label>
                      {bockad && <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </Card>
  )
}
