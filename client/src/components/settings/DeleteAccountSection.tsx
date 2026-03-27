/**
 * Delete Account Section
 * GDPR Art. 17 - Right to erasure ("right to be forgotten")
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Trash2,
  Download,
  Clock,
  XCircle,
  CheckCircle,
  Loader2,
  ShieldAlert,
  FileDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface DeletionStatus {
  has_pending_request: boolean
  request_id?: string
  requested_at?: string
  scheduled_at?: string
  days_remaining?: number
}

export function DeleteAccountSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signOut, profile } = useAuthStore()

  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showImmediateDialog, setShowImmediateDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load deletion status on mount
  useEffect(() => {
    loadDeletionStatus()
  }, [])

  const loadDeletionStatus = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.rpc('get_deletion_status')

      if (error) throw error

      if (data?.success) {
        setDeletionStatus(data)
      }
    } catch (err) {
      console.error('Error loading deletion status:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Export user data (GDPR Art. 20)
  const handleExportData = async () => {
    try {
      setIsExporting(true)
      setError(null)

      const { data, error } = await supabase.rpc('export_user_data')

      if (error) throw error

      if (data?.success) {
        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `jobin-data-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setSuccess(t('settings.deleteAccount.exportSuccess'))
      }
    } catch (err) {
      console.error('Error exporting data:', err)
      setError(t('settings.deleteAccount.exportError'))
    } finally {
      setIsExporting(false)
    }
  }

  // Request account deletion with grace period
  const handleRequestDeletion = async () => {
    try {
      setIsDeleting(true)
      setError(null)

      const { data, error } = await supabase.rpc('request_account_deletion', {
        p_reason: deleteReason || null,
        p_grace_period_days: 14
      })

      if (error) throw error

      if (data?.success) {
        setShowConfirmDialog(false)
        setDeletionStatus({
          has_pending_request: true,
          scheduled_at: data.scheduled_at,
          days_remaining: data.grace_period_days
        })
        setSuccess(t('settings.deleteAccount.requestSuccess'))
      } else {
        throw new Error(data?.error || 'Unknown error')
      }
    } catch (err: any) {
      console.error('Error requesting deletion:', err)
      setError(err.message || t('settings.deleteAccount.requestError'))
    } finally {
      setIsDeleting(false)
    }
  }

  // Cancel pending deletion
  const handleCancelDeletion = async () => {
    try {
      setIsCancelling(true)
      setError(null)

      const { data, error } = await supabase.rpc('cancel_account_deletion')

      if (error) throw error

      if (data?.success) {
        setDeletionStatus({ has_pending_request: false })
        setSuccess(t('settings.deleteAccount.cancelSuccess'))
      }
    } catch (err) {
      console.error('Error cancelling deletion:', err)
      setError(t('settings.deleteAccount.cancelError'))
    } finally {
      setIsCancelling(false)
    }
  }

  // Immediate deletion (skip grace period)
  const handleImmediateDeletion = async () => {
    if (confirmText !== 'RADERA') {
      setError(t('settings.deleteAccount.confirmTextError'))
      return
    }

    try {
      setIsDeleting(true)
      setError(null)

      // Get current session for the auth token
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      if (!accessToken) {
        throw new Error('No active session')
      }

      // Step 1: Delete profile data via RPC
      const { data, error } = await supabase.rpc('execute_account_deletion_immediate')

      if (error) throw error

      if (data?.success) {
        // Step 2: Delete from auth.users via Edge Function
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          )

          const result = await response.json()

          if (!response.ok) {
            // Log but don't fail - profile is already deleted
            console.warn('Auth deletion warning:', result)
          }
        } catch (authErr) {
          // Log but don't fail - profile is already deleted
          console.warn('Auth deletion error:', authErr)
        }

        // Sign out and redirect
        await signOut()
        navigate('/login', {
          state: { message: t('settings.deleteAccount.deletedMessage') }
        })
      }
    } catch (err) {
      console.error('Error deleting account:', err)
      setError(t('settings.deleteAccount.deleteError'))
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Deletion Warning */}
      {deletionStatus?.has_pending_request && (
        <Card className="border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/50">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                {t('settings.deleteAccount.pendingTitle')}
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                {t('settings.deleteAccount.pendingDesc', {
                  date: formatDate(deletionStatus.scheduled_at!),
                  days: deletionStatus.days_remaining
                })}
              </p>
              <div className="flex gap-3 mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancelDeletion}
                  isLoading={isCancelling}
                  className="bg-white dark:bg-stone-800"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('settings.deleteAccount.cancelRequest')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImmediateDialog(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {t('settings.deleteAccount.deleteNow')}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Data Export Section */}
      <Card variant="flat">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <FileDown className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-stone-900 dark:text-stone-100">
              {t('settings.deleteAccount.exportTitle')}
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {t('settings.deleteAccount.exportDesc')}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportData}
              isLoading={isExporting}
              className="mt-3"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('settings.deleteAccount.exportButton')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <div className="pt-6 border-t border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-red-600 dark:text-red-400">
            {t('settings.deleteAccount.dangerZone')}
          </h3>
        </div>

        <Card className="border-2 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-stone-900 dark:text-stone-100">
                {t('settings.deleteAccount.title')}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                {t('settings.deleteAccount.description')}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-stone-600 dark:text-stone-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {t('settings.deleteAccount.willDelete.profile')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {t('settings.deleteAccount.willDelete.cv')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {t('settings.deleteAccount.willDelete.coverLetters')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {t('settings.deleteAccount.willDelete.savedJobs')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {t('settings.deleteAccount.willDelete.activities')}
                </li>
              </ul>

              {!deletionStatus?.has_pending_request && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowConfirmDialog(true)}
                  className="mt-4 border-red-300 text-red-600 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('settings.deleteAccount.requestButton')}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmation Dialog - Request with Grace Period */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-stone-800 rounded-2xl shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                  {t('settings.deleteAccount.confirmTitle')}
                </h2>
              </div>

              <p className="text-stone-600 dark:text-stone-400 mb-4">
                {t('settings.deleteAccount.confirmDesc')}
              </p>

              <div className="p-4 bg-stone-100 dark:bg-stone-700 rounded-xl mb-4">
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  <strong>{t('settings.deleteAccount.gracePeriod')}</strong>{' '}
                  {t('settings.deleteAccount.gracePeriodDesc')}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  {t('settings.deleteAccount.reasonLabel')}
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder={t('settings.deleteAccount.reasonPlaceholder')}
                  className={cn(
                    "w-full px-4 py-3 border rounded-xl resize-none",
                    "bg-white dark:bg-stone-900",
                    "border-stone-200 dark:border-stone-600",
                    "text-stone-900 dark:text-stone-100",
                    "placeholder:text-stone-400"
                  )}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRequestDeletion}
                  isLoading={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {t('settings.deleteAccount.confirmButton')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Immediate Deletion Dialog */}
      {showImmediateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-stone-800 rounded-2xl shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                  <ShieldAlert className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-red-600">
                  {t('settings.deleteAccount.immediateTitle')}
                </h2>
              </div>

              <p className="text-stone-600 dark:text-stone-400 mb-4">
                {t('settings.deleteAccount.immediateDesc')}
              </p>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  {t('settings.deleteAccount.immediateWarning')}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  {t('settings.deleteAccount.typeToConfirm')}
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="RADERA"
                  className={cn(
                    "w-full px-4 py-3 border rounded-xl text-center font-mono text-lg",
                    "bg-white dark:bg-stone-900",
                    "border-stone-200 dark:border-stone-600",
                    "text-stone-900 dark:text-stone-100",
                    confirmText === 'RADERA' && "border-red-500 bg-red-50 dark:bg-red-900/20"
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowImmediateDialog(false)
                    setConfirmText('')
                  }}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImmediateDeletion}
                  disabled={confirmText !== 'RADERA'}
                  isLoading={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-stone-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('settings.deleteAccount.deleteForever')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeleteAccountSection
