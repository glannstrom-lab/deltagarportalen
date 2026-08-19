/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + context/konstant/helper-export */
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

// CoverLetterPreviewThumbnail raderad 2026-08-19: noll importörer sedan
// mallväljaren gick över till CoverLetterTemplateSelector. Den bar dessutom
// exempeldata ("Anna Andersson", "Exempelföretag AB") som såg ut som riktigt
// innehåll — precis den sortens påhittade värde som ska bort ur portalen.

export { COVER_LETTER_TEMPLATES, getTemplateById, getDefaultTemplate }
export type { CoverLetterTemplateConfig }
