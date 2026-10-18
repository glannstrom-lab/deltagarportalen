/**
 * Tvåstegsinloggning under Inställningar → Säkerhet, och samma påslagsflöde i
 * konsulentvyns krav för chef/admin (`KravTvaSteg`).
 *
 * Tre lägen, härledda ur Supabase och aldrig ur ett lokalt minne:
 *   av        → knappen "Slå på"
 *   påbörjad  → QR-kod + hemlighet + kodfält
 *   på        → status + "Stäng av" (kräver att sessionen angett koden, aal2)
 */
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Loader2, AlertCircle } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { mfaApi, type NyFaktor } from '@/services/mfaApi'
import { MFA_NYCKEL, MFA_ASSURANS_NYCKEL, useMfaFaktorer, mfaFelText as felText } from '@/hooks/useMfa'

/** Sexsiffrigt kodfält med en etikett — delas av påslaget och inloggningsgrinden. */
export function KodFalt({ id, varde, onChange }: { id: string; varde: string; onChange: (v: string) => void }) {
  const { t } = useTranslation()
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-800 dark:text-stone-200 mb-1">
        {t('settings.security.mfa.kodEtikett')}
      </label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]*"
        maxLength={7}
        value={varde}
        onChange={(e) => onChange(e.target.value)}
        className="w-40 px-3 py-2 text-lg tracking-widest font-mono rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
      />
    </div>
  )
}

/** Påslagsflödet: starta, skanna, ange kod. Anropar `klar` när faktorn är verifierad. */
export function SlaPaTvaSteg({ klar }: { klar?: () => void }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [ny, setNy] = useState<NyFaktor | null>(null)
  const [kod, setKod] = useState('')
  const [arbetar, setArbetar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  const starta = async () => {
    setArbetar(true); setFel(null)
    try { setNy(await mfaApi.paborja()) } catch (e) { setFel(felText(t, e)) } finally { setArbetar(false) }
  }

  const bekrafta = async (e: FormEvent) => {
    e.preventDefault()
    if (!ny) return
    setArbetar(true); setFel(null)
    try {
      await mfaApi.verifiera(ny.id, kod)
      await qc.invalidateQueries({ queryKey: MFA_NYCKEL })
      await qc.invalidateQueries({ queryKey: MFA_ASSURANS_NYCKEL })
      setNy(null); setKod('')
      klar?.()
    } catch (err) { setFel(felText(t, err)) } finally { setArbetar(false) }
  }

  if (!ny) {
    return (
      <div className="space-y-3">
        <Button onClick={starta} disabled={arbetar}>
          {arbetar && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {t('settings.security.mfa.slaPa')}
        </Button>
        {fel && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{fel}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={bekrafta} className="space-y-4">
      <ol className="list-decimal pl-5 text-sm text-stone-700 dark:text-stone-300 space-y-1.5">
        <li>{t('settings.security.mfa.steg1')}</li>
        <li>{t('settings.security.mfa.steg2')}</li>
        <li>{t('settings.security.mfa.steg3')}</li>
      </ol>
      <div className="flex flex-wrap items-start gap-5">
        {/* QR-koden är en vit SVG — den behöver vit botten även i mörkt läge för att gå att skanna. */}
        <img src={ny.qrKod} alt={t('settings.security.mfa.qrAlt')} className="w-40 h-40 bg-white p-2 rounded-lg border border-stone-200" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-stone-600 dark:text-stone-400">{t('settings.security.mfa.kanInteSkanna')}</p>
          <code className="block text-sm font-mono break-all text-stone-900 dark:text-stone-100 select-all">{ny.hemlighet}</code>
        </div>
      </div>
      <KodFalt id="mfa-pasla-kod" varde={kod} onChange={setKod} />
      {fel && <p role="alert" className="text-sm text-red-700 dark:text-red-300 flex gap-2"><AlertCircle className="w-4 h-4 mt-0.5" aria-hidden="true" />{fel}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={arbetar || kod.replace(/\s/g, '').length !== 6}>
          {arbetar && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {t('settings.security.mfa.bekrafta')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => { setNy(null); setKod('') }}>{t('common.cancel', 'Avbryt')}</Button>
      </div>
    </form>
  )
}

export function TvaStegsInloggning() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const faktorer = useMfaFaktorer()
  const [arbetar, setArbetar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const verifierad = faktorer.data?.find((f) => f.verifierad)

  const stangAv = async () => {
    if (!verifierad) return
    setArbetar(true); setFel(null)
    try {
      await mfaApi.tabort(verifierad.id)
      await qc.invalidateQueries({ queryKey: MFA_NYCKEL })
    } catch (e) { setFel(felText(t, e)) } finally { setArbetar(false) }
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-stone-900 dark:text-stone-100">{t('settings.security.mfa.rubrik')}</h4>
      <p className="text-sm text-stone-600 dark:text-stone-400">{t('settings.security.mfa.beskrivning')}</p>
      {faktorer.isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-stone-500" aria-label={t('common.loading', 'Laddar')} />
      ) : faktorer.isError ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">{t('settings.security.mfa.felAnnat')}</p>
      ) : verifierad ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />{t('settings.security.mfa.arPa')}
          </p>
          <Button variant="outline" onClick={stangAv} disabled={arbetar}>{t('settings.security.mfa.stangAv')}</Button>
          {fel && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{fel}</p>}
        </div>
      ) : (
        <SlaPaTvaSteg />
      )}
    </div>
  )
}
