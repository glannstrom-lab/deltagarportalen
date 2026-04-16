/**
 * ConfirmDialog - Consistent confirmation dialog to replace native confirm()
 * Provides better UX with custom styling and animations
 */

import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'

type DialogVariant = 'default' | 'danger' | 'warning' | 'info'

interface ConfirmDialogOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: DialogVariant
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  isOpen: boolean
  resolve: ((value: boolean) => void) | null
}

const initialState: ConfirmDialogState = {
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Bekräfta',
  cancelText: 'Avbryt',
  variant: 'default',
  resolve: null,
}

// Context for the confirm dialog
const ConfirmDialogContext = createContext<{
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>
} | null>(null)

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider')
  }
  return context
}

interface ConfirmDialogProviderProps {
  children: ReactNode
}

export function ConfirmDialogProvider({ children }: ConfirmDialogProviderProps) {
  const [state, setState] = useState<ConfirmDialogState>(initialState)

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Bekräfta',
        cancelText: options.cancelText || 'Avbryt',
        variant: options.variant || 'default',
        resolve,
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state.resolve?.(true)
    setState(initialState)
  }, [state.resolve])

  const handleCancel = useCallback(() => {
    state.resolve?.(false)
    setState(initialState)
  }, [state.resolve])

  const variantStyles = {
    default: {
      icon: Info,
      iconBg: 'bg-sky-100 dark:bg-sky-900/30',
      iconColor: 'text-sky-600 dark:text-sky-400',
      confirmBtn: 'bg-sky-600 hover:bg-sky-600 text-white',
    },
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: AlertCircle,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: CheckCircle,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  }

  const currentVariant = variantStyles[state.variant || 'default']
  const Icon = currentVariant.icon

  // Focus trap for accessibility - traps focus within dialog and handles Escape
  const dialogRef = useFocusTrap<HTMLDivElement>(state.isOpen, {
    onEscape: handleCancel,
    restoreFocus: true,
    autoFocus: true,
  })

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}

      {/* Dialog Overlay */}
      {state.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
        >
          {/* Dialog Content */}
          <div
            ref={dialogRef}
            className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-1 text-slate-600 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Stäng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              {/* Icon */}
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', currentVariant.iconBg)}>
                <Icon className={cn('w-6 h-6', currentVariant.iconColor)} />
              </div>

              {/* Title */}
              <h2
                id="confirm-dialog-title"
                className="text-xl font-bold text-slate-800 dark:text-stone-100 mb-2"
              >
                {state.title}
              </h2>

              {/* Message */}
              <p
                id="confirm-dialog-description"
                className="text-slate-600 dark:text-stone-300 mb-6"
              >
                {state.message}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-stone-600 text-slate-700 dark:text-stone-200 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-stone-800 transition-colors"
                >
                  {state.cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={cn('flex-1 px-4 py-2.5 font-medium rounded-xl transition-colors', currentVariant.confirmBtn)}
                  autoFocus
                >
                  {state.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  )
}

// Standalone confirm function for use without context (fallback to native)
export async function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  // This is a fallback - in production, use the context provider
  return window.confirm(`${options.title}\n\n${options.message}`)
}
