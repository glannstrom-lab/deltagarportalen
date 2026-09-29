/**
 * Klientanropet mot /api/cv-pdf. SV2 (rollspel 2026-09-28): första exporten
 * efter en kall start kunde ge 500 (Chromium hämtas då) och omförsöket
 * fungerade. Ett automatiskt omförsök vid 5xx/nätverksfel, och om det också
 * faller kastas ett fel med läsbar text som anroparen visar — aldrig tyst.
 */
import { supabase } from '@/lib/supabase'

export const CV_PDF_FEL = 'Kunde inte skapa PDF:en just nu. Försök igen om en stund.'
const PAUS_MS = 1500

const vila = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function generateServerCV(template: string, versionId?: string, paus = PAUS_MS): Promise<Blob> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Du måste vara inloggad för att exportera CV.')

  const anropa = () => fetch('/api/cv-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(versionId ? { template, versionId } : { template }),
  })

  let res: Response | null = null
  for (let forsok = 0; forsok < 2; forsok++) {
    try {
      res = await anropa()
    } catch {
      res = null // nätverksfel
    }
    if (res && res.status < 500) break
    if (forsok === 0) await vila(paus)
  }

  if (!res) throw new Error(CV_PDF_FEL)
  if (!res.ok) {
    let msg = res.status >= 500 ? CV_PDF_FEL : 'PDF-generering misslyckades'
    if (res.status < 500) {
      try {
        const err = await res.json()
        if (err?.error) msg = err.error
      } catch { /* ignore */ }
    }
    throw new Error(msg)
  }

  return await res.blob()
}
