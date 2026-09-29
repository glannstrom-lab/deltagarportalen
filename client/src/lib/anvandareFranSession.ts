/**
 * SFT1 (2026-09-29): den inloggade användaren UTAN en rundresa till auth-servern.
 *
 * `supabase.auth.getUser()` frågar auth-servern varje gång. Klienten gjorde det
 * 284 gånger — oftast bara för att få fram `user.id` till ett `.eq('user_id', …)`
 * — och anropet gav CORS-fel två gånger under det skarpa testet 2026-09-28
 * (SJ3, SKK1), vilket fällde skrivningar som inte hade något med auth att göra.
 *
 * `getSession()` läser sessionen ur localStorage och förnyar token själv när den
 * gått ut. Att id:t kommer från klienten är ingen säkerhetsfråga här: varje
 * fråga går till PostgREST med JWT:n, och RLS avgör vad som får läsas och
 * skrivas utifrån `auth.uid()` på servern — inte utifrån id:t vi skickar.
 *
 * Tokenen verifieras mot servern en gång per sidladdning, i authStore.initialize
 * (som med flit fortfarande anropar getUser). Den ska inte bytas mot den här.
 *
 * Returnerar samma form som getUser() så anropsställena kunde bytas mekaniskt.
 * Finns ingen session faller den tillbaka på getUser(): den som inte är inloggad
 * får samma fel som förut, och prov som bara mockar getUser fortsätter att gälla.
 */
import type { AuthError, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface AnvandarSvar {
  data: { user: User | null }
  error: AuthError | null
}

export async function anvandareFranSession(): Promise<AnvandarSvar> {
  try {
    const svar = await supabase.auth.getSession()
    const user = svar?.data?.session?.user
    if (user && !svar.error) return { data: { user }, error: null }
  } catch {
    // Trasig lagring eller mockad klient utan getSession — fråga servern i stället.
  }
  return supabase.auth.getUser() as Promise<AnvandarSvar>
}
