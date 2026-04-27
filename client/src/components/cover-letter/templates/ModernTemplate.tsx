/**
 * Modern Cover Letter Template
 * Clean design with blue accent header
 */

import { cn } from '@/lib/utils'
import type { CoverLetterTemplateProps } from './index'

export function ModernTemplate({
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
      {/* Colored header bar */}
      <div
        className="h-1 w-full mb-6"
        style={{ backgroundColor: template.colors.accent }}
      />

      {/* Header */}
      <div
        className="rounded-lg p-4 mb-6"
        style={{ backgroundColor: template.colors.headerBg }}
      >
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: template.colors.header }}
        >
          {sender.name}
        </h1>
        <div
          className="text-sm flex flex-wrap gap-x-2 gap-y-1"
          style={{ color: template.colors.muted }}
        >
          {sender.email && (
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: template.colors.accent }} />
              {sender.email}
            </span>
          )}
          {sender.phone && (
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: template.colors.accent }} />
              {sender.phone}
            </span>
          )}
          {sender.location && (
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: template.colors.accent }} />
              {sender.location}
            </span>
          )}
        </div>
      </div>

      {/* Date & Recipient row */}
      <div className="flex justify-between items-start mb-6">
        <div>
          {company && (
            <div className="font-semibold" style={{ color: template.colors.text }}>
              {company}
            </div>
          )}
          {jobTitle && (
            <div
              className="text-sm"
              style={{ color: template.colors.accent }}
            >
              {jobTitle}
            </div>
          )}
        </div>
        <div className="text-sm" style={{ color: template.colors.muted }}>
          {date}
        </div>
      </div>

      {/* Accent line */}
      <div
        className="w-20 h-0.5 mb-6"
        style={{ backgroundColor: template.colors.accent }}
      />

      {/* Body */}
      <div className="space-y-4 mb-8">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="leading-relaxed">
            {paragraph.replace(/\n/g, ' ').trim()}
          </p>
        ))}
      </div>

      {/* Signature */}
      <div className="mt-8 border-t pt-6" style={{ borderColor: template.colors.headerBg }}>
        <p className="mb-4">Med vänliga hälsningar,</p>
        <p className="font-bold text-lg" style={{ color: template.colors.header }}>
          {sender.name}
        </p>
        <div className="text-sm mt-2 flex flex-wrap gap-x-4" style={{ color: template.colors.muted }}>
          {sender.phone && <span>{sender.phone}</span>}
          {sender.email && <span>{sender.email}</span>}
        </div>
      </div>
    </div>
  )
}
