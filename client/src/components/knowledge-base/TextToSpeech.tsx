import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX } from '@/components/ui/icons'

interface TextToSpeechProps {
  text: string
}

export default function TextToSpeech({ text }: TextToSpeechProps) {
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
    u.lang = 'sv-SE'
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
  }, [text, isSupported])

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
    <div className="inline-flex items-center gap-2 bg-stone-100 rounded-lg p-1.5">
      <button
        onClick={togglePlay}
        className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        title={isPlaying && !isPaused ? 'Pausa' : 'Lyssna'}
      >
        {isPlaying && !isPaused ? (
          <>
            <Pause size={16} className="text-[var(--c-text)]" />
            <span>Pausa</span>
          </>
        ) : (
          <>
            <Play size={16} className="text-[var(--c-text)]" />
            <span>Lyssna</span>
          </>
        )}
      </button>
      
      {isPlaying && (
        <button
          onClick={stop}
          className="p-1.5 text-stone-700 hover:text-stone-700"
          title="Stoppa"
        >
          <VolumeX size={16} />
        </button>
      )}
      
      <Volume2 size={16} className="text-stone-600 ml-1" />
    </div>
  )
}
