/**
 * Inloggningens andra steg (KSL25 / spår KF). Den som har slagit på
 * tvåstegsinloggning och loggat in med bara lösenord har en session på
 * `aal1` medan Supabase säger att nästa nivå är `aal2`. Då täcker den här
 * rutan appen tills koden är angiven.
 *
 * Fail closed åt rätt håll: kan nivån inte läsas visas ingenting här — det är
 * RLS och Supabase som avgör vad sessionen når, och grinden ska inte låsa ute
 * någon som inte har tvåsteg på för att ett nätanrop föll.
 *
 * `KravTvaSteg` är konsulentvyns krav för chef och admin (beslut Mikael
 * 2026-10-18): utan en verifierad faktor visas påslaget i stället för vyn.
 */
import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Loader2, AlertCircle } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useAuthStore } from '@/stores/authStore'
import { mfaApi, kraverTvaSteg } from '@/services/mfaApi'
import { orgApi } from '@/services/orgApi'
import { KodFalt, SlaPaTvaSteg } from '@/components/settings/TvaStegsInloggning'
import { MFA_NYCKEL, MFA_ASSURANS_NYCKEL, useMfaFaktorer, useMfaAssurans, mfaFelText as felText } from '@/hooks/useMfa'

export function MfaGrind() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const inloggad = useAuthStore((s) => !!s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const assurans = useMfaAssurans(inloggad)
  const behover = assurans.data?.nasta === 'aal2' && assurans.data?.nuvarande === 'aal1'
  const faktorer = useMfaFaktorer()
  const [kod, setKod] = useState('')
  const [arbetar, setArbetar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const ref = useFocusTrap<HTMLDivElement>(!!behover, { autoFocus: true })

  if (!inloggad || !behover) return null
  const faktor = faktorer.data?.find((f) => f.verifierad)

  const skicka = async (e: FormEvent) => {
    e.preventDefault()
    if (!faktor) return
    setArbetar(true); setFel(null)
    try {
      await mfaApi.verifiera(faktor.id, kod)
      setKod('')
      await qc.invalidateQueries({ queryKey: MFA_ASSURANS_NYCKEL })
      await qc.invalidateQueries({ queryKey: MFA_NYCKEL })
    } catch (err) { setFel(felText(t, err)) } finally { setArbetar(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-stone-900/60 flex items-center justify-center p-4">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="mfa-grind-rubrik" className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-[var(--c-text)]" aria-hidden="true" />
          <h2 id="mfa-grind-rubrik" className="text-lg font-semibold text-stone-900 dark:text-stone-100">{t('settings.security.mfa.grindRubrik')}</h2>
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400">{t('settings.security.mfa.grindText')}</p>
        <form onSubmit={skicka} className="space-y-4">
          <KodFalt id="mfa-grind-kod" varde={kod} onChange={setKod} />
          {fel && <p role="alert" className="text-sm text-red-700 dark:text-red-300 flex gap-2"><AlertCircle className="w-4 h-4 mt-0.5" aria-hidden="true" />{fel}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={arbetar || !faktor || kod.replace(/\s/g, '').length !== 6}>
              {arbetar && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {t('settings.security.mfa.logaIn')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => void signOut()}>{t('settings.security.mfa.loggaUt')}</Button>
          </div>
        </form>
        <p className="text-xs text-stone-600 dark:text-stone-400">{t('settings.security.mfa.tappatApp')}</p>
      </div>
    </div>
  )
}

/** Konsulentvyns krav: chef/admin utan verifierad faktor ser påslaget i stället för vyn. */
export function KravTvaSteg({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const medlemskap = useQuery({ queryKey: ['org-medlemskap'], queryFn: () => orgApi.myMemberships(), staleTime: 5 * 60_000 })
  const kravs = kraverTvaSteg(medlemskap.data ?? [])
  const faktorer = useMfaFaktorer()

  if (!kravs) return <>{children}</>
  if (faktorer.isLoading) return <LoadingState />
  // Kan faktorerna inte läsas släpps vyn fram: RLS styr åtkomsten, och ett nätfel ska inte
  // låsa ute en chef mitt i arbetet. Grinden ovanför (MfaGrind) kräver koden när faktorn finns.
  if (faktorer.isError || faktorer.data?.some((f) => f.verifierad)) return <>{children}</>

  return (
    <div className="max-w-xl space-y-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-[var(--c-text)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{t('settings.security.mfa.kravRubrik')}</h2>
      </div>
      <p className="text-sm text-stone-700 dark:text-stone-300">{t('settings.security.mfa.kravText')}</p>
      <SlaPaTvaSteg />
    </div>
  )
}
