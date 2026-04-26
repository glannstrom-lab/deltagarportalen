/**
 * Starta-här-prompts - Förifyllda fraser för personliga brev
 */

import { useState } from 'react'
import { Sparkles, Building2, Heart, Lightbulb, ArrowRight } from '@/components/ui/icons'

interface PromptButtonsProps {
  onSelect: (text: string) => void
  type: 'opening' | 'motivation' | 'experience' | 'closing'
}

const prompts = {
  opening: [
    { text: 'Jag blev glad när jag såg er annons för', icon: Building2, emotion: 'positiv' },
    { text: 'Efter att ha läst om tjänsten som', icon: Lightbulb, emotion: 'nyfiken' },
    { text: 'Jag har länge varit intresserad av ert företag och ser nu möjligheten att', icon: Heart, emotion: 'engagerad' },
    { text: 'Som [din titel] ser jag med intresse på möjligheten att', icon: Sparkles, emotion: 'professionell' },
  ],
  motivation: [
    { text: 'Det som lockar mig mest är möjligheten att arbeta med', icon: Lightbulb, emotion: 'intresse' },
    { text: 'Jag uppskattar ert fokus på och vill bidra med', icon: Heart, emotion: 'värderingar' },
    { text: 'Efter min erfarenhet inom ser jag detta som nästa steg i min utveckling', icon: ArrowRight, emotion: 'utveckling' },
    { text: 'Det jag söker är en arbetsplats där jag kan', icon: Building2, emotion: 'arbetsplats' },
  ],
  experience: [
    { text: 'I min nuvarande roll har jag lärt mig vikten av', icon: Lightbulb, emotion: 'erfarenhet' },
    { text: 'Genom mitt arbete på har jag utvecklat färdigheter inom', icon: Sparkles, emotion: 'kompetens' },
    { text: 'Det jag tar med mig från tidigare erfarenheter är', icon: ArrowRight, emotion: 'lärdomar' },
    { text: 'Min bakgrund inom har förberett mig för', icon: Building2, emotion: 'bakgrund' },
  ],
  closing: [
    { text: 'Jag ser fram emot att få berätta mer om hur jag kan bidra till ert team', icon: Sparkles, emotion: 'positiv' },
    { text: 'Jag vill gärna diskutera mina erfarenheter vidare vid ett personligt möte', icon: Building2, emotion: 'formell' },
    { text: 'Tack för att ni tar er tid att läsa mitt brev. Jag hoppas vi får chansen att prata vidare', icon: Heart, emotion: 'tacksam' },
    { text: 'Med intresse för tjänsten ser jag fram emot att höra från er', icon: ArrowRight, emotion: 'intresse' },
  ],
}

const emotionColors: Record<string, string> = {
  positiv: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  nyfiken: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  engagerad: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  professionell: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
  intresse: 'bg-brand-50 text-brand-900 border-brand-200 hover:bg-brand-100',
  värderingar: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  utveckling: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  arbetsplats: 'bg-brand-50 text-brand-900 border-brand-200 hover:bg-brand-100',
  erfarenhet: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  kompetens: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  lärdomar: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  bakgrund: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
  formell: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
  tacksam: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
}

export function PromptButtons({ onSelect, type }: PromptButtonsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  
  const currentPrompts = prompts[type] || prompts.opening

  const handleSelect = (text: string, index: number) => {
    setSelectedIndex(index)
    onSelect(text)
    // Reset after animation
    setTimeout(() => setSelectedIndex(null), 500)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-700 font-medium">
        {type === 'opening' && 'Välj en inledning:'}
        {type === 'motivation' && 'Välj vad som motiverar dig:'}
        {type === 'experience' && 'Välj hur du beskriver erfarenhet:'}
        {type === 'closing' && 'Välj ett avslut:'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {currentPrompts.map((prompt, index) => {
          const Icon = prompt.icon
          const isSelected = selectedIndex === index
          
          return (
            <button
              key={index}
              onClick={() => handleSelect(prompt.text, index)}
              className={`
                flex items-start gap-2 p-2.5 rounded-lg border text-left text-sm
                transition-all duration-200
                ${emotionColors[prompt.emotion]}
                ${isSelected ? 'ring-2 ring-offset-1 scale-[1.02]' : ''}
              `}
            >
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{prompt.text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Quick phrase selector for inline use
export function QuickPhrases({ onSelect }: { onSelect: (text: string) => void }) {
  const phrases = [
    'Jag uppskattar ert arbete med',
    'Det som lockar mig är',
    'Min erfarenhet inom',
    'Jag ser fram emot att',
    'Tack för att ni tar er tid',
    'Med vänliga hälsningar',
  ]

  return (
    <div className="flex flex-wrap gap-1.5">
      {phrases.map((phrase, index) => (
        <button
          key={index}
          onClick={() => onSelect(phrase)}
          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-full transition-colors"
        >
          {phrase}
        </button>
      ))}
    </div>
  )
}
