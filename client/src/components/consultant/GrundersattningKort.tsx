/**
 * KF2 (2026-10-18): "Underlag för grundersättning" under Rapporter — bara för
 * Rusta och matcha-leverantör. Räknar dagar × nivåns dagbelopp per deltagare och
 * månad (FFU ROM2 §5.1) och laddar ner en CSV att stämma av mot AF:s "Underlag
 * ekonomi" och inköpsordern. Jobin fakturerar inte och skickar inget till AF.
 *
 * Konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { aktivitetsplanApi } from '@/services/aktivitetApi'
import { fetchCachedConsultantParticipants } from '@/pages/consultant/consultantParticipantsQuery'
import { grundersattningRader, grundersattningCsv } from '@/services/grundersattningUnderlag'
import { kr } from '@/services/rom2Ersattning'
import { deltagarEtikett } from './rapportOmfang'
import { useRapportOmfang } from './useRapportOmfang'

const MANAD_NAMN = ['', 'januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']

function manader(idag: Date) {
  return Array.from({ length: 13 }, (_, i) => {
    const d = new Date(idag.getFullYear(), idag.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { value, label: `${MANAD_NAMN[d.getMonth() + 1]} ${d.getFullYear()}` }
  })
}

function laddaNer(innehall: string, filnamn: string) {
  const url = URL.createObjectURL(new Blob([innehall], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url; a.download = filnamn; a.rel = 'noopener'
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function GrundersattningKort() {
  const qc = useQueryClient()
  const { kollegor } = useRapportOmfang()
  const alternativ = useMemo(() => manader(new Date()), [])
  // Grundersättningen faktureras i efterskott — förra månaden är förvald.
  const [manad, setManad] = useState(alternativ[1].value)
  const data = useQuery({
    queryKey: ['grundersattning-underlag'],
    queryFn: async () => {
      const [planer, deltagare] = await Promise.all([
        aktivitetsplanApi.listAll(),
        fetchCachedConsultantParticipants(qc).catch(() => []),
      ])
      const namn = new Map<string, string>()
      for (const d of deltagare) namn.set(d.participant_id, `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim())
      return { planer, namn }
    },
    staleTime: 60_000,
  })

  const rader = useMemo(
    () => (data.data ? grundersattningRader(data.data.planer, manad, (p) => deltagarEtikett(p, data.data!.namn, kollegor)) : []),
    [data.data, manad, kollegor],
  )
  const total = rader.reduce((s, r) => s + (r.summa ?? 0), 0)
  const ofullstandiga = rader.filter((r) => r.summa == null).length

  return (
    <Card className="p-5 space-y-4" id="grundersattning">
      <div>
        <h3 className="font-semibold text-stone-900 dark:text-stone-100">Underlag för grundersättning</h3>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Rusta och matcha, FFU §5.1: vardagar utan röda dagar × nivåns dagbelopp, 80 % vid deltagandegrad under 100 %. Stäm av mot AF:s "Underlag ekonomi" innan du fakturerar.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
        <Select id="grund-manad" label="Månad" options={alternativ} value={manad} onChange={(e) => setManad(e.target.value)} />
        <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
          <Button ton="kvarter" variant="secondary" disabled={!data.data || rader.length === 0}
            onClick={() => laddaNer(grundersattningCsv(rader, manad), `grundersattning-${manad}.csv`)}>
            Ladda ner CSV
          </Button>
          {data.data && rader.length > 0 && (
            <p className="m-0 text-sm text-stone-700 dark:text-stone-300" role="status">
              {rader.length} deltagare · {kr(total)}{ofullstandiga ? ` · ${ofullstandiga} utan summa (nivå eller deltagandegrad saknas)` : ''}
            </p>
          )}
        </div>
      </div>
      {data.isLoading && <LoadingState message="Hämtar planerna…" size="sm" />}
      {data.isError && <ErrorState title="Planerna kunde inte hämtas" message="Försök igen om en stund." onRetry={() => void data.refetch()} />}
      {data.data && rader.length === 0 && (
        <p className="text-sm text-stone-600 dark:text-stone-300">Ingen plan överlappar {alternativ.find((a) => a.value === manad)?.label}.</p>
      )}
      {rader.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-stone-500 dark:text-stone-400">
              <th className="py-1 pr-3 font-medium">Deltagare</th><th className="py-1 pr-3 font-medium">Nivå</th>
              <th className="py-1 pr-3 font-medium">Dagar</th><th className="py-1 pr-3 font-medium">Grundersättning</th>
            </tr></thead>
            <tbody>
              {rader.map((r, i) => (
                <tr key={`${r.namn}-${i}`} className="border-t border-stone-200 dark:border-stone-700">
                  <td className="py-1.5 pr-3">{r.namn}{r.arende ? <span className="text-stone-500"> · {r.arende}</span> : null}</td>
                  <td className="py-1.5 pr-3">{r.niva ?? '—'}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{r.dagar}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{r.summa != null ? kr(r.summa) : <span className="text-stone-500">{r.anmarkning}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
