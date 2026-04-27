/**
 * Minimal Cover Letter Template
 * Simple, focused design with lots of whitespace
 */

import { cn } from '@/lib/utils'
import type { CoverLetterTemplateProps } from './index'

export function MinimalTemplate({
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
      {/* Header - minimal, just name and date */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1
            className="text-xl font-medium tracking-tight"
            style={{ color: template.colors.header }}
          >
            {sender.name}
          </h1>
          <div
            className="text-xs mt-1 space-y-0.5"
            style={{ color: template.colors.muted }}
          >
            {sender.email && <div>{sender.email}</div>}
            {sender.phone && <div>{sender.phone}</div>}
          </div>
        </div>
        <div
          className="text-sm text-right"
          style={{ color: template.colors.muted }}
        >
          {date}
        </div>
      </div>

      {/* Recipient - simple */}
      {(company || jobTitle) && (
        <div className="mb-8">
          {company && (
            <div className="font-medium" style={{ color: template.colors.text }}>
              {company}
            </div>
          )}
          {jobTitle && (
            <div
              className="text-sm mt-0.5"
              style={{ color: template.colors.muted }}
            >
              Re: {jobTitle}
            </div>
          )}
        </div>
      )}

      {/* Body - generous line height */}
      <div className="space-y-5 mb-12">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="leading-7">
            {paragraph.replace(/\n/g, ' ').trim()}
          </p>
        ))}
      </div>

      {/* Signature - minimal */}
      <div className="mt-12">
        <p className="mb-6" style={{ color: template.colors.muted }}>
          Med vänliga hälsningar,
        </p>
        <p className="font-medium" style={{ color: template.colors.header }}>
          {sender.name}
        </p>
      </div>
    </div>
  )
}
