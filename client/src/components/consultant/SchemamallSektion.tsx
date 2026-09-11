/**
 * SchemamallSektion — konsulentens schemamallar i fliken Resurser (KM3).
 *
 * Tre lägen: laddar / fel / klart. Inga exempelmallar som ser ut som data —
 * tomt är tomt, med EN väg vidare.
 */

import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Star, Edit2, Trash2, Plus, Users, Clock } from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { notifications } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { schemamallApi, type ActivityTemplate } from '@/services/aktivitetApi'
import { mallensVeckotimmar } from '@/services/aktivitetSchema'
import { SchemamallDialog } from './SchemamallDialog'
import { AKTIVITETSTYP_CHIP, AKTIVITETSTYP_ETIKETT, formatTimmar } from './aktivitetEtiketter'

type Lage = { status: 'laddar' } | { status: 'fel'; fel: string } | { status: 'klart'; mallar: ActivityTemplate[] }

export function SchemamallSektion() {
  const { confirm } = useConfirmDialog()
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })
  const [userId, setUserId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ open: boolean; mall: ActivityTemplate | null }>({ open: false, mall: null })

  // Hämtningen bor i effekten och skriver tillstånd först efter await —
  // inget setState synkront i effekten (react-hooks/set-state-in-effect).
  // ladda() sätter laddar-läget och räknar upp omgången så effekten körs om.
  const [omgang, setOmgang] = useState(0)
  useEffect(() => {
    let aktiv = true
    ;(async () => {
      try {
        const [{ data: { user } }, mallar] = await Promise.all([supabase.auth.getUser(), schemamallApi.list()])
        if (!aktiv) return
        setUserId(user?.id ?? null)
        setLage({ status: 'klart', mallar })
      } catch (err) {
        if (aktiv) setLage({ status: 'fel', fel: err instanceof Error ? err.message : 'Mallarna kunde inte hämtas.' })
      }
    })()
    return () => { aktiv = false }
  }, [omgang])

  const ladda = useCallback(() => {
    setLage({ status: 'laddar' })
    setOmgang((n) => n + 1)
  }, [])

  const taBort = async (mall: ActivityTemplate) => {
    const ok = await confirm({
      title: 'Ta bort schemamallen?',
      message: `"${mall.name}" tas bort. Planer som redan skapats ur mallen påverkas inte.`,
      confirmText: 'Ta bort',
      cancelText: 'Avbryt',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await schemamallApi.remove(mall.id)
      notifications.success('Mallen är borttagen')
      void ladda()
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Mallen kunde inte tas bort')
    }
  }

  const stjarna = async (mall: ActivityTemplate) => {
    try {
      await schemamallApi.setStarred(mall.id, !mall.is_starred)
      setLage((prev) => prev.status === 'klart'
        ? { status: 'klart', mallar: prev.mallar.map((m) => (m.id === mall.id ? { ...m, is_starred: !m.is_starred } : m)) }
        : prev)
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Kunde inte spara')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Schemamallar</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-prose">
            En vecka med pass som tillämpas på en deltagare. Lagens tak är 40 timmar per vecka, 30 vid barn under 8 år.
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true, mall: null })}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Ny schemamall
        </Button>
      </div>

      {lage.status === 'laddar' && <LoadingState message="Hämtar schemamallar…" />}
      {lage.status === 'fel' && (
        <ErrorState title="Mallarna kunde inte hämtas" message={lage.fel} onRetry={() => void ladda()} />
      )}
      {lage.status === 'klart' && lage.mallar.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="Inga schemamallar än"
          description="Bygg den första: en vecka med pass som du sedan tillämpar på deltagare."
          action={{ label: 'Skapa första mallen', onClick: () => setDialog({ open: true, mall: null }) }}
        />
      )}
      {lage.status === 'klart' && lage.mallar.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Schemamallar">
          {lage.mallar.map((mall) => {
            const egen = mall.owner_id === userId
            const timmar = mallensVeckotimmar(mall.items)
            const typer = Array.from(new Set(mall.items.map((it) => it.activity_type)))
            return (
              <li key={mall.id}>
                <Card className="p-5 h-full flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-stone-900 dark:text-stone-100 truncate">{mall.name}</h3>
                      {mall.description && (
                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{mall.description}</p>
                      )}
                    </div>
                    {egen && (
                      <button
                        type="button"
                        onClick={() => stjarna(mall)}
                        aria-pressed={mall.is_starred}
                        aria-label={mall.is_starred ? 'Ta bort stjärna' : 'Stjärnmärk'}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-amber-500"
                      >
                        <Star className={cn('w-5 h-5', mall.is_starred && 'fill-amber-400 text-amber-500')} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <dl className="flex items-center gap-4 text-sm text-stone-600 dark:text-stone-300 flex-wrap">
                    <div className="inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      <dt className="sr-only">Timmar per vecka</dt>
                      <dd>{formatTimmar(timmar)}/vecka</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Pass per vecka</dt>
                      <dd>{mall.items.length} pass</dd>
                    </div>
                    <div className="inline-flex items-center gap-1.5">
                      <Users className="w-4 h-4" aria-hidden="true" />
                      <dt className="sr-only">Använd</dt>
                      <dd>{mall.usage_count === 0 ? 'Inte använd än' : `Använd ${mall.usage_count} ${mall.usage_count === 1 ? 'gång' : 'gånger'}`}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-1.5">
                    {typer.map((typ) => (
                      <span key={typ} className={cn('text-xs px-2 py-0.5 rounded-full', AKTIVITETSTYP_CHIP[typ])}>
                        {AKTIVITETSTYP_ETIKETT[typ]}
                      </span>
                    ))}
                    {!egen && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                        Delad av en kollega
                      </span>
                    )}
                  </div>
                  {egen && (
                    <div className="mt-auto flex items-center gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => setDialog({ open: true, mall })}>
                        <Edit2 className="w-4 h-4 mr-1.5" aria-hidden="true" />
                        Redigera
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => taBort(mall)}>
                        <Trash2 className="w-4 h-4 mr-1.5" aria-hidden="true" />
                        Ta bort
                      </Button>
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <SchemamallDialog
        isOpen={dialog.open}
        mall={dialog.mall}
        onClose={() => setDialog({ open: false, mall: null })}
        onSaved={() => {
          setDialog({ open: false, mall: null })
          notifications.success('Mallen är sparad')
          void ladda()
        }}
      />
    </div>
  )
}
