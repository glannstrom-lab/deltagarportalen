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
 * Omtaget "Kvarter", steg 5 (2026-10-11): en platt yta, och för Rusta och
 * matcha mötesklockan (dagar kvar till 14-dagarsgränsen) överst.
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useState } from 'react'
import { Loader2 } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useOrgTypVisning } from './useRegelverk'
import { SpaltYta } from './SpaltYta'
import { Motesklocka } from './Motesklocka'
import { motesklocka } from './motesklockaRegel'
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
  const kundtyp = useOrgTypVisning()
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
    <SpaltYta
      ikon="mote"
      rubrik="Möten"
      testId="motes-kort"
      atgard={<Button ton="kvarter" variant="tertiary" size="sm" onClick={onBoka}>Boka nytt möte</Button>}
    >
      {lage.status === 'laddar' && <p className="m-0 sr-only" role="status">Hämtar möten</p>}
      {lage.status === 'fel' && (
        <p role="alert" className="m-0 text-sm text-[var(--s-ogiltig-text)]">
          Mötena kunde inte hämtas. <button type="button" className="font-semibold underline underline-offset-2" onClick={onForsokIgen}>Försök igen</button>
        </p>
      )}
      {lage.status === 'klart' && (() => {
        const k = kadensForMoten(lage.moten, nu)
        const vantar = lage.moten.filter((m) => vantarPaBekraftelse(m, nu))
        const kommande = lage.moten
          .filter((m) => m.status === 'scheduled' && new Date(m.scheduled_at).getTime() > nu.getTime())
          .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
        return (
          <div className="grid gap-3">
            {/* Mötesklockan och regeln är Rusta och matcha-avtalets; kommunen har ingen (slipningen 2026-10-11). */}
            {kundtyp?.visaAvtalskrav && <Motesklocka klocka={motesklocka(k, nu)} />}
            {/* Med klockan säger raden bara något nytt när ett möte är bokat — annars upprepar den klockan. */}
            {(!kundtyp?.visaAvtalskrav || k.bokat) && (
              <p className="m-0 text-sm text-[var(--j-blak-2)]" data-testid="motes-kadens">{kadensText(k)}</p>
            )}
            {vantar.length > 0 && (
              <div className="grid gap-2">
                <p className="m-0 text-sm font-semibold text-[var(--s-vantar-text)]">
                  Hölls mötet? Bara bekräftade möten räknas mot regeln.
                </p>
                <ul className="m-0 p-0 list-none grid gap-2">
                  {vantar.map((m) => (
                    <li key={m.id} className="grid gap-2 rounded-[var(--j-r-m)] bg-[var(--s-vantar-bg)] px-3 py-2.5">
                      <span className="text-sm font-semibold text-[var(--j-blak)]">{TYP_TEXT[m.meeting_type]} · {tidText(m.scheduled_at)}</span>
                      <span className="flex flex-wrap gap-2">
                        <Button ton="kvarter" variant="secondary" size="sm" disabled={sparar !== null} onClick={() => void bekrafta(m.id, 'completed')}>
                          {sparar === m.id ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
                          Hölls
                        </Button>
                        <Button ton="kvarter" variant="tertiary" size="sm" disabled={sparar !== null} onClick={() => void bekrafta(m.id, 'cancelled')}>
                          Blev inte av
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {kommande.length > 0 ? (
              <ul className="m-0 p-0 list-none grid gap-1" aria-label="Bokade möten">
                {kommande.slice(0, 3).map((m) => (
                  <li key={m.id} className={cn('text-sm', m.meeting_type === 'physical' ? 'text-[var(--j-blak)] font-semibold' : 'text-[var(--j-blak-2)]')}>
                    Bokat: {TYP_TEXT[m.meeting_type]} · {tidText(m.scheduled_at)}{m.location ? ` · ${m.location}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-sm text-[var(--j-blak-3)]">Inget möte bokat framåt.</p>
            )}
            {kundtyp?.visaAvtalskrav && <p className="m-0 text-xs text-[var(--j-blak-3)]">{KADENS_REGEL}</p>}
            {fel && <p role="alert" className="m-0 text-sm text-[var(--s-ogiltig-text)]">{fel}</p>}
          </div>
        )
      })()}
    </SpaltYta>
  )
}
