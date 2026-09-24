/** Intresseguiden: pågående test (interest_guide_progress) och historik (interest_guide_history). */

import { supabase } from '@/lib/supabase'
import { storageLogger } from '@/lib/logger'
import { getCurrentUser, handleStorageError, kastaLagringsFel } from './_shared'
import { registreraRensning } from '@/lib/rensaVidUtloggning'
// Typerna för intresseguidens profiler. `Record<string, number>` stod här och
// gav fyra TS2322 i TestTab: ett interface är inte tilldelningsbart till
// Record<string, number> eftersom det saknar indexsignatur. interestGuideData
// importerar inget härifrån, så ingen cirkel uppstår.
import type {
  RiasecScores,
  BigFiveScores,
  ICFScores,
  StrongInterestCategories,
} from '../interestGuideData'

interface InterestGuideAnswers {
  [key: string]: unknown
}

// ============================================
// INTRESSEGUIDE
// ============================================

export interface InterestGuideHistoryEntry {
  id: string
  user_id: string
  answers: Record<string, number>
  riasec_profile: Record<string, number>
  bigfive_profile: Record<string, number>
  icf_profile: Record<string, number>
  strong_interest: Record<string, number>
  top_occupations: Array<{ name: string; matchPercentage: number }>
  completed_at: string
  created_at: string
}

type SparadProgress = {
  current_step?: number
  answers?: InterestGuideAnswers
  energy_level?: string
  is_completed?: boolean
}

/** Hur länge autosparningen väntar på nästa ändring innan den skriver. */
export const SPAR_FORDROJNING_MS = 800

/**
 * Kö för `saveProgress` på modulnivå — inte i komponenten, så en väntande
 * sparning överlever att TestTab avmonteras (sidbyte i appen).
 */
const spar: {
  vantande: SparadProgress | null
  lyssnare: Array<(ok: boolean) => void>
  timer: ReturnType<typeof setTimeout> | null
  pagaende: Promise<boolean> | null
} = { vantande: null, lyssnare: [], timer: null, pagaende: null }

async function skrivProgress(progress: SparadProgress): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      storageLogger.debug('Ingen användare inloggad - intresseguide sparas inte')
      return false
    }

    const { error } = await supabase
      .from('interest_guide_progress')
      .upsert({
        user_id: user.id,
        ...progress,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      handleStorageError(error, 'spara intresseguide')
      return false
    }
    return true
  } catch (err) {
    handleStorageError(err, 'spara intresseguide')
    return false
  }
}

/** Skriver det senaste väntande värdet — aldrig parallellt med en pågående skrivning. */
async function tomKon(): Promise<boolean> {
  // Vänta ut en pågående skrivning; den som kom in under tiden skrivs efter.
  while (spar.pagaende) {
    await spar.pagaende
  }
  const progress = spar.vantande
  const lyssnare = spar.lyssnare
  if (!progress) return true
  spar.vantande = null
  spar.lyssnare = []
  const skrivning = skrivProgress(progress)
  spar.pagaende = skrivning
  const ok = await skrivning
  spar.pagaende = null
  lyssnare.forEach((l) => l(ok))
  return ok
}

function avbrytVantande() {
  if (spar.timer) clearTimeout(spar.timer)
  spar.timer = null
  const lyssnare = spar.lyssnare
  spar.vantande = null
  spar.lyssnare = []
  lyssnare.forEach((l) => l(false))
}

// Stängd flik / sidbyte utanför appen: skriv det som väntar (bästa försök).
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    void interestGuideApi.flushProgress()
  })
}

// Utloggning: en väntande sparning hör till den som gjorde den.
registreraRensning(avbrytVantande)

export const interestGuideApi = {
  async getProgress() {
    const user = await getCurrentUser()
    if (!user) {
      storageLogger.debug('Ingen användare inloggad - kan inte hämta intresseguide')
      return null
    }

    // E11 (2026-07-23): explicit kolumnlista.
    // `updated_at` tillagd 2026-08-21: `useInterestProfile:280,293` och
    // `QuestionCard:36` läste redan fältet, men det hämtades aldrig — så
    // `completedAt` var alltid null i fallback-grenen. `lint:schema` ser inget
    // fel eftersom kolumnen finns i tabellen; den fattas bara i select-listan.
    const { data, error } = await supabase
      .from('interest_guide_progress')
      .select('answers, current_step, is_completed, updated_at')
      .eq('user_id', user.id)
      .maybeSingle()

    /*
      KASTAR vid annat än "ingen rad". Tidigare loggades felet och `null`
      returnerades — och varje anropare tolkar `null` som "användaren har inte
      gjort testet". Ett RLS-fel eller ett nätverksglapp blev alltså
      "Genomför testet först" för någon som gjort det, och i TestTab dessutom
      startpunkten för ett nytt test som upsertade över de sparade svaren.
      (Granskning 2026-08-21.)
    */
    if (error && error.code !== 'PGRST116') {
      storageLogger.error('Error getting interest guide progress:', { error })
      throw error
    }
    return data || null
  },

  /**
   * Returnerar `true` bara om raden faktiskt skrevs.
   *
   * Funktionen kunde tidigare inte misslyckas: `handleStorageError` är
   * `void`-typad och kastar aldrig, så `await saveProgress(...)` löstes alltid
   * ut. TestTabs `catch` var därmed oåtkomlig för databasfel, och den gröna
   * bocken **"Sparat"** visades även när ingenting sparats. För en målgrupp
   * vars ork räcker till ett försök var det den dyraste buggen på sidan.
   * Mönstret följer `integrationChecklistApi.saveProgress`.
   *
   * 2026-09-22 (kvalitetsgenomgången): TestTab sparar vid VARJE ändring —
   * 4 516 skrivningar i prod — och upsert:arna gick parallellt. Kom en äldre
   * fram sist skrev den över nyare svar; värst när en autosparning med
   * `is_completed: false` landade efter "Visa resultat" och gjorde ett klart
   * test oklart igen. Nu: vänta {@link SPAR_FORDROJNING_MS} på fler ändringar,
   * skriv bara den senaste, aldrig två samtidigt, och `is_completed: true`
   * skrivs direkt (efter en pågående skrivning). Alla väntande anrop får
   * utfallet av skrivningen som ersatte dem.
   */
  saveProgress(progress: SparadProgress): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      spar.vantande = progress
      spar.lyssnare.push(resolve)
      if (spar.timer) clearTimeout(spar.timer)
      spar.timer = null
      if (progress.is_completed) {
        void tomKon()
      } else {
        spar.timer = setTimeout(() => {
          spar.timer = null
          void tomKon()
        }, SPAR_FORDROJNING_MS)
      }
    })
  },

  /** Skriv det som väntar nu (sidbyte, stängd flik). Kastar aldrig. */
  flushProgress(): Promise<boolean> {
    if (spar.timer) clearTimeout(spar.timer)
    spar.timer = null
    return spar.vantande ? tomKon() : Promise.resolve(true)
  },

  async reset() {
    // En väntande autosparning får inte återskapa raden efter "Börja om".
    avbrytVantande()
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await supabase
      .from('interest_guide_progress')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      handleStorageError(error, 'återställa intresseguide')
    }
  },

  // ===== HISTORIK =====
  async saveToHistory(historyEntry: {
    answers: Record<string, number>
    riasec_profile: RiasecScores
    bigfive_profile: BigFiveScores
    /** null när hälsosamtycke saknas — ICF-delen är art. 9-data. */
    icf_profile: ICFScores | null
    strong_interest: StrongInterestCategories
    top_occupations: Array<{ name: string; matchPercentage: number }>
  }) {
    const user = await getCurrentUser()
    if (!user) {
      storageLogger.debug('Ingen användare inloggad - historik sparas inte')
      return null
    }

    const { data, error } = await supabase
      .from('interest_guide_history')
      .insert({
        user_id: user.id,
        ...historyEntry,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      handleStorageError(error, 'spara intresseguide-historik')
      return null
    }
    return data
  },

  async getHistory(limit: number = 10): Promise<InterestGuideHistoryEntry[]> {
    const user = await getCurrentUser()
    if (!user) {
      return []
    }

    // E11 (2026-07-23): explicit kolumnlista — matchar exakt InterestGuideHistoryEntry
    // (returtypen konsumenterna typas mot).
    const { data, error } = await supabase
      .from('interest_guide_history')
      .select('id, user_id, answers, riasec_profile, bigfive_profile, icf_profile, strong_interest, top_occupations, completed_at, created_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(limit)

    /*
      KASTAR vid läsfel (2026-09-24), som getProgress ovan. Ett fel blev
      tidigare `[]`, och HistoryTab visade då "inga tidigare resultat" — trots
      att sidan har ett eget felkort (`interestGuide.history.errorLoading`)
      och en uttrycklig ordning laddar → fel → tomt → data. ResultsTab har
      samma felväg. Båda fångar kastet.
    */
    if (error) kastaLagringsFel(error, 'hämta intresseguide-historik')
    return data || []
  },

  async getHistoryEntry(id: string): Promise<InterestGuideHistoryEntry | null> {
    const user = await getCurrentUser()
    if (!user) return null

    // E11 (2026-07-23): explicit kolumnlista — samma som getHistory ovan.
    const { data, error } = await supabase
      .from('interest_guide_history')
      .select('id, user_id, answers, riasec_profile, bigfive_profile, icf_profile, strong_interest, top_occupations, completed_at, created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      handleStorageError(error, 'hämta historikpost')
      return null
    }
    return data
  },
  // getHistoryCount raderad 2026-09-22: noll anropare, och den gjorde ett
  // läsfel till 0 (samma klass som D11). Behövs ett antal igen — kasta vid fel.
}
