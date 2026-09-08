/**
 * Toast notifications — adapter mot det monterade systemet.
 *
 * KA1 (2026-09-08): portalen hade två toastsystem. Den här filen gick via
 * react-hot-toast, som kräver en <Toaster/> — och den fanns bara på
 * profilsidan. De fjorton anroparna av `notifications.*` (fyra konsulentflikar,
 * gruppmeddelandet, rapportutkastet, aktivitetsrapporten, profileStore,
 * profilkomponenterna) visade därför ingenting utanför /profile: anropet gick
 * igenom, ingen ruta ritades. Nu delegerar allt till `components/Toast.tsx`,
 * vars <ToastContainer/> är monterad i Layout.tsx — EN monteringspunkt för
 * hela det inloggade trädet.
 *
 * API:t är oförändrat för anroparna (`success/error/info/warning/loading/
 * dismiss`). Det som försvann var `promise` (noll anropare), `position` i
 * optionsobjektet (ingen anropare skickade options alls; behållaren har fast
 * plats) och exporterna `Toaster`/`TOASTER_CONFIG`.
 *
 * Tillgänglighetskontraktet bor i ToastItem: fel annonseras med role="alert"
 * / aria-live="assertive", allt annat med role="status" / "polite", och
 * laddningstoasts stängs aldrig av sig själva. Vaktat i toast.test.ts.
 *
 * Grind: lib/toast.grind.test.ts — ingen import av react-hot-toast, ingen
 * <Toaster>, exakt en <ToastContainer/>.
 */

import { toast, dismissToast } from '@/components/Toast'

// ============== TOAST TYPES ==============

export type ToastType = 'success' | 'error' | 'loading' | 'info' | 'warning'

export interface ToastOptions {
  /** Millisekunder innan toasten stängs. Laddningstoasts stängs aldrig av sig själva. */
  duration?: number
}

// ============== DEFAULT OPTIONS ==============

const DEFAULT_DURATION = {
  success: 3000,
  error: 5000,
  loading: Infinity,
  info: 4000,
  warning: 4000
} as const

// ============== TOAST FUNCTIONS ==============

export const notifications = {
  /**
   * Show a success toast
   */
  success: (message: string, options?: ToastOptions) =>
    toast({
      type: 'success',
      title: message,
      duration: options?.duration ?? DEFAULT_DURATION.success
    }),

  /**
   * Show an error toast
   */
  error: (message: string, options?: ToastOptions) =>
    toast({
      type: 'error',
      title: message,
      duration: options?.duration ?? DEFAULT_DURATION.error
    }),

  /**
   * Show a loading toast (returns ID for dismissal)
   */
  loading: (message: string, options?: ToastOptions) =>
    toast({
      type: 'loading',
      title: message,
      duration: options?.duration ?? DEFAULT_DURATION.loading
    }),

  /**
   * Show an info toast
   */
  info: (message: string, options?: ToastOptions) =>
    toast({
      type: 'info',
      title: message,
      duration: options?.duration ?? DEFAULT_DURATION.info
    }),

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: ToastOptions) =>
    toast({
      type: 'warning',
      title: message,
      duration: options?.duration ?? DEFAULT_DURATION.warning
    }),

  /**
   * Dismiss a specific toast by ID, or every toast when no ID is given
   */
  dismiss: (toastId?: string) => {
    dismissToast(toastId)
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
