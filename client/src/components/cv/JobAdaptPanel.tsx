/**
 * JobAdaptPanel - "Anpassa för jobb" feature
 * Låter användaren klistra in en jobbannons eller välja från sparade jobb
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Target, Check, X, Plus, Sparkles, Loader2,
  ChevronDown, ChevronUp, Briefcase, AlertCircle,
  Bookmark, ClipboardPaste
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import type { CVData } from '@/services/supabaseApi'
import { useSavedJobs } from '@/hooks/useSavedJobs'

interface JobAdaptPanelProps {
  cvData: CVData
  onAddSkill: (skill: string) => void
  onUpdateSummary: (summary: string) => void
  className?: string
  defaultExpanded?: boolean
}

interface AnalysisResult {
  matchScore: number
  foundKeywords: string[]
  missingKeywords: string[]
  suggestedSummaryAdditions: string[]
  jobTitle: string
  companyName: string
}

// Extrahera nyckelord från text
function extractKeywords(text: string): string[] {
  const commonKeywords = [
    // Tekniska
    'javascript', 'typescript', 'react', 'node', 'python', 'java', 'sql', 'git',
    'agil', 'scrum', 'kanban', 'ci/cd', 'devops', 'aws', 'azure', 'docker',
    // Mjuka
    'kommunikation', 'teamwork', 'ledarskap', 'projektledning', 'problemlösning',
    'kundservice', 'försäljning', 'marknadsföring', 'analys', 'kreativitet',
    'samarbete', 'självständig', 'driven', 'noggrann', 'flexibel', 'strukturerad',
    // Språk
    'engelska', 'svenska', 'tyska', 'franska', 'spanska',
    // Verktyg
    'excel', 'powerpoint', 'word', 'office', 'crm', 'erp', 'sap',
    // Branscher
    'it', 'finans', 'vård', 'utbildning', 'industri', 'handel', 'bygg',
    // Roller
    'chef', 'ledare', 'koordinator', 'specialist', 'konsult', 'utvecklare',
    // Egenskaper
    'ansvarstagande', 'initiativrik', 'serviceinriktad', 'resultatorienterad',
    'kvalitetsmedveten', 'lösningsorienterad', 'affärsmässig'
  ]

  const textLower = text.toLowerCase()
  return commonKeywords.filter(keyword => textLower.includes(keyword))
}

// Extrahera jobbtitel och företagsnamn (enkel heuristik)
function extractJobInfo(text: string): { title: string; company: string } {
  const lines = text.split('\n').filter(l => l.trim())

  // Första raden är ofta titeln
  const title = lines[0]?.substring(0, 50) || 'Okänd tjänst'

  // Sök efter "hos", "på", "till" för företagsnamn
  const companyMatch = text.match(/(?:hos|på|till|för|at)\s+([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)?)/i)
  const company = companyMatch?.[1] || ''

  return { title, company }
}

type InputMode = 'paste' | 'saved'

export function JobAdaptPanel({ cvData, onAddSkill, onUpdateSummary, className, defaultExpanded = true }: JobAdaptPanelProps) {
  const { t } = useTranslation()
  const [jobDescription, setJobDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [addedKeywords, setAddedKeywords] = useState<string[]>([])
  const [inputMode, setInputMode] = useState<InputMode>('paste')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  // Hämta sparade jobb
  const { savedJobs, isLoaded: savedJobsLoaded } = useSavedJobs()

  // Skapa CV-text för matchning
  const cvText = [
    cvData.summary || '',
    cvData.skills?.map(s => s.name).join(' ') || '',
    cvData.workExperience?.map(w => `${w.title} ${w.description}`).join(' ') || '',
    cvData.title || ''
  ].join(' ').toLowerCase()

  const analyzeJobAd = () => {
    if (!jobDescription.trim()) return

    setIsAnalyzing(true)

    // Simulera API-anrop (i produktion: anropa /api/ai med function: 'analyze-job')
    setTimeout(() => {
      const jobKeywords = extractKeywords(jobDescription)
      const cvKeywords = extractKeywords(cvText)

      const found = jobKeywords.filter(k => cvKeywords.includes(k) || cvText.includes(k))
      const missing = jobKeywords.filter(k => !found.includes(k))

      const { title, company } = extractJobInfo(jobDescription)

      // Beräkna matchscore
      const totalRelevant = jobKeywords.length || 1
      const matchScore = Math.round((found.length / totalRelevant) * 100)

      // Föreslå sammanfattningstillägg baserat på saknade nyckelord
      const suggestions: string[] = []
      if (missing.includes('teamwork') || missing.includes('samarbete')) {
        suggestions.push('Trivs i team och samarbetar effektivt med kollegor.')
      }
      if (missing.includes('självständig')) {
        suggestions.push('Arbetar självständigt och tar egna initiativ.')
      }
      if (missing.includes('strukturerad') || missing.includes('noggrann')) {
        suggestions.push('Strukturerad och noggrann i mitt arbetssätt.')
      }
      if (missing.includes('kundservice') || missing.includes('serviceinriktad')) {
        suggestions.push('Serviceinriktad med fokus på kundnöjdhet.')
      }

      setAnalysis({
        matchScore,
        foundKeywords: found,
        missingKeywords: missing,
        suggestedSummaryAdditions: suggestions.slice(0, 3),
        jobTitle: title,
        companyName: company
      })

      setIsAnalyzing(false)
    }, 1200)
  }

  const handleAddKeyword = (keyword: string) => {
    onAddSkill(keyword)
    setAddedKeywords(prev => [...prev, keyword])
  }

  const handleAddToSummary = (text: string) => {
    const currentSummary = cvData.summary || ''
    const newSummary = currentSummary.trim()
      ? `${currentSummary.trim()} ${text}`
      : text
    onUpdateSummary(newSummary)
  }

  const resetAnalysis = () => {
    setAnalysis(null)
    setJobDescription('')
    setAddedKeywords([])
    setSelectedJobId(null)
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30'
    if (score >= 40) return 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30'
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
  }

  const getScoreMessage = (score: number) => {
    if (score >= 70) return t('cv.jobAdapt.scoreGood', 'Bra matchning!')
    if (score >= 40) return t('cv.jobAdapt.scoreMedium', 'Kan förbättras')
    return t('cv.jobAdapt.scoreLow', 'Behöver anpassning')
  }

  return (
    <div className={cn(
      "bg-gradient-to-br from-sky-50 to-teal-50 dark:from-sky-900/20 dark:to-teal-900/20",
      "rounded-2xl border border-sky-200 dark:border-sky-800/50 overflow-hidden",
      className
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-sky-100/50 dark:hover:bg-sky-900/30 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="job-adapt-content"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-teal-500 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-sky-900 dark:text-sky-100">
              {t('cv.jobAdapt.title', 'Anpassa för jobb')}
            </h3>
            <p className="text-sm text-sky-700 dark:text-sky-300">
              {t('cv.jobAdapt.subtitle', 'Matcha ditt CV med en jobbannons')}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-sky-600 dark:text-sky-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-sky-600 dark:text-sky-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div id="job-adapt-content" className="p-4 pt-0 space-y-4">
          {!analysis ? (
            <>
              {/* Input mode toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setInputMode('paste')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                    inputMode === 'paste'
                      ? "bg-sky-500 text-white"
                      : "bg-white dark:bg-stone-800 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                  )}
                >
                  <ClipboardPaste className="w-4 h-4" />
                  {t('cv.jobAdapt.pasteTab', 'Klistra in')}
                </button>
                <button
                  onClick={() => setInputMode('saved')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                    inputMode === 'saved'
                      ? "bg-sky-500 text-white"
                      : "bg-white dark:bg-stone-800 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                  )}
                >
                  <Bookmark className="w-4 h-4" />
                  {t('cv.jobAdapt.savedTab', 'Sparade jobb')}
                  {savedJobs.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-sky-600 rounded-full">
                      {savedJobs.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Paste mode */}
              {inputMode === 'paste' && (
                <div>
                  <label htmlFor="job-description" className="block text-sm font-medium text-sky-800 dark:text-sky-200 mb-2">
                    {t('cv.jobAdapt.pasteJob', 'Klistra in jobbannonsen')}
                  </label>
                  <textarea
                    id="job-description"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder={t('cv.jobAdapt.placeholder', 'Klistra in hela jobbannonsen här så analyserar vi vilka nyckelord som saknas i ditt CV...')}
                    className="w-full h-32 p-3 border border-sky-200 dark:border-sky-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                    aria-describedby="job-description-help"
                  />
                  <p id="job-description-help" className="mt-1 text-xs text-sky-600 dark:text-sky-400">
                    {t('cv.jobAdapt.help', 'Vi analyserar nyckelord och föreslår förbättringar')}
                  </p>
                </div>
              )}

              {/* Saved jobs mode */}
              {inputMode === 'saved' && (
                <div>
                  <label className="block text-sm font-medium text-sky-800 dark:text-sky-200 mb-2">
                    {t('cv.jobAdapt.selectSavedJob', 'Välj ett sparat jobb')}
                  </label>
                  {!savedJobsLoaded ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
                    </div>
                  ) : savedJobs.length === 0 ? (
                    <div className="text-center py-6 bg-white dark:bg-stone-800 rounded-xl border border-sky-200 dark:border-sky-700">
                      <Bookmark className="w-8 h-8 text-sky-300 dark:text-sky-600 mx-auto mb-2" />
                      <p className="text-sm text-sky-700 dark:text-sky-300">
                        {t('cv.jobAdapt.noSavedJobs', 'Du har inga sparade jobb ännu')}
                      </p>
                      <p className="text-xs text-sky-600 dark:text-sky-400 mt-1">
                        {t('cv.jobAdapt.saveJobsHint', 'Spara jobb från jobbsökningen för att använda dem här')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {savedJobs.map((savedJob) => {
                        const isSelected = selectedJobId === savedJob.id
                        return (
                          <button
                            key={savedJob.id}
                            onClick={() => {
                              setSelectedJobId(savedJob.id)
                              // Sätt jobbeskrivningen från det sparade jobbet
                              const description = savedJob.jobData.description?.text || savedJob.jobData.headline || ''
                              setJobDescription(description)
                            }}
                            className={cn(
                              "w-full text-left p-3 rounded-xl transition-all flex items-start gap-3",
                              isSelected
                                ? "bg-sky-500 text-white"
                                : "bg-white dark:bg-stone-800 border border-sky-200 dark:border-sky-700 hover:border-sky-400 dark:hover:border-sky-500"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                              isSelected ? "bg-sky-400" : "bg-sky-100 dark:bg-sky-900/30"
                            )}>
                              <Briefcase className={cn(
                                "w-4 h-4",
                                isSelected ? "text-white" : "text-sky-600 dark:text-sky-400"
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium text-sm truncate",
                                isSelected ? "text-white" : "text-stone-800 dark:text-stone-200"
                              )}>
                                {savedJob.jobData.headline}
                              </p>
                              <p className={cn(
                                "text-xs truncate",
                                isSelected ? "text-sky-100" : "text-stone-500 dark:text-stone-400"
                              )}>
                                {savedJob.jobData.employer?.name}
                                {savedJob.jobData.workplace_address?.municipality && (
                                  <> • {savedJob.jobData.workplace_address.municipality}</>
                                )}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="w-5 h-5 text-white flex-shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Analyze button */}
              <button
                onClick={analyzeJobAd}
                disabled={!jobDescription.trim() || isAnalyzing}
                className={cn(
                  "w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 mt-4",
                  "bg-gradient-to-r from-sky-500 to-teal-500 text-white",
                  "hover:from-sky-600 hover:to-teal-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('cv.jobAdapt.analyzing', 'Analyserar...')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {t('cv.jobAdapt.analyze', 'Analysera matchning')}
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Results */}
              <div className="space-y-4">
                {/* Match score */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-stone-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold",
                      getScoreColor(analysis.matchScore)
                    )}>
                      {analysis.matchScore}%
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800 dark:text-stone-200">
                        {getScoreMessage(analysis.matchScore)}
                      </p>
                      {analysis.jobTitle && (
                        <p className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          {analysis.jobTitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Found keywords */}
                {analysis.foundKeywords.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      {t('cv.jobAdapt.found', 'Du har')} ({analysis.foundKeywords.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.foundKeywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing keywords - can add */}
                {analysis.missingKeywords.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {t('cv.jobAdapt.missing', 'Saknas i ditt CV')} ({analysis.missingKeywords.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missingKeywords.map((keyword) => {
                        const isAdded = addedKeywords.includes(keyword)
                        return (
                          <button
                            key={keyword}
                            onClick={() => !isAdded && handleAddKeyword(keyword)}
                            disabled={isAdded}
                            className={cn(
                              "px-2.5 py-1 text-xs rounded-full font-medium transition-all flex items-center gap-1",
                              isAdded
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 cursor-pointer"
                            )}
                            aria-label={isAdded ? `${keyword} tillagd` : `Lägg till ${keyword}`}
                          >
                            {keyword}
                            {isAdded ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                      {t('cv.jobAdapt.clickToAdd', 'Klicka för att lägga till som kompetens')}
                    </p>
                  </div>
                )}

                {/* Suggested summary additions */}
                {analysis.suggestedSummaryAdditions.length > 0 && (
                  <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
                    <p className="text-sm font-medium text-sky-800 dark:text-sky-200 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      {t('cv.jobAdapt.suggestions', 'Förslag till din sammanfattning')}
                    </p>
                    <div className="space-y-2">
                      {analysis.suggestedSummaryAdditions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleAddToSummary(suggestion)}
                          className="w-full text-left p-2 bg-white dark:bg-stone-800 rounded-lg text-sm text-stone-700 dark:text-stone-300 hover:bg-sky-50 dark:hover:bg-sky-900/50 transition-colors flex items-center justify-between gap-2 group"
                        >
                          <span>"{suggestion}"</span>
                          <Plus className="w-4 h-4 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* New analysis button */}
                <button
                  onClick={resetAnalysis}
                  className="w-full py-2.5 border border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors font-medium"
                >
                  {t('cv.jobAdapt.newAnalysis', 'Analysera ny annons')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default JobAdaptPanel
