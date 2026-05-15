/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + helper-export */
/**
 * AI-märkning enligt AI Act Art 50 (transparenskrav som gäller från 2 aug 2026).
 *
 * AIBadge: visas synligt på AI-funktioner ("Du chattar med AI", "AI-genererat")
 * AIGeneratedWatermark: större disclaimer för output (CV-text, brev, planer)
 *
 * Båda inkluderar maskinläsbar metadata via data-ai-generated attribut.
 */

import { Bot, Sparkles } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface AIBadgeProps {
  /** Visningsläge: 'inline' (liten chip), 'block' (rad), eller 'banner' (full bredd) */
  variant?: 'inline' | 'block' | 'banner'
  /** Text att visa (default: "AI-genererat") */
  label?: string
  className?: string
}

/**
 * AI-märkning. Använd på:
 * - Chatknappar för AI-coach ("AI" badge)
 * - Knappar som triggar AI-generering ("AI-stöd")
 * - Resultat-rubriker ("Detta är AI-genererat")
 *
 * Maskinläsbar via `data-ai-generated="true"` (AI Act Art 50.2-krav).
 */
export function AIBadge({ variant = 'inline', label = 'AI-genererat', className }: AIBadgeProps) {
  if (variant === 'banner') {
    return (
      <div
        data-ai-generated="true"
        className={cn(
          'flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg text-sm text-violet-900 dark:text-violet-100',
          className
        )}
        role="note"
        aria-label={label}
      >
        <Bot className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span><strong>AI:</strong> {label}. AI-rekommendationer är vägledning, inte slutgiltiga beslut — granska innan du delar.</span>
      </div>
    )
  }

  if (variant === 'block') {
    return (
      <div
        data-ai-generated="true"
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 rounded-md text-xs font-medium',
          className
        )}
        role="note"
        aria-label={label}
      >
        <Sparkles className="w-3 h-3" aria-hidden="true" />
        {label}
      </div>
    )
  }

  // inline (default)
  return (
    <span
      data-ai-generated="true"
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 rounded text-[10px] font-medium uppercase tracking-wide',
        className
      )}
      role="note"
      aria-label={label}
    >
      <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
      AI
    </span>
  )
}

interface AIGeneratedWatermarkProps {
  /** Vilken sorts AI-output detta är (visas i texten) */
  contentType?: string
  /** Egen klassnamn */
  className?: string
}

/**
 * Större disclaimer som visas i botten av AI-genererat innehåll.
 * Använd på t.ex. färdiga personliga brev, CV-summeringar, karriärplaner.
 *
 * AI Act Art 50.2: AI-genererat innehåll måste märkas på ett sätt som är
 * "tydligt och tillgängligt" för slutanvändaren.
 */
export function AIGeneratedWatermark({ contentType = 'innehåll', className }: AIGeneratedWatermarkProps) {
  return (
    <div
      data-ai-generated="true"
      data-ai-content-type={contentType}
      className={cn(
        'mt-4 pt-3 border-t border-violet-200 dark:border-violet-800 flex items-start gap-2 text-xs text-violet-700 dark:text-violet-300',
        className
      )}
      role="note"
    >
      <Bot className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <strong>Detta {contentType} är genererat med AI-stöd.</strong>{' '}
        Granska och redigera innan du använder det. AI kan göra misstag eller missa viktiga nyanser.
      </div>
    </div>
  )
}
