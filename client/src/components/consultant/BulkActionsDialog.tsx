/**
 * BulkActionsDialog - Modal dialog for bulk operations on participants
 * Supports group messaging, tagging, export, and status updates
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  Mail,
  Tag,
  Download,
  UserCheck,
  Users,
  Send,
  Check,
  Loader2,
  FileText,
  FileSpreadsheet,
  AlertCircle,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Participant {
  participant_id: string
  first_name: string
  last_name: string
  email: string
  status: string
}

type BulkActionType = 'message' | 'tag' | 'export' | 'status'

interface BulkActionsDialogProps {
  isOpen: boolean
  onClose: () => void
  actionType: BulkActionType
  selectedParticipants: Participant[]
  onComplete: () => void
}

// Pre-defined message templates
const MESSAGE_TEMPLATES = [
  {
    id: 'checkin',
    title: 'Check-in',
    content: 'Hej! Hur går det med jobbsökningen? Behöver du hjälp med något?',
  },
  {
    id: 'meeting',
    title: 'Mötespåminnelse',
    content: 'Glöm inte vårt kommande möte. Ser fram emot att prata med dig!',
  },
  {
    id: 'cv',
    title: 'CV-påminnelse',
    content: 'Hej! Jag ville bara påminna dig om att uppdatera ditt CV. Jag hjälper dig gärna!',
  },
  {
    id: 'congrats',
    title: 'Uppmuntran',
    content: 'Bra jobbat med dina framsteg! Fortsätt så här!',
  },
]

// Pre-defined tags
const AVAILABLE_TAGS = [
  { id: 'followup', label: 'Behöver uppföljning', color: 'amber' },
  { id: 'priority', label: 'Prioriterad', color: 'rose' },
  { id: 'ready', label: 'Redo för jobb', color: 'emerald' },
  { id: 'interview', label: 'Intervjuträning', color: 'violet' },
  { id: 'cv', label: 'CV-förbättring', color: 'blue' },
  { id: 'motivation', label: 'Motivationsstöd', color: 'orange' },
]

// Status options
const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Aktiv', color: 'emerald' },
  { value: 'INACTIVE', label: 'Inaktiv', color: 'stone' },
  { value: 'ON_HOLD', label: 'Pausad', color: 'amber' },
  { value: 'COMPLETED', label: 'Avslutad', color: 'blue' },
]

export function BulkActionsDialog({
  isOpen,
  onClose,
  actionType,
  selectedParticipants,
  onComplete,
}: BulkActionsDialogProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Message state
  const [messageContent, setMessageContent] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Tag state
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Export state
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')

  // Status state
  const [newStatus, setNewStatus] = useState<string>('ACTIVE')

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLoading(false)
      setSuccess(false)
      setError(null)
      setMessageContent('')
      setSelectedTemplate(null)
      setSelectedTags([])
      setExportFormat('csv')
      setNewStatus('ACTIVE')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelectTemplate = (templateId: string) => {
    const template = MESSAGE_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setMessageContent(template.content)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    )
  }

  const handleSendMessages = async () => {
    if (!messageContent.trim()) {
      setError('Ange ett meddelande')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Send message to each participant
      const messages = selectedParticipants.map(p => ({
        sender_id: user.id,
        receiver_id: p.participant_id,
        content: messageContent.trim(),
        is_read: false,
      }))

      const { error: insertError } = await supabase
        .from('consultant_messages')
        .insert(messages)

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        onComplete()
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Error sending messages:', err)
      setError('Det gick inte att skicka meddelanden')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyTags = async () => {
    if (selectedTags.length === 0) {
      setError('Välj minst en tagg')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Mock implementation - in real app, would update participant tags
      await new Promise(resolve => setTimeout(resolve, 1000))

      // TODO: Implement actual API call to apply tags

      setSuccess(true)
      setTimeout(() => {
        onComplete()
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Error applying tags:', err)
      setError('Det gick inte att lägga till taggar')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    setError(null)

    try {
      // Generate export data
      const exportData = selectedParticipants.map(p => ({
        Namn: `${p.first_name} ${p.last_name}`,
        Email: p.email,
        Status: p.status,
      }))

      if (exportFormat === 'csv') {
        // Create CSV
        const headers = Object.keys(exportData[0]).join(',')
        const rows = exportData.map(row => Object.values(row).join(','))
        const csv = [headers, ...rows].join('\n')

        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `deltagare-export-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        URL.revokeObjectURL(url)
      } else if (exportFormat === 'excel') {
        // For Excel, we'd typically use a library like xlsx
        // For now, export as CSV with .xlsx extension
        const headers = Object.keys(exportData[0]).join('\t')
        const rows = exportData.map(row => Object.values(row).join('\t'))
        const tsv = [headers, ...rows].join('\n')

        const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `deltagare-export-${new Date().toISOString().split('T')[0]}.xlsx`
        link.click()
        URL.revokeObjectURL(url)
      } else if (exportFormat === 'pdf') {
        // PDF export would use jspdf - not yet implemented
        setError('PDF-export kommer snart')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onComplete()
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Error exporting:', err)
      setError('Det gick inte att exportera')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      // Mock implementation - in real app, would update participant statuses
      await new Promise(resolve => setTimeout(resolve, 1000))

      // TODO: Implement actual API call to update status

      setSuccess(true)
      setTimeout(() => {
        onComplete()
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Det gick inte att uppdatera status')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    switch (actionType) {
      case 'message':
        handleSendMessages()
        break
      case 'tag':
        handleApplyTags()
        break
      case 'export':
        handleExport()
        break
      case 'status':
        handleUpdateStatus()
        break
    }
  }

  const getTitle = () => {
    switch (actionType) {
      case 'message': return t('consultant.bulk.sendMessage', 'Skicka gruppmeddelande')
      case 'tag': return t('consultant.bulk.addTags', 'Lägg till taggar')
      case 'export': return t('consultant.bulk.export', 'Exportera deltagare')
      case 'status': return t('consultant.bulk.updateStatus', 'Uppdatera status')
    }
  }

  const getIcon = () => {
    switch (actionType) {
      case 'message': return Mail
      case 'tag': return Tag
      case 'export': return Download
      case 'status': return UserCheck
    }
  }

  const Icon = getIcon()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                {getTitle()}
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {selectedParticipants.length} {t('consultant.bulk.participantsSelected', 'deltagare valda')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="font-medium text-stone-900 dark:text-stone-100">
                {t('consultant.bulk.success', 'Åtgärd slutförd!')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected participants preview */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-stone-500" />
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    {t('consultant.bulk.selectedParticipants', 'Valda deltagare')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedParticipants.slice(0, 5).map(p => (
                    <span
                      key={p.participant_id}
                      className="px-2 py-1 bg-white dark:bg-stone-700 rounded-lg text-xs text-stone-700 dark:text-stone-300"
                    >
                      {p.first_name} {p.last_name}
                    </span>
                  ))}
                  {selectedParticipants.length > 5 && (
                    <span className="px-2 py-1 bg-violet-100 dark:bg-violet-900/40 rounded-lg text-xs text-violet-600 dark:text-violet-400">
                      +{selectedParticipants.length - 5} till
                    </span>
                  )}
                </div>
              </div>

              {/* Action-specific content */}
              {actionType === 'message' && (
                <div className="space-y-4">
                  {/* Message templates */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      {t('consultant.bulk.templates', 'Snabbmallar')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {MESSAGE_TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template.id)}
                          className={cn(
                            'p-3 rounded-xl text-left transition-all',
                            selectedTemplate === template.id
                              ? 'bg-violet-100 dark:bg-violet-900/40 ring-2 ring-violet-500'
                              : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'
                          )}
                        >
                          <p className="font-medium text-sm text-stone-900 dark:text-stone-100">
                            {template.title}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message content */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      {t('consultant.bulk.message', 'Meddelande')}
                    </label>
                    <textarea
                      value={messageContent}
                      onChange={e => {
                        setMessageContent(e.target.value)
                        setSelectedTemplate(null)
                      }}
                      placeholder={t('consultant.bulk.messagePlaceholder', 'Skriv ditt meddelande...')}
                      rows={4}
                      className={cn(
                        'w-full px-4 py-3 rounded-xl',
                        'bg-stone-100 dark:bg-stone-800',
                        'border-2 border-transparent',
                        'focus:border-violet-500 focus:outline-none',
                        'text-stone-900 dark:text-stone-100',
                        'placeholder:text-stone-400',
                        'resize-none'
                      )}
                    />
                  </div>
                </div>
              )}

              {actionType === 'tag' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    {t('consultant.bulk.selectTags', 'Välj taggar att lägga till')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TAGS.map(tag => {
                      const colorClasses = {
                        amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 ring-amber-500',
                        rose: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 ring-rose-500',
                        emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 ring-emerald-500',
                        violet: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 ring-violet-500',
                        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 ring-blue-500',
                        orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 ring-orange-500',
                      }

                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className={cn(
                            'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                            colorClasses[tag.color as keyof typeof colorClasses],
                            selectedTags.includes(tag.id) && 'ring-2'
                          )}
                        >
                          {selectedTags.includes(tag.id) && (
                            <Check className="w-4 h-4 inline mr-1" />
                          )}
                          {tag.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {actionType === 'export' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    {t('consultant.bulk.exportFormat', 'Välj exportformat')}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'csv', label: 'CSV', icon: FileText },
                      { id: 'excel', label: 'Excel', icon: FileSpreadsheet },
                      { id: 'pdf', label: 'PDF', icon: FileText, disabled: true },
                    ].map(format => (
                      <button
                        key={format.id}
                        onClick={() => !format.disabled && setExportFormat(format.id as typeof exportFormat)}
                        disabled={format.disabled}
                        className={cn(
                          'p-4 rounded-xl text-center transition-all',
                          format.disabled && 'opacity-50 cursor-not-allowed',
                          exportFormat === format.id
                            ? 'bg-violet-100 dark:bg-violet-900/40 ring-2 ring-violet-500'
                            : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'
                        )}
                      >
                        <format.icon className="w-6 h-6 mx-auto mb-2 text-stone-600 dark:text-stone-400" />
                        <p className="font-medium text-sm text-stone-900 dark:text-stone-100">
                          {format.label}
                        </p>
                        {format.disabled && (
                          <p className="text-xs text-stone-500 mt-1">Kommer snart</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {actionType === 'status' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    {t('consultant.bulk.selectStatus', 'Välj ny status')}
                  </label>
                  <div className="space-y-2">
                    {STATUS_OPTIONS.map(status => {
                      const colorClasses = {
                        emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
                        stone: 'bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-300',
                        amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
                        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
                      }

                      return (
                        <button
                          key={status.value}
                          onClick={() => setNewStatus(status.value)}
                          className={cn(
                            'w-full p-3 rounded-xl flex items-center justify-between transition-all',
                            newStatus === status.value
                              ? 'ring-2 ring-violet-500 bg-white dark:bg-stone-800'
                              : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              'px-3 py-1 rounded-full text-sm font-medium',
                              colorClasses[status.color as keyof typeof colorClasses]
                            )}>
                              {status.label}
                            </span>
                          </div>
                          {newStatus === status.value && (
                            <Check className="w-5 h-5 text-violet-600" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              {t('common.cancel', 'Avbryt')}
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.processing', 'Bearbetar...')}
                </>
              ) : actionType === 'message' ? (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('consultant.bulk.send', 'Skicka')}
                </>
              ) : actionType === 'export' ? (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  {t('consultant.bulk.download', 'Ladda ner')}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('consultant.bulk.apply', 'Tillämpa')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
