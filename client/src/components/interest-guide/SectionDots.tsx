import { sections, type SectionId } from '@/services/interestGuideData'

interface SectionDotsProps {
  currentSection: SectionId
  completedSections: SectionId[]
  onSectionClick?: (section: SectionId) => void
}

export function SectionDots({ 
  currentSection, 
  completedSections, 
  onSectionClick 
}: SectionDotsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-6">
      {sections.map((section) => {
        const isActive = section.id === currentSection
        const isCompleted = completedSections.includes(section.id)
        
        return (
          <button
            key={section.id}
            onClick={() => onSectionClick?.(section.id)}
            disabled={!onSectionClick}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-110'
                : isCompleted
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            } ${onSectionClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            title={section.name}
          >
            {section.name}
          </button>
        )
      })}
    </div>
  )
}

interface SectionInfoProps {
  sectionId: SectionId
}

export function SectionInfo({ sectionId }: SectionInfoProps) {
  const section = sections.find(s => s.id === sectionId)
  if (!section) return null

  return (
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        {section.name}
      </h2>
      <p className="text-gray-500 mt-1">{section.subtitle}</p>
    </div>
  )
}
