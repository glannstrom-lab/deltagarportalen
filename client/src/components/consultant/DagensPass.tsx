/**
 * DagensPass — konsulentens morgonfråga under aktivitetskravet (F9, 2026-09-12):
 * vilka deltagare har pass i dag, vilka har checkat in, vilka har anmält
 * frånvaro (F1), och vilka saknar närvaro fast passet är slut.
 *
 * Läser `activity_sessions` för dagens datum — RLS ger konsulenten sina
 * deltagares pass (mätt i prod: km-konsulent 80 pass, demot 10, 200 via REST).
 * Närvaron sätts genom samma API som Aktivitet-sektionen på deltagarsidan
 * (`aktivitetsplanApi.markAttendance`) — ingen kopia av logiken.
 *
 * Tre lägen: laddar / fel / klart. Tomt underlag är en invit, inte en nolla.
 * Konsulentvyn är svensk med flit (DESIGN.md §2).
 */

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, CheckCircle, AlertTriangle, Clock, Loader2 } from '@/components/ui/icons'
import { aktivitetsplanApi } from '@/services/aktivitetApi'
import type { Attendance } from '@/services/aktivitetSchema'
import { hamtaDagensPass, passStatus, NARVARO_ETIKETT, type PassIdag } from '@/lib/dagensPass'

type Lage = 'laddar' | 'fel' | 'klart'
import { notifications } from '@/lib/toast'
import { cn } from '@/lib/utils'

interface Props {
  /** Namn per deltagar-id — kommer ur Översiktens redan hämtade deltagarlista. */
  namnFor: (participantId: string) => string
}

export function DagensPass({ namnFor }: Props) {
  const [lage, setLage] = useState<Lage>('laddar')
  const [pass, setPass] = useState<PassIdag[]>([])
  const [sparar, setSparar] = useState<string | null>(null)

  const ladda = useCallback(async () => {
    setLage('laddar')
    try {
      setPass(await hamtaDagensPass())
      setLage('klart')
    } catch {
      setLage('fel')
    }
  }, [])

  useEffect(() => {
    void ladda()
  }, [ladda])

  const markera = async (p: PassIdag, attendance: Attendance) => {
    setSparar(p.id)
    try {
      const uppdaterad = await aktivitetsplanApi.markAttendance(p.id, { attendance })
      setPass((prev) => prev.map((x) => (x.id === p.id ? { ...x, attendance: uppdaterad.attendance } : x)))
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Närvaron kunde inte sparas')
    } finally {
      setSparar(null)
    }
  }

  return (
    <section aria-labelledby="dagens-pass-rubrik" className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4 text-stone-500 dark:text-stone-400" aria-hidden="true" />
        <h4 id="dagens-pass-rubrik" className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Dagens pass
        </h4>
        {lage === 'klart' && <span className="text-xs text-stone-500 dark:text-stone-400">({pass.length})</span>}
      </div>

      {lage === 'laddar' && (
        <p className="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-2" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Hämtar dagens pass…
        </p>
      )}
      {lage === 'fel' && (
        <p className="text-sm text-rose-700 dark:text-rose-400" role="alert">
          Dagens pass kunde inte hämtas.{' '}
          <button type="button" onClick={() => void ladda()} className="underline">
            Försök igen
          </button>
        </p>
      )}
      {lage === 'klart' && pass.length === 0 && (
        <p className="text-sm text-stone-500 dark:text-stone-400">Inga pass i dag. Planerna finns under varje deltagares Aktivitet.</p>
      )}
      {lage === 'klart' && pass.length > 0 && (
        <ul className="space-y-2">
          {pass.map((p) => {
            const status = passStatus(p)
            const Ikon = status.ton === 'ok' ? CheckCircle : status.ton === 'varning' ? AlertTriangle : Clock
            const tid = `${p.start_time.slice(0, 5)}–${p.end_time.slice(0, 5)}`
            return (
              <li key={p.id} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/consultant/participants/${p.participant_id}`}
                      className="font-medium text-stone-900 dark:text-stone-100 hover:underline text-sm"
                    >
                      {namnFor(p.participant_id)}
                    </Link>
                    <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
                      {tid} · {p.title}
                    </p>
                  </div>
                  <p
                    className={cn(
                      'text-xs font-medium flex items-center gap-1',
                      status.ton === 'ok' && 'text-emerald-700 dark:text-emerald-400',
                      status.ton === 'varning' && 'text-amber-700 dark:text-amber-400',
                      status.ton === 'info' && 'text-sky-700 dark:text-sky-400',
                      status.ton === 'neutral' && 'text-stone-600 dark:text-stone-400',
                    )}
                  >
                    <Ikon className="w-3.5 h-3.5" aria-hidden="true" />
                    {status.text}
                  </p>
                </div>
                {!p.attendance && (
                  <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={`Närvaro för ${namnFor(p.participant_id)}`}>
                    {(['present', 'absent_valid', 'absent_invalid', 'sick_certified'] as Attendance[]).map((a) => (
                      <button
                        key={a}
                        type="button"
                        disabled={sparar === p.id}
                        onClick={() => void markera(p, a)}
                        className="text-xs px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-50"
                      >
                        {NARVARO_ETIKETT[a]}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
