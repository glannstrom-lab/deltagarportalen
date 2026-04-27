/**
 * Professional Cover Letter Template
 * Classic layout with teal accent
 */

import { cn } from '@/lib/utils'
import type { CoverLetterTemplateProps } from './index'

export function ProfessionalTemplate({
  content,
  company,
  jobTitle,
  date,
  sender,
  template,
  className
}: CoverLetterTemplateProps) {
  // Parse content into paragraphs, removing markdown bold markers
  const paragraphs = content
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .split(/\n\n+/)
    .filter(p => p.trim())

  return (
    <div
      className={cn(
        'bg-white text-sm leading-relaxed',
        'font-sans',
        className
      )}
      style={{ color: template.colors.text }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: template.colors.header }}
        >
          {sender.name}
        </h1>
        <div
          className="text-sm flex flex-wrap gap-x-3"
          style={{ color: template.colors.muted }}
        >
          {sender.email && <span>{sender.email}</span>}
          {sender.phone && <span>{sender.phone}</span>}
          {sender.location && <span>{sender.location}</span>}
        </div>
        {/* Accent line */}
        <div
          className="w-16 h-0.5 mt-4"
          style={{ backgroundColor: template.colors.accent }}
        />
      </div>

      {/* Date */}
      <div
        className="text-sm mb-6 text-right"
        style={{ color: template.colors.muted }}
      >
        {date}
      </div>

      {/* Recipient */}
      {(company || jobTitle) && (
        <div className="mb-6">
          {company && (
            <div className="font-semibold" style={{ color: template.colors.text }}>
              {company}
            </div>
          )}
          {jobTitle && (
            <div
              className="italic text-sm"
              style={{ color: template.colors.muted }}
            >
              Angående: {jobTitle}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="space-y-4 mb-8">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="leading-relaxed">
            {paragraph.replace(/\n/g, ' ').trim()}
          </p>
        ))}
      </div>

      {/* Signature */}
      <div className="mt-8">
        <p className="mb-4">Med vänliga hälsningar,</p>
        <p className="font-semibold" style={{ color: template.colors.header }}>
          {sender.name}
        </p>
        <div className="text-sm mt-1" style={{ color: template.colors.muted }}>
          {sender.phone && <div>{sender.phone}</div>}
          {sender.email && <div>{sender.email}</div>}
        </div>
      </div>
    </div>
  )
}
