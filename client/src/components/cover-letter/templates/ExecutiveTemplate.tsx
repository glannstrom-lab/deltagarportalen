/**
 * Executive Cover Letter Template
 * Formal design with serif headings and gold accent
 */

import { cn } from '@/lib/utils'
import type { CoverLetterTemplateProps } from './index'

export function ExecutiveTemplate({
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
        className
      )}
      style={{ color: template.colors.text }}
    >
      {/* Header with serif font */}
      <div className="text-center mb-8 pb-6 border-b-2" style={{ borderColor: template.colors.accent }}>
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            color: template.colors.header,
            fontFamily: 'Georgia, "Times New Roman", serif'
          }}
        >
          {sender.name}
        </h1>
        <div
          className="text-sm flex justify-center flex-wrap gap-x-4"
          style={{ color: template.colors.muted }}
        >
          {sender.email && <span>{sender.email}</span>}
          {sender.phone && <span>{sender.phone}</span>}
          {sender.location && <span>{sender.location}</span>}
        </div>
      </div>

      {/* Date - right aligned */}
      <div
        className="text-right mb-6 italic"
        style={{ color: template.colors.muted }}
      >
        {date}
      </div>

      {/* Recipient */}
      {(company || jobTitle) && (
        <div className="mb-8">
          {company && (
            <div
              className="font-semibold text-base"
              style={{
                color: template.colors.text,
                fontFamily: 'Georgia, "Times New Roman", serif'
              }}
            >
              {company}
            </div>
          )}
          {jobTitle && (
            <div
              className="mt-1 italic"
              style={{ color: template.colors.muted }}
            >
              Angående tjänsten: {jobTitle}
            </div>
          )}
        </div>
      )}

      {/* Gold accent line */}
      <div className="flex items-center gap-2 mb-6">
        <div
          className="h-px flex-1"
          style={{ backgroundColor: template.colors.accent }}
        />
        <div
          className="w-2 h-2 rotate-45"
          style={{ backgroundColor: template.colors.accent }}
        />
        <div
          className="h-px flex-1"
          style={{ backgroundColor: template.colors.accent }}
        />
      </div>

      {/* Body */}
      <div className="space-y-4 mb-8">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="leading-7 text-justify">
            {paragraph.replace(/\n/g, ' ').trim()}
          </p>
        ))}
      </div>

      {/* Signature - formal */}
      <div className="mt-10">
        <p className="mb-6 italic" style={{ color: template.colors.muted }}>
          Med vänliga hälsningar,
        </p>
        <div className="border-t pt-4" style={{ borderColor: template.colors.accent }}>
          <p
            className="font-bold text-lg"
            style={{
              color: template.colors.header,
              fontFamily: 'Georgia, "Times New Roman", serif'
            }}
          >
            {sender.name}
          </p>
          <div className="text-sm mt-2 space-y-0.5" style={{ color: template.colors.muted }}>
            {sender.phone && <div>{sender.phone}</div>}
            {sender.email && <div>{sender.email}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
