/**
 * Cover Letter Preview Component
 * Routes to the appropriate visual template based on template ID
 */

import { cn } from '@/lib/utils'
import {
  COVER_LETTER_TEMPLATES,
  getTemplateById,
  getDefaultTemplate,
  type CoverLetterTemplateConfig
} from './templates'
import { ProfessionalTemplate } from './templates/ProfessionalTemplate'
import { ModernTemplate } from './templates/ModernTemplate'
import { MinimalTemplate } from './templates/MinimalTemplate'
import { ExecutiveTemplate } from './templates/ExecutiveTemplate'

export interface CoverLetterPreviewProps {
  content: string
  company?: string
  jobTitle?: string
  date?: string
  templateId?: string
  sender: {
    name: string
    email?: string
    phone?: string
    location?: string
  }
  className?: string
  scale?: number // Scale factor for preview (e.g., 0.5 for half size)
}

export function CoverLetterPreview({
  content,
  company,
  jobTitle,
  date,
  templateId = 'professional',
  sender,
  className,
  scale = 1
}: CoverLetterPreviewProps) {
  const template = getTemplateById(templateId) || getDefaultTemplate()

  // Format date if not provided
  const formattedDate = date || new Date().toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Common props for all templates
  const templateProps = {
    content,
    company,
    jobTitle,
    date: formattedDate,
    sender,
    template,
    className: 'p-8'
  }

  // Render the appropriate template
  const renderTemplate = () => {
    switch (templateId) {
      case 'modern':
        return <ModernTemplate {...templateProps} />
      case 'minimal':
        return <MinimalTemplate {...templateProps} />
      case 'executive':
        return <ExecutiveTemplate {...templateProps} />
      case 'professional':
      default:
        return <ProfessionalTemplate {...templateProps} />
    }
  }

  return (
    <div
      className={cn(
        'bg-white shadow-lg border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden',
        className
      )}
      style={{
        // A4 aspect ratio: 210mm x 297mm
        aspectRatio: '210 / 297',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left'
      }}
    >
      {renderTemplate()}
    </div>
  )
}

// Thumbnail preview for template selection
export function CoverLetterPreviewThumbnail({
  templateId,
  selected = false,
  onClick
}: {
  templateId: string
  selected?: boolean
  onClick?: () => void
}) {
  const template = getTemplateById(templateId) || getDefaultTemplate()

  // Sample content for thumbnail
  const sampleContent = `Hej,

Jag söker tjänsten med stort intresse. Min bakgrund och erfarenhet gör mig till en stark kandidat.

Jag ser fram emot att få höra från er.`

  const sampleSender = {
    name: 'Anna Andersson',
    email: 'anna@example.com',
    phone: '070-123 45 67'
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full aspect-[210/297] rounded-lg border-2 overflow-hidden transition-all',
        'hover:ring-2 hover:ring-teal-500/30',
        'focus:outline-none focus:ring-2 focus:ring-teal-500',
        selected
          ? 'border-teal-500 ring-2 ring-teal-500/30'
          : 'border-stone-200 dark:border-stone-700'
      )}
      aria-pressed={selected}
      aria-label={`Välj ${template.name}-mall`}
    >
      {/* Scaled preview */}
      <div
        className="absolute inset-0 origin-top-left"
        style={{ transform: 'scale(0.25)', width: '400%', height: '400%' }}
      >
        <CoverLetterPreview
          content={sampleContent}
          company="Exempelföretag AB"
          jobTitle="Projektledare"
          templateId={templateId}
          sender={sampleSender}
          className="h-full"
        />
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  )
}

export { COVER_LETTER_TEMPLATES, getTemplateById, getDefaultTemplate }
export type { CoverLetterTemplateConfig }
