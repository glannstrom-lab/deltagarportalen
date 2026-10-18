/** Frågor och felhjälp för tvåstegsinloggningen (KSL25 / spår KF). Komponenterna ligger i
 *  `components/settings/TvaStegsInloggning.tsx` och `components/auth/MfaGrind.tsx`. */
import { useQuery } from '@tanstack/react-query'
import { mfaApi, MfaFel } from '@/services/mfaApi'

export const MFA_NYCKEL = ['mfa-faktorer'] as const
export const MFA_ASSURANS_NYCKEL = ['mfa-assurans'] as const

export function useMfaFaktorer() {
  return useQuery({ queryKey: MFA_NYCKEL, queryFn: () => mfaApi.faktorer(), staleTime: 60_000 })
}

export function useMfaAssurans(aktiv: boolean) {
  return useQuery({ queryKey: MFA_ASSURANS_NYCKEL, queryFn: () => mfaApi.assurans(), enabled: aktiv, staleTime: 30_000 })
}

export function mfaFelText(t: (k: string) => string, e: unknown): string {
  return e instanceof MfaFel && e.kod === 'fel-kod'
    ? t('settings.security.mfa.felKod')
    : t('settings.security.mfa.felAnnat')
}
