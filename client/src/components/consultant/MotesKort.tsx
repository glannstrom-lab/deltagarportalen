/**
 * MotesKort — deltagarens möten och mötesregeln på deltagarsidan (RR11,
 * rollspelet 2026-09-27).
 *
 * Möteskadensen (RM3) räknar bara GENOMFÖRDA möten, men portalen hade ingen
 * väg att markera ett möte som hållet: bokningar blev liggande som
 * `scheduled`, chipet i deltagarlistan stod still och ingen såg att ett
 * fysiskt möte redan var bokat. Här syns regeln, nästa bokade möte, och möten
 * vars tid passerat kan markeras "Hölls" eller "Blev inte av".
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useState } from 'react'
import { Calendar, Loader2 } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  KADENS_REGEL,
  bekraftaMote,
  kadensForMoten,
  kadensText,
  vantarPaBekraftelse,
  type DeltagarMote,
  type MoteTyp,
} from '@/services/moteskadens'

export type MotenLage =
  | { status: 'laddar' }
  | { status: 'fel'; fel: string }
  | { status: 'klart'; moten: DeltagarMote[] }

const TYP_TEXT: Record<MoteTyp, string> = { physical: 'Fysiskt', video: 'Video', phone: 'Telefon' }

function tidText(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function MotesKort({ lage, onBoka, onAndrat, onForsokIgen }: {
  lage: MotenLage
  onBoka: () => void
  onAndrat: (id: string, status: 'completed' | 'cancelled') => void
  onForsokIgen: () => void
}) {
  const [sparar, setSparar] = useState<string | null>(null)
  const [fel, setFel] = useState<string | null>(null)
  const nu = new Date()

  const bekrafta = async (id: string, status: 'completed' | 'cancelled') => {
    setSparar(id)
    setFel(null)
    try {
      await bekraftaMote(id, status)
      onAndrat(id, status)
    } catch (err) {
      setFel(err instanceof Error ? err.message : 'Mötet kunde inte uppdateras.')
    } finally {
      setSparar(null)
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-stone-500" aria-hidden="true" />
          Möten
        </h3>
        <Button size="sm" variant="outline" onClick={onBoka}>Boka nytt möte</Button>
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">{KADENS_REGEL}</p>

      {lage.status === 'laddar' && <p className="text-sm text-stone-500">Hämtar möten…</p>}
      {lage.status === 'fel' && (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
          Mötena kunde inte hämtas. <button type="button" className="underline" onClick={onForsokIgen}>Försök igen</button>
        </p>
      )}
      {lage.status === 'klart' && (() => {
        const k = kadensForMoten(lage.moten, nu)
        const vantar = lage.moten.filter((m) => vantarPaBekraftelse(m, nu))
        const kommande = lage.moten
          .filter((m) => m.status === 'scheduled' && new Date(m.scheduled_at).getTime() > nu.getTime())
          .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
        return (
          <div className="space-y-3">
            <p className="text-sm text-stone-800 dark:text-stone-100" data-testid="motes-kadens">{kadensText(k)}</p>
            {vantar.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Hölls mötet? Bara bekräftade möten räknas mot regeln.
                </p>
                <ul className="space-y-2">
                  {vantar.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
                      <span className="text-sm text-stone-800 dark:text-stone-100">{TYP_TEXT[m.meeting_type]} · {tidText(m.scheduled_at)}</span>
                      <span className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={sparar !== null} onClick={() => void bekrafta(m.id, 'completed')}>
                          {sparar === m.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" aria-hidden="true" /> : null}
                          Hölls
                        </Button>
                        <Button size="sm" variant="ghost" disabled={sparar !== null} onClick={() => void bekrafta(m.id, 'cancelled')}>
                          Blev inte av
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {kommande.length > 0 ? (
              <ul className="space-y-1" aria-label="Bokade möten">
                {kommande.slice(0, 3).map((m) => (
                  <li key={m.id} className={cn('text-sm', m.meeting_type === 'physical' ? 'text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-300')}>
                    Bokat: {TYP_TEXT[m.meeting_type]} · {tidText(m.scheduled_at)}{m.location ? ` · ${m.location}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500 dark:text-stone-400">Inget möte bokat framåt.</p>
            )}
            {fel && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{fel}</p>}
          </div>
        )
      })()}
    </Card>
  )
}
