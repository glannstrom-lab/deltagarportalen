/**
 * Ett AI-utkast som personen ska läsa, fylla i och själv föra vidare: texten,
 * en tydlig rad om att det är ett utkast, en räknare för luckor som återstår,
 * och Kopiera. Uppläsning (AIX6) läggs till via `medUpplasning`.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Check } from '@/components/ui/icons'
import { showToast } from '@/components/Toast'
import TextToSpeech from '@/components/knowledge-base/TextToSpeech'
import { antalLuckor } from './ansokanFalt'

interface Props {
  text: string
  /** Visa knapp för uppläsning (telefonmanus). */
  medUpplasning?: boolean
}

export function UtkastRuta({ text, medUpplasning = false }: Props) {
  const { t } = useTranslation()
  const [kopierad, setKopierad] = useState(false)
  const luckor = antalLuckor(text)

  const kopiera = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setKopierad(true)
      window.setTimeout(() => setKopierad(false), 2500)
    } catch {
      showToast.error(t('ansokanAi.kopieraFel', 'Det gick inte att kopiera. Markera texten och kopiera själv.'))
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-stone-600 dark:text-stone-400">
        {luckor > 0
          ? t('ansokanAi.luckor', { antal: luckor, defaultValue: 'Ett utkast från AI. Fyll i det som står i [hakparentes] — {{antal}} kvar.' })
          : t('ansokanAi.utkast', 'Ett utkast från AI. Läs igenom och ändra så att det låter som du.')}
      </p>
      <div
        className="whitespace-pre-wrap rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
        // Fokuserbar så att tangentbordsanvändare kan rulla en lång text.
        tabIndex={0}
        role="region"
        aria-label={t('ansokanAi.utkastRegion', 'Utkastet')}
      >
        {text}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void kopiera()}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          {kopierad ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {kopierad ? t('ansokanAi.kopierad', 'Kopierat') : t('ansokanAi.kopiera', 'Kopiera')}
        </button>
        {medUpplasning && <TextToSpeech text={text} sprak="sv" />}
      </div>
    </div>
  )
}
