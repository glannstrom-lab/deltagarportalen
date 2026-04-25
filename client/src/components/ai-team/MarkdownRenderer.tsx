/**
 * Simple Markdown Renderer for AI Team chat
 * Renders common markdown patterns without external dependencies
 */

import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const elements = parseMarkdown(content)

  return (
    <div className={cn('text-sm space-y-2', className)}>
      {elements.map((element, index) => (
        <MarkdownElement key={index} element={element} />
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

function MarkdownElement({ element }: { element: ParsedElement }) {
  switch (element.type) {
    case 'heading':
      return <Heading level={element.level || 2} content={element.content} />
    case 'paragraph':
      return <Paragraph content={element.content} />
    case 'list':
      return <UnorderedList items={element.items || []} />
    case 'numbered-list':
      return <OrderedList items={element.items || []} />
    case 'code-block':
      return <CodeBlock content={element.content} language={element.language} />
    case 'blockquote':
      return <Blockquote content={element.content} />
    default:
      return <Paragraph content={element.content} />
  }
}

function Heading({ level, content }: { level: number; content: string }) {
  const classes = {
    1: 'text-lg font-bold text-stone-900 dark:text-stone-100',
    2: 'text-base font-semibold text-stone-900 dark:text-stone-100',
    3: 'text-sm font-semibold text-stone-800 dark:text-stone-200',
    4: 'text-sm font-medium text-stone-700 dark:text-stone-300',
  }

  return (
    <p className={classes[level as keyof typeof classes] || classes[2]}>
      <InlineMarkdown text={content} />
    </p>
  )
}

function Paragraph({ content }: { content: string }) {
  return (
    <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
      <InlineMarkdown text={content} />
    </p>
  )
}

function UnorderedList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 ml-1">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 text-stone-700 dark:text-stone-300">
          <span className="text-teal-500 mt-1.5 text-xs">●</span>
          <span className="flex-1">
            <InlineMarkdown text={item} />
          </span>
        </li>
      ))}
    </ul>
  )
}

function OrderedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-1.5 ml-1">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 text-stone-700 dark:text-stone-300">
          <span className="text-teal-600 dark:text-teal-400 font-medium min-w-[1.25rem]">
            {idx + 1}.
          </span>
          <span className="flex-1">
            <InlineMarkdown text={item} />
          </span>
        </li>
      ))}
    </ol>
  )
}

function CodeBlock({ content, language }: { content: string; language?: string }) {
  return (
    <div className="relative">
      {language && (
        <div className="absolute top-0 right-0 px-2 py-0.5 text-xs text-stone-400 dark:text-stone-500 bg-stone-200 dark:bg-stone-700 rounded-bl rounded-tr-lg">
          {language}
        </div>
      )}
      <pre className="bg-stone-100 dark:bg-stone-900 rounded-lg p-3 overflow-x-auto">
        <code className="text-xs text-stone-800 dark:text-stone-200 font-mono">
          {content}
        </code>
      </pre>
    </div>
  )
}

function Blockquote({ content }: { content: string }) {
  return (
    <blockquote className="border-l-3 border-teal-400 pl-3 py-1 bg-teal-50/50 dark:bg-teal-900/20 rounded-r-lg">
      <p className="text-stone-600 dark:text-stone-400 italic">
        <InlineMarkdown text={content} />
      </p>
    </blockquote>
  )
}

// Inline markdown: **bold**, *italic*, `code`, [link](url)
function InlineMarkdown({ text }: { text: string }) {
  // Process inline elements
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
        <strong key={`bold-${keyIndex++}`} className="font-semibold text-stone-900 dark:text-stone-100">
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
        <em key={`italic-${keyIndex++}`} className="italic">
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
          className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-700 rounded text-xs font-mono text-teal-700 dark:text-teal-300"
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
          className="text-teal-600 dark:text-teal-400 hover:underline"
        >
          {linkMatch[2]}
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
          className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-700 rounded text-xs font-mono text-teal-700 dark:text-teal-300"
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
