import { Clock } from 'lucide-react'

interface ReadingTimeProps {
  minutes: number
  showLabel?: boolean
  variant?: 'default' | 'compact' | 'detailed'
}

export default function ReadingTime({ 
  minutes, 
  showLabel = true, 
  variant = 'default' 
}: ReadingTimeProps) {
  const getCategory = () => {
    if (minutes <= 5) return { label: 'Snabb', color: 'text-green-600', bgColor: 'bg-green-50' }
    if (minutes <= 10) return { label: 'Medel', color: 'text-blue-600', bgColor: 'bg-blue-50' }
    return { label: 'Djup', color: 'text-purple-600', bgColor: 'bg-purple-50' }
  }

  const category = getCategory()

  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1 text-slate-500 text-sm">
        <Clock size={14} />
        <span>{minutes} min</span>
      </span>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${category.bgColor}`}>
        <Clock size={16} className={category.color} />
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${category.color}`}>
            {minutes} min läsning
          </span>
          <span className="text-xs text-slate-500">{category.label}</span>
        </div>
      </div>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-slate-600">
      <Clock size={16} className="text-slate-400" />
      <span className="text-sm">
        {showLabel ? `${minutes} min läsning` : `${minutes} min`}
      </span>
    </span>
  )
}
