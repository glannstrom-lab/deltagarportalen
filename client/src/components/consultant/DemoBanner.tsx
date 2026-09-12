import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlaskConical } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { orgApi } from '@/services/orgApi'

/**
 * Banner för demoorganisationen (KM12 (8), 2026-09-12).
 *
 * Visas när den inloggade användaren är medlem i en organisation med
 * `organizations.is_demo = true` — demokontot som står öppet på
 * /for-arbetsmarknadsenheter/. Den går inte att stänga: den som provar demot
 * ska hela tiden se att personerna är påhittade och att allt återställs.
 *
 * Läser medlemskapen en gång per inloggning via `orgApi.myMemberships()`.
 * `is_demo` finns i `organizations` sedan migration 20260912190000 men inte i
 * `Organization`-typen (orgApi.ts ägs inte av det här passet) — därför en
 * smal lokal typ. Fail closed åt "ingen banner": ett uppslagsfel får inte
 * blockera en riktig konsulent.
 */
type MedlemskapMedDemo = { organization?: { is_demo?: boolean } | null }

export function DemoBanner() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [arDemo, setArDemo] = useState(false)

  useEffect(() => {
    let avbruten = false
    if (!user?.id) {
      setArDemo(false)
      return
    }
    // Personal: organization_members. Deltagare: vyn my_ai_policy (kedjan
    // consultant_participants → organization_members → organizations, is_demo sedan
    // 20260913003000). Persona-fynd PG26: bannern syntes inte för demodeltagaren.
    Promise.all([
      orgApi.myMemberships().catch(() => [] as unknown[]),
      supabase.from('my_ai_policy').select('is_demo').then((r) => (r.data ?? []) as { is_demo?: boolean | null }[]),
    ])
      .then(([rader, policy]) => {
        if (avbruten) return
        const personal = (rader as MedlemskapMedDemo[]).some((r) => r.organization?.is_demo === true)
        const deltagare = policy.some((p) => p.is_demo === true)
        setArDemo(personal || deltagare)
      })
      .catch(() => {
        if (!avbruten) setArDemo(false)
      })
    return () => {
      avbruten = true
    }
  }, [user?.id])

  if (!arDemo) return null

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="demo-banner"
      className="flex items-start gap-2.5 px-4 py-2 text-sm bg-amber-100 text-amber-950 dark:bg-amber-900/40 dark:text-amber-100 border-b border-amber-300 dark:border-amber-700"
    >
      <FlaskConical size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
      <p className="m-0">
        <span className="font-semibold">{t('demo.bannerKort')}</span>
        <span className="hidden sm:inline"> — {t('demo.banner')}</span>
      </p>
    </div>
  )
}
