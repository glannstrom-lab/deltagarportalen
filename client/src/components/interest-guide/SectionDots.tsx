import { type SectionId, sections } from '@/services/interestGuideData'
import { UserCircle2, Brain, Heart, Activity } from 'lucide-react'

interface SectionDotsProps {
  currentSection: SectionId
  completedSections: SectionId[]
  onSectionClick: (sectionId: SectionId) => void
}

const sectionIcons = {
  riasec: UserCircle2,
  bigfive: Brain,
  strong: Heart,
  icf: Activity,
}

const sectionColors = {
  riasec: 'bg-blue-500',
  bigfive: 'bg-purple-500',
  strong: 'bg-pink-500',
  icf: 'bg-emerald-500',
}

export function SectionDots({ 
  currentSection, 
  completedSections,
  onSectionClick 
}: SectionDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {sections.map((section, index) => {
        const Icon = sectionIcons[section.id]
        const isCurrent = section.id === currentSection
        const isCompleted = completedSections.includes(section.id)
        const isUpcoming = !isCurrent && !isCompleted
        
        return (
          <div key={section.id} className="flex items-center">
            <button
              onClick={() => onSectionClick(section.id)}
              className={`
                group relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300
                ${isCurrent 
                  ? `${sectionColors[section.id]} text-white shadow-lg scale-105` 
                  : isCompleted
                    ? 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm'
                    : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isCurrent ? 'text-white' : isCompleted ? 'text-gray-600' : 'text-gray-400'}`} />
              <span className={`text-xs font-medium ${!isCurrent && !isCompleted && 'hidden sm:inline'}`}>
                {section.name}
              </span>
              
              {/* Completed checkmark */}
              {isCompleted && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
            
            {/* Connector line */}
            {index < sections.length - 1 && (
              <div className={`w-4 sm:w-6 h-0.5 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Enkel sektionsinfo-komponent
interface SectionInfoProps {
  sectionId: SectionId
}

export function SectionInfo({ sectionId }: SectionInfoProps) {
  const info = {
    riasec: {
      title: 'Dina arbetsintressen',
      description: 'RIASEC-modellen hjälper oss förstå vilka typer av arbete du trivs bäst med.'
    },
    bigfive: {
      title: 'Din personlighet',
      description: 'Big Five är världens mest forskade personlighetsmodell.'
    },
    strong: {
      title: 'Vad intresserar dig?',
      description: 'Dina intressen är en stark indikator på yrken du ska trivas med.'
    },
    icf: {
      title: 'Dina förutsättningar',
      description: 'ICF kartlägger dina styrkor och visar var du kan behöva anpassningar.'
    }
  }

  const currentInfo = info[sectionId]
  
  return (
    <div className="text-center mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{currentInfo.title}</h2>
      <p className="text-sm text-gray-500">{currentInfo.description}</p>
    </div>
  )
}
