import { useState } from 'react'
import { Sparkles, Loader2, Check } from '@/components/ui/icons'

interface AIHelpButtonProps {
  field: string
  onFill: () => void
}

export function AIHelpButton({ field, onFill }: AIHelpButtonProps) {
  const [state, setState] = useState<'idle' | 'filling' | 'done'>('idle')

  const handleClick = async () => {
    if (state !== 'idle') return
    
    setState('filling')
    
    // Simulate AI processing
    await new Promise(r => setTimeout(r, 800))
    
    onFill()
    setState('done')
    
    // Reset after showing success
    setTimeout(() => setState('idle'), 2000)
  }

  const labels: Record<string, string> = {
    firstName: 'Föreslå namnstil',
    title: 'Föreslå titel',
    summary: 'Generera sammanfattning',
    skills: 'Föreslå kompetenser',
    workExperience: 'Föreslå erfarenhet',
    education: 'Föreslå utbildning'
  }

  return (
    <button
      onClick={handleClick}
      disabled={state !== 'idle'}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
        transition-all duration-200
        ${state === 'done' 
          ? 'bg-green-100 text-green-700' 
          : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
        }
        ${state !== 'idle' && 'cursor-default'}
      `}
    >
      {state === 'idle' && <Sparkles className="w-4 h-4" />}
      {state === 'filling' && <Loader2 className="w-4 h-4 animate-spin" />}
      {state === 'done' && <Check className="w-4 h-4" />}
      
      <span>
        {state === 'idle' && (labels[field] || 'Få hjälp av AI')}
        {state === 'filling' && 'Fyller i...'}
        {state === 'done' && 'Klart!'}
      </span>
    </button>
  )
}
