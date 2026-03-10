import { useState } from 'react'
import type { Question } from '@/services/interestGuideData'

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
  const [isAnimating, setIsAnimating] = useState(false)

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    onChange(newValue)
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 200)
  }

  const getThumbPosition = () => {
    return ((value - 1) / 4) * 100
  }

  const getGradientColor = () => {
    const percentage = (value - 1) / 4
    if (percentage < 0.25) return 'from-red-400 to-orange-400'
    if (percentage < 0.5) return 'from-orange-400 to-yellow-400'
    if (percentage < 0.75) return 'from-yellow-400 to-emerald-400'
    return 'from-emerald-400 to-green-500'
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8">
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
          <div className="absolute inset-x-0 flex justify-between px-[2px]">
            {[1, 2, 3, 4, 5].map((dotValue) => {
              const isActive = value >= dotValue
              const isCurrent = value === dotValue
              
              return (
                <button
                  key={dotValue}
                  onClick={() => onChange(dotValue)}
                  className={`
                    w-6 h-6 rounded-full border-4 transition-all duration-200 ease-out
                    ${isCurrent 
                      ? 'bg-white border-indigo-600 scale-125 shadow-lg' 
                      : isActive 
                        ? 'bg-white border-emerald-400' 
                        : 'bg-white border-gray-300'
                    }
                  `}
                />
              )
            })}
          </div>

          {/* Hidden range input for accessibility */}
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={value}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Svarsalternativ"
          />
        </div>

        {/* Labels below */}
        <div className="flex justify-between mt-4 px-1">
          <button 
            onClick={() => onChange(1)}
            className={`text-xs font-medium transition-colors ${value === 1 ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            1
          </button>
          <button 
            onClick={() => onChange(2)}
            className={`text-xs font-medium transition-colors ${value === 2 ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            2
          </button>
          <button 
            onClick={() => onChange(3)}
            className={`text-xs font-medium transition-colors ${value === 3 ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            3
          </button>
          <button 
            onClick={() => onChange(4)}
            className={`text-xs font-medium transition-colors ${value === 4 ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            4
          </button>
          <button 
            onClick={() => onChange(5)}
            className={`text-xs font-medium transition-colors ${value === 5 ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            5
          </button>
        </div>
      </div>

      {/* Selected value indicator */}
      <div className="mt-6 text-center">
        <div 
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-300
            ${isAnimating ? 'scale-105' : 'scale-100'}
            ${value <= 2 
              ? 'bg-red-50 text-red-700' 
              : value === 3 
                ? 'bg-yellow-50 text-yellow-700' 
                : 'bg-emerald-50 text-emerald-700'
            }
          `}
        >
          <span>Ditt svar:</span>
          <span className="font-bold">
            {value === 1 && 'Stämmer inte alls'}
            {value === 2 && 'Stämmer ganska dåligt'}
            {value === 3 && 'Stämmer delvis'}
            {value === 4 && 'Stämmer ganska bra'}
            {value === 5 && 'Stämmer helt'}
          </span>
        </div>
      </div>
    </div>
  )
}
