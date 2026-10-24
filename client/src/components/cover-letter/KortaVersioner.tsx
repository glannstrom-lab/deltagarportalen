/**
 * AIX10: korta versioner av brevet — en mejlversion (tre meningar) och en
 * chattversion. Samma underlag och samma sanningsregler som brevet; bara
 * längden skiljer (parametern `langd` i personligt-brev).
 *
 * Visas under brevet och ersätter det aldrig: brevet i rutan ovan är det som
 * sparas och laddas ner. Texten här är till för att kopieras.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AIBadge } from '@/components/ai/AIBadge'

export type KortLangd = 'mejl' | 'chatt'

interface Props {
  /** Hämtar en kort version. Kastar vid fel. */
  skapa: (langd: KortLangd) => Promise<string>
}

export function KortaVersioner({ skapa }: Props) {
  const { t } = useTranslation()
  const [valt, setValt] = useState<KortLangd | null>(null)
  const [original, setOriginal] = useState('')
  const [text, setText] = useState('')
  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState(false)
  const [kopierat, setKopierat] = useState(false)

  const valj = async (langd: KortLangd) => {
    setValt(langd)
    setLaddar(true)
    setFel(false)
    setKopierat(false)
    try {
      const svar = (await skapa(langd)).trim()
      if (!svar) throw new Error('tomt svar')
      setOriginal(svar)
      setText(svar)
    } catch (err) {
      console.error('Kunde inte skapa kort version:', err)
      setText('')
      setOriginal('')
      setFel(true)
    } finally {
      setLaddar(false)
    }
  }

  const kopiera = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setKopierat(true)
      setTimeout(() => setKopierat(false), 2000)
    } catch {
      setFel(true)
    }
  }

  const etikett: Record<KortLangd, string> = {
    mejl: t('coverLetter.write.kort.mejl', 'Kort mejl (tre meningar)'),
    chatt: t('coverLetter.write.kort.chatt', 'Chattmeddelande'),
  }

  return (
    <section aria-labelledby="kortaversioner-rubrik" className="space-y-3">
      <div>
        <h3 id="kortaversioner-rubrik" className="text-sm font-medium text-stone-700 dark:text-stone-200">
          {t('coverLetter.write.kort.rubrik', 'Behöver du något kortare?')}
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {t('coverLetter.write.kort.beskrivning', 'Många annonser vill bara ha ett kort meddelande. Här får du samma sak i kortare form, byggd på samma uppgifter som brevet.')}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {(['mejl', 'chatt'] as const).map((l) => (
          <Button
            key={l}
            variant="outline"
            onClick={() => valj(l)}
            disabled={laddar}
            aria-pressed={valt === l}
          >
            {etikett[l]}
          </Button>
        ))}
      </div>

      {laddar && (
        <p className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300" role="status" aria-live="polite">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          {t('coverLetter.write.kort.laddar', 'Skriver den korta versionen …')}
        </p>
      )}

      {fel && !laddar && (
        <p className="text-sm text-stone-700 dark:text-stone-300" role="alert">
          {t('coverLetter.write.kort.fel', 'Det gick inte att skriva den korta versionen just nu. Försök igen om en stund.')}
        </p>
      )}

      {valt && text && !laddar && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="kortversion-text" className="text-sm font-medium text-stone-700 dark:text-stone-200">
              {etikett[valt]}
            </label>
            {text === original && <AIBadge variant="inline" label={t('coverLetter.write.aiDraftLabel', 'AI-utkast')} />}
          </div>
          <textarea
            id="kortversion-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={valt === 'mejl' ? 4 : 3}
            className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-solid)]/20 outline-none resize-y"
          />
          <Button variant="outline" className="gap-2" onClick={kopiera}>
            {kopierat ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {kopierat ? t('coverLetter.write.copied', 'Kopierat') : t('coverLetter.write.copy', 'Kopiera texten')}
          </Button>
        </div>
      )}
    </section>
  )
}
