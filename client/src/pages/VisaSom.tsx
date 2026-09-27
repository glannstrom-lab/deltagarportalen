/**
 * /visa-som?t=<token_hash>&e=<email>&till=<sökväg> (2026-09-27)
 *
 * Tar emot en engångsinloggning skapad av edge-funktionen superadmin-visa-som
 * och loggar in som demo-/testkontot i den här fliken. Öppnas normalt i ett
 * privat fönster så att superadmins egen inloggning ligger kvar i det vanliga.
 *
 * Svenska literaler med flit: sidan nås bara via superadmin-panelen.
 */

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { sakerLandning, VISA_SOM_NYCKEL } from '@/services/visaSomApi'

export default function VisaSom() {
  const [params] = useSearchParams()
  const [verifieringsfel, setVerifieringsfel] = useState<string | null>(null)
  const startad = useRef(false)
  const tokenHash = params.get('t')
  const email = params.get('e')
  const fel = !tokenHash || !email
    ? 'Länken saknar inloggningsuppgifter. Skapa en ny i superadmin-panelen.'
    : verifieringsfel

  useEffect(() => {
    if (startad.current || !tokenHash || !email) return
    startad.current = true
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
      .then(({ error }) => {
        if (error) {
          setVerifieringsfel('Länken har redan använts eller gått ut. Skapa en ny i superadmin-panelen.')
          return
        }
        try {
          sessionStorage.setItem(VISA_SOM_NYCKEL, email)
        } catch {
          // utan sessionStorage syns ingen banner, men inloggningen fungerar
        }
        // Full omladdning, inte navigate(): authStore hinner annars inte läsa in
        // den nya sessionen, och PrivateRoute skickar en "gäst" till /register
        // (uppmätt i prod 2026-09-27). Efter omladdningen startar appen som kontot.
        window.location.replace(`${window.location.pathname}#${sakerLandning(params.get('till'))}`)
        window.location.reload()
      })
  }, [params, tokenHash, email])

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 p-6">
      <div className="max-w-md text-center" role="status" aria-live="polite">
        {fel ? (
          <p className="text-stone-800 dark:text-stone-100">{fel}</p>
        ) : (
          <p className="text-stone-700 dark:text-stone-200">Loggar in som demokontot …</p>
        )}
      </div>
    </main>
  )
}
