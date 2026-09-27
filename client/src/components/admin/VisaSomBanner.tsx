/**
 * Visas när superadmin loggat in som ett demo- eller testkonto via "Visa som"
 * (2026-09-27). Bara i den flik där inloggningen gjordes (sessionStorage), och
 * bara så länge det inloggade kontot är just det kontot.
 *
 * Svenska literaler med flit: bannern ses bara av superadmin (Mikael).
 */

import { useNavigate } from 'react-router-dom'
import { Eye } from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { VISA_SOM_NYCKEL } from '@/services/visaSomApi'

function lasMarkering(): string | null {
  try {
    return sessionStorage.getItem(VISA_SOM_NYCKEL)
  } catch {
    return null
  }
}

export function VisaSomBanner() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()
  const markering = lasMarkering()

  if (!user?.email || !markering || markering.toLowerCase() !== user.email.toLowerCase()) return null

  const avsluta = async () => {
    try {
      sessionStorage.removeItem(VISA_SOM_NYCKEL)
    } catch {
      // sessionStorage kan vara avstängd — utloggningen nedan räcker ändå
    }
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div
      role="status"
      data-testid="visa-som-banner"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm bg-sky-100 text-sky-950 dark:bg-sky-900/40 dark:text-sky-100 border-b border-sky-300 dark:border-sky-700"
    >
      <Eye size={16} aria-hidden="true" className="shrink-0" />
      <p className="m-0 flex-1 min-w-0">
        <span className="font-semibold">Visa som:</span> du ser Jobin som <span className="font-medium break-all">{user.email}</span>
      </p>
      <button
        type="button"
        onClick={avsluta}
        className="rounded-md border border-sky-400 bg-white px-3 py-1 font-medium text-sky-900 hover:bg-sky-50 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-600"
      >
        Avsluta och logga ut
      </button>
    </div>
  )
}
