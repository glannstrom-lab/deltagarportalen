/**
 * "Ta med dig" (FN16): en knapp som ger en zip med CV, ansökningar,
 * aktivitetsrapport, plan och mål, och veckan som .ics. Journalen från
 * konsulenten följer bara med om deltagaren bockar i den, varje gång.
 * Logiken bor i services/mittUnderlag.ts.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { skapaUnderlag, laddaNerZip, type Overs, type Paket, type FilStatus } from '@/services/mittUnderlag'

const STATUS_NYCKEL: Record<FilStatus, [string, string]> = {
  med: ['underlag.lasMig.med', 'ingår'],
  tom: ['underlag.lasMig.tom', 'ingår inte: det fanns inget att ta med'],
  fel: ['underlag.lasMig.fel', 'ingår inte: det gick inte att läsa just nu, hämta paketet igen'],
  utelamnad: ['underlag.lasMig.utelamnad', 'ingår inte: du valde att inte ta med det'],
}

export function MittUnderlagSection() {
  const { t, i18n } = useTranslation()
  const [journal, setJournal] = useState(false)
  const [pagar, setPagar] = useState(false)
  const [fel, setFel] = useState(false)
  const [paket, setPaket] = useState<Paket | null>(null)

  const hamta = async () => {
    setPagar(true)
    setFel(false)
    setPaket(null)
    try {
      const oversatt: Overs = (nyckel, standard, vars) =>
        t(nyckel, { defaultValue: standard, ...(vars ?? {}) }) as string
      const resultat = await skapaUnderlag({ journal }, oversatt, i18n.language?.slice(0, 2) ?? 'sv')
      laddaNerZip(resultat.zip, resultat.filnamn)
      setPaket(resultat)
    } catch (e) {
      console.error('Mitt underlag kunde inte skapas', e)
      setFel(true)
    } finally {
      setPagar(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--c-text)]">
        {t('underlag.intro', 'Hämta det du har gjort i Jobin som en fil du kan ta med dig, till exempel om du byter leverantör eller kommun. Paketet innehåller ditt CV som PDF, dina ansökningar, din aktivitetsrapport, din plan och dina mål, och kommande vecka som kalenderfil.')}
      </p>

      <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
        <input
          type="checkbox"
          checked={journal}
          onChange={(e) => setJournal(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-[var(--c-solid)]"
        />
        <span className="text-sm text-[var(--c-text)]">
          <span className="font-medium">
            {t('underlag.journalVal', 'Ta med journalanteckningar från min konsulent')}
          </span>
          <span className="block text-stone-600 dark:text-stone-300">
            {t('underlag.journalForklaring', 'Det är anteckningar din konsulent har skrivit om dig. Bocka bara i om du vill att den som får filen ska se dem. Din dagbok tas aldrig med.')}
          </span>
        </span>
      </label>

      <Button type="button" variant="secondary" size="sm" onClick={hamta} disabled={pagar}>
        <Download className="w-4 h-4 mr-2" aria-hidden="true" />
        {pagar ? t('underlag.pagar', 'Samlar ihop…') : t('underlag.knapp', 'Hämta mitt underlag')}
      </Button>

      <div role="status" aria-live="polite">
        {fel && (
          <p className="text-sm text-red-700 dark:text-red-300">
            {t('underlag.fel', 'Paketet kunde inte skapas just nu. Försök igen om en stund.')}
          </p>
        )}
        {paket && (
          <div className="text-sm text-[var(--c-text)]">
            <p className="font-medium">{t('underlag.klart', 'Filen är nedladdad. Så här gick det:')}</p>
            <ul className="mt-1 list-disc pl-5">
              {paket.poster.map((p) => (
                <li key={p.fil}>
                  {p.fil}: {t(STATUS_NYCKEL[p.status][0], STATUS_NYCKEL[p.status][1])}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
