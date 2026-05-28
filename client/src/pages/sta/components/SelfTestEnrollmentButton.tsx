/**
 * SelfTestEnrollmentButton — admin/superadmin/AT kan skapa en koppling till
 * sig själva (som både konsulent och deltagare) för att utforska STA-sidan
 * utan att behöva en separat konsulent.
 *
 * Visas bara om användaren har en testberättigad roll. Efter skapandet:
 *   1. enrollment skapas (participant_id = consultant_id = auth.uid())
 *   2. profile.program sätts till 'steg_till_arbete' om det inte redan är det
 *   3. onCreated anropas så caller kan trigga reload
 */

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Sparkles, CheckCircle2, AlertCircle } from '@/components/ui/icons'
import { useAuthStore, useIsArbetsterapeut, useIsConsultant } from '@/stores/authStore'
import { staEnrollmentsApi } from '@/services/staApi'

interface Props {
  onCreated: () => void | Promise<void>
  /** Visuell variant — kompakt för knappar i tomtillstånd, full för stora banners. */
  variant?: 'compact' | 'full'
}

export function SelfTestEnrollmentButton({ onCreated, variant = 'compact' }: Props) {
  const isAt = useIsArbetsterapeut()
  const isConsultant = useIsConsultant()
  const { profile, updateProfile } = useAuthStore()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Konsulent/AT/admin/superadmin får skapa självkoppling.
  // useIsConsultant täcker CONSULTANT+ADMIN+SUPERADMIN; useIsArbetsterapeut täcker ARBETSTERAPEUT.
  if (!isConsultant && !isAt) return null

  const handleClick = async () => {
    setCreating(true)
    setError(null)
    try {
      await staEnrollmentsApi.createSelfTest()
      // Sätt program-flaggan så sidebar-länken visas (om inte redan satt)
      if (profile?.program !== 'steg_till_arbete') {
        await updateProfile({ program: 'steg_till_arbete' })
      }
      setSuccess(true)
      await onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte skapa testkoppling')
    } finally {
      setCreating(false)
    }
  }

  if (variant === 'full') {
    return (
      <div
        className="p-4 rounded-xl border-2 border-dashed"
        style={{ borderColor: 'var(--c-solid)', background: 'var(--header-bg)' }}
      >
        <div className="flex items-start gap-3 flex-wrap">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
          >
            <Sparkles size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-stone-900">Skapa testkoppling till dig själv</h4>
            <p className="text-xs text-stone-600 mt-0.5">
              Vi kopplar dig som <strong>både konsulent och deltagare</strong> så att du kan
              utforska sidan från båda sidor utan en separat konsulent.
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="primary"
                onClick={handleClick}
                isLoading={creating}
                disabled={success}
                leftIcon={success ? <CheckCircle2 size={12} /> : <Sparkles size={12} />}
              >
                {success ? 'Klar — laddar om…' : 'Skapa testkoppling'}
              </Button>
              {error && (
                <span className="inline-flex items-center gap-1 text-xs text-rose-700">
                  <AlertCircle size={12} />
                  {error}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // compact
  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      <Button
        size="sm"
        variant="primary"
        onClick={handleClick}
        isLoading={creating}
        disabled={success}
        leftIcon={success ? <CheckCircle2 size={14} /> : <Sparkles size={14} />}
      >
        {success ? 'Skapad — laddar om…' : 'Skapa testkoppling till mig själv'}
      </Button>
      {error && (
        <span className="inline-flex items-center gap-1 text-xs text-rose-700">
          <AlertCircle size={12} />
          {error}
        </span>
      )}
    </div>
  )
}
