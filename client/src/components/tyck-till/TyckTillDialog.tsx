/**
 * Tyck till — idé eller felrapport (FN15). Monteras en gång i App.tsx och
 * öppnas via useTyckTillStore från menyn, hjälpsidan, felsidan och
 * konsulenthjälpen.
 *
 * Sidan, språket och de senaste webbläsarfelen bifogas automatiskt och visas
 * för användaren innan hen skickar — inget går iväg som hen inte kan se.
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lightbulb, Bug, CheckCircle2, Check, Loader2 } from '@/components/ui/icons'
import { Dialog } from '@/components/ui/Dialog'
import { useTyckTillStore, type TyckTillTyp } from '@/stores/tyckTillStore'
import { skickaTyckTill, type TyckTillSvar } from '@/services/tyckTillApi'
import { senasteKlientfel } from '@/lib/senasteKlientfel'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const MAX = 4000
type Lage = 'skriver' | 'skickar' | 'klart' | Exclude<TyckTillSvar, { ok: true }>['fel']

export function TyckTillDialog() {
  const oppen = useTyckTillStore((s) => s.oppen)
  const userId = useAuthStore((s) => s.user?.id ?? null)
  // En delad dator: nästa person som loggar in ska inte se förras utkast.
  useEffect(() => {
    useTyckTillStore.setState({ utkast: '' })
  }, [userId])
  // Innehållet monteras på nytt vid varje öppning, så typ och läge börjar
  // om utan en effekt. Texten ligger i storen och överlever en stängning.
  return oppen ? <TyckTillInnehall /> : null
}

function TyckTillInnehall() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { typ: startTyp, bifogatFel, stang, utkast: text, sattUtkast: setText } = useTyckTillStore()
  const user = useAuthStore((s) => s.user)
  const [typ, setTyp] = useState<TyckTillTyp>(startTyp)
  const [farKontakta, setFarKontakta] = useState(false)
  const [lage, setLage] = useState<Lage>('skriver')

  const klientfel = [...(bifogatFel ? [bifogatFel] : []), ...senasteKlientfel()].slice(-5)
  const sida = location.pathname

  const stangOchNollstall = () => {
    if (lage === 'klart') setText('')
    stang()
  }

  const skicka = async () => {
    if (!text.trim() || lage === 'skickar') return
    setLage('skickar')
    const svar = await skickaTyckTill({
      typ,
      meddelande: text.trim(),
      farKontakta,
      sida,
      sprak: i18n.language,
      klientfel: typ === 'fel' ? klientfel : [],
    })
    setLage(svar.ok ? 'klart' : svar.fel)
  }

  const typer: { id: TyckTillTyp; Icon: typeof Lightbulb }[] = [
    { id: 'ide', Icon: Lightbulb },
    { id: 'fel', Icon: Bug },
  ]

  return (
    <Dialog
      isOpen
      onClose={stangOchNollstall}
      labelledBy="tyck-till-rubrik"
      className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 p-6 shadow-xl"
    >
      <h2 id="tyck-till-rubrik" className="text-xl font-semibold text-stone-900 dark:text-stone-100">
        {t('tyckTill.rubrik')}
      </h2>

      {lage === 'klart' ? (
        <div className="mt-5 space-y-4" role="status" aria-live="polite">
          <p className="flex items-start gap-2 text-stone-700 dark:text-stone-200">
            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-[var(--c-solid)]" aria-hidden="true" />
            <span>{farKontakta ? t('tyckTill.tackKontakt') : t('tyckTill.tack')}</span>
          </p>
          <button
            type="button"
            onClick={stangOchNollstall}
            className="px-4 py-2 rounded-lg bg-[var(--c-solid)] text-white font-medium hover:brightness-110"
          >
            {t('tyckTill.stang')}
          </button>
        </div>
      ) : !user ? (
        <p className="mt-4 text-stone-700 dark:text-stone-200">{t('tyckTill.loggaIn')}</p>
      ) : (
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void skicka()
          }}
        >
          <fieldset className="border-0 p-0 m-0 min-w-0">
            <legend className="sr-only">{t('tyckTill.valjTyp')}</legend>
            <div className="grid grid-cols-2 gap-2">
              {typer.map(({ id, Icon }) => (
                <label
                  key={id}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-3 cursor-pointer text-sm font-medium transition-colors',
                    'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--c-solid)]',
                    typ === id
                      ? 'border-2 border-[var(--c-solid)] bg-[var(--c-bg)] text-[var(--c-text)] dark:text-stone-100 font-semibold'
                      : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800'
                  )}
                >
                  <input
                    type="radio"
                    name="tyck-till-typ"
                    value={id}
                    checked={typ === id}
                    onChange={() => setTyp(id)}
                    className="sr-only"
                  />
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{t(id === 'ide' ? 'tyckTill.typIde' : 'tyckTill.typFel')}</span>
                  {/* Valt syns med form, inte bara färg (WCAG 1.4.1). */}
                  {typ === id && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="tyck-till-text" className="block text-sm font-medium text-stone-800 dark:text-stone-100">
              {t(typ === 'ide' ? 'tyckTill.etikettIde' : 'tyckTill.etikettFel')}
            </label>
            <textarea
              id="tyck-till-text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX))}
              rows={5}
              aria-describedby="tyck-till-integritet"
              className="mt-1 w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-stone-900 dark:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
            />
            <p id="tyck-till-integritet" className="mt-1 text-xs text-stone-600 dark:text-stone-300">
              {t('tyckTill.integritet')}
            </p>
          </div>

          <label className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-200">
            <input
              type="checkbox"
              id="tyck-till-kontakt"
              checked={farKontakta}
              onChange={(e) => setFarKontakta(e.target.checked)}
              className="mt-0.5"
            />
            <span>{t('tyckTill.farKontakta')}</span>
          </label>

          <details className="text-xs text-stone-600 dark:text-stone-300">
            <summary className="cursor-pointer">{t('tyckTill.bifogas')}</summary>
            <ul className="mt-2 space-y-1 break-words">
              <li>{t('tyckTill.bifogasSida', { sida })}</li>
              <li>{t('tyckTill.bifogasSprak', { sprak: i18n.language })}</li>
              <li>{t('tyckTill.bifogasRoll')}</li>
              {typ === 'fel' && klientfel.length > 0 && (
                <li>
                  {t('tyckTill.bifogasFel')}
                  <pre className="mt-1 whitespace-pre-wrap rounded bg-stone-100 dark:bg-stone-800 p-2">{klientfel.join('\n')}</pre>
                </li>
              )}
            </ul>
          </details>

          {(lage === 'okant' || lage === 'forManga' || lage === 'inloggning') && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {t(lage === 'forManga' ? 'tyckTill.felForManga' : lage === 'inloggning' ? 'tyckTill.loggaIn' : 'tyckTill.felOkant')}
            </p>
          )}

          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={stangOchNollstall}
              className="px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              {t('tyckTill.avbryt')}
            </button>
            <button
              type="submit"
              disabled={!text.trim() || lage === 'skickar'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--c-solid)] text-white font-medium hover:brightness-110 disabled:opacity-50"
            >
              {lage === 'skickar' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {t('tyckTill.skicka')}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  )
}

export default TyckTillDialog
