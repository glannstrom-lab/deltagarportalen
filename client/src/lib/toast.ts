/**
 * Toast notification system
 * Replaces alert() with accessible, non-blocking notifications
 */

import { toast, Toaster } from 'react-hot-toast'

// ============== TOAST TYPES ==============

export type ToastType = 'success' | 'error' | 'loading' | 'info' | 'warning'

export interface ToastOptions {
  duration?: number
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right'
}

// ============== DEFAULT OPTIONS ==============

const DEFAULT_DURATION = {
  success: 3000,
  error: 5000,
  loading: Infinity,
  info: 4000,
  warning: 4000
}

// ============== TOAST FUNCTIONS ==============

export const notifications = {
  /**
   * Show a success toast
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: options?.duration ?? DEFAULT_DURATION.success,
      position: options?.position ?? 'top-center',
      ariaProps: {
        role: 'status',
        'aria-live': 'polite'
      }
    })
  },

  /**
   * Show an error toast
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: options?.duration ?? DEFAULT_DURATION.error,
      position: options?.position ?? 'top-center',
      ariaProps: {
        role: 'alert',
        'aria-live': 'assertive'
      }
    })
  },

  /**
   * Show a loading toast (returns ID for dismissal)
   */
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      duration: options?.duration ?? DEFAULT_DURATION.loading,
      position: options?.position ?? 'top-center',
      ariaProps: {
        role: 'status',
        'aria-live': 'polite'
      }
    })
  },

  /**
   * Show an info toast
   */
  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      duration: options?.duration ?? DEFAULT_DURATION.info,
      position: options?.position ?? 'top-center',
      icon: 'ℹ️',
      ariaProps: {
        role: 'status',
        'aria-live': 'polite'
      }
    })
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast(message, {
      duration: options?.duration ?? DEFAULT_DURATION.warning,
      position: options?.position ?? 'top-center',
      icon: '⚠️',
      style: {
        background: '#FEF3C7',
        color: '#92400E'
      },
      ariaProps: {
        role: 'alert',
        'aria-live': 'polite'
      }
    })
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  },

  /**
   * Promise-based toast (shows loading, then success/error)
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((err: Error) => string)
    }
  ) => {
    return toast.promise(promise, messages, {
      position: 'top-center',
      success: {
        duration: DEFAULT_DURATION.success
      },
      error: {
        duration: DEFAULT_DURATION.error
      }
    })
  }
}

// ============== COMMON NOTIFICATION MESSAGES ==============

export const TOAST_MESSAGES = {
  // Save operations
  SAVE_SUCCESS: 'Ändringar sparade',
  SAVE_ERROR: 'Kunde inte spara. Försök igen.',
  SAVING: 'Sparar...',

  // Import/Export
  IMPORT_SUCCESS: 'Import klar!',
  IMPORT_ERROR: 'Import misslyckades',
  IMPORTING: 'Importerar...',
  EXPORT_SUCCESS: 'Export klar!',
  EXPORT_ERROR: 'Export misslyckades',
  EXPORTING: 'Exporterar...',

  // Upload
  UPLOAD_SUCCESS: 'Uppladdning klar!',
  UPLOAD_ERROR: 'Uppladdning misslyckades',
  UPLOADING: 'Laddar upp...',

  // Delete
  DELETE_SUCCESS: 'Borttaget',
  DELETE_ERROR: 'Kunde inte ta bort',

  // AI
  AI_GENERATING: 'AI genererar...',
  AI_SUCCESS: 'AI-sammanfattning klar!',
  AI_ERROR: 'Kunde inte generera. Försök igen.',

  // Validation
  VALIDATION_ERROR: 'Kontrollera formuläret',

  // Network
  OFFLINE: 'Du är offline. Ändringar sparas när du är online igen.',
  ONLINE: 'Du är online igen!',
  NETWORK_ERROR: 'Nätverksfel. Försök igen.'
}

// ============== TOASTER COMPONENT CONFIG ==============

export { Toaster }

export const TOASTER_CONFIG = {
  position: 'top-center' as const,
  toastOptions: {
    className: 'text-sm font-medium',
    style: {
      padding: '12px 16px',
      borderRadius: '12px'
    },
    success: {
      iconTheme: {
        primary: '#10B981',
        secondary: '#ECFDF5'
      }
    },
    error: {
      iconTheme: {
        primary: '#EF4444',
        secondary: '#FEF2F2'
      }
    }
  }
}
