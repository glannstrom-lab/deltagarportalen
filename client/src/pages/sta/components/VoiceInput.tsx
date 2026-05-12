/**
 * VoiceInput — textarea + voice-to-text-knapp
 *
 * Använder browser-native Web Speech API (Chrome, Edge, Safari) — ingen extern
 * tjänst krävs. Inte tillgänglig i Firefox; då döljs knappen och bara textarea visas.
 *
 * Talspråk: svenska (sv-SE). Användaren ser interim-resultat medan hen talar.
 * När hen stoppar inspelningen ersätts/tilläggs det final-transkriptet i fältet.
 */

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Loader2 } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

// SpeechRecognition-typer (inte i standard-DOM-typdefinitioner ännu)
interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: { transcript: string; confidence: number }
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResult>
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
}

function getRecognitionConstructor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

interface VoiceInputProps {
  value: string
  onChange: (value: string) => void
  /** Callback specifikt när voice-transkript klart — för dem som vill lagra audio separat. */
  onVoiceTranscript?: (transcript: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  className?: string
}

export function VoiceInput({
  value,
  onChange,
  onVoiceTranscript,
  placeholder,
  rows = 3,
  disabled = false,
  className,
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const ctor = getRecognitionConstructor()
  const isSupported = !!ctor

  const startRecording = () => {
    setError(null)
    if (!ctor) {
      setError('Voice-input stöds inte i denna webbläsare. Använd Chrome eller Edge.')
      return
    }
    const recognition = new ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'sv-SE'

    let finalTranscript = ''

    recognition.onresult = (event) => {
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) finalTranscript += transcript
        else interimTranscript += transcript
      }
      setInterim(interimTranscript)
      if (finalTranscript) {
        const newValue = value ? `${value} ${finalTranscript}`.trim() : finalTranscript
        onChange(newValue)
        onVoiceTranscript?.(finalTranscript)
        finalTranscript = ''
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return
      if (event.error === 'aborted') return
      setError(`Voice-fel: ${event.error}`)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
      setInterim('')
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  return (
    <div className={cn('relative', className)}>
      <textarea
        rows={rows}
        value={value + (interim ? ` ${interim}` : '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || isRecording}
        className={cn(
          'w-full px-3 py-2 pr-12 rounded-lg border border-stone-200 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-stone-200',
          'resize-y',
        )}
      />
      {isSupported && (
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          aria-label={isRecording ? 'Stoppa inspelning' : 'Starta voice-to-text'}
          className={cn(
            'absolute top-2 right-2 w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
            isRecording
              ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
          )}
        >
          {isRecording ? (
            <span className="relative flex items-center justify-center w-full h-full">
              <Loader2 size={16} className="animate-spin" />
            </span>
          ) : (
            <Mic size={16} />
          )}
        </button>
      )}
      {isRecording && (
        <div className="absolute top-12 right-2 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          Spelar in
        </div>
      )}
      {error && (
        <p className="mt-1 text-xs text-rose-700 flex items-center gap-1">
          <MicOff size={12} />
          {error}
        </p>
      )}
      {!isSupported && (
        <p className="mt-1 text-xs text-stone-500">
          Tips: Voice-to-text fungerar i Chrome, Edge och Safari.
        </p>
      )}
    </div>
  )
}
