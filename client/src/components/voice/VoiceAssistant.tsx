/**
 * Voice Assistant - Röststöd och tillgänglighet
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, X, Command } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

const commands = [
  { phrase: 'Logga mitt humör', action: '/wellness' },
  { phrase: 'Visa mina jobb', action: '/job-search' },
  { phrase: 'Hur går det med mitt CV', action: '/cv' },
  { phrase: 'Påminn mig att ta en paus', action: 'reminder' },
]

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [showCommands, setShowCommands] = useState(false)

  // Simulerad röstigenkänning
  const toggleListening = () => {
    setIsListening(!isListening)
    if (!isListening) {
      setTimeout(() => {
        setTranscript('Lyssnar...')
        setTimeout(() => {
          setTranscript('Logga mitt humör')
          setIsListening(false)
        }, 2000)
      }, 500)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all",
          isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        )}
      >
        {isListening ? <Mic size={20} /> : <MicOff size={20} />}
      </button>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-2 w-72 p-4 bg-white rounded-2xl shadow-xl border border-slate-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-slate-800">Röststöd</span>
              <button onClick={() => setIsListening(false)}><X size={16} className="text-slate-600" /></button>
            </div>
            
            <div className="h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3">
              {transcript ? <span className="text-slate-700">{transcript}</span> : <span className="text-slate-600 text-sm">Säg något...</span>}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-700 mb-2">Prova:</p>
              {commands.map((cmd, i) => (
                <button key={i} className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-slate-50 text-slate-600">
                  "{cmd.phrase}"
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default VoiceAssistant
