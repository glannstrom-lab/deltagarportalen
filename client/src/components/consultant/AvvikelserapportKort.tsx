/**
 * AvvikelserapportKort — leverantörens avvikelser per månad (RR28,
 * rollspelet 2026-09-27): datum, typ, orsak och om AF underrättats, enligt
 * FFU §4.4. Visas i stället för kommunens "Underlag till handläggaren /
 * socialnämnden", som är dolt för leverantörer (`regelverkForPlan`).
 *
 * Raderna räknas ur passen (services/avvikelserapport.ts). Portalen skickar
 * ingenting till Arbetsförmedlingen — det står på kortet. "Underrättad" är
 * konsulentens anteckning och finns först efter PENDING_20260927d.
 *
 * Omtaget "Kvarter", steg 5 (2026-10-11): "Markera som underrättad" och
 * "Kopiera" var understrukna länkar i brödtexten — de två handlingar som är
 * skälet till att rutan finns (diagnosen, punkt 10). Nu knappar.
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */
import { useMemo, useState } from 'react'
import { Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { KVARTER_FOKUS } from '@/components/ui/kvarterStatus'
import { cn } from '@/lib/utils'
import { SpaltYta } from './SpaltYta'
import { aktivitetsplanApi, type ActivitySession } from '@/services/aktivitetApi'
import { avvikelseManader, avvikelserader, avvikelserSomText, omarkeradePasserade } from '@/services/avvikelserapport'
import { manadGranser } from '@/services/aktivitetslogg'
import { formatLocalDate } from '@/services/aktivitetSchema'
import { PLAN_PASS_KOLUMNER_FINNS } from '@/services/planMarkning'
import { kortDatum } from './aktivitetEtiketter'

const MANAD = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']

function manadEtikett(ym: string): string {
  const [ar, m] = ym.split('-').map(Number)
  return `${MANAD[m - 1]} ${ar}`
}

/**
 * Slipningen 2026-10-11 (R&M A8): raden sa "skriv den i passets anteckning" utan att
 * visa var — anteckningen nåddes bara via "Ändra" på passet längre ned. Fältet ligger
 * nu i raden och sparar till samma kolumn (attendance_note) som passets anteckning.
 */
function OrsakFalt({ sessionId, onSparad }: { sessionId: string; onSparad: (s: ActivitySession) => void }) {
  const [text, setText] = useState('')
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const id = `orsak-${sessionId}`
  const spara = async () => {
    if (!text.trim()) return
    setSparar(true)
    setFel(null)
    try {
      onSparad(await aktivitetsplanApi.saveAttendanceNote(sessionId, text))
    } catch (err) {
      setFel(err instanceof Error ? err.message : 'Orsaken kunde inte sparas')
    } finally {
      setSparar(false)
    }
  }
  return (
    <div className="grid gap-1.5 mt-1">
      <label htmlFor={id} className="text-[var(--j-blak-2)]">Orsak: ingen antecknad än. Vad hände?</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={id}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={cn('flex-1 min-w-[10rem] px-3 min-h-[44px] sm:min-h-[36px] rounded-[var(--j-r-s)] bg-[var(--j-kort)] text-[var(--j-blak)] border border-[var(--j-linje-2)]', KVARTER_FOKUS)}
        />
        <Button ton="kvarter" variant="secondary" size="sm" disabled={sparar || !text.trim()} onClick={() => void spara()}>
          {sparar ? 'Sparar…' : 'Spara orsak'}
        </Button>
      </div>
      {fel && <p role="alert" className="m-0 text-[var(--s-ogiltig-text)]">{fel}</p>}
    </div>
  )
}

export function AvvikelserapportKort({ planStart, sessions, onChanged, kolumnerFinns = PLAN_PASS_KOLUMNER_FINNS }: {
  planStart: string
  sessions: readonly ActivitySession[]
  onChanged: (s: ActivitySession) => void
  /** Injicerbar för test. */
  kolumnerFinns?: boolean
}) {
  const idag = formatLocalDate(new Date())
  const manader = useMemo(() => avvikelseManader(planStart, idag), [planStart, idag])
  const [manad, setManad] = useState(manader[0])
  const [sparar, setSparar] = useState<string | null>(null)
  const [fel, setFel] = useState<string | null>(null)
  const [kopierat, setKopierat] = useState<'ja' | 'fel' | null>(null)

  const { from, to } = manadGranser(manad)
  const rader = avvikelserader(sessions, from, to)
  const okanda = omarkeradePasserade(sessions, from, to, idag)

  const vaxlaUnderrattad = async (sessionId: string, underrattad: boolean) => {
    setSparar(sessionId)
    setFel(null)
    try {
      onChanged(await aktivitetsplanApi.sattAfUnderrattad(sessionId, underrattad ? null : new Date().toISOString()))
    } catch (err) {
      setFel(err instanceof Error ? err.message : 'Underrättelsen kunde inte sparas')
    } finally {
      setSparar(null)
    }
  }

  const kopiera = async () => {
    try {
      await navigator.clipboard.writeText(avvikelserSomText(rader, kolumnerFinns))
      setKopierat('ja')
    } catch {
      setKopierat('fel')
    }
  }

  return (
    <SpaltYta ikon="avvikelse" rubrik="Avvikelser till Arbetsförmedlingen" testId="avvikelserapport">
      <div className="grid gap-2">
        <p className="m-0 text-sm text-[var(--j-blak-2)]">Datum, typ, orsak och om handläggaren på Arbetsförmedlingen underrättats (FFU §4.4).</p>
        <Select id="avvikelse-manad" label="Månad" options={manader.map((m) => ({ value: m, label: manadEtikett(m) }))} value={manad} onChange={(e) => setManad(e.target.value)} />
      </div>

      {rader.length === 0 ? (
        <p className="m-0 text-sm text-[var(--j-blak-2)]" role="status">Inga avvikelser registrerade i {manadEtikett(manad)}.</p>
      ) : (
        <ul className="m-0 p-0 list-none grid gap-2" aria-label={`Avvikelser i ${manadEtikett(manad)}`}>
          {rader.map((r) => (
            <li key={r.sessionId} className="grid gap-1 rounded-[var(--j-r-m)] bg-[var(--j-sankt)] px-3 py-2.5 text-sm">
              <p className="m-0 font-semibold text-[var(--j-blak)]">{kortDatum(r.datum)} · {r.typ}</p>
              <p className="m-0 text-[var(--j-blak-2)]">{r.pass}</p>
              {r.orsak ? (
                <p className="m-0 text-[var(--j-blak)]"><span className="text-[var(--j-blak-3)]">Orsak:</span> {r.orsak}</p>
              ) : (
                <OrsakFalt sessionId={r.sessionId} onSparad={onChanged} />
              )}
              {kolumnerFinns && (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {r.underrattad
                    ? <StatusChip status="narvarande">{`AF underrättad ${kortDatum(new Date(r.underrattad).toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' }))}`}</StatusChip>
                    : <StatusChip status="vantar">AF inte underrättad</StatusChip>}
                  {r.underrattad ? (
                    <Button ton="kvarter" variant="tertiary" size="sm" disabled={sparar !== null} onClick={() => void vaxlaUnderrattad(r.sessionId, true)}>
                      Ångra
                    </Button>
                  ) : (
                    <Button
                      ton="kvarter"
                      variant="secondary"
                      size="sm"
                      disabled={sparar !== null}
                      onClick={() => void vaxlaUnderrattad(r.sessionId, false)}
                      leftIcon={<KvarterIkon namn="bock" size={18} />}
                    >
                      Markera som underrättad
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {okanda > 0 && (
        <p className="m-0 text-sm rounded-[var(--j-r-m)] bg-[var(--s-planerat-bg)] text-[var(--s-planerat-text)] px-3 py-2" role="status">
          {okanda} {okanda === 1 ? 'passerat pass är' : 'passerade pass är'} inte markerade i {manadEtikett(manad)} — utfallet är okänt och finns inte med ovan.
        </p>
      )}
      {fel && <p role="alert" className="m-0 text-sm text-[var(--s-ogiltig-text)]">{fel}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button ton="kvarter" variant="secondary" size="sm" onClick={() => void kopiera()} leftIcon={<KvarterIkon namn="kopiera" size={18} />}>
          {kopierat === 'ja' ? 'Kopierat' : 'Kopiera avvikelserna'}
        </Button>
        {kopierat === 'fel' && <span role="alert" className="text-xs text-[var(--s-ogiltig-text)]">Webbläsaren tillät inte kopiering — markera texten och kopiera den för hand.</span>}
      </div>
      <p className="m-0 text-xs text-[var(--j-blak-3)]">
        Portalen skickar ingenting till Arbetsförmedlingen. Avvikelserna rapporterar du själv i Arbetsförmedlingens system;
        {kolumnerFinns ? ' markera här när det är gjort.' : ' kopiera texten därifrån.'} Bara pass som verksamheten håller i och som du markerat räknas.
      </p>
    </SpaltYta>
  )
}
