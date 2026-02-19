import { useState, useEffect, useCallback } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X,
  Loader2
} from 'lucide-react'

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
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    loading: <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
  }

  const styles = {
    success: 'border-l-4 border-green-500 bg-white',
    error: 'border-l-4 border-red-500 bg-white',
    warning: 'border-l-4 border-amber-500 bg-white',
    info: 'border-l-4 border-blue-500 bg-white',
    loading: 'border-l-4 border-teal-500 bg-white'
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

  return (
    <div
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
        <p className="font-semibold text-slate-900">{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-slate-600 mt-1">{toast.message}</p>
        )}
        
        {/* Action button */}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick()
              handleRemove()
            }}
            className="mt-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleRemove}
        className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      {toast.type !== 'loading' && toast.duration !== Infinity && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 rounded-b-xl overflow-hidden">
          <div 
            className="h-full bg-current opacity-20 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

// Toast container and hook
let toastListeners: ((toast: Toast) => void)[] = []

export function toast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast = { ...toast, id }
  
  toastListeners.forEach(listener => listener(newToast as Toast))
  
  return id
}

export function dismissToast(_id: string) {
  // Implementation would require storing toast IDs
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (newToast: Toast) => {
      setToasts(prev => [...prev, newToast])
    }
    
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener)
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
