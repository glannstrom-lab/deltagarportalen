/**
 * Byt lösenord i Inställningar (BP6, bekräftat i skarpt test 2026-09-28): formuläret
 * var tre fält och en knapp utan onClick — det gjorde ingenting.
 *
 * Nuvarande lösenord prövas med signInWithPassword innan updateUser, så ett konto
 * som lämnats inloggat på en delad dator inte kan få lösenordet bytt av någon annan.
 * Konton utan lösenord (bara Google) får i stället en länk mejlad för att välja ett.
 */
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NyttLosenordFalt } from '@/components/auth/NyttLosenordFalt'
import { losenordetDuger } from '@/components/auth/losenordetDuger'

type Lage = { typ: 'laddar' } | { typ: 'losenord'; epost: string } | { typ: 'utan'; epost: string | null }

export function BytLosenord() {
  const { t } = useTranslation()
  const [nuvarande, setNuvarande] = useState('')
  const [nytt, setNytt] = useState('')
  const [bekrafta, setBekrafta] = useState('')
  const [fel, setFel] = useState<string | null>(null)
  const [klart, setKlart] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)

  // Användaren ur authStore (redan hämtad) i stället för ett eget getUser-anrop.
  const anvandare = useAuthStore((st) => st.user)
  const lage: Lage = useMemo(() => {
    if (!anvandare) return { typ: 'laddar' }
    const harLosenord = (anvandare.identities ?? []).some((i) => i.provider === 'email')
    return harLosenord && anvandare.email ? { typ: 'losenord', epost: anvandare.email } : { typ: 'utan', epost: anvandare.email ?? null }
  }, [anvandare])

  const byt = async () => {
    if (lage.typ !== 'losenord') return
    setFel(null)
    setKlart(null)
    if (!nuvarande) return setFel(t('aterstall.angeNuvarande'))
    if (!losenordetDuger(nytt)) return setFel(t('aterstall.uppfyllerInte'))
    if (nytt !== bekrafta) return setFel(t('aterstall.olika'))
    setSparar(true)
    try {
      const { error: inloggFel } = await supabase.auth.signInWithPassword({ email: lage.epost, password: nuvarande })
      if (inloggFel) return setFel(t('aterstall.nuvarandeFel'))
      const { error } = await supabase.auth.updateUser({ password: nytt })
      if (error) return setFel(/different from the old|same/i.test(error.message) ? t('aterstall.sammaSomForut') : t('aterstall.sparaFel'))
      setNuvarande('')
      setNytt('')
      setBekrafta('')
      setKlart(t('aterstall.bytt'))
    } finally {
      setSparar(false)
    }
  }

  const skickaLank = async () => {
    if (lage.typ !== 'utan' || !lage.epost) return
    setFel(null)
    setSparar(true)
    const { error } = await supabase.functions.invoke('losenord-aterstall', { body: { email: lage.epost } })
    setSparar(false)
    if (error) setFel(t('aterstall.gickInte'))
    else setKlart(t('aterstall.skickat', { epost: lage.epost }))
  }

  if (lage.typ === 'laddar') return null

  if (lage.typ === 'utan') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-stone-700 dark:text-stone-200">{t('aterstall.utanLosenord')}</p>
        {lage.epost && (
          <Button variant="outline" onClick={skickaLank} disabled={sparar}>{t('aterstall.skickaLank')}</Button>
        )}
        {fel && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{fel}</p>}
        {klart && <p role="status" className="text-sm text-emerald-800 dark:text-emerald-300">{klart}</p>}
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void byt() }} noValidate>
      <Input
        label={t('settings.security.currentPassword')}
        type="password"
        autoComplete="current-password"
        value={nuvarande}
        onChange={(e) => setNuvarande(e.target.value)}
        placeholder={t('settings.security.currentPasswordPlaceholder')}
      />
      <NyttLosenordFalt nytt={nytt} bekrafta={bekrafta} onNytt={setNytt} onBekrafta={setBekrafta} />
      {fel && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{fel}</p>}
      {klart && <p role="status" className="text-sm text-emerald-800 dark:text-emerald-300">{klart}</p>}
      <Button type="submit" variant="primary" touchOptimized fullWidth disabled={sparar}>
        {t('settings.security.updatePassword')}
      </Button>
    </form>
  )
}
