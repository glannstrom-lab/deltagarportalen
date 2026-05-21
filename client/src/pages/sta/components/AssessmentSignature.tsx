/**
 * AssessmentSignature — visar AT-signatur eller "Signera"-knapp.
 *
 * AF-uppdraget kräver att skattningar (DOA/WRI/MOHOST/AWP/AWC) signeras av
 * en arbetsterapeut innan de räknas som klara. Komponenten:
 *   - visar "Signerad av X den Y" om signed_at finns
 *   - visar "Signera"-knapp om aktuell användare har AT-roll
 *   - visar "Väntar på signatur" om varken
 */

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, Clock, AlertCircle } from '@/components/ui/icons'
import { useIsArbetsterapeut } from '@/stores/authStore'
import { staAssessmentsApi, type StaAssessment } from '@/services/staApi'

interface Props {
  assessment: StaAssessment
  /** Visa kompakt-läge (för listor) eller full-läge (för formulär). */
  compact?: boolean
  onSigned?: (updated: StaAssessment) => void
}

export function AssessmentSignature({ assessment, compact = false, onSigned }: Props) {
  const isAt = useIsArbetsterapeut()
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSigned = !!assessment.signed_at

  const handleSign = async () => {
    setSigning(true)
    setError(null)
    try {
      const updated = await staAssessmentsApi.signByArbetsterapeut(assessment.id)
      onSigned?.(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte signera')
    } finally {
      setSigning(false)
    }
  }

  if (isSigned && compact) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700"
        title={`Signerad ${new Date(assessment.signed_at!).toLocaleString('sv-SE')}`}
      >
        <CheckCircle2 size={11} />
        Signerad
      </span>
    )
  }

  if (isSigned) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
        <CheckCircle2 size={14} className="text-emerald-700" />
        <div className="text-xs">
          <div className="font-medium text-emerald-900">Signerad av arbetsterapeut</div>
          <div className="text-emerald-700">
            {new Date(assessment.signed_at!).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}
          </div>
        </div>
      </div>
    )
  }

  if (compact) {
    if (!isAt) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800">
          <Clock size={11} />
          Väntar på AT
        </span>
      )
    }
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={handleSign}
        isLoading={signing}
        leftIcon={<CheckCircle2 size={12} />}
      >
        Signera
      </Button>
    )
  }

  return (
    <div className="inline-flex items-center gap-3 flex-wrap">
      {!isAt ? (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
          <Clock size={14} className="text-amber-700" />
          <div className="text-xs">
            <div className="font-medium text-amber-900">Väntar på AT-signatur</div>
            <div className="text-amber-700">Endast arbetsterapeut kan signera</div>
          </div>
        </div>
      ) : (
        <Button
          variant="primary"
          size="sm"
          onClick={handleSign}
          isLoading={signing}
          leftIcon={<CheckCircle2 size={14} />}
        >
          Signera skattningen
        </Button>
      )}
      {error && (
        <span className="inline-flex items-center gap-1 text-xs text-rose-700">
          <AlertCircle size={12} />
          {error}
        </span>
      )}
    </div>
  )
}
