/**
 * Cover Letter Template Selector
 * Visual grid for selecting cover letter templates
 */

import { FileText, Sparkles, Minus, Briefcase, Check } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { COVER_LETTER_TEMPLATES, type CoverLetterTemplateConfig } from './templates'

// Map icon names to components
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  FileText,
  Sparkles,
  Minus,
  Briefcase
}

interface CoverLetterTemplateSelectorProps {
  selectedTemplate: string
  onSelect: (templateId: string) => void
  showDescription?: boolean
  columns?: 2 | 4
}

export function CoverLetterTemplateSelector({
  selectedTemplate,
  onSelect,
  showDescription = true,
  columns = 2
}: CoverLetterTemplateSelectorProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'
      )}
      role="listbox"
      aria-label="Välj brevmall"
    >
      {COVER_LETTER_TEMPLATES.map((template) => {
        const Icon = ICON_MAP[template.icon] || FileText
        const isSelected = selectedTemplate === template.id

        return (
          <button
            key={template.id}
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(template.id)}
            className={cn(
              'relative p-4 rounded-xl border-2 text-left transition-all',
              'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
              'hover:shadow-md',
              isSelected
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                : 'border-stone-200 dark:border-stone-700 hover:border-teal-200 dark:hover:border-teal-700 bg-white dark:bg-stone-800/50'
            )}
          >
            {/* Template preview mini */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
                  isSelected
                    ? 'text-white'
                    : 'text-stone-600 dark:text-stone-300'
                )}
                style={{
                  backgroundColor: isSelected ? template.colors.accent : undefined,
                  ...(isSelected ? {} : { backgroundColor: 'rgb(241 245 249)' }) // stone-100
                }}
              >
                <Icon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                    {template.name}
                  </h3>
                  {isSelected && (
                    <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center shrink-0">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </div>
                {showDescription && (
                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 line-clamp-2">
                    {template.description}
                  </p>
                )}
                {/* Color preview dots */}
                <div className="flex items-center gap-1.5 mt-2">
                  <div
                    className="w-3 h-3 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: template.colors.header }}
                    title="Rubrik"
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: template.colors.accent }}
                    title="Accent"
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: template.colors.muted }}
                    title="Sekundär"
                  />
                  <span className="text-xs text-stone-500 dark:text-stone-400 ml-1">
                    {template.fontFamily === 'serif' ? 'Serif' : 'Sans'}
                  </span>
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Compact variant for inline selection
export function CoverLetterTemplateSelectorCompact({
  selectedTemplate,
  onSelect
}: {
  selectedTemplate: string
  onSelect: (templateId: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="listbox" aria-label="Välj brevmall">
      {COVER_LETTER_TEMPLATES.map((template) => {
        const isSelected = selectedTemplate === template.id

        return (
          <button
            key={template.id}
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(template.id)}
            className={cn(
              'px-3 py-2 rounded-lg border transition-all',
              'focus:outline-none focus:ring-2 focus:ring-teal-500',
              isSelected
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 text-stone-700 dark:text-stone-300'
            )}
          >
            <span className="text-sm font-medium">{template.name}</span>
          </button>
        )
      })}
    </div>
  )
}
