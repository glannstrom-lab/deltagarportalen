/**
 * Voice Input Hook
 * Handles speech-to-text functionality using Web Speech API
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface UseVoiceInputOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  onTranscript?: (transcript: string) => void
  onError?: (error: string) => void
}

interface UseVoiceInputReturn {
  isRecording: boolean
  isSupported: boolean
  toggleRecording: () => void
  stopRecording: () => void
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    lang = 'sv-SE',
    continuous = false,
    interimResults = true,
    onTranscript,
    onError,
  } = options

  const { t } = useTranslation()
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check browser support
  const isSupported = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
  }, [])

  const toggleRecording = useCallback(() => {
    if (!isSupported) {
      onError?.(t('aiTeam.voice.notSupported'))
      return
    }

    if (isRecording) {
      stopRecording()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = continuous
    recognition.interimResults = interimResults

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('')
      onTranscript?.(transcript)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.onerror = (event) => {
      setIsRecording(false)
      // Handle specific error types
      if (event.error === 'not-allowed') {
        onError?.(t('aiTeam.voice.permissionDenied'))
      } else if (event.error === 'no-speech') {
        // Silent fail for no speech detected
      } else {
        onError?.(t('aiTeam.voice.error'))
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }, [isRecording, isSupported, lang, continuous, interimResults, onTranscript, onError, stopRecording, t])

  return {
    isRecording,
    isSupported,
    toggleRecording,
    stopRecording,
  }
}

export default useVoiceInput
