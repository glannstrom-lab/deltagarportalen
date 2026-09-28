import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, Volume2, VolumeX } from '@/components/ui/icons'

interface TextToSpeechProps {
  text: string
  /** Textens språk — inte gränssnittets. En oöversatt artikel i engelskt läge är svensk. */
  sprak?: 'sv' | 'en'
}

export default function TextToSpeech({ text, sprak }: TextToSpeechProps) {
  // SK3 (skarpt test 2026-09-28): knapparna var hårdkodad svenska, och rösten läste alltid
  // sv-SE — även en engelsk artikel för en engelsk läsare.
  const { t, i18n } = useTranslation()
  const rostSprak = (sprak ?? (i18n.language?.startsWith('en') ? 'en' : 'sv')) === 'en' ? 'en-GB' : 'sv-SE'
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  // Ett handtag till en extern webbläsar-API-instans — påverkar aldrig vad
  // som renderas, så en ref (inte state) är rätt lager. En useState hade satt
  // objektet i en effekt utan att komponenten någonsin läser värdet i JSX.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [isSupported] = useState(() => 'speechSynthesis' in window)

  useEffect(() => {
    if (!isSupported) return

    const u = new SpeechSynthesisUtterance(text)
    u.lang = rostSprak
    u.rate = 0.9
    u.pitch = 1

    u.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
    }

    u.onpause = () => setIsPaused(true)
    u.onresume = () => setIsPaused(false)

    utteranceRef.current = u

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [text, isSupported, rostSprak])

  const togglePlay = useCallback(() => {
    const utterance = utteranceRef.current
    if (!utterance) return

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    } else if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      setIsPlaying(true)
    } else {
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
      setIsPlaying(true)
      setIsPaused(false)
    }
  }, [isPlaying, isPaused])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
  }, [])

  if (!isSupported) return null

  return (
    <div className="inline-flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded-lg p-1.5">
      <button
        onClick={togglePlay}
        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-stone-900 rounded-md text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
      >
        {isPlaying && !isPaused ? (
          <>
            <Pause size={16} className="text-[var(--c-text)]" aria-hidden="true" />
            <span>{t('uppläsning.pausa')}</span>
          </>
        ) : (
          <>
            <Play size={16} className="text-[var(--c-text)]" aria-hidden="true" />
            <span>{t('uppläsning.lyssna')}</span>
          </>
        )}
      </button>
      
      {isPlaying && (
        <button
          onClick={stop}
          className="p-1.5 text-stone-700 dark:text-stone-200"
          aria-label={t('uppläsning.stoppa')}
          title={t('uppläsning.stoppa')}
        >
          <VolumeX size={16} aria-hidden="true" />
        </button>
      )}
      
      <Volume2 size={16} className="text-stone-600 dark:text-stone-300 ml-1" aria-hidden="true" />
    </div>
  )
}
