/**
 * EnhetensUtfall (FN7) — utfall för hela enheten, för chef/admin. Visas i
 * Rapporter när växeln står på "Hela enheten". Bara tal; ett värde utan underlag
 * är "—" med en rad om varför. Konsulentvyn översätts inte.
 */
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { enhetensUtfallApi } from '@/services/enhetensUtfall'

interface Props {
  orgId: string
  orgNamn: string | null
  arDemo?: boolean
}

export function EnhetensUtfall({ orgId, orgNamn, arDemo = false }: Props) {
  const q = useQuery({
    queryKey: ['enhetens-utfall', orgId],
    queryFn: () => enhetensUtfallApi.hamta(orgId, arDemo),
    staleTime: 60_000,
  })

  return (
    <Card className="p-5" data-testid="enhetens-utfall">
      <h3 className="font-semibold text-stone-900 dark:text-stone-100">Utfall för hela {orgNamn ?? 'enheten'}</h3>
      {q.isLoading && <p className="text-sm text-stone-600 mt-2">Hämtar enhetens utfall…</p>}
      {q.isError && (
        <p className="text-sm text-rose-700 mt-2" role="alert">Utfallet kunde inte hämtas. Försök igen om en stund.</p>
      )}
      {q.data?.status === 'kraver_aal2' && (
        <p className="text-sm text-stone-700 dark:text-stone-300 mt-2" data-testid="utfall-aal2">
          Enhetens utfall visas bara med tvåstegsinloggning. Slå på den under Inställningar och logga in igen.
        </p>
      )}
      {q.data?.status === 'klart' && (
        <dl className="grid gap-3 sm:grid-cols-3 mt-3">
          {q.data.rader.map((r) => (
            <div key={r.nyckel} className="grid content-start gap-1 rounded-xl border border-stone-200 dark:border-stone-700 p-3">
              <dt className="text-sm font-medium">{r.rubrik}</dt>
              <dd className="text-xl font-bold tabular-nums" data-testid={`utfall-${r.nyckel}`}>{r.text}</dd>
              {!r.visas && <dd className="text-xs text-stone-600 dark:text-stone-400">{r.varfor}</dd>}
            </div>
          ))}
        </dl>
      )}
      <p className="text-xs text-stone-500 mt-3">
        Räknat på hela enhetens deltagare. Celler under 5 personer redovisas inte.
      </p>
    </Card>
  )
}

export type Vy = 'mina' | 'enheten'

/** Växeln "Mina deltagare / Hela enheten". Renderas bara för chef/admin — anroparen avgör det. */
export function VyVaxel({ vy, onChange }: { vy: Vy; onChange: (v: Vy) => void }) {
  const val: Array<{ id: Vy; text: string }> = [
    { id: 'mina', text: 'Mina deltagare' },
    { id: 'enheten', text: 'Hela enheten' },
  ]
  return (
    <div role="group" aria-label="Omfång för rapporterna" className="inline-flex rounded-xl bg-stone-100 dark:bg-stone-800 p-1" data-testid="vyvaxel">
      {val.map((v) => (
        <button
          key={v.id}
          type="button"
          aria-pressed={vy === v.id}
          onClick={() => onChange(v.id)}
          className={
            'px-4 py-2 rounded-lg text-sm font-medium ' +
            (vy === v.id ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400')
          }
        >
          {v.text}
        </button>
      ))}
    </div>
  )
}
