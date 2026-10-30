/**
 * AIX8 — "Prata, så skriver vi".
 *
 * För den som har lättare att tala än att skriva. Personen pratar, webbläsaren
 * skriver ner, AI:n städar bort upprepningar och utfyllnad, och personen väljer
 * mellan det hen sa och den städade texten. Inget hamnar i fältet förrän hen
 * valt.
 *
 * Integritet: webbläsarens taligenkänning skickar ljudet till webbläsarens
 * leverantör (i Chrome är det Google). Det står i klartext FÖRE mikrofonen
 * slås på — raden är alltid synlig, aldrig bakom ett klick. Använd den INTE i
 * dagboken: den är art. 9-data och får inte gå via AI utan samtycke.
 */
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Mic, Square } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { rensaTal, laggTillText, TAL_MAX_TECKEN } from '@/services/talApi'

interface Props {
  /** Texten som står i fältet nu. Det inpratade läggs efter den. */
  text: string
  /** Anropas med hela den nya texten när personen valt vilken version som ska med. */
  onApply: (nyText: string) => void
  disabled?: boolean
}

export function PrataSaSkriverVi({ text, onApply, disabled }: Props) {
  const { t } = useTranslation()
  const infoId = useId()
  const [inpratat, setInpratat] = useState('')
  const [rensad, setRensad] = useState<string | null>(null)
  const [rensar, setRensar] = useState(false)
  const [meddelande, setMeddelande] = useState('')
  const [fel, setFel] = useState('')

  const { isRecording, isSupported, toggleRecording, stopRecording } = useVoiceInput({
    lang: 'sv-SE',
    continuous: true,
    interimResults: true,
    onTranscript: (tal) => setInpratat(tal),
    onError: (m) => setFel(m),
  })

  if (!isSupported) {
    return (
      <p className="mt-3 text-sm text-stone-700 dark:text-stone-300">
        {t('tal.saknas', 'Din webbläsare kan inte skriva ner tal. Prova Chrome, Edge eller Safari, eller skriv som vanligt.')}
      </p>
    )
  }

  const borja = () => {
    setInpratat('')
    setRensad(null)
    setMeddelande('')
    setFel('')
    toggleRecording()
  }

  const rensa = async () => {
    setRensar(true)
    setFel('')
    try {
      setRensad(await rensaTal(inpratat))
    } catch (err) {
      console.error('Kunde inte rensa den inpratade texten:', err)
      setFel(t('tal.fel', 'Det gick inte att städa texten just nu. Det du sa finns kvar, och du kan använda det som det är.'))
    } finally {
      setRensar(false)
    }
  }

  const anvand = (valt: string) => {
    onApply(laggTillText(text, valt))
    setInpratat('')
    setRensad(null)
    setMeddelande(t('tal.klart', 'Klart. Texten lades till sist i fältet.'))
  }

  const slang = () => {
    setInpratat('')
    setRensad(null)
    setMeddelande('')
  }

  const harInpratat = !isRecording && inpratat.trim().length > 0
  const forLang = inpratat.length > TAL_MAX_TECKEN

  return (
    <div className="mt-3">
      <p id={infoId} className="text-sm text-stone-700 dark:text-stone-300">
        {t(
          'tal.info',
          'När du pratar skickar din webbläsare ljudet till sin leverantör (i Chrome är det Google) för att göra om det till text. Vi sparar inget ljud. Städningen går sedan genom vår AI-tjänst, och du väljer själv vad som hamnar i texten.',
        )}
      </p>

      <div className="mt-2">
        {isRecording ? (
          <Button variant="outline" size="sm" onClick={stopRecording} className="gap-1">
            <Square size={14} aria-hidden="true" />
            {t('tal.stoppa', 'Sluta prata')}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={borja}
            disabled={disabled || rensar}
            aria-describedby={infoId}
            className="gap-1"
          >
            <Mic size={14} aria-hidden="true" />
            {t('tal.knapp', 'Prata in text')}
          </Button>
        )}
      </div>

      <div role="status" aria-live="polite">
        {isRecording && (
          <p className="mt-2 text-sm font-medium text-stone-800 dark:text-stone-100">
            {t('tal.lyssnar', 'Jag lyssnar. Prata på, och tryck på Sluta prata när du är klar.')}
          </p>
        )}
        {rensar && (
          <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">{t('tal.rensar', 'Städar texten …')}</p>
        )}
        {meddelande && <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">{meddelande}</p>}
        {fel && <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">{fel}</p>}
      </div>

      {harInpratat && rensad === null && (
        <div className="mt-3 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
          <p className="text-sm font-medium text-stone-800 dark:text-stone-100">
            {t('tal.hort', 'Det här skrevs ner:')}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-stone-900 dark:text-stone-100">{inpratat}</p>
          {forLang && (
            <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
              {t('tal.langText', 'Texten är lång. Vi städar de första {{antal}} tecknen.', { antal: TAL_MAX_TECKEN })}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={rensa} disabled={rensar} className="gap-1">
              {rensar && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              {t('tal.rensa', 'Städa texten')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => anvand(inpratat)} disabled={rensar}>
              {t('tal.anvandOriginal', 'Använd som den är')}
            </Button>
            <Button variant="outline" size="sm" onClick={slang} disabled={rensar}>
              {t('tal.kasta', 'Släng')}
            </Button>
          </div>
        </div>
      )}

      {rensad !== null && (
        <div className="mt-3 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-stone-800 dark:text-stone-100">
                {t('tal.original', 'Som du sa det')}
              </h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-stone-900 dark:text-stone-100">{inpratat}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-stone-800 dark:text-stone-100">
                {t('tal.rensad', 'Städad')}
              </h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-stone-900 dark:text-stone-100">{rensad}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => anvand(rensad)}>
              {t('tal.anvandRensad', 'Använd den städade')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => anvand(inpratat)}>
              {t('tal.anvandOriginal', 'Använd som den är')}
            </Button>
            <Button variant="outline" size="sm" onClick={slang}>
              {t('tal.kasta', 'Släng')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
