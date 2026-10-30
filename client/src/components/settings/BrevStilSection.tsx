/**
 * "Brevskrivaren lär sig av dig" (KF13). Av som standard. Här slår deltagaren på
 * det, ser de högst fem stilpreferenserna, ändrar eller tar bort dem.
 * Logiken bor i lib/brevStil.ts. Sektionen monteras bara när kolumnen finns.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import {
  hamtaBrevStil,
  sparaBrevStil,
  rensaPreferens,
  MAX_TECKEN,
  type BrevStil,
} from '@/lib/brevStil'

type Lage = 'laddar' | 'fel' | 'klart'

export function BrevStilSection() {
  const { t } = useTranslation()
  const userId = useAuthStore((s) => s.user?.id)
  const [lage, setLage] = useState<Lage>('laddar')
  const [stil, setStil] = useState<BrevStil | null>(null)
  const [redigerar, setRedigerar] = useState<string | null>(null)
  const [utkast, setUtkast] = useState('')
  const [sparFel, setSparFel] = useState<'spara' | 'halsa' | null>(null)

  const [forsok, setForsok] = useState(0)

  useEffect(() => {
    if (!userId) return
    let aktiv = true
    hamtaBrevStil(userId)
      .then((ny) => {
        if (!aktiv) return
        setStil(ny)
        setLage('klart')
      })
      .catch(() => {
        if (aktiv) setLage('fel')
      })
    return () => {
      aktiv = false
    }
  }, [userId, forsok])

  const forsokIgen = () => {
    setLage('laddar')
    setForsok((n) => n + 1)
  }

  // En skrivning bygger alltid på en LYCKAD läsning (stil !== null); annars rör vi inget.
  const skriv = async (ny: BrevStil) => {
    if (!userId) return
    setSparFel(null)
    try {
      await sparaBrevStil(userId, ny)
      setStil(ny)
    } catch {
      setSparFel('spara')
    }
  }

  if (lage === 'laddar') {
    return <p className="text-sm text-[var(--c-text)]" role="status">{t('brevstil.laddar', 'Hämtar dina inställningar…')}</p>
  }
  if (lage === 'fel' || !stil) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-[var(--c-text)]" role="status">
          {t('brevstil.lasfel', 'Det gick inte att hämta dina inställningar för brevskrivaren just nu. Inget har ändrats.')}
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={forsokIgen}>
          {t('brevstil.forsokIgen', 'Försök igen')}
        </Button>
      </div>
    )
  }

  const spara = async (id: string) => {
    const ren = rensaPreferens(utkast)
    if (!ren) {
      setSparFel('halsa')
      return
    }
    await skriv({ ...stil, prefs: stil.prefs.map((p) => (p.id === id ? { ...p, text: ren } : p)) })
    setRedigerar(null)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--c-text)]">
        {t('brevstil.intro', 'När du ändrar ett utkast till personligt brev och sparar det kan Jobin lägga märke till hur du hellre skriver, till exempel utan utropstecken eller med kortare meningar. Det är ingen AI-träning: det räknas fram direkt i din webbläsare och sparas på ditt konto. Vid nästa brev får skrivhjälpen veta hur du vill ha det. Det gäller bara stilen, aldrig vad du har gjort eller kan.')}
      </p>

      <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
        <input
          type="checkbox"
          checked={stil.pa}
          onChange={(e) => void skriv({ ...stil, pa: e.target.checked })}
          className="mt-1 h-5 w-5 shrink-0 accent-[var(--c-solid)]"
        />
        <span className="text-sm text-[var(--c-text)]">
          <span className="font-medium">{t('brevstil.val', 'Låt brevskrivaren lära sig av mina ändringar')}</span>
          <span className="block text-stone-600 dark:text-stone-300">
            {stil.pa
              ? t('brevstil.paForklaring', 'Påslaget. Du kan stänga av det när du vill. Då används inga preferenser och inga nya sparas.')
              : t('brevstil.avForklaring', 'Avstängt. Ingenting sparas och ingenting skickas med.')}
          </span>
        </span>
      </label>

      <div>
        <h4 className="text-sm font-medium text-[var(--c-text)]">{t('brevstil.listaRubrik', 'Det som Jobin har lagt märke till')}</h4>
        {stil.prefs.length === 0 ? (
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
            {t('brevstil.tomt', 'Inget än. Det dyker upp här efter att du ändrat ett utkast och sparat brevet.')}
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {stil.prefs.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2 text-sm text-[var(--c-text)]">
                {redigerar === p.id ? (
                  <>
                    <label className="sr-only" htmlFor={`brevstil-${p.id}`}>{t('brevstil.andraEtikett', 'Ändra preferensen')}</label>
                    <input
                      id={`brevstil-${p.id}`}
                      type="text"
                      value={utkast}
                      maxLength={MAX_TECKEN}
                      onChange={(e) => setUtkast(e.target.value)}
                      className="min-h-[44px] flex-1 rounded border border-stone-400 bg-transparent px-2"
                    />
                    <Button type="button" size="sm" onClick={() => void spara(p.id)}>{t('brevstil.spara', 'Spara')}</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => { setRedigerar(null); setSparFel(null) }}>
                      {t('brevstil.avbryt', 'Avbryt')}
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{p.text}</span>
                    <Button type="button" variant="secondary" size="sm" onClick={() => { setRedigerar(p.id); setUtkast(p.text); setSparFel(null) }}>
                      {t('brevstil.andra', 'Ändra')}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void skriv({ ...stil, prefs: stil.prefs.filter((x) => x.id !== p.id) })}
                    >
                      {t('brevstil.taBort', 'Ta bort')}
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        {stil.prefs.length > 1 && (
          <div className="mt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => void skriv({ ...stil, prefs: [] })}>
              {t('brevstil.rensaAlla', 'Ta bort alla')}
            </Button>
          </div>
        )}
      </div>

      <div role="status" aria-live="polite">
        {sparFel === 'spara' && (
          <p className="text-sm text-red-700 dark:text-red-300">
            {t('brevstil.sparFel', 'Det gick inte att spara just nu. Försök igen om en stund.')}
          </p>
        )}
        {sparFel === 'halsa' && (
          <p className="text-sm text-red-700 dark:text-red-300">
            {t('brevstil.halsaFel', 'Raden är tom, eller så handlar den om hälsa. Här sparas bara hur du vill att brevet ska låta. Skriv om den, eller ta bort raden.')}
          </p>
        )}
      </div>
    </div>
  )
}
