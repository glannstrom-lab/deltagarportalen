import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, AlertCircle } from 'lucide-react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  placeholder?: string
  className?: string
}

export function VoiceInput({ onTranscript, placeholder, className = '' }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const startRecording = useCallback(() => {
    // Show privacy notice first time
    const hasSeenPrivacy = localStorage.getItem('voice-privacy-seen')
    if (!hasSeenPrivacy) {
      setShowPrivacyNotice(true)
      localStorage.setItem('voice-privacy-seen', 'true')
      return
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Röstinmatning stöds inte i din webbläsare')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    
    recognitionRef.current.lang = 'sv-SE'
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = false

    recognitionRef.current.onstart = () => {
      setIsRecording(true)
      setError(null)
    }

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
    }

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setError('Kunde inte förstå rösten. Försök igen.')
      setIsRecording(false)
    }

    recognitionRef.current.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current.start()
  }, [onTranscript])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  const handlePrivacyAccept = () => {
    setShowPrivacyNotice(false)
    startRecording()
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={`p-2 rounded-full transition-all ${
          isRecording 
            ? 'bg-red-100 text-red-600 animate-pulse' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
        aria-label={isRecording ? 'Stoppa inspelning' : 'Starta röstinmatning'}
        title={isRecording ? 'Klicka för att stoppa' : 'Klicka för att prata'}
      >
        {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {isRecording && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap">
          Lyssnar...
        </div>
      )}

      {error && (
        <div className="absolute top-full mt-2 right-0 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {showPrivacyNotice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-full">
                <Mic className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Sekretess vid röstinmatning</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-4">
              När du använder röstinmatning skickas ljudet till din webbläsares 
              röstigenkänningstjänst (t.ex. Google eller Apple). 
              Ingen röstdata sparas på våra servrar.
            </p>

            <ul className="text-sm text-slate-600 mb-6 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Rösten omvandlas direkt till text i din enhet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Du kan alltid skriva istället om du föredrar det</span>
              </li>
            </ul>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPrivacyNotice(false)}
                className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handlePrivacyAccept}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Jag förstår
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// TypeScript-deklaration för Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export default VoiceInput
