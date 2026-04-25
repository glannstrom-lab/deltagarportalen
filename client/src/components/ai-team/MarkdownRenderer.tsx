/**
 * Markdown Renderer for AI Team chat
 * Beautiful rendering of AI responses with modern styling
 */

import { cn } from '@/lib/utils'
import { CheckCircle, Lightbulb, ArrowRight, Star, Sparkles } from '@/components/ui/icons'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const elements = parseMarkdown(content)

  return (
    <div className={cn('text-sm space-y-3', className)}>
      {elements.map((element, index) => (
        <MarkdownElement key={index} element={element} isFirst={index === 0} />
      ))}
    </div>
  )
}

type ElementType =
  | 'paragraph'
  | 'heading'
  | 'list'
  | 'numbered-list'
  | 'code-block'
  | 'blockquote'

interface ParsedElement {
  type: ElementType
  content: string
  level?: number // For headings
  items?: string[] // For lists
  language?: string // For code blocks
}

function parseMarkdown(text: string): ParsedElement[] {
  const lines = text.split('\n')
  const elements: ParsedElement[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.startsWith('```')) {
      const language = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push({
        type: 'code-block',
        content: codeLines.join('\n'),
        language,
      })
      i++
      continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      elements.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      })
      i++
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      elements.push({
        type: 'blockquote',
        content: quoteLines.join('\n'),
      })
      continue
    }

    // Unordered list
    if (line.match(/^[-*•]\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*•]\s+/)) {
        items.push(lines[i].replace(/^[-*•]\s+/, ''))
        i++
      }
      elements.push({
        type: 'list',
        content: '',
        items,
      })
      continue
    }

    // Numbered list
    if (line.match(/^\d+\.\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''))
        i++
      }
      elements.push({
        type: 'numbered-list',
        content: '',
        items,
      })
      continue
    }

    // Empty line - skip
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph - collect consecutive non-special lines
    const paragraphLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('> ') &&
      !lines[i].match(/^[-*•]\s+/) &&
      !lines[i].match(/^\d+\.\s+/)
    ) {
      paragraphLines.push(lines[i])
      i++
    }
    if (paragraphLines.length > 0) {
      elements.push({
        type: 'paragraph',
        content: paragraphLines.join(' '),
      })
    }
  }

  return elements
}

function MarkdownElement({ element, isFirst }: { element: ParsedElement; isFirst: boolean }) {
  switch (element.type) {
    case 'heading':
      return <Heading level={element.level || 2} content={element.content} />
    case 'paragraph':
      return <Paragraph content={element.content} isFirst={isFirst} />
    case 'list':
      return <UnorderedList items={element.items || []} />
    case 'numbered-list':
      return <OrderedList items={element.items || []} />
    case 'code-block':
      return <CodeBlock content={element.content} language={element.language} />
    case 'blockquote':
      return <Blockquote content={element.content} />
    default:
      return <Paragraph content={element.content} isFirst={isFirst} />
  }
}

function Heading({ level, content }: { level: number; content: string }) {
  const baseClasses = 'flex items-center gap-2'

  if (level === 1) {
    return (
      <div className={cn(baseClasses, 'mt-1')}>
        <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
          <InlineMarkdown text={content} />
        </h3>
      </div>
    )
  }

  if (level === 2) {
    return (
      <div className={cn(baseClasses, 'mt-1')}>
        <Star className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
        <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
          <InlineMarkdown text={content} />
        </h4>
      </div>
    )
  }

  return (
    <h5 className="text-sm font-medium text-stone-700 dark:text-stone-200 mt-1">
      <InlineMarkdown text={content} />
    </h5>
  )
}

function Paragraph({ content, isFirst }: { content: string; isFirst: boolean }) {
  // First paragraph gets special styling if it looks like a greeting or intro
  const isGreeting = isFirst && (
    content.toLowerCase().includes('hej') ||
    content.toLowerCase().includes('hallå') ||
    content.toLowerCase().includes('välkommen') ||
    content.startsWith('Absolut') ||
    content.startsWith('Självklart') ||
    content.startsWith('Visst')
  )

  if (isGreeting) {
    return (
      <p className="text-stone-700 dark:text-stone-200 leading-relaxed font-medium">
        <InlineMarkdown text={content} />
      </p>
    )
  }

  return (
    <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
      <InlineMarkdown text={content} />
    </p>
  )
}

function UnorderedList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li
          key={idx}
          className={cn(
            'flex items-start gap-2.5 p-2.5 rounded-lg',
            'bg-white/60 dark:bg-stone-800/60',
            'border border-stone-200/50 dark:border-stone-700/50'
          )}
        >
          <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
          <span className="flex-1 text-stone-700 dark:text-stone-200">
            <InlineMarkdown text={item} />
          </span>
        </li>
      ))}
    </ul>
  )
}

function OrderedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2">
      {items.map((item, idx) => {
        // Extract title if item has a dash or colon pattern like "Strategy 1 - Description"
        const titleMatch = item.match(/^(.+?)(?:\s*[-–—:]\s*)(.+)$/)
        const hasTitle = titleMatch && titleMatch[1].length < 50

        return (
          <li
            key={idx}
            className={cn(
              'relative p-3 rounded-xl',
              'bg-gradient-to-r from-white/80 to-white/40',
              'dark:from-stone-800/80 dark:to-stone-800/40',
              'border border-stone-200/60 dark:border-stone-700/60',
              'shadow-sm'
            )}
          >
            <div className="flex items-start gap-3">
              {/* Number badge */}
              <div className={cn(
                'flex-shrink-0 w-6 h-6 rounded-lg',
                'bg-gradient-to-br from-teal-500 to-teal-600',
                'flex items-center justify-center',
                'text-white text-xs font-bold',
                'shadow-sm'
              )}>
                {idx + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {hasTitle ? (
                  <>
                    <div className="font-semibold text-stone-800 dark:text-stone-100 mb-0.5">
                      <InlineMarkdown text={titleMatch[1]} />
                    </div>
                    <div className="text-stone-600 dark:text-stone-300 text-[13px] leading-relaxed">
                      <InlineMarkdown text={titleMatch[2]} />
                    </div>
                  </>
                ) : (
                  <div className="text-stone-700 dark:text-stone-200">
                    <InlineMarkdown text={item} />
                  </div>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function CodeBlock({ content, language }: { content: string; language?: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-stone-300/50 dark:border-stone-600/50">
      {language && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-stone-200/80 dark:bg-stone-700/80 border-b border-stone-300/50 dark:border-stone-600/50">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            {language}
          </span>
        </div>
      )}
      <pre className="bg-stone-100 dark:bg-stone-900 p-3 overflow-x-auto">
        <code className="text-xs text-stone-800 dark:text-stone-200 font-mono leading-relaxed">
          {content}
        </code>
      </pre>
    </div>
  )
}

function Blockquote({ content }: { content: string }) {
  return (
    <blockquote className={cn(
      'relative pl-4 py-2 pr-3',
      'bg-gradient-to-r from-amber-50/80 to-transparent',
      'dark:from-amber-900/20 dark:to-transparent',
      'border-l-4 border-amber-400 dark:border-amber-500',
      'rounded-r-lg'
    )}>
      <Lightbulb className="absolute -left-2 -top-2 w-4 h-4 text-amber-500 bg-stone-50 dark:bg-stone-800 rounded-full p-0.5" />
      <p className="text-stone-700 dark:text-stone-300 italic leading-relaxed">
        <InlineMarkdown text={content} />
      </p>
    </blockquote>
  )
}

// Inline markdown: **bold**, *italic*, `code`, [link](url)
function InlineMarkdown({ text }: { text: string }) {
  const parts: (string | JSX.Element)[] = []
  let remaining = text
  let keyIndex = 0

  while (remaining.length > 0) {
    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(.+?)(\*\*|__)(.+?)\2/)
    if (boldMatch && boldMatch.index === 0) {
      if (boldMatch[1]) {
        parts.push(...processInlineCode(boldMatch[1], keyIndex))
        keyIndex++
      }
      parts.push(
        <strong key={`bold-${keyIndex++}`} className="font-semibold text-stone-800 dark:text-stone-100">
          {boldMatch[3]}
        </strong>
      )
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Italic: *text* or _text_ (but not ** or __)
    const italicMatch = remaining.match(/^(.+?)(?<!\*)\*(?!\*)(.+?)\*(?!\*)/)
    if (italicMatch && italicMatch.index === 0) {
      if (italicMatch[1]) {
        parts.push(...processInlineCode(italicMatch[1], keyIndex))
        keyIndex++
      }
      parts.push(
        <em key={`italic-${keyIndex++}`} className="italic text-stone-600 dark:text-stone-400">
          {italicMatch[2]}
        </em>
      )
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Inline code: `code`
    const codeMatch = remaining.match(/^(.+?)`([^`]+)`/)
    if (codeMatch && codeMatch.index === 0) {
      if (codeMatch[1]) {
        parts.push(codeMatch[1])
      }
      parts.push(
        <code
          key={`code-${keyIndex++}`}
          className={cn(
            'px-1.5 py-0.5 rounded-md',
            'bg-teal-100/80 dark:bg-teal-900/40',
            'text-teal-700 dark:text-teal-300',
            'text-[13px] font-mono font-medium'
          )}
        >
          {codeMatch[2]}
        </code>
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/^(.+?)\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch && linkMatch.index === 0) {
      if (linkMatch[1]) {
        parts.push(linkMatch[1])
      }
      parts.push(
        <a
          key={`link-${keyIndex++}`}
          href={linkMatch[3]}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center gap-0.5',
            'text-teal-600 dark:text-teal-400',
            'hover:text-teal-700 dark:hover:text-teal-300',
            'underline decoration-teal-300 dark:decoration-teal-600',
            'underline-offset-2 hover:decoration-teal-500',
            'transition-colors'
          )}
        >
          {linkMatch[2]}
          <ArrowRight className="w-3 h-3" />
        </a>
      )
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    // No match found - add remaining text and break
    parts.push(...processInlineCode(remaining, keyIndex))
    break
  }

  return <>{parts}</>
}

// Process just inline code in text
function processInlineCode(text: string, startKey: number): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = []
  let remaining = text
  let keyIndex = startKey

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/`([^`]+)`/)
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(remaining.slice(0, codeMatch.index))
      }
      parts.push(
        <code
          key={`code-${keyIndex++}`}
          className={cn(
            'px-1.5 py-0.5 rounded-md',
            'bg-teal-100/80 dark:bg-teal-900/40',
            'text-teal-700 dark:text-teal-300',
            'text-[13px] font-mono font-medium'
          )}
        >
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length)
    } else {
      parts.push(remaining)
      break
    }
  }

  return parts
}

export default MarkdownRenderer
