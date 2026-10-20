/**
 * Superadmin → "Tyck till" (FN15, 2026-10-20). Idéer och felrapporter från
 * användarna, nyast först, med status ny → läst → åtgärdad.
 *
 * Svenska literaler med flit: superadmin-panelen översätts inte.
 */
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bug, Lightbulb } from '@/components/ui/icons'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { hamtaTyckTill, sattTyckTillStatus, type TyckTillRad } from '@/services/tyckTillApi'

const STATUS: { id: TyckTillRad['status']; text: string }[] = [
  { id: 'ny', text: 'Ny' },
  { id: 'last', text: 'Läst' },
  { id: 'atgardad', text: 'Åtgärdad' },
]

type Filter = 'alla' | TyckTillRad['typ'] | 'oppna'

export function TyckTillTab() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['tyck-till'], queryFn: hamtaTyckTill })
  const [filter, setFilter] = useState<Filter>('oppna')
  const [sparFel, setSparFel] = useState<string | null>(null)

  const andraStatus = async (id: string, status: TyckTillRad['status']) => {
    setSparFel(null)
    try {
      await sattTyckTillStatus(id, status)
      await qc.invalidateQueries({ queryKey: ['tyck-till'] })
    } catch {
      setSparFel('Statusen kunde inte sparas. Försök igen.')
    }
  }

  if (q.isLoading) return <LoadingState message="Hämtar inskick…" />
  if (q.isError) return <ErrorState message="Inskicken kunde inte hämtas." onRetry={() => q.refetch()} />

  const rader = (q.data ?? []).filter((r) =>
    filter === 'alla' ? true : filter === 'oppna' ? r.status !== 'atgardad' : r.typ === filter
  )
  const nya = (q.data ?? []).filter((r) => r.status === 'ny').length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {q.data?.length ? `${q.data.length} inskick, varav ${nya} nya.` : 'Inga inskick ännu. De dyker upp här när någon använder Tyck till i menyn.'}
        </p>
        <label className="text-sm text-gray-700 flex items-center gap-2">
          Visa
          <select
            id="tyck-till-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="oppna">Inte åtgärdade</option>
            <option value="alla">Alla</option>
            <option value="fel">Felrapporter</option>
            <option value="ide">Idéer</option>
          </select>
        </label>
      </div>

      {sparFel && <p role="alert" className="text-sm text-red-700">{sparFel}</p>}

      <ul className="space-y-3">
        {rader.map((r) => (
          <li key={r.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-800">
                {r.typ === 'fel' ? <Bug className="w-4 h-4" aria-hidden="true" /> : <Lightbulb className="w-4 h-4" aria-hidden="true" />}
                {r.typ === 'fel' ? 'Felrapport' : 'Idé'}
                <span className="text-gray-500 font-normal">
                  · {new Date(r.created_at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </span>
              <label className="text-sm text-gray-700 flex items-center gap-2">
                <span className="sr-only">Status</span>
                <select
                  id={`tyck-till-status-${r.id}`}
                  value={r.status}
                  onChange={(e) => void andraStatus(r.id, e.target.value as TyckTillRad['status'])}
                  className="border border-gray-300 rounded-md px-2 py-1"
                >
                  {STATUS.map((s) => <option key={s.id} value={s.id}>{s.text}</option>)}
                </select>
              </label>
            </div>
            <p className="text-gray-900 whitespace-pre-wrap break-words">{r.meddelande}</p>
            <p className="text-xs text-gray-500 break-words">
              {[r.sida, r.roll, r.sprak].filter(Boolean).join(' · ')}
              {r.far_kontakta ? ' · får kontaktas (svara på mejlet)' : ''}
              {!r.mejl_skickat ? ' · mejlet gick inte iväg' : ''}
            </p>
            {r.klientfel.length > 0 && (
              <details className="text-xs text-gray-600">
                <summary className="cursor-pointer">Fel i webbläsaren ({r.klientfel.length})</summary>
                <pre className="mt-1 whitespace-pre-wrap bg-gray-50 rounded p-2">{r.klientfel.join('\n')}</pre>
              </details>
            )}
            {r.webblasare && <p className="text-xs text-gray-400 break-words">{r.webblasare}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
