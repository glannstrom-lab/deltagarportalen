/**
 * RevokeConsultantLinkSection — Deltagaren säger upp kopplingen till sin konsulent.
 *
 * Visar:
 *   - Aktivt samtycke (datum, scope) om det finns
 *   - "Säg upp kopplingen"-knapp
 *   - Bekräftelsedialog som beskriver konsekvenser
 *
 * Mjuk uppsägning enligt designval: inskickade dokument bevaras för AF-arkivkrav.
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ShieldCheck, X, Loader2 } from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { datumSprak } from '@/lib/datumsprak'
import { konsulentKopplingApi, consultantConsentsApi, type ConsultantConsent } from '@/services/konsulentKopplingApi'

interface RevokeConsultantLinkSectionProps {
  consultantId: string
  consultantName: string
  onRevoked: () => void
}

export function RevokeConsultantLinkSection({
  consultantId,
  consultantName,
  onRevoked,
}: RevokeConsultantLinkSectionProps) {
  const { t, i18n } = useTranslation()
  const [consent, setConsent] = useState<ConsultantConsent | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let active = true
    consultantConsentsApi.getActive(consultantId).then((c) => {
      if (active) setConsent(c)
    })
    return () => {
      active = false
    }
  }, [consultantId])

  return (
    <>
      <Card padding="md" className="border border-stone-200">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-stone-500" />
              {t('myConsultant.revoke.title')}
            </h3>
            <p className="text-sm text-stone-600 mt-1">
              {t('myConsultant.revoke.description', { namn: consultantName })}
            </p>
            {consent && (
              <p className="text-xs text-stone-500 mt-2">
                {t('myConsultant.revoke.consentGiven')}{' '}
                <time dateTime={consent.granted_at}>
                  {new Date(consent.granted_at).toLocaleDateString(datumSprak(i18n.language), {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                {consent.program === 'steg_till_arbete' && ' · Steg till arbete'}
              </p>
            )}
          </div>
          {/* MB3: konsekvensrik handling — md, inte sm (12 px text på mobil). */}
          <Button variant="secondary" size="md" onClick={() => setOpen(true)}>
            {t('myConsultant.revoke.title')}
          </Button>
        </div>
      </Card>

      {open && (
        <RevokeConfirmDialog
          consultantName={consultantName}
          consultantId={consultantId}
          onClose={() => setOpen(false)}
          onRevoked={() => {
            setOpen(false)
            onRevoked()
          }}
        />
      )}
    </>
  )
}

function RevokeConfirmDialog({
  consultantId,
  consultantName,
  onClose,
  onRevoked,
}: {
  consultantId: string
  consultantName: string
  onClose: () => void
  onRevoked: () => void
}) {
  const { t } = useTranslation()
  const [confirmText, setConfirmText] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bekräftelseordet följer språket. Det svenska ordet godtas alltid, så den
  // som bytt språk mitt i dialogen inte låses ute.
  const bekraftelseord = t('myConsultant.revoke.confirmWord')
  const skrivet = confirmText.trim().toLowerCase()
  const canConfirm = skrivet === bekraftelseord.toLowerCase() || skrivet === 'säg upp'

  const handleConfirm = async () => {
    if (!canConfirm) return
    setSubmitting(true)
    setError(null)
    try {
      await konsulentKopplingApi.revokeConsultantLink(consultantId, reason.trim() || undefined)
      onRevoked()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('myConsultant.revoke.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
        aria-label={t('common.close')}
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              {t('myConsultant.revoke.title')}
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              {t('myConsultant.revoke.dialogIntro', { namn: consultantName })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
            <p className="font-medium mb-2">{t('myConsultant.revoke.consequencesTitle')}</p>
            <ul className="space-y-1 list-disc list-inside text-amber-900">
              <li>{t('myConsultant.revoke.consequenceActivity', { namn: consultantName })}</li>
              <li>{t('myConsultant.revoke.consequenceSta')}</li>
              <li>{t('myConsultant.revoke.consequenceDrafts')}</li>
              <li>{t('myConsultant.revoke.consequenceSubmitted')}</li>
              <li>{t('myConsultant.revoke.consequenceOwnData')}</li>
            </ul>
          </div>

          <div>
            <label htmlFor="revoke-reason" className="block text-sm font-medium text-stone-700 mb-1">
              {t('myConsultant.revoke.reasonLabel')}
            </label>
            <textarea
              id="revoke-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder={t('myConsultant.revoke.reasonPlaceholder')}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 resize-y"
            />
            <p className="text-xs text-stone-500 mt-1">
              {t('myConsultant.revoke.reasonVisibility', { namn: consultantName })}
            </p>
          </div>

          <div>
            <label htmlFor="revoke-confirm" className="block text-sm font-medium text-stone-700 mb-1">
              {t('myConsultant.revoke.confirmBefore')} <strong>{bekraftelseord}</strong> {t('myConsultant.revoke.confirmAfter')}
            </label>
            <input
              id="revoke-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-2 bg-stone-50">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || submitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('myConsultant.revoke.submitting')}
              </>
            ) : (
              t('myConsultant.revoke.confirmButton')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
