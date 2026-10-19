/**
 * Visas när superadmin loggat in som ett demo- eller testkonto via "Visa som"
 * (2026-09-27). Bara i den flik där inloggningen gjordes (sessionStorage), och
 * bara så länge det inloggade kontot är just det kontot.
 *
 * Svenska literaler med flit: bannern ses bara av superadmin (Mikael).
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye } from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { demoLage, lasDemoLage, VISA_SOM_NYCKEL, type DemoRoll } from '@/services/visaSomApi'

/**
 * Demoläget (2026-10-19): rollerna som knappar och vägen tillbaka till
 * superadmins eget konto — allt i samma fönster. Se demoLage i visaSomApi.
 */
function DemoRad({ aktuell, ursprung, roller }: { aktuell: string; ursprung: string; roller: DemoRoll[] }) {
  const [arbetar, setArbetar] = useState<string | null>(null)
  const [fel, setFel] = useState<string | null>(null)

  const kor = async (nyckel: string, gor: () => Promise<void>) => {
    setFel(null)
    setArbetar(nyckel)
    try {
      await gor()
    } catch (e) {
      setFel(e instanceof Error ? e.message : 'Något gick fel')
      setArbetar(null)
    }
  }

  return (
    <div
      role="region"
      aria-label="Demoläge"
      data-testid="demo-rad"
      className="flex flex-wrap items-center gap-2 px-4 py-2 text-sm bg-sky-100 text-sky-950 dark:bg-sky-900/40 dark:text-sky-100 border-b border-sky-300 dark:border-sky-700"
    >
      <Eye size={16} aria-hidden="true" className="shrink-0" />
      <span className="font-semibold">Demo:</span>
      {roller.map((r) => {
        const vald = r.email.toLowerCase() === aktuell.toLowerCase()
        return (
          <button
            key={r.id}
            type="button"
            aria-pressed={vald}
            disabled={arbetar !== null || vald}
            onClick={() => kor(r.id, () => demoLage.byt(r))}
            className={
              vald
                ? 'rounded-md border border-sky-700 bg-sky-700 px-3 py-1 font-medium text-white dark:bg-sky-300 dark:text-sky-950'
                : 'rounded-md border border-sky-400 bg-white px-3 py-1 font-medium text-sky-900 hover:bg-sky-50 disabled:opacity-60 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-600'
            }
          >
            {arbetar === r.id ? 'Byter …' : r.etikett}
          </button>
        )
      })}
      <button
        type="button"
        disabled={arbetar !== null}
        onClick={() => kor('tillbaka', () => demoLage.avsluta())}
        className="ml-auto rounded-md border border-sky-700 px-3 py-1 font-medium text-sky-900 hover:bg-sky-50 disabled:opacity-60 dark:text-sky-100 dark:border-sky-400 dark:hover:bg-sky-950"
      >
        {arbetar === 'tillbaka' ? 'Byter …' : `Tillbaka till mitt konto (${ursprung})`}
      </button>
      {fel && (
        <p role="alert" className="basis-full m-0 text-red-800 dark:text-red-200">
          {fel}
        </p>
      )}
    </div>
  )
}

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

  if (!user?.email || !markering) return null

  // DL1 (2026-10-19): inloggningen ligger i localStorage och delas av alla flikar
  // i samma webbläsarprofil — även alla inkognitofönster. Öppnas ett andra Visa
  // som-konto tar det över den här fliken tyst: listorna blev tomma utan fel och
  // raden fortsatte visa det gamla kontot. Säg det i stället för att dölja raden.
  if (markering.toLowerCase() !== user.email.toLowerCase()) {
    return (
      <div
        role="alert"
        data-testid="visa-som-krock"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm bg-amber-100 text-amber-950 dark:bg-amber-900/40 dark:text-amber-100 border-b border-amber-300 dark:border-amber-700"
      >
        <Eye size={16} aria-hidden="true" className="shrink-0" />
        <p className="m-0 flex-1 min-w-0">
          <span className="font-semibold">Ett annat konto har loggats in i den här webbläsaren.</span> Fliken öppnades som{' '}
          <span className="font-medium break-all">{markering}</span> men är nu inloggad som{' '}
          <span className="font-medium break-all">{user.email}</span>. Ladda om sidan, och öppna varje konto i en egen
          webbläsare.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md border border-amber-500 bg-white px-3 py-1 font-medium text-amber-950 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-600"
        >
          Ladda om
        </button>
      </div>
    )
  }

  const avsluta = async () => {
    try {
      sessionStorage.removeItem(VISA_SOM_NYCKEL)
    } catch {
      // sessionStorage kan vara avstängd — utloggningen nedan räcker ändå
    }
    await signOut()
    navigate('/login', { replace: true })
  }

  const demo = lasDemoLage()
  if (demo) return <DemoRad aktuell={user.email} ursprung={demo.ursprungEmail} roller={demo.roller} />

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
