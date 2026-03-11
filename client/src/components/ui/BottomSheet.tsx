/**
 * Bottom Sheet Component
 * Mobil-optimized bottom sheet för filter, val och modaler
 */

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { CloseButton } from './Button'
import { animations, radius } from '@/styles/design-system'

// ============================================
// BOTTOM SHEET
// ============================================
interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  showHandle?: boolean
  snapPoints?: ('25%' | '50%' | '75%' | 'full')[]
  initialSnap?: '25%' | '50%' | '75%' | 'full'
  showCloseButton?: boolean
  className?: string
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  showHandle = true,
  snapPoints,
  initialSnap = '75%',
  showCloseButton = true,
  className,
}: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
        document.body.style.overflow = ''
      }, 300)
      return () => clearTimeout(timer)
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  if (!isVisible && !isOpen) return null
  
  const heightClass = {
    '25%': 'h-[25vh]',
    '50%': 'h-[50vh]',
    '75%': 'h-[75vh]',
    'full': 'h-[calc(100vh-40px)]',
  }
  
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40',
          'transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-white rounded-t-3xl shadow-2xl',
          'flex flex-col',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          heightClass[initialSnap],
          className
        )}
      >
        {/* Handle bar */}
        {showHandle && (
          <div 
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onClick={onClose}
          >
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>
        )}
        
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 px-6 pb-4">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
              )}
              {description && (
                <p className="text-sm text-slate-500 mt-1">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <CloseButton onClick={onClose} size="md" />
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {children}
        </div>
      </div>
    </>
  )
}

// ============================================
// BOTTOM SHEET ITEM (för listor)
// ============================================
interface BottomSheetItemProps {
  icon?: React.ReactNode
  label: string
  description?: string
  isSelected?: boolean
  isDestructive?: boolean
  onClick: () => void
  disabled?: boolean
}

export function BottomSheetItem({
  icon,
  label,
  description,
  isSelected,
  isDestructive,
  onClick,
  disabled,
}: BottomSheetItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-4 px-4 py-4',
        'text-left rounded-xl',
        'transition-colors duration-200',
        animations.press,
        isSelected 
          ? 'bg-indigo-50 text-indigo-700' 
          : 'hover:bg-slate-50',
        isDestructive && !isSelected && 'text-red-600 hover:bg-red-50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {icon && (
        <div className={cn(
          'flex-shrink-0',
          isSelected ? 'text-indigo-600' : isDestructive ? 'text-red-500' : 'text-slate-500'
        )}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={cn(
          'font-medium',
          isSelected && 'text-indigo-700',
          isDestructive && !isSelected && 'text-red-600'
        )}>
          {label}
        </div>
        {description && (
          <div className="text-sm text-slate-500 mt-0.5">{description}</div>
        )}
      </div>
      {isSelected && (
        <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}

// ============================================
// BOTTOM SHEET DIVIDER
// ============================================
export function BottomSheetDivider() {
  return <div className="h-px bg-slate-200 my-2" />
}

// ============================================
// FILTER SHEET (för filter på mobil)
// ============================================
interface FilterSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  filterCount?: number
  onClear: () => void
  onApply: () => void
  children: React.ReactNode
}

export function FilterSheet({
  isOpen,
  onClose,
  title = 'Filter',
  filterCount = 0,
  onClear,
  onApply,
  children,
}: FilterSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      initialSnap="75%"
    >
      <div className="space-y-6">
        {children}
        
        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={onClear}
            disabled={filterCount === 0}
            className={cn(
              'flex-1 py-3 px-4 rounded-xl font-medium',
              'border border-slate-200 text-slate-700',
              'hover:bg-slate-50 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Rensa {filterCount > 0 && `(${filterCount})`}
          </button>
          <button
            onClick={() => {
              onApply()
              onClose()
            }}
            className={cn(
              'flex-1 py-3 px-4 rounded-xl font-medium',
              'bg-indigo-600 text-white',
              'hover:bg-indigo-700 transition-colors'
            )}
          >
            Visa resultat
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ============================================
// ACTION SHEET (för val/actions)
// ============================================
interface Action {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  isDestructive?: boolean
  isSelected?: boolean
  disabled?: boolean
}

interface ActionSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  actions: Action[]
  showCancel?: boolean
  cancelLabel?: string
}

export function ActionSheet({
  isOpen,
  onClose,
  title,
  description,
  actions,
  showCancel = true,
  cancelLabel = 'Avbryt',
}: ActionSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      initialSnap="auto"
      showCloseButton={false}
    >
      <div className="space-y-1">
        {actions.map((action, index) => (
          <BottomSheetItem
            key={index}
            icon={action.icon}
            label={action.label}
            isSelected={action.isSelected}
            isDestructive={action.isDestructive}
            onClick={() => {
              action.onClick()
              onClose()
            }}
            disabled={action.disabled}
          />
        ))}
        
        {showCancel && (
          <>
            <BottomSheetDivider />
            <button
              onClick={onClose}
              className={cn(
                'w-full py-4 px-4',
                'text-center font-medium text-slate-600',
                'hover:bg-slate-50 rounded-xl',
                animations.press,
                'transition-colors duration-200'
              )}
            >
              {cancelLabel}
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  )
}

export default BottomSheet
