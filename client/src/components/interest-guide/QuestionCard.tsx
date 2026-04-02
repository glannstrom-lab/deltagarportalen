import { useState, useCallback, useEffect } from 'react'
import type { Question } from '@/services/interestGuideData'
import { Pause, Coffee, Save, RotateCcw } from '@/components/ui/icons'
import { interestGuideApi } from '@/services/cloudStorage'

interface QuestionCardProps {
  question: Question
  value: number
  onChange: (value: number) => void
  questionNumber: number
  totalQuestions: number
  onPause?: () => void
  onResume?: (questionIndex: number) => void
}

// Sparar progress (cloud storage)
export async function saveProgress(questionIndex: number, answers: Record<string, number>) {
  await interestGuideApi.saveProgress({
    current_step: questionIndex,
    answers: answers,
    is_completed: false
  })
}

// Hämtar progress (cloud storage)
export async function loadProgress(): Promise<{ questionIndex: number; answers: Record<string, number>; timestamp: number } | null> {
  const data = await interestGuideApi.getProgress()
  if (!data || !data.answers || Object.keys(data.answers).length === 0) {
    return null
  }
  return {
    questionIndex: data.current_step || 0,
    answers: data.answers,
    timestamp: data.updated_at ? new Date(data.updated_at).getTime() : Date.now()
  }
}

// Rensar progress (cloud storage)
export async function clearProgress() {
  await interestGuideApi.reset()
}

export function QuestionCard({ 
  question, 
  value, 
  onChange,
  questionNumber,
  totalQuestions,
  onPause,
  onResume
}: QuestionCardProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showPauseConfirm, setShowPauseConfirm] = useState(false)

  // Spara progress vid varje svar
  useEffect(() => {
    if (value > 0) {
      // Detta kommer att sparas av parent-komponenten
    }
  }, [value])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    onChange(newValue)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 200)
  }

  const handlePause = useCallback(() => {
    setShowPauseConfirm(true)
  }, [])

  const confirmPause = useCallback(() => {
    setShowPauseConfirm(false)
    onPause?.()
  }, [onPause])

  const getThumbPosition = () => {
    return ((value || 1) - 1) / 4 * 100
  }

  const getGradientColor = () => {
    const percentage = ((value || 1) - 1) / 4
    if (percentage < 0.25) return 'from-red-400 to-orange-400'
    if (percentage < 0.5) return 'from-orange-400 to-yellow-400'
    if (percentage < 0.75) return 'from-yellow-400 to-emerald-400'
    return 'from-emerald-400 to-green-500'
  }

  // Beräkna progress
  const progress = Math.round((questionNumber / totalQuestions) * 100)
  const remaining = totalQuestions - questionNumber

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8 relative">
      {/* Paus-confirmation modal */}
      {showPauseConfirm && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pause className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Vill du ta en paus?</h3>
            <p className="text-gray-600 mb-6 max-w-xs">
              Dina svar sparas automatiskt. Du kan fortsätta precis där du var när du kommer tillbaka.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowPauseConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Fortsätt
              </button>
              <button
                onClick={confirmPause}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Spara & Pausa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">
              Fråga {questionNumber} av {totalQuestions}
            </span>
            <span className="text-xs text-gray-400">
              ({remaining} kvar)
            </span>
          </div>
          
          {/* Paus-knapp */}
          <button
            onClick={handlePause}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Spara och gör paus"
          >
            <Pause className="w-4 h-4" />
            Pausa
          </button>
        </div>

        {/* Progress bar med uppmuntran */}
        <div className="relative">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Progress meddelande */}
          <p className="text-xs text-gray-500 mt-2 text-center">
            {questionNumber === 1 && 'Bra att du kom igång! 🌱'}
            {questionNumber === 5 && 'Du har kommit en bit nu! 💪'}
            {questionNumber === 10 && 'Halvvägs! Ta en paus om du behöver ☕'}
            {questionNumber === 15 && 'Nästan klart nu! 🌟'}
            {questionNumber === totalQuestions && 'Sista frågan! 🎉'}
            {![1, 5, 10, 15, totalQuestions].includes(questionNumber) && `${progress}% klart - ta den tid du behöver 💙`}
          </p>
        </div>
      </div>

      {/* Question text */}
      <div className="text-center mb-8">
        <h3 className="text-lg sm:text-xl font-medium text-gray-900 leading-relaxed">
          {question.text}
        </h3>
        {question.subtext && (
          <p className="text-sm text-gray-500 mt-2">{question.subtext}</p>
        )}
      </div>

      {/* Slider */}
      <div className="relative px-2">
        {/* Scale labels */}
        <div className="flex justify-between text-xs text-gray-400 mb-3 px-1">
          <span className="text-center flex-1">Stämmer inte alls</span>
          <span className="text-center flex-1">Stämmer delvis</span>
          <span className="text-center flex-1">Stämmer helt</span>
        </div>

        {/* Slider track */}
        <div className="relative h-12 flex items-center">
          {/* Background track */}
          <div className="absolute inset-x-0 h-3 bg-gray-200 rounded-full"></div>
          
          {/* Active gradient track */}
          <div 
            className={`absolute left-0 h-3 bg-gradient-to-r ${getGradientColor()} rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${getThumbPosition()}%` }}
          />
          
          {/* Dots for each value */}
          <div className="absolute inset-x-0 flex justify-between px-1 z-10">
            {[1, 2, 3, 4, 5].map((dotValue) => {
              const isActive = (value || 0) >= dotValue
              const isCurrent = value === dotValue

              return (
                <button
                  key={dotValue}
                  onClick={() => onChange(dotValue)}
                  className={`
                    w-8 h-8 rounded-full border-4 transition-all duration-200 ease-out cursor-pointer
                    ${isCurrent
                      ? 'bg-white border-indigo-600 scale-110 shadow-lg'
                      : isActive
                        ? 'bg-white border-emerald-400 hover:scale-105'
                        : 'bg-white border-gray-300 hover:scale-105 hover:border-gray-400'
                    }
                  `}
                  aria-label={`Värde ${dotValue}`}
                />
              )
            })}
          </div>

          {/* Hidden range input for keyboard accessibility only */}
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={value || 3}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        {/* Labels below */}
        <div className="flex justify-between mt-4 px-1">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => onChange(num)}
              className={`text-xs font-medium transition-colors ${
                value === num 
                  ? num <= 2 ? 'text-red-500' : num === 3 ? 'text-yellow-500' : 'text-emerald-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label={`Välj ${num}`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Selected value indicator */}
      <div className="mt-6 text-center">
        <div 
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-300
            ${isAnimating ? 'scale-105' : 'scale-100'}
            ${(value || 3) <= 2 
              ? 'bg-red-50 text-red-700' 
              : (value || 3) === 3 
                ? 'bg-yellow-50 text-yellow-700' 
                : 'bg-emerald-50 text-emerald-700'
            }
          `}
        >
          <span>Ditt svar:</span>
          <span className="font-bold">
            {(value || 0) === 1 && 'Stämmer inte alls'}
            {(value || 0) === 2 && 'Stämmer ganska dåligt'}
            {(value || 0) === 3 && 'Stämmer delvis'}
            {(value || 0) === 4 && 'Stämmer ganska bra'}
            {(value || 0) === 5 && 'Stämmer helt'}
            {(value || 0) === 0 && 'Inget svar än'}
          </span>
        </div>
      </div>

      {/* Föregående-knapp info */}
      {questionNumber > 1 && (
        <p className="text-xs text-center text-gray-400 mt-4">
          💡 Du kan alltid gå tillbaka för att ändra tidigare svar
        </p>
      )}
    </div>
  )
}

// ResumeModal - visas när användaren återvänder efter paus
export function ResumeModal({ 
  onResume, 
  onRestart, 
  questionIndex, 
  savedDate 
}: { 
  onResume: () => void
  onRestart: () => void
  questionIndex: number
  savedDate: Date
}) {
  const hoursSince = Math.round((Date.now() - savedDate.getTime()) / (1000 * 60 * 60))
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <RotateCcw className="w-8 h-8 text-indigo-600" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Välkommen tillbaka!
        </h2>
        
        <p className="text-gray-600 text-center mb-6">
          {hoursSince < 1 
            ? 'Du var på fråga ' + (questionIndex + 1) + ' för en stund sedan.'
            : `Du var på fråga ${questionIndex + 1} för ${hoursSince} timme${hoursSince > 1 ? 'r' : ''} sedan.`
          }
          <br />
          <span className="text-sm">Det är okej att ta det i din takt.</span>
        </p>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Fortsätt där jag slutade
          </button>
          
          <button
            onClick={onRestart}
            className="w-full py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Börja om från början
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestionCard
