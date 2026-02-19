import { useState, useEffect } from 'react'
import type { Question } from '@/services/interestGuideData'
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react'

interface QuestionCardProps {
  question: Question
  value: number
  onChange: (value: number) => void
  questionNumber: number
  totalQuestions: number
}

export function QuestionCard({ 
  question, 
  value, 
  onChange, 
  questionNumber, 
  totalQuestions 
}: QuestionCardProps) {
  const [localValue, setLocalValue] = useState(value || 50)

  useEffect(() => {
    setLocalValue(value || 50)
  }, [value, question.id])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    setLocalValue(newValue)
    onChange(newValue)
  }

  const handleLikertClick = (newValue: number) => {
    setLocalValue(newValue)
    onChange(newValue)
  }

  // Beräkna progress för sektionen
  const progress = Math.round((questionNumber / totalQuestions) * 100)

  if (question.type === 'slider') {
    return (
      <div className="w-full max-w-2xl mx-auto transition-all duration-300">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Fråga {questionNumber} av {totalQuestions}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Fråga */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {question.text}
          </h3>
        </div>

        {/* Slider */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-4">
            <span>{question.lowLabel || 'Mycket svårt'}</span>
            <span>{question.highLabel || 'Mycket lätt'}</span>
          </div>
          
          <input
            type="range"
            min="0"
            max="100"
            value={localValue}
            onChange={handleSliderChange}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 transition-all"
          />
          
          <div className="mt-4 text-center">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xl font-bold shadow-lg">
              {localValue}
            </span>
          </div>
        </div>

        {/* Värdeindikatorer */}
        <div className="flex justify-center gap-2">
          {[0, 25, 50, 75, 100].map((val) => (
            <button
              key={val}
              onClick={() => handleLikertClick(val)}
              className={`w-3 h-3 rounded-full transition-all ${
                Math.abs(localValue - val) < 12
                  ? 'bg-indigo-600 scale-150'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  // Likert (radio buttons)
  const likertOptions = [
    { value: 0, label: 'Stämmer inte alls', icon: ThumbsDown },
    { value: 25, label: 'Stämmer delvis', icon: Minus },
    { value: 50, label: 'Varken eller', icon: Minus },
    { value: 75, label: 'Stämmer ganska bra', icon: ThumbsUp },
    { value: 100, label: 'Stämmer helt', icon: ThumbsUp },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto transition-all duration-300">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Fråga {questionNumber} av {totalQuestions}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Fråga */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {question.text}
        </h3>
      </div>

      {/* Alternativ */}
      <div className="space-y-3">
        {likertOptions.map((option) => {
          const Icon = option.icon
          const isSelected = Math.abs(localValue - option.value) < 12
          
          return (
            <button
              key={option.value}
              onClick={() => handleLikertClick(option.value)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
              }`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className={`flex-1 font-medium ${
                isSelected ? 'text-indigo-900' : 'text-gray-700'
              }`}>
                {option.label}
              </span>
              <Icon className={`w-5 h-5 ${
                isSelected ? 'text-indigo-500' : 'text-gray-400'
              }`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
