/**
 * Voice Output Hook
 * Handles text-to-speech functionality using Web Speech API
 */

import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface UseVoiceOutputOptions {
  lang?: string
  rate?: number
  pitch?: number
  onError?: (error: string) => void
}

interface UseVoiceOutputReturn {
  isSpeaking: boolean
  isSupported: boolean
  speak: (text: string) => void
  stop: () => void
}

export function useVoiceOutput(options: UseVoiceOutputOptions = {}): UseVoiceOutputReturn {
  const {
    lang = 'sv-SE',
    rate = 1.0,
    pitch = 1.0,
    onError,
  } = options

  const { t } = useTranslation()
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Check browser support
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isSupported])

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [isSupported])

  const speak = useCallback((text: string) => {
    if (!isSupported) {
      onError?.(t('aiTeam.voice.notSupported'))
      return
    }

    // If already speaking, stop first
    if (isSpeaking) {
      stop()
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch

    // Try to find a voice matching the language
    const voices = window.speechSynthesis.getVoices()
    const matchingVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]))
    if (matchingVoice) {
      utterance.voice = matchingVoice
    }

    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => {
      setIsSpeaking(false)
      onError?.(t('aiTeam.voice.error'))
    }

    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }, [isSpeaking, isSupported, lang, rate, pitch, onError, stop, t])

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
  }
}

export default useVoiceOutput
