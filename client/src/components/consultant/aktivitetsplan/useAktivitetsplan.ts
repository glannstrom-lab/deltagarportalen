/**
 * useAktivitetsplan — deltagarens aktivitetsplan, passen och underlagen, med
 * handlingarna som ändrar dem (lyft ur AktivitetsplanSektion i omtaget
 * "Kvarter", steg 5, 2026-10-11).
 *
 * Varför en hook: deltagarsidans huvud behöver planen för "läget", Mer-menyn
 * ("Plan som PDF", "Avsluta plan") och veckan på Översikt — samtidigt som
 * Aktivitet-fliken visar den i detalj. Sidan hämtar EN gång och skickar
 * styrningen vidare; fristående (testerna) hämtar sektionen själv.
 *
 * Tre lägen: laddar / fel / klart. Underlagen är en egen tabell (F10): går de
 * inte att läsa visas planen ändå, med felraden synlig — aldrig tyst.
 */
import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { downloadAktivitetsplanPDF } from '@/services/aktivitetsplanPdf'
import { orgApi } from '@/services/orgApi'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { notifications } from '@/lib/toast'
import { aktivitetsplanApi, underlagApi, type ActivityPlan, type ActivitySession, type PlanHandover } from '@/services/aktivitetApi'
import { regelverkForPlan, type Regelverk } from '../orgTypVisning'

export type PlanLage =
  | { status: 'laddar' }
  | { status: 'fel'; fel: string }
  | { status: 'klart'; plan: ActivityPlan | null; sessions: ActivitySession[]; underlag: PlanHandover[]; underlagFel: string | null }

export interface AktivitetsplanStyrning {
  lage: PlanLage
  /** Laddar-läge och en ny hämtning. */
  ladda: () => void
  ersattPlan: (p: ActivityPlan) => void
  ersattSession: (s: ActivitySession) => void
  /** Nytt eller ångrat underlag in i listan; planens synkade datum speglas lokalt. */
  taEmotUnderlag: (h: PlanHandover) => void
  /**
   * Regelverket för planen. `null` medan medlemskapen laddar — anroparen
   * avgör vad som gäller då (Aktivitet-fliken visar kommunens vy, som förut).
   */
  regelverk: Regelverk | null
  /** Bekräftelse, sedan avslut. Planen och passen finns kvar som underlag. */
  avslutaPlan: () => Promise<void>
  laddaNerPdf: () => Promise<void>
  pdfLaddar: boolean
}

export function useAktivitetsplan(participantId: string, participantName: string, aktiv = true): AktivitetsplanStyrning {
  const { confirm } = useConfirmDialog()
  const profile = useAuthStore((s) => s.profile)
  const [lage, setLage] = useState<PlanLage>({ status: 'laddar' })
  const [omgang, setOmgang] = useState(0)
  const [pdfLaddar, setPdfLaddar] = useState(false)
  // RR2: försörjningshinder, underlag och socialnämnden är kommunens regelverk.
  // Samma nyckel och form som AnalyticsTab och useRegelverk (en nyckel = en form).
  const medlemskapQ = useQuery({ queryKey: ['org-medlemskap'], queryFn: () => orgApi.myMemberships(), staleTime: 5 * 60_000 })

  // KV1: byts deltagaren får förra deltagarens plan inte stå kvar medan den nya hämtas.
  // Härlett under render (inte i effekten), samma mönster som Tidslinje.
  const [forraId, setForraId] = useState(participantId)
  if (participantId !== forraId) {
    setForraId(participantId)
    setLage({ status: 'laddar' })
  }

  // Hämtningen skriver tillstånd först efter await — inget setState synkront i effekten.
  useEffect(() => {
    if (!aktiv) return
    let pagaende = true
    ;(async () => {
      try {
        const plan = await aktivitetsplanApi.getForParticipant(participantId)
        const sessions = plan ? await aktivitetsplanApi.listAllSessions(plan.id) : []
        let underlag: PlanHandover[] = []
        let underlagFel: string | null = null
        if (plan) {
          try {
            underlag = await underlagApi.list(plan.id)
          } catch (err) {
            underlagFel = err instanceof Error ? err.message : 'Underlagen kunde inte hämtas'
          }
        }
        if (pagaende) setLage({ status: 'klart', plan, sessions, underlag, underlagFel })
      } catch (err) {
        if (pagaende) setLage({ status: 'fel', fel: err instanceof Error ? err.message : 'Planen kunde inte hämtas.' })
      }
    })()
    return () => { pagaende = false }
  }, [participantId, omgang, aktiv])

  const ladda = useCallback(() => {
    setLage({ status: 'laddar' })
    setOmgang((n) => n + 1)
  }, [])

  const ersattPlan = useCallback((p: ActivityPlan) => {
    setLage((prev) => (prev.status === 'klart' ? { ...prev, plan: p } : prev))
  }, [])

  const ersattSession = useCallback((s: ActivitySession) => {
    setLage((prev) => prev.status === 'klart'
      ? { ...prev, sessions: prev.sessions.map((x) => (x.id === s.id ? s : x)) }
      : prev)
  }, [])

  const taEmotUnderlag = useCallback((h: PlanHandover) => {
    setLage((prev) => {
      if (prev.status !== 'klart' || !prev.plan) return prev
      const utanDenna = prev.underlag.filter((u) => u.id !== h.id)
      const underlag = [h, ...utanDenna].sort((a, b) => (a.handed_over_at < b.handed_over_at ? 1 : -1))
      const senaste = underlag.find((u) => !u.withdrawn_at)
      const datum = senaste ? new Date(senaste.handed_over_at).toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' }) : null
      return { ...prev, underlag, plan: { ...prev.plan, nedsattning_underlag_lamnat_at: datum } }
    })
  }, [])

  const plan = lage.status === 'klart' ? lage.plan : null
  const regelverk: Regelverk | null = medlemskapQ.isSuccess
    ? regelverkForPlan(medlemskapQ.data, plan?.org_id)
    : medlemskapQ.isError ? 'kommun' : null

  const avslutaPlan = async () => {
    if (!plan) return
    const ok = await confirm({
      title: 'Avsluta aktivitetsplanen?',
      message: 'Planen markeras som avslutad. Passen och närvaron finns kvar som underlag.',
      confirmText: 'Avsluta plan',
      cancelText: 'Avbryt',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await aktivitetsplanApi.end(plan.id)
      notifications.success('Planen är avslutad')
      ladda()
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Planen kunde inte avslutas')
    }
  }

  const laddaNerPdf = async () => {
    if (lage.status !== 'klart' || !lage.plan) return
    const { plan: p, sessions } = lage
    setPdfLaddar(true)
    try {
      // Organisationsnamnet ur konsulentens medlemskap, matchat mot planens org_id.
      // Går hämtningen fel skrivs "-" i PDF:en — namnet är inte värt att fälla utskriften för.
      const organizationName = p.org_id
        ? await orgApi.myMemberships().then((m) => m.find((x) => x.org_id === p.org_id)?.organization.name ?? null).catch(() => null)
        : null
      await downloadAktivitetsplanPDF({
        regelverk: medlemskapQ.isSuccess ? regelverkForPlan(medlemskapQ.data, p.org_id) : undefined,
        plan: p,
        sessions,
        participantName,
        consultantName: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Arbetskonsulent',
        organizationName,
      })
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'PDF:en kunde inte skapas')
    } finally {
      setPdfLaddar(false)
    }
  }

  return { lage, ladda, ersattPlan, ersattSession, taEmotUnderlag, regelverk, avslutaPlan, laddaNerPdf, pdfLaddar }
}
