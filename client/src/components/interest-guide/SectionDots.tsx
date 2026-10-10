import { type SectionId } from '@/services/interestGuideData'
import { useSektioner } from '@/services/useIntresseguideInnehall'
import { UserCircle2, Brain, Heart, Activity } from '@/components/ui/icons'

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

// En färg per sida: den aktiva delen bär hubbens färg (var fyra pasteller,
// och vit text på bg-blue-500 gav 3,8:1). Ikonen skiljer delarna åt.

export function SectionDots({ 
  currentSection, 
  completedSections,
  onSectionClick 
}: SectionDotsProps) {
  const sektioner = useSektioner()
  return (
    <div className="flex items-center justify-center gap-2">
      {sektioner.map((section, index) => {
        const Icon = sectionIcons[section.id]
        const isCurrent = section.id === currentSection
        const isCompleted = completedSections.includes(section.id)

        return (
          <div key={section.id} className="flex items-center">
            <button
              onClick={() => onSectionClick(section.id)}
              // Etiketten är dold på mobil för kommande delar — namnet måste ändå finnas.
              aria-label={section.name}
              aria-current={isCurrent ? 'step' : undefined}
              className={`
                group relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300
                ${isCurrent 
                  ? `bg-[var(--c-solid)] text-[var(--c-on-solid)] shadow-lg scale-105` 
                  : isCompleted
                    ? 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-600 hover:border-stone-300 shadow-sm'
                    : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-stone-300'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isCurrent ? 'text-[var(--c-on-solid)]' : ''}`} />
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
            {index < sektioner.length - 1 && (
              <div className={`w-4 sm:w-6 h-0.5 ${isCompleted ? 'bg-green-400' : 'bg-stone-200 dark:bg-stone-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
