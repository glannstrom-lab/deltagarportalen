/**
 * DeltagarHuvud — deltagarsidans huvud i omtaget "Kvarter" (steg 5, 2026-10-11).
 *
 * Namn, läget i en mening, och handlingarna efter förslagets knappregel:
 *   EN primärknapp  — Skicka meddelande (den vanligaste handlingen, kommun A5 / R&M A5)
 *   ramade          — Boka möte, Logga samtal
 *   Mer-menyn       — Plan som PDF, Registrera placering, och sist, avskilt
 *                     och i varningsfärg: Avsluta plan (går inte att ångra)
 *
 * CV-poäng och sparade jobb står inte här längre: de är mått på CV:t, inte på
 * deltagarens läge (diagnosen, punkt 5). De finns under "Om deltagaren" på Översikt.
 *
 * Läget är `null` medan något det bygger på laddar — då står ingenting, hellre
 * än en mening som påstår något om deltagaren för tidigt.
 */
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { MerMeny, type MerMenyVal } from '@/components/ui/MerMeny'
import { StatusChip } from '@/components/ui/StatusChip'
import { KvarterIkon } from '@/components/ui/icons/kvarter/KvarterIkon'
import { initialerAv, type Status } from '@/components/ui/kvarterStatus'
import type { DeltagarStatus } from '@/components/consultant/deltagarStatus'

export type { DeltagarStatus }

/** Aktiv är det vanliga och visas inte; de andra är värda en rad. */
const STATUS_CHIP: Record<Exclude<DeltagarStatus, 'ACTIVE'>, { status: Status; nyckel: string }> = {
  INACTIVE: { status: 'planerat', nyckel: 'consultant.participants.status.inactive' },
  COMPLETED: { status: 'planerat', nyckel: 'consultant.participants.status.completed' },
  ON_HOLD: { status: 'vantar', nyckel: 'consultant.participants.status.onHold' },
  FOLLOW_UP: { status: 'planerat', nyckel: 'consultant.participants.status.followUp' },
}

export interface PlanAtgarder {
  /** Finns det en plan att ladda ner eller avsluta? */
  harPlan: boolean
  pdfLaddar: boolean
  onPdf: () => void
  onAvsluta: () => void
}

export function DeltagarHuvud({
  namn,
  bildUrl,
  epost,
  telefon,
  status,
  placeringsrad,
  laget,
  meddelandeLast = null,
  loggarSamtal,
  onMeddelande,
  onBokaMote,
  onLoggaSamtal,
  onRegistreraPlacering,
  plan,
}: {
  namn: string
  bildUrl: string | null
  epost: string
  telefon: string | null
  status: DeltagarStatus
  placeringsrad: string | null
  laget: string | null
  /** "Läst 14:32" för konsulentens senaste meddelande till deltagaren, null = visa inget. */
  meddelandeLast?: string | null
  loggarSamtal: boolean
  onMeddelande: () => void
  onBokaMote: () => void
  onLoggaSamtal: () => void
  onRegistreraPlacering: () => void
  plan: PlanAtgarder | null
}) {
  const { t } = useTranslation()
  const statusChip = status === 'ACTIVE' ? null : STATUS_CHIP[status] ?? STATUS_CHIP.INACTIVE
  const merVal: MerMenyVal[] = [
    ...(plan?.harPlan
      ? [{ etikett: plan.pdfLaddar ? 'Skapar PDF…' : 'Plan som PDF', ikon: 'dokument' as const, onClick: plan.onPdf, disabled: plan.pdfLaddar }]
      : []),
    { etikett: 'Registrera placering', ikon: 'jobb', onClick: onRegistreraPlacering },
    ...(plan?.harPlan ? [{ etikett: 'Avsluta plan', ikon: 'kryss' as const, farlig: true, onClick: plan.onAvsluta }] : []),
  ]

  return (
    <header
      className="grid items-center gap-x-4 gap-y-2.5 grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto]"
      data-testid="deltagar-huvud"
    >
      {bildUrl ? (
        <img src={bildUrl} alt="" className="row-start-1 col-start-1 w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="row-start-1 col-start-1 w-14 h-14 sm:w-16 sm:h-16 rounded-full grid place-items-center font-rubrik text-lg sm:text-xl font-bold bg-[var(--j-gran-mjuk)] text-[var(--j-gran-text)]"
        >
          {initialerAv(namn)}
        </span>
      )}
      <h1 className="row-start-1 col-start-2 m-0 min-w-0 font-rubrik text-[1.625rem] sm:text-[2rem] leading-[1.1] font-bold text-[var(--j-blak)] break-words">
        {namn}
      </h1>

      {/* Läget: ord före siffror. Tomt under laddning (min-höjd så raden inte hoppar).
          Får hela bredden under namnet — det är sidans viktigaste mening. */}
      <p
        className="row-start-2 col-[1/3] sm:col-[2/3] lg:col-[2/4] m-0 min-h-[1.5rem] text-base leading-6 text-[var(--j-blak-2)]"
        data-testid="deltagar-laget"
      >
        {laget}
      </p>
      <p className="row-start-3 col-[1/3] sm:col-[2/3] lg:col-[2/4] m-0 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
        {statusChip && <StatusChip status={statusChip.status}>{t(statusChip.nyckel)}</StatusChip>}
        {meddelandeLast && (
          <span data-testid="meddelande-last" className="inline-flex items-center gap-1.5 text-[var(--j-blak-2)]">
            <KvarterIkon namn="meddelande" size={16} />
            Ditt senaste meddelande: {meddelandeLast.charAt(0).toLowerCase() + meddelandeLast.slice(1)}
          </span>
        )}
        {placeringsrad && (
          <span data-testid="placering-status"><StatusChip status="narvarande">{placeringsrad}</StatusChip></span>
        )}
        {/* Slipningen 2026-10-11 (kommun A6): ett tryck för att ringa eller mejla. */}
        <a href={`mailto:${epost}`} className="inline-flex items-center gap-1.5 min-w-0 break-all min-h-[44px] sm:min-h-0 hover:underline underline-offset-2 text-[var(--j-blak-2)]">
          <KvarterIkon namn="meddelande" size={16} />
          {epost}
        </a>
        {telefon && (
          <a href={`tel:${telefon.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-0 hover:underline underline-offset-2 text-[var(--j-blak-2)]">
            <KvarterIkon namn="samtal" size={16} />
            {telefon}
          </a>
        )}
      </p>

      {/* RK17: på 390 px radbryts knapparna under namnet — primärknappen får hela raden. */}
      <div
        className="row-start-4 col-[1/3] mt-2 lg:mt-0 lg:row-start-1 lg:col-[3/4] flex flex-wrap items-center gap-2 lg:justify-end"
        data-testid="deltagare-atgarder"
      >
        <Button
          ton="kvarter"
          variant="primary"
          onClick={onMeddelande}
          leftIcon={<KvarterIkon namn="meddelande" size={20} />}
          className="w-full sm:w-auto"
        >
          Skicka meddelande
        </Button>
        <Button ton="kvarter" variant="secondary" onClick={onBokaMote} leftIcon={<KvarterIkon namn="kalender" size={20} />}>
          {t('consultant.communication.bookMeeting', 'Boka möte')}
        </Button>
        <Button ton="kvarter" variant="secondary" disabled={loggarSamtal} onClick={onLoggaSamtal} leftIcon={<KvarterIkon namn="samtal" size={20} />}>
          {loggarSamtal ? 'Loggar…' : 'Logga samtal'}
        </Button>
        <MerMeny val={merVal} etikett="Fler åtgärder" baraIkon />
      </div>
    </header>
  )
}
