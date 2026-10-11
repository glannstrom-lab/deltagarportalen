/**
 * NarvaroRad — en deltagare, ett pass, ett närvaroval (omtaget "Kvarter", steg 4).
 *
 * Används av Gruppnärvaron (hela passet på en skärm) och Dagens pass.
 *
 *   - Omarkerat pass: NarvaroVal (radiogrupp med piltangenter). Har deltagaren
 *     checkat in eller anmält frånvaro står ett FÖRSLAG under namnet; inget är
 *     valt i radiogruppen förrän konsulenten klickar — ett förval som ser sparat
 *     ut men inte är det vore en lögn.
 *   - Markerat på den här skärmen: valet går att ändra, och "Ångra" nollställer.
 *     Ogiltig frånvaro fäller ut en rad för vad som hände (följer med till
 *     underlaget).
 *   - Markerat tidigare: bara status. Det ändras på deltagarsidan, där
 *     anteckning och intyg syns — markAttendance skriver om anteckningen, och
 *     en anteckning ska aldrig försvinna i förbifarten.
 *
 * Valen kommer från planens regelverk (KSL21, franvaroFakta.ts): kommunen har
 * Här / Giltig / Ogiltig / Sjuk; en Rusta och matcha-leverantör har Närvarande /
 * Frånvarande / Sjuk, och registrerar om frånvaron var anmäld i förväg — fakta,
 * ingen giltighetsbedömning. `alternativ` skriver över båda (tester).
 * Konsulentvyn är svensk med flit (DESIGN.md §2).
 */
import { useId, useState } from 'react'
import { StatusChip } from '@/components/ui/StatusChip'
import { Checkbox } from '@/components/ui/Input'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { NarvaroVal } from '@/components/ui/NarvaroVal'
import { MerMeny } from '@/components/ui/MerMeny'
import { Button } from '@/components/ui/Button'
import { franNarvarovarde, initialerAv, KVARTER_FOKUS, type NarvaroAlternativ } from '@/components/ui/kvarterStatus'
import { cn } from '@/lib/utils'
import { aktivitetsplanApi } from '@/services/aktivitetApi'
import type { Attendance } from '@/services/aktivitetSchema'
import { NARVARO_ETIKETT, type PassIdag } from '@/lib/dagensPass'
import { narvaroForslag, omarkeratLage } from '@/lib/gruppnarvaro'
import { ANMALD_HJALP, arFranvaro, arLeverantor, narvaroOrd, narvaroValFor, statusOrd, type Regelverk } from './franvaroFakta'

export interface NarvaroRadProps {
  pass: PassIdag
  namn: string
  /** Planens regelverk (KSL21). Utan: kommunens val, som förut. */
  regelverk?: Regelverk | null
  /** Skriver över regelverkets val. */
  alternativ?: readonly NarvaroAlternativ[]
  /** Leverantör: ändra "anmäld i förväg" på en frånvaro (sparas direkt). */
  onAnmald?: (anmald: boolean) => void
  /** Sparar just nu. */
  sparar: boolean
  /** Markerat på den här skärmen — då får det ändras och ångras här. */
  markeradHar: boolean
  /** Valet i radiogruppen (sparas efter en kort paus). */
  onValj: (attendance: Attendance) => void
  /** Ångra / nollställ — sparas direkt. */
  onAngra: () => void
  /** Ett val som syns men inte är skrivet än. */
  utkast?: Attendance
  onOppna: () => void
  /** Tid och titel, när raden inte står under passets egen rubrik. */
  passText?: string
}

function etikettFor(varde: Attendance, alternativ: readonly NarvaroAlternativ[], regelverk: Regelverk | null | undefined): string {
  return alternativ.find((a) => a.varde === varde)?.etikett ?? narvaroOrd(varde, regelverk, NARVARO_ETIKETT)
}

export function NarvaroRad({
  pass: p,
  namn,
  regelverk,
  alternativ: egnaVal,
  onAnmald,
  sparar,
  markeradHar,
  onValj,
  onAngra,
  utkast,
  onOppna,
  passText,
}: NarvaroRadProps) {
  const forslag = narvaroForslag(p, regelverk)
  const status = franNarvarovarde(p.attendance)
  const leverantor = arLeverantor(regelverk)
  const alternativ = egnaVal ?? narvaroValFor(regelverk, p)
  const kanAndras = p.attendance === null || markeradHar

  const lage = p.attendance === null
    ? omarkeratLage(p)
    : p.self_checkin_at || p.absence_reason
      ? omarkeratLage(p)
      : 'Markerad'

  const detaljer: string[] = []
  if (passText) detaljer.push(passText)
  if (p.attendance !== null && !markeradHar) detaljer.push('Ändras på deltagarsidan, där anteckningen syns')

  const statusText = p.attendance === 'external' ? 'Annan aktivitet' : statusOrd(status, regelverk)

  // Egen rad i stället för PersonRad: på mobil står radiogruppen i full bredd under
  // namnet och "Mer" uppe till höger — fyra val och en menyknapp får inte plats bredvid
  // varandra på 390 px. På dator: namn | val | Mer, som i förslagets skiss.
  return (
    <li
      data-testid="narvaro-rad"
      data-pass={p.id}
      className={cn(
        'grid grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3.5 gap-y-3',
        'px-4 sm:px-[18px] py-3.5 border-b border-[var(--j-linje)] last:border-b-0 text-[var(--j-blak)]',
      )}
    >
      <span
        aria-hidden="true"
        className="row-start-1 col-start-1 w-10 h-10 rounded-full grid place-items-center text-[0.8125rem] font-bold bg-[var(--j-gran-mjuk)] text-[var(--j-gran-text)]"
      >
        {initialerAv(namn)}
      </span>

      <div className="row-start-1 col-start-2 grid gap-0.5 min-w-0">
        <button
          type="button"
          onClick={onOppna}
          className={cn('justify-self-start text-left text-base leading-6 font-semibold underline-offset-2 hover:underline rounded-[var(--j-r-s)]', KVARTER_FOKUS)}
        >
          {namn}
        </button>
        <span className="text-[0.9375rem] leading-[1.4] text-[var(--j-blak-2)]">{lage}</span>
        {utkast ? (
          <span className="text-[0.8125rem] leading-5 text-[var(--j-blak-3)]" aria-live="polite">Sparar…</span>
        ) : forslag ? (
          <span className="inline-flex items-center gap-1 text-[0.8125rem] leading-5 font-semibold text-[var(--j-glod)]">
            <KvarterIkon namn="nasta" size={15} ton="glod" />
            Förslag: {etikettFor(forslag.varde, alternativ, regelverk)} · inte sparat än
          </span>
        ) : null}
        {detaljer.length > 0 && <span className="text-[0.8125rem] leading-5 text-[var(--j-blak-3)]">{detaljer.join(' · ')}</span>}
        {status && (!kanAndras || markeradHar) ? (
          <span className="mt-1">
            <StatusChip status={status}>{statusText}</StatusChip>
          </span>
        ) : null}
      </div>

      {kanAndras ? (
        <NarvaroVal
          etikett={`Närvaro för ${namn}`}
          alternativ={alternativ}
          varde={utkast ?? p.attendance}
          onChange={(v) => onValj(v as Attendance)}
          className="row-start-2 col-span-3 sm:row-start-1 sm:col-span-1 sm:col-start-3 w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none [&>button]:justify-center [&>button]:px-2 sm:[&>button]:px-3 [&_svg]:shrink-0"
        />
      ) : null}

      <div className="row-start-1 col-start-3 sm:col-start-4 flex items-center gap-1 justify-self-end">
        {markeradHar && p.attendance !== null ? (
          <Button ton="kvarter" variant="tertiary" size="sm" onClick={onAngra} aria-label={`Ångra: ${namn}`}>
            Ångra
          </Button>
        ) : null}
        {kanAndras ? (
          <MerMeny
            baraIkon
            etikett={`Fler val för ${namn}`}
            val={[{ etikett: 'Annan aktivitet', ikon: 'kalender', onClick: () => onValj('external'), disabled: sparar }]}
          />
        ) : null}
      </div>

      {markeradHar && !utkast && leverantor && arFranvaro(p.attendance) ? (
        <div className="col-span-3 sm:col-span-4 sm:pl-[54px] grid gap-3">
          {onAnmald && (
            <Checkbox
              id={`anmald-${p.id}`}
              label="Anmäld i förväg"
              description={ANMALD_HJALP}
              checked={p.attendance === 'absent_valid'}
              disabled={sparar}
              onChange={(e) => onAnmald(e.target.checked)}
            />
          )}
          <OgiltigRad pass={p} namn={namn} leverantor />
        </div>
      ) : markeradHar && !leverantor && p.attendance === 'absent_invalid' ? (
        <div className="col-span-3 sm:col-span-4">
          <OgiltigRad pass={p} namn={namn} />
        </div>
      ) : null}
    </li>
  )
}

/**
 * "Vad hände?" — en rad som följer med till underlaget. Hos leverantören är det
 * orsaken till frånvaron (anmäld eller inte) som följer med till avvikelsen.
 */
function OgiltigRad({ pass, namn, leverantor = false }: { pass: PassIdag; namn: string; leverantor?: boolean }) {
  const id = useId()
  const [text, setText] = useState('')
  const [lage, setLage] = useState<'tom' | 'sparar' | 'sparad' | 'fel'>('tom')
  const fornamn = namn.split(' ')[0] || namn

  const spara = async () => {
    if (!text.trim()) return
    setLage('sparar')
    try {
      await aktivitetsplanApi.saveAttendanceNote(pass.id, text)
      setLage('sparad')
    } catch {
      setLage('fel')
    }
  }

  return (
    <div className={cn('grid gap-2', !leverantor && 'sm:pl-[54px]')}>
      <label htmlFor={id} className="text-[0.9375rem] text-[var(--j-blak-2)]">
        {leverantor
          ? `Orsak: vad hände med ${fornamn}? En rad räcker, den följer med till avvikelsen.`
          : `Vad hände med ${fornamn}? En rad räcker, den följer med till underlaget.`}
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id={id}
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (lage !== 'sparar') setLage('tom')
          }}
          placeholder="T.ex. svarade inte i telefon, ringer igen måndag"
          className="flex-1 min-h-[44px] px-3 rounded-[var(--j-r-s)] border border-[var(--j-linje-2)] bg-[var(--j-kort)] text-[var(--j-blak)] placeholder:text-[var(--j-blak-3)] focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--j-fokus)]"
        />
        <Button ton="kvarter" variant="secondary" size="sm" onClick={() => void spara()} disabled={!text.trim() || lage === 'sparar'}>
          Spara raden
        </Button>
      </div>
      {lage === 'sparad' && <p role="status" className="text-[0.8125rem] text-[var(--s-narvarande-text)]">Raden är sparad.</p>}
      {lage === 'fel' && <p role="alert" className="text-[0.8125rem] text-[var(--s-ogiltig-text)]">Raden kunde inte sparas. Försök igen.</p>}
    </div>
  )
}
