/**
 * AI Result Card Component
 * Reusable component for displaying AI-generated results
 * Features gradient header, loading states, collapsible sections, source citations
 */

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// ============================================
// LOADING INDICATOR
// ============================================

interface AILoadingIndicatorProps {
  text?: string
  subtext?: string
}

export function AILoadingIndicator({
  text = 'AI analyserar...',
  subtext,
}: AILoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="flex items-center gap-1.5 mb-3">
        <motion.div
          className="w-2.5 h-2.5 rounded-full bg-teal-500"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2.5 h-2.5 rounded-full bg-teal-500"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2.5 h-2.5 rounded-full bg-teal-500"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      <p className="text-sm font-medium text-teal-700 dark:text-teal-300">{text}</p>
      {subtext && (
        <p className="text-xs text-slate-700 dark:text-slate-600 mt-1">{subtext}</p>
      )}
    </div>
  )
}

// ============================================
// COLLAPSIBLE SECTION
// ============================================

interface CollapsibleSectionProps {
  title: string
  icon?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  badge?: string | number
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between p-3 sm:p-4',
          'bg-slate-50 dark:bg-slate-800/50',
          'hover:bg-slate-100 dark:hover:bg-slate-800',
          'transition-colors text-left'
        )}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-teal-500">{icon}</span>}
          <span className="font-medium text-slate-800 dark:text-slate-200 text-sm sm:text-base">
            {title}
          </span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-xs rounded-full">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-700" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-700" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// COPY BUTTON
// ============================================

interface CopyButtonProps {
  text: string
  className?: string
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        'hover:bg-slate-100 dark:hover:bg-slate-800',
        'text-slate-700 hover:text-slate-700 dark:hover:text-slate-300',
        className
      )}
      title={copied ? 'Kopierad!' : 'Kopiera'}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  )
}

// ============================================
// SOURCE CITATIONS
// ============================================

interface SourceCitationsProps {
  sources: string[]
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
      <p className="text-xs font-medium text-slate-700 dark:text-slate-600 mb-2">
        Källor:
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1',
              'bg-slate-100 dark:bg-slate-800 rounded-md',
              'text-xs text-slate-600 dark:text-slate-600',
              'hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
            )}
          >
            <ExternalLink className="w-3 h-3" />
            {new URL(source).hostname.replace('www.', '')}
          </a>
        ))}
      </div>
    </div>
  )
}

// ============================================
// MAIN AI RESULT CARD
// ============================================

interface AIResultCardProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  isLoading?: boolean
  loadingText?: string
  error?: string | null
  onRetry?: () => void
  children?: ReactNode
  sources?: string[]
  className?: string
  variant?: 'default' | 'compact'
  headerActions?: ReactNode
}

export function AIResultCard({
  title,
  subtitle,
  icon,
  isLoading = false,
  loadingText,
  error,
  onRetry,
  children,
  sources,
  className,
  variant = 'default',
  headerActions,
}: AIResultCardProps) {
  if (error) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-1">
                Något gick fel
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-600 mb-4">
                {error}
              </p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Försök igen
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)} padding="none">
      {/* Gradient Header */}
      <div
        className={cn(
          'bg-gradient-to-r from-teal-600 to-sky-600',
          'px-4 sm:px-6',
          variant === 'compact' ? 'py-3' : 'py-4'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              {icon || <Sparkles className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm sm:text-base">{title}</h3>
              {subtitle && (
                <p className="text-teal-100 text-xs sm:text-sm">{subtitle}</p>
              )}
            </div>
          </div>
          {headerActions && (
            <div className="flex items-center gap-2">{headerActions}</div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn('p-4 sm:p-6', variant === 'compact' && 'p-3 sm:p-4')}>
        {isLoading ? (
          <AILoadingIndicator text={loadingText} />
        ) : (
          <>
            {children}
            {sources && <SourceCitations sources={sources} />}
          </>
        )}
      </div>
    </Card>
  )
}

// ============================================
// LIST ITEMS
// ============================================

interface AIListItemProps {
  children: ReactNode
  icon?: ReactNode
  className?: string
}

export function AIListItem({ children, icon, className }: AIListItemProps) {
  return (
    <li className={cn('flex items-start gap-2', className)}>
      {icon || (
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 flex-shrink-0" />
      )}
      <span className="text-sm text-slate-700 dark:text-slate-300">{children}</span>
    </li>
  )
}

interface AIListProps {
  items: (string | ReactNode)[]
  icon?: ReactNode
  className?: string
}

export function AIList({ items, icon, className }: AIListProps) {
  return (
    <ul className={cn('space-y-2', className)}>
      {items.map((item, index) => (
        <AIListItem key={index} icon={icon}>
          {item}
        </AIListItem>
      ))}
    </ul>
  )
}

// ============================================
// STAT BLOCK
// ============================================

interface AIStatBlockProps {
  label: string
  value: string | number
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function AIStatBlock({
  label,
  value,
  subValue,
  trend,
  className,
}: AIStatBlockProps) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50',
        className
      )}
    >
      <p className="text-xs text-slate-700 dark:text-slate-600 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trend === 'up' && 'text-green-600',
              trend === 'down' && 'text-red-600',
              trend === 'neutral' && 'text-slate-700'
            )}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
      {subValue && (
        <p className="text-xs text-slate-700 dark:text-slate-600 mt-0.5">
          {subValue}
        </p>
      )}
    </div>
  )
}

// ============================================
// EXPORTS
// ============================================

export default AIResultCard
