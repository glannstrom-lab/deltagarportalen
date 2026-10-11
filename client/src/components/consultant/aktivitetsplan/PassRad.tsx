/**
 * PassRad — ett pass i veckan, med närvaron som en riktig radiogrupp
 * (NarvaroVal) direkt på raden. Omtaget "Kvarter", steg 5 (2026-10-11).
 *
 * Förut: en "Närvaro"-knapp som fällde ut fem ramade knappar. Nu syns valet
 * på raden, och det som händer sällan ("Annan aktivitet", "Nollställ",
 * "Ändra passet", "Ta bort passet") ligger i radens Mer-meny.
 *
 * Anteckningen fälls ut direkt under raden när passet markeras som ogiltig
 * frånvaro utan orsak — det är den raden handläggaren och Arbetsförmedlingen
 * frågar efter. RK4: text som inte är sparad sparas när panelen stängs; går
 * det inte stannar panelen öppen med felet och texten.
 *
 * KSL21: hos en Rusta och matcha-leverantör är valen Närvarande / Frånvarande /
 * Sjuk, och frånvaron får "Anmäld i förväg" som fakta — aldrig giltig/ogiltig
 * (franvaroFakta.ts). Kommunens val är oförändrade.
 */
import { useState } from 'react'
import { Loader2, MapPin } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Textarea, Checkbox } from '@/components/ui/Input'
import { NarvaroVal } from '@/components/ui/NarvaroVal'
import { MerMeny, type MerMenyVal } from '@/components/ui/MerMeny'
import { StatusChip } from '@/components/ui/StatusChip'
import { franNarvarovarde } from '@/components/ui/kvarterStatus'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { notifications } from '@/lib/toast'
import { aktivitetsplanApi, type ActivitySession } from '@/services/aktivitetApi'
import { formatLocalDate, timmar, type Attendance } from '@/services/aktivitetSchema'
import { vantarPaKvittens } from '@/services/egenrapport'
import { franvaroAv, type FranvaroOrsak } from '@/services/franvaroApi'
import { PLAN_PASS_KOLUMNER_FINNS, arFysisktPass, arLeverantorsledd, fysiskHarledd } from '@/services/planMarkning'
import { AndraPassDialog } from '../AndraPassDialog'
import { ANMALD_HJALP, arFranvaro, narvaroValFor, type Regelverk } from '../franvaroFakta'
import {
  AKTIVITETSTYP_ETIKETT,
  INTYG_HJALP,
  NARVARO_ETIKETT,
  formatTimmar,
  klockslag,
  kortDatum,
} from '../aktivitetEtiketter'

const FRANVARO_ORSAK_ETIKETT: Record<FranvaroOrsak, string> = {
  sick: 'sjuk',
  child_care: 'vård av barn',
  authority_meeting: 'möte hos myndighet',
  other: 'annat skäl',
}

export function PassRad({ session, allaPass, visaMarkning, regelverk = null, onChanged, onRemoved, onSerieAndrad }: {
  session: ActivitySession
  allaPass: readonly ActivitySession[]
  /** KSL21: planens regelverk. Utan: kommunens val, som förut. */
  regelverk?: Regelverk | null
  /** RR27-märkningen gäller Rusta och matcha-avtalets logg — inte kommunens plan (slipningen 2026-10-11). */
  visaMarkning: boolean
  onChanged: (s: ActivitySession) => void
  onRemoved: () => void
  onSerieAndrad: (antal: number) => void
}) {
  const { confirm } = useConfirmDialog()
  const [oppen, setOppen] = useState(false)
  const [andra, setAndra] = useState(false)
  const [anteckning, setAnteckning] = useState(session.attendance_note ?? '')
  const [intyg, setIntyg] = useState(session.sick_certificate_received)
  const [sparar, setSparar] = useState<Attendance | 'nollstall' | 'anteckning' | 'anmald' | null>(null)
  const leverantor = regelverk === 'leverantor'
  const [anteckningFel, setAnteckningFel] = useState<string | null>(null)
  const egetJobbsok = session.activity_type === 'jobsearch_own'
  // RK15: egenrapporterat och omarkerat — väntar på konsulentens kvittens.
  const vantar = vantarPaKvittens(session, formatLocalDate(new Date()))
  // RK4: text i rutan som inte finns i databasen. Syns även när panelen är stängd.
  const osparadAnteckning = anteckning.trim() !== (session.attendance_note ?? '').trim()
  const dag = kortDatum(session.date)
  const panelId = `narvaro-${session.id}`
  const anmalan = !session.attendance ? franvaroAv(session) : null

  const sparaAnteckning = async (): Promise<boolean> => {
    setSparar('anteckning')
    setAnteckningFel(null)
    try {
      onChanged(await aktivitetsplanApi.saveAttendanceNote(session.id, anteckning))
      return true
    } catch (err) {
      setAnteckningFel(`Anteckningen kunde inte sparas — texten finns kvar här. ${err instanceof Error ? err.message : ''}`.trim())
      return false
    } finally {
      setSparar(null)
    }
  }

  // Att stänga panelen med osparad text sparar den. Går det inte stannar panelen
  // öppen med felet och texten — den försvinner aldrig tyst.
  const vaxlaPanel = async () => {
    if (!oppen) { setOppen(true); return }
    if (osparadAnteckning && !(await sparaAnteckning())) return
    setOppen(false)
  }

  const markera = async (attendance: Attendance | null, medIntyg: boolean = intyg) => {
    setSparar(attendance ?? 'nollstall')
    try {
      const uppdaterad = await aktivitetsplanApi.markAttendance(session.id, {
        attendance,
        note: anteckning,
        sickCertificateReceived: attendance === 'sick_certified' ? medIntyg : false,
        ...(regelverk === 'leverantor' ? { regelverk } : {}),
      })
      onChanged(uppdaterad)
      setAnteckningFel(null)
      // Ogiltig frånvaro utan orsak, eller sjuk (intyget): raden fälls ut. Annars stängs den.
      // Leverantör: varje frånvaro fälls ut — orsaken och "anmäld i förväg" hör till avvikelsen.
      if (attendance === 'sick_certified' || (attendance === 'absent_invalid' && !anteckning.trim()) || (leverantor && arFranvaro(attendance))) setOppen(true)
      else setOppen(false)
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Närvaron kunde inte sparas')
    } finally {
      setSparar(null)
    }
  }

  // Intyget är en egenskap hos "Sjuk" — är passet redan markerat sjukt sparas kryssrutan direkt.
  const vaxlaIntyg = (varde: boolean) => {
    setIntyg(varde)
    if (session.attendance === 'sick_certified') void markera('sick_certified', varde)
  }

  // KSL21, leverantör: anmäld i förväg är fakta. Byter bara frånvarons värde — anteckningen står kvar.
  const vaxlaAnmald = async (anmald: boolean) => {
    setSparar('anmald')
    try {
      onChanged(await aktivitetsplanApi.sattFranvaroAnmald(session.id, anmald, regelverk))
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Uppgiften om anmälan kunde inte sparas')
    } finally {
      setSparar(null)
    }
  }

  const taBort = async () => {
    const ok = await confirm({ title: 'Ta bort passet?', message: `${session.title} ${dag} ${session.start_time}–${session.end_time} tas bort.`, confirmText: 'Ta bort', cancelText: 'Avbryt', variant: 'danger' })
    if (!ok) return
    try {
      await aktivitetsplanApi.removeSession(session.id)
      onRemoved()
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Passet kunde inte tas bort')
    }
  }

  const merVal: MerMenyVal[] = [
    { etikett: 'Ändra passet', ikon: 'kalender', onClick: () => setAndra(true) },
    ...(session.attendance !== 'external'
      ? [{ etikett: 'Annan aktivitet', ikon: 'narvaro' as const, onClick: () => void markera('external'), disabled: sparar !== null }]
      : []),
    ...(session.attendance
      ? [{ etikett: 'Nollställ närvaron', ikon: 'streck' as const, onClick: () => void markera(null), disabled: sparar !== null }]
      : []),
    { etikett: 'Ta bort passet', ikon: 'kryss', farlig: true, onClick: () => void taBort() },
  ]

  return (
    <li className="py-3.5 border-b border-[var(--j-linje)] last:border-b-0" data-testid="pass-rad">
      <div className="grid gap-2.5 2xl:grid-cols-[minmax(0,1fr)_auto] 2xl:items-center">
        <div className="flex gap-3 min-w-0">
          <span className="text-sm tabular-nums text-[var(--j-blak-2)] shrink-0 w-[10.5ch] pt-0.5">
            {session.start_time}–{session.end_time}
          </span>
          <div className="min-w-0 grid gap-0.5">
            <p className="m-0 font-semibold text-[var(--j-blak)] truncate">{session.title}</p>
            <p className="m-0 text-[0.8125rem] leading-5 text-[var(--j-blak-3)] flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>{AKTIVITETSTYP_ETIKETT[session.activity_type]}</span>
              <span aria-hidden="true">·</span>
              <span>{formatTimmar(timmar(session.start_time, session.end_time))}</span>
              {session.location && (
                <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true" />{session.location}</span>
              )}
              {/* RR27: märkningen när den finns — härledda pass säger det. */}
              {PLAN_PASS_KOLUMNER_FINNS && visaMarkning && (
                <span data-testid="pass-markning">
                  {arLeverantorsledd(session) ? 'Verksamheten' : 'Egen aktivitet'} · {arFysisktPass(session) ? 'fysiskt' : 'digitalt'}
                  {fysiskHarledd(session) ? ' (antaget — ändra passet för att märka det)' : ''}
                </span>
              )}
            </p>
            {(session.self_checkin_at || anmalan || vantar || session.attendance === 'external' || session.attendance === 'sick_certified' || (egetJobbsok && !session.attendance)) && (
              <p className="m-0 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-[var(--j-blak-2)]">
                {vantar ? (
                  <StatusChip status="vantar">{egetJobbsok ? 'Egen redovisning' : 'Incheckad'} · väntar på kvittens</StatusChip>
                ) : egetJobbsok && !session.attendance ? (
                  <span>Egen redovisning</span>
                ) : null}
                {session.self_checkin_at && (
                  <span>Checkade in {klockslag(session.self_checkin_at)}</span>
                )}
                {/* F1: deltagarens egen anmälan — konsulenten bekräftar med närvarovalet. */}
                {anmalan && (
                  <StatusChip status="giltig">
                    Anmäld frånvaro: {FRANVARO_ORSAK_ETIKETT[anmalan.reason]}{anmalan.note ? ` — „${anmalan.note}”` : ''}
                  </StatusChip>
                )}
                {session.attendance === 'external' && <StatusChip status="narvarande">{NARVARO_ETIKETT.external}</StatusChip>}
                {session.attendance === 'sick_certified' && (
                  <span>{session.sick_certificate_received ? 'Intyg inkommet' : 'Intyg saknas'}</span>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:pl-[calc(10.5ch+0.75rem)] 2xl:pl-0 2xl:justify-end">
          {/* RK15: kvittera = markera närvarande, samma skrivväg som närvarovalet. */}
          {vantar && (
            <Button ton="kvarter" variant="secondary" size="sm" onClick={() => void markera('present')} disabled={sparar !== null}>
              {sparar === 'present' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
              Kvittera
            </Button>
          )}
          <NarvaroVal
            etikett={`Närvaro för ${session.title} ${dag}`}
            alternativ={narvaroValFor(regelverk, session)}
            varde={franNarvarovarde(session.attendance) ? session.attendance : null}
            onChange={(v) => void markera(v as Attendance)}
            disabled={sparar !== null}
          />
          <Button
            ton="kvarter"
            variant="tertiary"
            size="sm"
            onClick={() => void vaxlaPanel()}
            disabled={sparar === 'anteckning'}
            aria-expanded={oppen}
            aria-controls={panelId}
          >
            Anteckning
            {osparadAnteckning && !oppen ? <span className="sr-only"> (inte sparad)</span> : null}
          </Button>
          <MerMeny baraIkon etikett={`Mer för ${session.title} ${dag}`} val={merVal} />
        </div>
      </div>
      {andra && (
        <AndraPassDialog
          session={session}
          allaPass={allaPass}
          onClose={() => setAndra(false)}
          onSparat={(antal) => { setAndra(false); onSerieAndrad(antal) }}
        />
      )}
      {!oppen && anteckningFel && (
        <p role="alert" className="mt-2 text-sm text-[var(--s-ogiltig-text)]">{anteckningFel}</p>
      )}
      {!oppen && session.attendance_note && (
        <p className="m-0 mt-1.5 text-sm text-[var(--j-blak-2)] sm:pl-[calc(10.5ch+0.75rem)]">
          <span className="text-[var(--j-blak-3)]">Anteckning:</span> {session.attendance_note}
        </p>
      )}

      {oppen && (
        <div id={panelId} className="mt-3 rounded-[var(--j-r-m)] bg-[var(--j-sankt)] p-4 space-y-3">
          {leverantor && arFranvaro(session.attendance) ? (
            <>
              <Checkbox
                id={`anmald-${session.id}`}
                label="Anmäld i förväg"
                description={ANMALD_HJALP}
                checked={session.attendance === 'absent_valid'}
                disabled={sparar !== null}
                onChange={(e) => void vaxlaAnmald(e.target.checked)}
              />
              <p className="m-0 text-sm font-semibold text-[var(--j-blak)]">
                Orsak: vad hände? En rad räcker, den följer med till avvikelsen.
              </p>
            </>
          ) : session.attendance === 'absent_invalid' && (
            <p className="m-0 text-sm font-semibold text-[var(--j-blak)]">
              Vad hände? En rad räcker, den följer med till underlaget.
            </p>
          )}
          <Textarea
            id={`anteckning-${session.id}`}
            label="Anteckning"
            value={anteckning}
            onChange={(e) => setAnteckning(e.target.value)}
            rows={2}
            placeholder="Orsak, kontakt, överenskommelse."
            hint="Sparas med markeringen, med Spara anteckning, eller när du stänger raden."
            fullWidth
          />
          <Checkbox
            id={`intyg-${session.id}`}
            label="Läkarintyg inkommet"
            description={INTYG_HJALP}
            checked={intyg}
            onChange={(e) => vaxlaIntyg(e.target.checked)}
          />
          {anteckningFel && <p role="alert" className="text-sm text-[var(--s-ogiltig-text)]">{anteckningFel}</p>}
          {osparadAnteckning && (
            <div className="flex flex-wrap items-center gap-3">
              <Button ton="kvarter" variant="secondary" size="sm" onClick={() => void sparaAnteckning()} disabled={sparar !== null}>
                {sparar === 'anteckning' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
                Spara anteckning
              </Button>
              <span className="text-sm text-[var(--s-vantar-text)]" role="status">Anteckningen är inte sparad</span>
            </div>
          )}
        </div>
      )}
    </li>
  )
}
