import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface TextToSpeechProps {
  text: string
}

export default function TextToSpeech({ text }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false)
      return
    }

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

    setUtterance(u)

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [text])

  const togglePlay = useCallback(() => {
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
  }, [isPlaying, isPaused, utterance])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
  }, [])

  if (!isSupported) return null

  return (
    <div className="inline-flex items-center gap-2 bg-slate-100 rounded-lg p-1.5">
      <button
        onClick={togglePlay}
        className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        title={isPlaying && !isPaused ? 'Pausa' : 'Lyssna'}
      >
        {isPlaying && !isPaused ? (
          <>
            <Pause size={16} className="text-teal-600" />
            <span>Pausa</span>
          </>
        ) : (
          <>
            <Play size={16} className="text-teal-600" />
            <span>Lyssna</span>
          </>
        )}
      </button>
      
      {isPlaying && (
        <button
          onClick={stop}
          className="p-1.5 text-slate-500 hover:text-slate-700"
          title="Stoppa"
        >
          <VolumeX size={16} />
        </button>
      )}
      
      <Volume2 size={16} className="text-slate-400 ml-1" />
    </div>
  )
}
