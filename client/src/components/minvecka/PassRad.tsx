/**
 * PassRad — ett pass i veckans lista (omtaget steg 6, 2026-10-11).
 *
 * En rad, inte ett kort: tid till vänster, passet till höger, och läget som
 * StatusChip (färg + ikon + ord). Handlingarna står under, i den ordning de
 * behövs: "Jag är här" i dag, "Jag kan inte komma" före passet, "Förklara
 * frånvaron" efter en markerad frånvaro, och sist kalendern och frågan.
 *
 * Passet som står överst som nästa steg (`iFokus`) har sina två stora knappar
 * där. Raden visar dem inte en gång till — två "Jag är här" på samma skärm
 * väcker frågan vilken som gäller.
 */
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { StatusChip } from '@/components/ui/StatusChip'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { franNarvarovarde } from '@/components/ui/kvarterStatus'
import type { ActivitySession } from '@/services/aktivitetApi'
import type { Attendance } from '@/services/aktivitetSchema'
import { FranvaroAnmalan, type MoteSammaDag } from './FranvaroAnmalan'
import { ForklaraFranvaro } from './ForklaraFranvaro'
import { FragaOmPasset } from './FragaOmPasset'
import { visaTid } from './forvantasRegler'
import { TYP_NYCKEL } from './passTyp'
import type { PlanensRegelverk } from './planensRegelverk'

const NARVARO_NYCKEL: Record<Attendance, string> = {
  present: 'minVecka.narvaro.present',
  absent_valid: 'minVecka.narvaro.absent_valid',
  absent_invalid: 'minVecka.narvaro.absent_invalid',
  sick_certified: 'minVecka.narvaro.sick_certified',
  external: 'minVecka.narvaro.external',
}

/**
 * KSL21: hos en Rusta och matcha-leverantör bedömer konsulenten inte om skälet
 * är giltigt (det gör Arbetsförmedlingen). Deltagaren ser fakta: anmäld i förväg.
 */
const NARVARO_NYCKEL_LEVERANTOR: Record<Attendance, string> = {
  ...NARVARO_NYCKEL,
  absent_valid: 'minVecka.narvaro.absent_validLeverantor',
}

interface Props {
  pass: ActivitySession
  idag: string
  locale: string
  datumText: string
  /** Passet står överst som nästa steg — incheckning och frånvaro sköts där. */
  iFokus: boolean
  pagar: string | null
  motenSammaDag: readonly MoteSammaDag[]
  passSammaDag: readonly ActivitySession[]
  onCheckin: (pass: ActivitySession) => void
  onKalender: (pass: ActivitySession) => void
  onUppdaterat: (pass: ActivitySession) => void
  onUppdateradeFlera: (pass: ActivitySession[]) => void
  onForklarat: (pass: ActivitySession) => void
  onFragat: (namn: string) => void
  /** KSL21: planens regelverk — styr frånvarons ord. */
  regelverk?: PlanensRegelverk | null
}

export function PassRad({
  pass: s,
  idag,
  locale,
  datumText,
  iFokus,
  pagar,
  motenSammaDag,
  passSammaDag,
  onCheckin,
  onKalender,
  onUppdaterat,
  onUppdateradeFlera,
  onForklarat,
  onFragat,
  regelverk = null,
}: Props) {
  const { t } = useTranslation()
  const status = franNarvarovarde(s.attendance)
  const incheckadKl = s.self_checkin_at
    ? new Date(s.self_checkin_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <li className="flex gap-3 px-4 py-4 sm:gap-4 sm:px-5" data-testid={`pass-${s.id}`}>
      <span className="w-12 shrink-0 pt-0.5 text-[0.9375rem] font-semibold leading-5 tabular-nums text-j-blak">
        {visaTid(s.start_time)}
        <span className="block font-normal text-j-blak-3">{visaTid(s.end_time)}</span>
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <h4 className="m-0 text-base font-semibold leading-6 text-j-blak">{s.title}</h4>
          <p className="m-0 text-[0.9375rem] leading-5 text-j-blak-2">
            {t(TYP_NYCKEL[s.activity_type])}
            {s.location ? ` · ${s.location}` : ''}
          </p>
        </div>

        {s.attendance && status ? (
          <StatusChip status={status}>{t((regelverk === 'leverantor' ? NARVARO_NYCKEL_LEVERANTOR : NARVARO_NYCKEL)[s.attendance])}</StatusChip>
        ) : incheckadKl ? (
          <StatusChip status="narvarande">
            {t('minVecka.incheckad', { defaultValue: 'Incheckad kl {{tid}}', tid: incheckadKl })}
          </StatusChip>
        ) : s.date === idag && !iFokus ? (
          <Button ton="kvarter" variant="secondary" className="w-full sm:w-auto" onClick={() => onCheckin(s)} disabled={pagar === s.id}
            leftIcon={<KvarterIkon namn="narvaro" size={20} ton="narvarande" />}>
            {t('minVecka.jagArHar', 'Jag är här')}
          </Button>
        ) : null}

        {/* F1: kommande, omarkerat pass → "Jag kan inte komma"; anmält → status + ångra */}
        {!s.self_checkin_at && !iFokus && (
          <FranvaroAnmalan
            session={s}
            motenSammaDag={motenSammaDag}
            passSammaDag={passSammaDag}
            datumText={datumText}
            onSaved={onUppdaterat}
            onSavedFlera={onUppdateradeFlera}
            regelverk={regelverk}
          />
        )}
        {/* RD11: en markerad frånvaro kan förklaras i efterhand */}
        <ForklaraFranvaro session={s} onSaved={onForklarat} />

        <div className="-ml-3 flex flex-wrap gap-x-1 gap-y-1 [&>div]:ml-3 [&>div]:basis-full [&>p]:ml-3 [&>p]:basis-full">
          {/* NF1: bara pass som inte redan har varit */}
          {s.date >= idag && (
            <Button
              ton="kvarter"
              variant="tertiary"
              size="sm"
              onClick={() => onKalender(s)}
              aria-label={t('minVecka.kalender.knappEtikett', { defaultValue: 'Lägg till {{titel}} i kalendern', titel: s.title })}
              leftIcon={<KvarterIkon namn="kalender" size={18} />}
            >
              {t('minVecka.kalender.knapp', 'Lägg till i kalendern')}
            </Button>
          )}
          {/* F8: frågan uppstår vid passet — samma sändväg som Min konsulent */}
          {s.activity_type !== 'jobsearch_own' && (
            <FragaOmPasset session={s} datumText={datumText} onSent={onFragat} />
          )}
        </div>
      </div>
    </li>
  )
}
