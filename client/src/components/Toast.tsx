/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + context/konstant/helper-export */
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X,
  Loader2
} from '@/components/ui/icons'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const { t } = useTranslation()
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    loading: <Loader2 className="w-5 h-5 text-[var(--c-solid)] animate-spin" />
  }

  const styles = {
    success: 'border-l-4 border-green-500 bg-white',
    error: 'border-l-4 border-red-500 bg-white',
    warning: 'border-l-4 border-amber-500 bg-white',
    info: 'border-l-4 border-blue-500 bg-white',
    loading: 'border-l-4 border-[var(--c-solid)] bg-white'
  }

  useEffect(() => {
    if (toast.type === 'loading' || toast.duration === Infinity) return

    const duration = toast.duration || 5000
    const interval = 100
    const step = (interval / duration) * 100

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= step) {
          handleRemove()
          return 0
        }
        return prev - step
      })
    }, interval)

    return () => clearInterval(timer)
  }, [toast.duration, toast.type])

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(toast.id), 300)
  }

  // Determine aria-live based on toast type (errors are assertive, others polite)
  const ariaLive = toast.type === 'error' ? 'assertive' : 'polite'
  const ariaRole = toast.type === 'error' ? 'alert' : 'status'

  return (
    <div
      role={ariaRole}
      aria-live={ariaLive}
      aria-atomic="true"
      className={`
        relative flex items-start gap-3 p-4 rounded-xl shadow-lg
        transform transition-all duration-300 min-w-[320px] max-w-md
        ${styles[toast.type]}
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        animate-slide-in-right
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-900">{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-stone-600 mt-1">{toast.message}</p>
        )}
        
        {/* Action button */}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick()
              handleRemove()
            }}
            className="mt-2 text-sm font-medium text-[var(--c-text)] hover:text-[var(--c-text)] transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleRemove}
        aria-label={t('toast.aria.closeMessage', 'Stäng meddelande')}
        className="flex-shrink-0 p-1 text-stone-600 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Progress bar */}
      {toast.type !== 'loading' && toast.duration !== Infinity && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-100 rounded-b-xl overflow-hidden">
          <div 
            className="h-full bg-current opacity-20 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

// Toast container and hook.
//
// Registret på modulnivå är det som gör att `showToast` och adaptern i
// `lib/toast.ts` (`notifications.*`) kan anropas utanför React — ur stores,
// services och händelsehanterare — och ändå ritas av den ENDA monterade
// <ToastContainer/> i Layout.tsx. KA1 (2026-09-08): react-hot-toast är borta.
let toastListeners: ((toast: Toast) => void)[] = []
let dismissListeners: ((id?: string) => void)[] = []

export function toast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast = { ...toast, id }
  
  toastListeners.forEach(listener => listener(newToast as Toast))
  
  return id
}

/**
 * Stäng en toast via dess id, eller alla om id utelämnas. Det är den här
 * vägen laddningstoasts ("Laddar upp…", duration Infinity) stängs på.
 */
export function dismissToast(id?: string) {
  dismissListeners.forEach(listener => listener(id))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (newToast: Toast) => {
      setToasts(prev => [...prev, newToast])
    }
    
    const dismissListener = (id?: string) => {
      setToasts(prev => (id === undefined ? [] : prev.filter(t => t.id !== id)))
    }

    toastListeners.push(listener)
    dismissListeners.push(dismissListener)
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener)
      dismissListeners = dismissListeners.filter(l => l !== dismissListener)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  )
}

// Convenience methods
export const showToast = {
  success: (title: string, message?: string) => {
    toast({ type: 'success', title, message })
  },
  error: (title: string, message?: string) => {
    toast({ type: 'error', title, message, duration: 8000 })
  },
  warning: (title: string, message?: string) => {
    toast({ type: 'warning', title, message })
  },
  info: (title: string, message?: string) => {
    toast({ type: 'info', title, message })
  },
  loading: (title: string, message?: string) => {
    return toast({ type: 'loading', title, message, duration: Infinity })
  },
  custom: (toastData: Omit<Toast, 'id'>) => {
    return toast(toastData)
  }
}
