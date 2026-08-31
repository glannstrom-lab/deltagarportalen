/**
 * ReportGeneratorDialog - Dialog for generating PDF reports with options
 * Allows consultants to customize report content and preview before download
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  FileText,
  Download,
  Eye,
  Settings,
  Calendar,
  Users,
  BarChart3,
  CheckCircle2,
  Loader2,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { cn } from '@/lib/utils'
import {
  downloadConsultantReport,
  generateReportDataUrl,
  type ReportData,
  type ReportOptions,
} from '@/services/pdfReportGenerator'

interface ReportGeneratorDialogProps {
  isOpen: boolean
  onClose: () => void
  analyticsData: ReportData
  consultantName?: string
  /**
   * Etiketten för den period `analyticsData` faktiskt representerar.
   *
   * KS6: dialogen hade tidigare en egen "Tidsperiod"-väljare (vecka/månad/
   * kvartal/år) som bara ändrade en TEXT i PDF-huvudet — den siffersättande
   * `analyticsData` kommer redan färdigberäknad från föräldern och reagerade
   * inte på valet. En konsulent kunde välja "Senaste året" och få en PDF som
   * SÄGER "Senaste året" men VISAR förra månadens siffror.
   *
   * Dialogen väljer därför ingen period längre — den VISAR den period
   * anropande vy redan har valt. Utelämnas propen (t.ex. från Översikt, som
   * inte har någon periodavgränsning alls) visas ett ärligt
   * ögonblicksvärde-meddelande i stället för en påhittad period.
   */
  periodLabel?: string
}

type ReportSection = 'overview' | 'cohort' | 'participants'

export function ReportGeneratorDialog({
  isOpen,
  onClose,
  analyticsData,
  consultantName = 'Konsulent',
  periodLabel,
}: ReportGeneratorDialogProps) {
  const { t, i18n } = useTranslation()
  const [step, setStep] = useState<'options' | 'preview'>('options')
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Report options
  const [reportTitle, setReportTitle] = useState('')
  const [selectedSections, setSelectedSections] = useState<Set<ReportSection>>(
    new Set(['overview', 'cohort'])
  )
  const [language, setLanguage] = useState<'sv' | 'en'>(
    i18n.language === 'en' ? 'en' : 'sv'
  )

  // Perioden är inte ett val i dialogen (se periodLabel-kommentaren ovan).
  // Saknas den (Översikt har ingen periodavgränsning) visar vi ett
  // ögonblicksvärde med dagens datum i stället för att gissa en period.
  const effectivePeriodLabel =
    periodLabel ||
    t('consultant.report.currentStatusOn', 'Aktuell status per {{date}}', {
      date: new Date().toLocaleDateString('sv-SE'),
    })

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep('options')
      setPreviewUrl(null)
      setGenerating(false)
    }
  }, [isOpen])

  const toggleSection = (section: ReportSection) => {
    const newSections = new Set(selectedSections)
    if (newSections.has(section)) {
      // Don't allow removing all sections
      if (newSections.size > 1) {
        newSections.delete(section)
      }
    } else {
      newSections.add(section)
    }
    setSelectedSections(newSections)
  }

  const handleGeneratePreview = async () => {
    setGenerating(true)
    try {
      const options: ReportOptions = {
        title: reportTitle || undefined,
        consultantName,
        dateRange: effectivePeriodLabel,
        includeParticipantDetails: selectedSections.has('participants'),
        includeCohortAnalysis: selectedSections.has('cohort'),
        language,
      }

      // KS6: saknades `await` — previewUrl fick en Promise i stället för en
      // data-URL och förhandsgranskningen kunde aldrig visa något (TS2345).
      const dataUrl = await generateReportDataUrl(analyticsData, options)
      setPreviewUrl(dataUrl)
      setStep('preview')
    } catch (error) {
      console.error('Error generating preview:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = () => {
    const options: ReportOptions = {
      title: reportTitle || undefined,
      consultantName,
      dateRange: effectivePeriodLabel,
      includeParticipantDetails: selectedSections.has('participants'),
      includeCohortAnalysis: selectedSections.has('cohort'),
      language,
    }

    downloadConsultantReport(analyticsData, options)
    onClose()
  }

  const sections = [
    {
      id: 'overview' as const,
      icon: BarChart3,
      title: t('consultant.report.sections.overview', 'Översikt & Nyckeltal'),
      description: t(
        'consultant.report.sections.overviewDesc',
        'Sammanfattning, statusfördelning och framsteg'
      ),
      required: true,
    },
    {
      id: 'cohort' as const,
      icon: Calendar,
      title: t('consultant.report.sections.cohort', 'Kohortanalys'),
      description: t(
        'consultant.report.sections.cohortDesc',
        'Jämförelse mellan deltagargrupper'
      ),
    },
    {
      id: 'participants' as const,
      icon: Users,
      title: t('consultant.report.sections.participants', 'Deltagardetaljer'),
      description: t(
        'consultant.report.sections.participantsDesc',
        'Individuell information för varje deltagare'
      ),
    },
  ]

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="report-generator-dialog-title"
      overlayClassName="backdrop-blur-sm"
      className={cn(
        'w-full bg-white dark:bg-stone-900 rounded-2xl shadow-xl',
        'max-h-[90vh] overflow-hidden flex flex-col',
        step === 'preview' ? 'max-w-4xl' : 'max-w-lg'
      )}
    >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
            </div>
            <div>
              <h2 id="report-generator-dialog-title" className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                {t('consultant.report.title', 'Generera PDF-rapport')}
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-600">
                {step === 'options'
                  ? t('consultant.report.configureOptions', 'Anpassa rapportinnehåll')
                  : t('consultant.report.previewReport', 'Förhandsgranska rapporten')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close', 'Stäng')}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'options' ? (
            <div className="space-y-6">
              {/* Report Title */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  {t('consultant.report.reportTitle', 'Rapporttitel')}
                  <span className="text-stone-600 font-normal ml-1">
                    ({t('common.optional', 'valfritt')})
                  </span>
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  placeholder={t('consultant.report.titlePlaceholder', 'Konsultrapport')}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-stone-100 dark:bg-stone-800',
                    'border-2 border-transparent',
                    'focus:border-[var(--c-solid)] focus:outline-none',
                    'text-stone-900 dark:text-stone-100',
                    'placeholder:text-stone-600'
                  )}
                />
              </div>

              {/* Date Range — visas, väljs inte här. Se periodLabel-kommentaren
                  i props-typen: perioden bestäms av vyn som öppnade dialogen. */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  {t('consultant.report.dateRange', 'Tidsperiod')}
                </label>
                <div
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-stone-100 dark:bg-stone-800',
                    'text-stone-900 dark:text-stone-100'
                  )}
                >
                  {effectivePeriodLabel}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-600 mt-1.5">
                  {periodLabel
                    ? t(
                        'consultant.report.dateRangeFromView',
                        'Perioden är den som redan är vald i vyn du öppnade rapporten från.'
                      )
                    : t(
                        'consultant.report.dateRangeSnapshot',
                        'Den här vyn har ingen tidsavgränsning — rapporten visar aktuella totalsummor, inte en period.'
                      )}
                </p>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  {t('consultant.report.language', 'Rapportspråk')}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLanguage('sv')}
                    className={cn(
                      'flex-1 py-2.5 px-4 rounded-xl font-medium transition-all',
                      language === 'sv'
                        ? 'bg-[var(--c-solid)] text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    )}
                  >
                    Svenska
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={cn(
                      'flex-1 py-2.5 px-4 rounded-xl font-medium transition-all',
                      language === 'en'
                        ? 'bg-[var(--c-solid)] text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    )}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Sections */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
                  {t('consultant.report.includeSections', 'Inkludera sektioner')}
                </label>
                <div className="space-y-2">
                  {sections.map(section => (
                    <Card
                      key={section.id}
                      className={cn(
                        'p-4 cursor-pointer transition-all',
                        selectedSections.has(section.id)
                          ? 'ring-2 ring-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20'
                          : 'hover:bg-stone-50 dark:hover:bg-stone-800'
                      )}
                      onClick={() => !section.required && toggleSection(section.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            selectedSections.has(section.id)
                              ? 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40'
                              : 'bg-stone-100 dark:bg-stone-800'
                          )}
                        >
                          <section.icon
                            className={cn(
                              'w-5 h-5',
                              selectedSections.has(section.id)
                                ? 'text-[var(--c-text)] dark:text-[var(--c-text)]'
                                : 'text-stone-500'
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-stone-900 dark:text-stone-100">
                              {section.title}
                            </p>
                            {section.required && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-600">
                                {t('common.required', 'Obligatorisk')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-stone-500 dark:text-stone-600">
                            {section.description}
                          </p>
                        </div>
                        {selectedSections.has(section.id) && (
                          <CheckCircle2 className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Preview Step
            <div className="space-y-4">
              {previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[60vh] rounded-xl border border-stone-200 dark:border-stone-700"
                  title="PDF Preview"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
          {step === 'options' ? (
            <>
              <Button variant="outline" onClick={onClose}>
                {t('common.cancel', 'Avbryt')}
              </Button>
              <Button onClick={handleGeneratePreview} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.generating', 'Genererar...')}
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    {t('consultant.report.preview', 'Förhandsgranska')}
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('options')}>
                <Settings className="w-4 h-4 mr-2" />
                {t('consultant.report.backToOptions', 'Tillbaka till inställningar')}
              </Button>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                {t('consultant.report.download', 'Ladda ner PDF')}
              </Button>
            </>
          )}
        </div>
    </Dialog>
  )
}
