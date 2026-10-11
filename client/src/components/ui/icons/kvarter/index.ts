/**
 * Ikonsetet "Kvarter" — se KvarterIkon.tsx för API:t.
 *
 *   import { IkonNarvaro, KvarterIkon } from '@/components/ui/icons/kvarter'
 *   <IkonNarvaro className='w-5 h-5' ton='narvarande' />
 *   <KvarterIkon namn='kalender' size={20} />
 *
 * Befintliga ikoner (lucide via @/components/ui/icons) byts sida för sida,
 * inte i ett svep.
 */
import { skapaKvarterIkon } from './skapa'

export { KvarterIkon } from './KvarterIkon'
export { skapaKvarterIkon } from './skapa'
export type { KvarterIkonProps, KvarterTon } from './KvarterIkon'
export { KVARTER_NAMN, KVARTER_ETIKETT } from './ritningar'
export type { KvarterNamn } from './ritningar'

export const IkonNarvaro = skapaKvarterIkon('narvaro')
export const IkonFranvaro = skapaKvarterIkon('franvaro')
export const IkonSjuk = skapaKvarterIkon('sjuk')
export const IkonMote = skapaKvarterIkon('mote')
export const IkonFysiskt = skapaKvarterIkon('fysiskt')
export const IkonDigitalt = skapaKvarterIkon('digitalt')
export const IkonPlan = skapaKvarterIkon('plan')
export const IkonUnderlag = skapaKvarterIkon('underlag')
export const IkonAvvikelse = skapaKvarterIkon('avvikelse')
export const IkonMeddelande = skapaKvarterIkon('meddelande')
export const IkonSamtal = skapaKvarterIkon('samtal')
export const IkonJobb = skapaKvarterIkon('jobb')
export const IkonUppfoljning = skapaKvarterIkon('uppfoljning')
export const IkonDeltagare = skapaKvarterIkon('deltagare')
export const IkonGrupp = skapaKvarterIkon('grupp')
export const IkonVarning = skapaKvarterIkon('varning')
export const IkonKlart = skapaKvarterIkon('klart')
export const IkonNasta = skapaKvarterIkon('nasta')
export const IkonKalender = skapaKvarterIkon('kalender')
export const IkonDokument = skapaKvarterIkon('dokument')
export const IkonTid = skapaKvarterIkon('tid')
export const IkonHandlaggare = skapaKvarterIkon('handlaggare')
export const IkonHem = skapaKvarterIkon('hem')
export const IkonLykta = skapaKvarterIkon('lykta')
export const IkonSok = skapaKvarterIkon('sok')
export const IkonPil = skapaKvarterIkon('pil')
export const IkonTillbaka = skapaKvarterIkon('tillbaka')
export const IkonMer = skapaKvarterIkon('mer')
export const IkonKopiera = skapaKvarterIkon('kopiera')
export const IkonBock = skapaKvarterIkon('bock')
export const IkonKryss = skapaKvarterIkon('kryss')
export const IkonStreck = skapaKvarterIkon('streck')
