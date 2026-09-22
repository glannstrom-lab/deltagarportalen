/**
 * Status för ett fel som slunkit ut till en funktions yttre catch (2026-09-22).
 *
 * En motpart som inte svarar i tid (`TidsgransError` från fetchMedTimeout) är
 * en 504 — felet ligger uppströms, och ett nytt försök kan lyckas. Allt annat
 * är vårt eget fel: 500. Innan den här fanns svarade alla fem AI-funktionerna
 * 500 på båda. Vaktat av felstatus.test.ts.
 */

import { TidsgransError } from './fetchMedTimeout.ts'

export function felstatus(err: unknown): { status: 504 | 500; error: string } {
  if (err instanceof TidsgransError) {
    return { status: 504, error: 'Tjänsten svarade inte i tid. Försök igen om en stund.' }
  }
  return { status: 500, error: 'Ett fel uppstod' }
}
