/**
 * UppladdningDeltagarlistaDialog — FN6: bjud in många deltagare ur en CSV-fil.
 *
 * Fyra steg: välj fil → granska (tabell med riktiga rubriker, felrader med text) →
 * skicka i takt med framsteg → resultat per rad. Inget skickas före bekräftelsen,
 * och inget delfel döljs. Svenska literaler: konsulentvyn översätts inte.
 */

import { useEffect, useRef, useState } from 'react'
import { X, Download, CheckCircle, AlertCircle, Info, Loader2 } from '@/components/ui/icons'
import { Dialog } from '@/components/ui/Dialog'
import { KVARTER_FOKUS } from '@/components/ui/kvarterStatus'
import { cn } from '@/lib/utils'
import { anvandareFranSession } from '@/lib/anvandareFranSession'
import {
  MAX_RADER, avkodaCsv, avgransarnamn, granskaDeltagarlista, markeraBefintliga, raknaStatus, utfallTillCsv,
  type GranskadRad, type RadStatus, type Utfall, type UtfallTyp,
} from './deltagarlistaCsv'
import { hamtaBefintliga, skickaInbjudningar } from './deltagarlistaInbjudan'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** Körs när dialogen stängs efter att något skickats — så listan kan läsas om. */
  onKlar: () => void
  /** Tillbaka till formuläret för en deltagare. */
  onEnskild: () => void
}

type Steg = 'valj' | 'granska' | 'skickar' | 'klart'

const MAX_BYTES = 1_000_000

const STATUS_ETIKETT: Record<RadStatus, string> = {
  ok: 'Redo att skickas',
  fel: 'Rättas i filen',
  dubblett: 'Dubblett i filen',
  redan_kopplad: 'Redan kopplad',
  redan_inbjuden: 'Redan inbjuden',
}
const STATUS_TON: Record<RadStatus, 'ok' | 'fel' | 'hoppar'> = {
  ok: 'ok', fel: 'fel', dubblett: 'hoppar', redan_kopplad: 'hoppar', redan_inbjuden: 'hoppar',
}
const UTFALL_ETIKETT: Record<UtfallTyp, string> = {
  skickad: 'Inbjudan skickad',
  sparad_utan_mejl: 'Sparad, mejlet uteblev',
  fel: 'Misslyckades',
  ej_skickad: 'Ej skickad',
}
const UTFALL_TON: Record<UtfallTyp, 'ok' | 'fel' | 'hoppar'> = {
  skickad: 'ok', sparad_utan_mejl: 'fel', fel: 'fel', ej_skickad: 'hoppar',
}

const TON_KLASS = {
  ok: 'bg-[var(--s-narvarande-bg)] text-[var(--s-narvarande-text)]',
  fel: 'bg-[var(--s-ogiltig-bg)] text-[var(--s-ogiltig-text)]',
  hoppar: 'bg-[var(--s-planerat-bg)] text-[var(--s-planerat-text)]',
} as const

function Etikett({ ton, text }: { ton: keyof typeof TON_KLASS; text: string }) {
  const Ikon = ton === 'ok' ? CheckCircle : ton === 'fel' ? AlertCircle : Info
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap', TON_KLASS[ton])}>
      <Ikon className="w-3.5 h-3.5" aria-hidden="true" />
      {text}
    </span>
  )
}

const KNAPP = 'px-4 min-h-[44px] rounded-[var(--j-r-m)] font-medium disabled:opacity-50 disabled:cursor-not-allowed'
const PRIMAR = cn(KNAPP, 'bg-[var(--j-gran)] text-[var(--j-pa-gran)]', KVARTER_FOKUS)
const SEKUNDAR = cn(KNAPP, 'border border-[var(--j-linje-2)] bg-[var(--j-kort)] text-[var(--j-blak)]', KVARTER_FOKUS)

const TH = 'text-left font-semibold text-[var(--j-blak-2)] px-3 py-2 border-b border-[var(--j-linje)] whitespace-nowrap'
const TD = 'px-3 py-2 align-top border-b border-[var(--j-linje)] text-[var(--j-blak)]'

function nedladdning(text: string, filnamn: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filnamn
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function UppladdningDeltagarlistaDialog({ isOpen, onClose, onKlar, onEnskild }: Props) {
  const [steg, setSteg] = useState<Steg>('valj')
  const [filnamn, setFilnamn] = useState('')
  const [rader, setRader] = useState<GranskadRad[]>([])
  const [info, setInfo] = useState<string[]>([])
  const [fel, setFel] = useState<string | null>(null)
  const [laser, setLaser] = useState(false)
  const [framsteg, setFramsteg] = useState({ klara: 0, totalt: 0 })
  const [utfall, setUtfall] = useState<Utfall[]>([])
  const avbryt = useRef<AbortController | null>(null)
  const rubrikRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setSteg('valj'); setFilnamn(''); setRader([]); setInfo([]); setFel(null); setLaser(false)
      setFramsteg({ klara: 0, totalt: 0 }); setUtfall([])
      avbryt.current?.abort()
    }
  }, [isOpen])

  // Fokus till rubriken vid stegbyte, så skärmläsare följer med.
  useEffect(() => { if (isOpen) rubrikRef.current?.focus() }, [steg, isOpen])

  const stang = () => {
    if (steg === 'skickar') return
    if (steg === 'klart') onKlar()
    onClose()
  }

  const lasFil = async (fil: File) => {
    setFel(null)
    setLaser(true)
    try {
      if (/\.xlsx?$/i.test(fil.name)) {
        setFel('Det här är en Excel-fil. Välj Arkiv > Spara som > CSV (semikolonavgränsad) i Excel och ladda upp den filen.')
        return
      }
      if (fil.size > MAX_BYTES) { setFel('Filen är större än 1 MB. En deltagarlista behöver inte vara det — kontrollera att det är rätt fil.'); return }
      const { text, kodning } = avkodaCsv(new Uint8Array(await fil.arrayBuffer()))
      const g = granskaDeltagarlista(text)
      if (!g.ok) { setFel(g.fel); return }
      const { data: { user } } = await anvandareFranSession()
      if (!user) { setFel('Du är inte inloggad längre — logga in igen.'); return }
      const befintliga = await hamtaBefintliga(user.id)
      setRader(markeraBefintliga(g.rader, befintliga.kopplade, befintliga.inbjudna))
      setInfo([
        `Läste ${g.rader.length} rader (${avgransarnamn(g.avgransare)}avgränsad, ${kodning === 'utf-8' ? 'UTF-8' : 'Windows-1252'}).`,
        ...(g.ignoreradeRubriker.length > 0 ? [`Kolumner som inte används: ${g.ignoreradeRubriker.join(', ')}.`] : []),
      ])
      setFilnamn(fil.name)
      setSteg('granska')
    } catch (e) {
      setFel(e instanceof Error ? e.message : 'Filen kunde inte läsas.')
    } finally {
      setLaser(false)
    }
  }

  const skicka = async () => {
    const { data: { user } } = await anvandareFranSession()
    if (!user) { setFel('Du är inte inloggad längre — logga in igen.'); return }
    const ac = new AbortController()
    avbryt.current = ac
    setFel(null)
    setSteg('skickar')
    setFramsteg({ klara: 0, totalt: rader.filter((r) => r.status === 'ok').length })
    try {
      setUtfall(await skickaInbjudningar(rader, user.id, {
        signal: ac.signal,
        onFramsteg: (klara, totalt) => setFramsteg({ klara, totalt }),
      }))
    } catch (e) {
      setFel(e instanceof Error ? e.message : 'Utskicket avbröts oväntat.')
      setUtfall([])
    }
    setSteg('klart')
  }

  const rakning = raknaStatus(rader)
  const skickade = utfall.filter((u) => u.utfall === 'skickad').length
  const problem = utfall.filter((u) => u.utfall !== 'skickad')

  return (
    <Dialog
      isOpen={isOpen}
      onClose={stang}
      labelledBy="lista-dialog-titel"
      className="bg-[var(--j-kort)] text-[var(--j-blak)] rounded-[var(--j-r-m)] shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-4 p-6 border-b border-[var(--j-linje)]">
        <div>
          <h2 id="lista-dialog-titel" ref={rubrikRef} tabIndex={-1} className="m-0 text-xl font-bold outline-none">
            {steg === 'valj' && 'Ladda upp en deltagarlista'}
            {steg === 'granska' && 'Granska listan innan något skickas'}
            {steg === 'skickar' && 'Skickar inbjudningar'}
            {steg === 'klart' && 'Klart – så gick det'}
          </h2>
          <p className="m-0 mt-1 text-sm text-[var(--j-blak-2)]">
            {steg === 'valj' && 'En CSV-fil med en deltagare per rad.'}
            {steg === 'granska' && filnamn}
          </p>
        </div>
        <button type="button" onClick={stang} disabled={steg === 'skickar'} aria-label="Stäng" className={cn('p-2 rounded-[var(--j-r-m)] min-w-[44px] min-h-[44px] disabled:opacity-40', KVARTER_FOKUS)}>
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {fel && (
          <p role="alert" className={cn('m-0 rounded-[var(--j-r-m)] px-4 py-3 text-sm', TON_KLASS.fel)}>{fel}</p>
        )}

        {steg === 'valj' && (
          <>
            <div className="text-sm text-[var(--j-blak-2)] space-y-2">
              <p className="m-0">Första raden är rubriker. Kolumnerna kan stå i valfri ordning:</p>
              <ul className="m-0 pl-5 list-disc space-y-1">
                <li><strong>E-post</strong> (krävs)</li>
                <li><strong>Namn</strong>, eller Förnamn och Efternamn</li>
                <li><strong>Ärendenummer</strong> och <strong>Startdatum</strong> (ÅÅÅÅ-MM-DD eller DD/MM-ÅÅÅÅ). Inga personnummer.</li>
              </ul>
              <p className="m-0">
                Exempel: <code className="bg-[var(--j-sankt)] px-1.5 py-0.5 rounded">Namn;E-post;Ärendenummer;Startdatum</code>
              </p>
              <p className="m-0">
                Högst {MAX_RADER} rader åt gången. Excel-filer (.xlsx) måste sparas som CSV först. Semikolon, komma och tabb fungerar,
                liksom UTF-8 och Excels vanliga teckenkodning.
              </p>
              <p className="m-0 flex gap-2 items-start rounded-[var(--j-r-m)] px-3 py-2 bg-[var(--s-planerat-bg)] text-[var(--s-planerat-text)]">
                <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  Ärendenummer och startdatum sparas på inbjudan, men förs inte över till deltagarens plan automatiskt än.
                  Lägg in dem på planen när deltagaren har gått med.
                </span>
              </p>
            </div>
            <div>
              <label htmlFor="lista-fil" className="block text-sm font-medium mb-1">Välj CSV-fil</label>
              <input
                id="lista-fil"
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                disabled={laser}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void lasFil(f); e.target.value = '' }}
                className={cn('block w-full text-sm text-[var(--j-blak)]', KVARTER_FOKUS)}
              />
              {laser && (
                <p role="status" className="m-0 mt-2 text-sm text-[var(--j-blak-2)] flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Läser filen och kontrollerar dubbletter…
                </p>
              )}
            </div>
            <div className="flex justify-between gap-3 pt-2">
              <button type="button" onClick={onEnskild} className={SEKUNDAR}>Bjud in en i taget</button>
              <button type="button" onClick={stang} className={SEKUNDAR}>Avbryt</button>
            </div>
          </>
        )}

        {steg === 'granska' && (
          <>
            {info.map((t) => <p key={t} className="m-0 text-sm text-[var(--j-blak-2)]">{t}</p>)}
            <p role="status" className="m-0 text-sm font-medium">
              {rakning.ok} redo att skickas
              {rakning.fel > 0 && ` · ${rakning.fel} med fel`}
              {rakning.dubblett > 0 && ` · ${rakning.dubblett} dubbletter i filen`}
              {rakning.redan_kopplad > 0 && ` · ${rakning.redan_kopplad} redan kopplade`}
              {rakning.redan_inbjuden > 0 && ` · ${rakning.redan_inbjuden} redan inbjudna`}
            </p>
            {rakning.fel > 0 && (
              <p className="m-0 text-sm text-[var(--j-blak-2)]">
                Rader med fel skickas inte. Rätta dem i filen och ladda upp den igen, eller skicka de som är klara nu och ta resten efteråt.
              </p>
            )}
            <div
              className="overflow-auto max-h-[45vh] border border-[var(--j-linje)] rounded-[var(--j-r-m)]"
              role="region"
              aria-label="Granskade rader"
              tabIndex={0}
            >
              <table className="w-full text-sm border-collapse">
                <caption className="sr-only">Deltagare i filen och om de kan bjudas in</caption>
                <thead>
                  <tr>
                    <th scope="col" className={TH}>Rad</th>
                    <th scope="col" className={TH}>Namn</th>
                    <th scope="col" className={TH}>E-post</th>
                    <th scope="col" className={TH}>Ärendenummer</th>
                    <th scope="col" className={TH}>Startdatum</th>
                    <th scope="col" className={TH}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rader.map((r) => (
                    <tr key={r.rad}>
                      <td className={TD}>{r.rad}</td>
                      <td className={TD}>{[r.fornamn, r.efternamn].filter(Boolean).join(' ') || '–'}</td>
                      <td className={cn(TD, 'break-all')}>{r.epost || '–'}</td>
                      <td className={TD}>{r.arendenummer ?? '–'}</td>
                      <td className={TD}>{r.startdatum ?? '–'}</td>
                      <td className={TD}>
                        <Etikett ton={STATUS_TON[r.status]} text={STATUS_ETIKETT[r.status]} />
                        {r.orsak && <p className="m-0 mt-1 text-xs text-[var(--j-blak-2)]">{r.orsak}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="m-0 text-sm text-[var(--j-blak-2)]">
              Varje deltagare får ett mejl från Jobin. Har adressen redan ett konto blir det en förfrågan hen godkänner själv.
              Utskicket går i en lugn takt och {rakning.ok > 0 ? `tar ungefär ${Math.max(1, Math.ceil((rakning.ok / 4) * 1.5))} sekunder` : 'behövs inte'}.
            </p>
            <div className="flex justify-between gap-3 pt-2">
              <button type="button" onClick={() => { setSteg('valj'); setRader([]); setFel(null) }} className={SEKUNDAR}>Välj en annan fil</button>
              <button type="button" onClick={() => void skicka()} disabled={rakning.ok === 0} className={PRIMAR}>
                Skicka {rakning.ok} {rakning.ok === 1 ? 'inbjudan' : 'inbjudningar'}
              </button>
            </div>
          </>
        )}

        {steg === 'skickar' && (
          <>
            <p role="status" aria-live="polite" className="m-0 flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              {framsteg.klara} av {framsteg.totalt} klara. Stäng inte fönstret.
            </p>
            <progress className="w-full" max={framsteg.totalt || 1} value={framsteg.klara} aria-label="Hur många inbjudningar som är skickade" />
            <div className="flex justify-end">
              <button type="button" onClick={() => avbryt.current?.abort()} className={SEKUNDAR}>Avbryt resten</button>
            </div>
          </>
        )}

        {steg === 'klart' && (
          <>
            <p role="status" className="m-0 text-sm font-medium">
              {skickade} av {utfall.length} inbjudningar skickade{problem.length > 0 ? ` – ${problem.length} behöver du titta på` : ''}.
            </p>
            {problem.length > 0 && (
              <p className="m-0 text-sm text-[var(--j-blak-2)]">
                &quot;Sparad, mejlet uteblev&quot; betyder att inbjudan finns men deltagaren inte fått något mejl – hör av dig på annat sätt.
                Skicka inte om filen för de raderna, då blir det dubbletter.
              </p>
            )}
            <div className="overflow-auto max-h-[45vh] border border-[var(--j-linje)] rounded-[var(--j-r-m)]" role="region" aria-label="Resultat per rad" tabIndex={0}>
              <table className="w-full text-sm border-collapse">
                <caption className="sr-only">Resultat för varje deltagare</caption>
                <thead>
                  <tr>
                    <th scope="col" className={TH}>Rad</th>
                    <th scope="col" className={TH}>E-post</th>
                    <th scope="col" className={TH}>Utfall</th>
                  </tr>
                </thead>
                <tbody>
                  {utfall.map((u) => (
                    <tr key={u.rad}>
                      <td className={TD}>{u.rad}</td>
                      <td className={cn(TD, 'break-all')}>{u.epost}</td>
                      <td className={TD}>
                        <Etikett ton={UTFALL_TON[u.utfall]} text={UTFALL_ETIKETT[u.utfall]} />
                        {u.utfall !== 'skickad' && <p className="m-0 mt-1 text-xs text-[var(--j-blak-2)]">{u.meddelande}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between gap-3 pt-2">
              <button type="button" onClick={() => nedladdning(utfallTillCsv(utfall), 'inbjudningar-resultat.csv')} disabled={utfall.length === 0} className={cn(SEKUNDAR, 'inline-flex items-center gap-2')}>
                <Download className="w-4 h-4" aria-hidden="true" /> Spara resultatet (CSV)
              </button>
              <button type="button" onClick={stang} className={PRIMAR}>Stäng</button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
