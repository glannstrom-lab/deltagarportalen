/**
 * FocusCVBuilder - NPF-anpassad stegvis CV-byggare
 *
 * Designad för användare med neuropsykiatriska funktionsvariationer (ADHD, autism, etc.)
 * - Ett fält/steg åt gången
 * - Stor, tydlig progressindikator
 * - Minimalt visuellt brus
 * - Enkla knappar för att navigera
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cvApi } from '@/services/supabaseApi'
import type { CVData, WorkExperience, Education, Skill } from '@/services/supabaseApi'
import { cn } from '@/lib/utils'
import { showToast } from '@/components/Toast'
import {
  User, Briefcase, GraduationCap, Sparkles, Check,
  ChevronLeft, ChevronRight, Save, Eye, Loader2, Plus, X
} from '@/components/ui/icons'
import { CVPreview } from '@/components/cv/CVPreview'

// Step definitions
const FOCUS_STEPS = [
  { id: 'basic', icon: User, titleKey: 'focusCV.steps.basic.title', descKey: 'focusCV.steps.basic.desc' },
  { id: 'summary', icon: Sparkles, titleKey: 'focusCV.steps.summary.title', descKey: 'focusCV.steps.summary.desc' },
  { id: 'work', icon: Briefcase, titleKey: 'focusCV.steps.work.title', descKey: 'focusCV.steps.work.desc' },
  { id: 'education', icon: GraduationCap, titleKey: 'focusCV.steps.education.title', descKey: 'focusCV.steps.education.desc' },
  { id: 'skills', icon: Sparkles, titleKey: 'focusCV.steps.skills.title', descKey: 'focusCV.steps.skills.desc' },
  { id: 'preview', icon: Eye, titleKey: 'focusCV.steps.preview.title', descKey: 'focusCV.steps.preview.desc' },
] as const

interface FocusCVBuilderProps {
  onExitFocusMode?: () => void
}

export function FocusCVBuilder({ onExitFocusMode }: FocusCVBuilderProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(0)
  const [cvData, setCvData] = useState<CVData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    summary: '',
    workExperience: [],
    education: [],
    skills: [],
    template: 'minimal',
  })

  // Load existing CV data
  const { data: existingCV, isLoading } = useQuery({
    queryKey: ['cv'],
    queryFn: cvApi.getCV,
  })

  // Populate form with existing data
  useEffect(() => {
    if (existingCV) {
      setCvData({
        ...existingCV,
        firstName: existingCV.firstName || existingCV.first_name || '',
        lastName: existingCV.lastName || existingCV.last_name || '',
        workExperience: existingCV.workExperience || existingCV.work_experience || [],
      })
    }
  }, [existingCV])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: cvApi.updateCV,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cv'] })
      showToast(t('focusCV.saved', 'CV sparat!'), 'success')
    },
    onError: () => {
      showToast(t('focusCV.saveError', 'Kunde inte spara CV'), 'error')
    },
  })

  const handleSave = useCallback(() => {
    saveMutation.mutate(cvData)
  }, [cvData, saveMutation])

  const currentStepData = FOCUS_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === FOCUS_STEPS.length - 1
  const progress = ((currentStep + 1) / FOCUS_STEPS.length) * 100

  const goNext = () => {
    if (!isLastStep) {
      handleSave()
      setCurrentStep(prev => prev + 1)
    }
  }

  const goPrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--c-solid)]" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Header */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700/50 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">
            {t(currentStepData.titleKey, currentStepData.id)}
          </h2>
          <span className="text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)]">
            {t('focusCV.stepOf', 'Steg {{current}} av {{total}}', {
              current: currentStep + 1,
              total: FOCUS_STEPS.length
            })}
          </span>
        </div>

        {/* Large Progress Bar */}
        <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-[var(--c-solid)] rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Icons */}
        <div className="flex items-center justify-between">
          {FOCUS_STEPS.map((step, i) => {
            const Icon = step.icon
            const isComplete = i < currentStep
            const isCurrent = i === currentStep

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  isComplete && 'bg-[var(--c-solid)] text-white',
                  isCurrent && 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50 text-[var(--c-text)] dark:text-[var(--c-text)] ring-2 ring-[var(--c-solid)]',
                  !isComplete && !isCurrent && 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                )}
                aria-label={t(step.titleKey)}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700/50 p-6">
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
          {t(currentStepData.descKey, '')}
        </p>

        {currentStepData.id === 'basic' && (
          <BasicInfoStep cvData={cvData} setCvData={setCvData} />
        )}
        {currentStepData.id === 'summary' && (
          <SummaryStep cvData={cvData} setCvData={setCvData} />
        )}
        {currentStepData.id === 'work' && (
          <WorkStep cvData={cvData} setCvData={setCvData} />
        )}
        {currentStepData.id === 'education' && (
          <EducationStep cvData={cvData} setCvData={setCvData} />
        )}
        {currentStepData.id === 'skills' && (
          <SkillsStep cvData={cvData} setCvData={setCvData} />
        )}
        {currentStepData.id === 'preview' && (
          <PreviewStep cvData={cvData} onSave={handleSave} isSaving={saveMutation.isPending} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 gap-4">
        <button
          onClick={goPrev}
          disabled={isFirstStep}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors',
            'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300',
            'hover:bg-stone-200 dark:hover:bg-stone-700',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
          {t('common.previous', 'Föregående')}
        </button>

        {isLastStep ? (
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className={cn(
              'flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-colors',
              'bg-[var(--c-solid)] text-white hover:bg-[var(--c-solid)]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {t('focusCV.saveAndFinish', 'Spara CV')}
          </button>
        ) : (
          <button
            onClick={goNext}
            className={cn(
              'flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-colors',
              'bg-[var(--c-solid)] text-white hover:bg-[var(--c-solid)]'
            )}
          >
            {t('common.next', 'Nästa')}
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Exit Focus Mode Link */}
      {onExitFocusMode && (
        <button
          onClick={onExitFocusMode}
          className="w-full mt-4 text-center text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
        >
          {t('focusCV.exitFocusMode', 'Byt till vanligt läge')}
        </button>
      )}
    </div>
  )
}

// ============================================
// STEP COMPONENTS
// ============================================

interface StepProps {
  cvData: CVData
  setCvData: React.Dispatch<React.SetStateAction<CVData>>
}

function BasicInfoStep({ cvData, setCvData }: StepProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <FocusInput
        label={t('focusCV.fields.firstName', 'Förnamn')}
        value={cvData.firstName || ''}
        onChange={(value) => setCvData(prev => ({ ...prev, firstName: value }))}
        placeholder={t('focusCV.placeholders.firstName', 'Anna')}
        autoFocus
      />
      <FocusInput
        label={t('focusCV.fields.lastName', 'Efternamn')}
        value={cvData.lastName || ''}
        onChange={(value) => setCvData(prev => ({ ...prev, lastName: value }))}
        placeholder={t('focusCV.placeholders.lastName', 'Andersson')}
      />
      <FocusInput
        label={t('focusCV.fields.email', 'E-post')}
        type="email"
        value={cvData.email || ''}
        onChange={(value) => setCvData(prev => ({ ...prev, email: value }))}
        placeholder={t('focusCV.placeholders.email', 'anna@exempel.se')}
      />
      <FocusInput
        label={t('focusCV.fields.phone', 'Telefon')}
        type="tel"
        value={cvData.phone || ''}
        onChange={(value) => setCvData(prev => ({ ...prev, phone: value }))}
        placeholder={t('focusCV.placeholders.phone', '070-123 45 67')}
      />
    </div>
  )
}

function SummaryStep({ cvData, setCvData }: StepProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <FocusInput
        label={t('focusCV.fields.title', 'Yrkestitel')}
        value={cvData.title || ''}
        onChange={(value) => setCvData(prev => ({ ...prev, title: value }))}
        placeholder={t('focusCV.placeholders.title', 't.ex. Projektledare, Säljare, Utvecklare')}
        autoFocus
      />
      <div>
        <label className="block text-base font-medium text-stone-700 dark:text-stone-300 mb-2">
          {t('focusCV.fields.summary', 'Kort presentation')}
        </label>
        <textarea
          value={cvData.summary || ''}
          onChange={(e) => setCvData(prev => ({ ...prev, summary: e.target.value }))}
          placeholder={t('focusCV.placeholders.summary', 'Beskriv dig själv i 2-3 meningar. Vad är du bra på? Vad vill du jobba med?')}
          rows={5}
          className={cn(
            'w-full px-4 py-4 text-lg rounded-xl border-2 transition-colors',
            'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700',
            'focus:border-[var(--c-solid)] focus:ring-0 focus:outline-none',
            'placeholder:text-stone-400'
          )}
        />
        <p className="mt-2 text-sm text-stone-500">
          {t('focusCV.hints.summary', 'Tips: Skriv vad du vill jobba med och vad du är bra på.')}
        </p>
      </div>
    </div>
  )
}

function WorkStep({ cvData, setCvData }: StepProps) {
  const { t } = useTranslation()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const experiences = cvData.workExperience || []

  const addExperience = () => {
    const newExp: WorkExperience = {
      id: Date.now().toString(),
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      description: '',
    }
    setCvData(prev => ({
      ...prev,
      workExperience: [...(prev.workExperience || []), newExp]
    }))
    setEditingIndex(experiences.length)
  }

  const updateExperience = (index: number, updates: Partial<WorkExperience>) => {
    setCvData(prev => ({
      ...prev,
      workExperience: (prev.workExperience || []).map((exp, i) =>
        i === index ? { ...exp, ...updates } : exp
      )
    }))
  }

  const removeExperience = (index: number) => {
    setCvData(prev => ({
      ...prev,
      workExperience: (prev.workExperience || []).filter((_, i) => i !== index)
    }))
    setEditingIndex(null)
  }

  if (editingIndex !== null) {
    const exp = experiences[editingIndex]
    if (!exp) {
      setEditingIndex(null)
      return null
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            {t('focusCV.work.editing', 'Redigera arbetslivserfarenhet')}
          </h3>
          <button
            onClick={() => setEditingIndex(null)}
            className="text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <FocusInput
          label={t('focusCV.fields.jobTitle', 'Befattning/Roll')}
          value={exp.title}
          onChange={(value) => updateExperience(editingIndex, { title: value })}
          placeholder={t('focusCV.placeholders.jobTitle', 't.ex. Projektledare')}
          autoFocus
        />
        <FocusInput
          label={t('focusCV.fields.company', 'Arbetsgivare')}
          value={exp.company}
          onChange={(value) => updateExperience(editingIndex, { company: value })}
          placeholder={t('focusCV.placeholders.company', 't.ex. Företaget AB')}
        />
        <div className="grid grid-cols-2 gap-4">
          <FocusInput
            label={t('focusCV.fields.startDate', 'Startdatum')}
            type="month"
            value={exp.startDate}
            onChange={(value) => updateExperience(editingIndex, { startDate: value })}
          />
          <FocusInput
            label={t('focusCV.fields.endDate', 'Slutdatum')}
            type="month"
            value={exp.endDate || ''}
            onChange={(value) => updateExperience(editingIndex, { endDate: value })}
            placeholder={t('focusCV.placeholders.endDate', 'Pågående?')}
          />
        </div>
        <div>
          <label className="block text-base font-medium text-stone-700 dark:text-stone-300 mb-2">
            {t('focusCV.fields.workDescription', 'Vad gjorde du?')}
          </label>
          <textarea
            value={exp.description || ''}
            onChange={(e) => updateExperience(editingIndex, { description: e.target.value })}
            placeholder={t('focusCV.placeholders.workDescription', 'Beskriv dina viktigaste arbetsuppgifter och vad du åstadkom.')}
            rows={4}
            className={cn(
              'w-full px-4 py-4 text-lg rounded-xl border-2 transition-colors',
              'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700',
              'focus:border-[var(--c-solid)] focus:ring-0 focus:outline-none',
              'placeholder:text-stone-400'
            )}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setEditingIndex(null)}
            className="flex-1 py-3 rounded-xl font-medium bg-[var(--c-solid)] text-white hover:bg-[var(--c-solid)]"
          >
            {t('common.done', 'Klar')}
          </button>
          <button
            onClick={() => removeExperience(editingIndex)}
            className="py-3 px-4 rounded-xl font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
          >
            {t('common.delete', 'Ta bort')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {experiences.length === 0 ? (
        <p className="text-center text-stone-500 dark:text-stone-400 py-8">
          {t('focusCV.work.empty', 'Lägg till dina tidigare jobb här.')}
        </p>
      ) : (
        experiences.map((exp, i) => (
          <button
            key={exp.id}
            onClick={() => setEditingIndex(i)}
            className="w-full text-left p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:border-[var(--c-solid)] transition-colors"
          >
            <p className="font-medium text-stone-800 dark:text-stone-100">{exp.title || t('focusCV.work.untitled', '(Ingen titel)')}</p>
            <p className="text-sm text-stone-500">{exp.company}</p>
          </button>
        ))
      )}

      <button
        onClick={addExperience}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed',
          'border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400',
          'hover:border-[var(--c-solid)] hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] transition-colors'
        )}
      >
        <Plus className="w-5 h-5" />
        {t('focusCV.work.add', 'Lägg till arbetslivserfarenhet')}
      </button>
    </div>
  )
}

function EducationStep({ cvData, setCvData }: StepProps) {
  const { t } = useTranslation()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const educations = cvData.education || []

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      degree: '',
      school: '',
      field: '',
      startDate: '',
      endDate: '',
    }
    setCvData(prev => ({
      ...prev,
      education: [...(prev.education || []), newEdu]
    }))
    setEditingIndex(educations.length)
  }

  const updateEducation = (index: number, updates: Partial<Education>) => {
    setCvData(prev => ({
      ...prev,
      education: (prev.education || []).map((edu, i) =>
        i === index ? { ...edu, ...updates } : edu
      )
    }))
  }

  const removeEducation = (index: number) => {
    setCvData(prev => ({
      ...prev,
      education: (prev.education || []).filter((_, i) => i !== index)
    }))
    setEditingIndex(null)
  }

  if (editingIndex !== null) {
    const edu = educations[editingIndex]
    if (!edu) {
      setEditingIndex(null)
      return null
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            {t('focusCV.education.editing', 'Redigera utbildning')}
          </h3>
          <button
            onClick={() => setEditingIndex(null)}
            className="text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <FocusInput
          label={t('focusCV.fields.degree', 'Examen/Utbildning')}
          value={edu.degree}
          onChange={(value) => updateEducation(editingIndex, { degree: value })}
          placeholder={t('focusCV.placeholders.degree', 't.ex. Kandidatexamen, Yrkesutbildning')}
          autoFocus
        />
        <FocusInput
          label={t('focusCV.fields.school', 'Skola/Lärosäte')}
          value={edu.school}
          onChange={(value) => updateEducation(editingIndex, { school: value })}
          placeholder={t('focusCV.placeholders.school', 't.ex. Stockholms universitet')}
        />
        <FocusInput
          label={t('focusCV.fields.field', 'Inriktning (valfritt)')}
          value={edu.field || ''}
          onChange={(value) => updateEducation(editingIndex, { field: value })}
          placeholder={t('focusCV.placeholders.field', 't.ex. Datavetenskap')}
        />
        <div className="grid grid-cols-2 gap-4">
          <FocusInput
            label={t('focusCV.fields.startDate', 'Startdatum')}
            type="month"
            value={edu.startDate}
            onChange={(value) => updateEducation(editingIndex, { startDate: value })}
          />
          <FocusInput
            label={t('focusCV.fields.endDate', 'Slutdatum')}
            type="month"
            value={edu.endDate || ''}
            onChange={(value) => updateEducation(editingIndex, { endDate: value })}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setEditingIndex(null)}
            className="flex-1 py-3 rounded-xl font-medium bg-[var(--c-solid)] text-white hover:bg-[var(--c-solid)]"
          >
            {t('common.done', 'Klar')}
          </button>
          <button
            onClick={() => removeEducation(editingIndex)}
            className="py-3 px-4 rounded-xl font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
          >
            {t('common.delete', 'Ta bort')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {educations.length === 0 ? (
        <p className="text-center text-stone-500 dark:text-stone-400 py-8">
          {t('focusCV.education.empty', 'Lägg till dina utbildningar här.')}
        </p>
      ) : (
        educations.map((edu, i) => (
          <button
            key={edu.id}
            onClick={() => setEditingIndex(i)}
            className="w-full text-left p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:border-[var(--c-solid)] transition-colors"
          >
            <p className="font-medium text-stone-800 dark:text-stone-100">{edu.degree || t('focusCV.education.untitled', '(Ingen examen)')}</p>
            <p className="text-sm text-stone-500">{edu.school}</p>
          </button>
        ))
      )}

      <button
        onClick={addEducation}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed',
          'border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400',
          'hover:border-[var(--c-solid)] hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] transition-colors'
        )}
      >
        <Plus className="w-5 h-5" />
        {t('focusCV.education.add', 'Lägg till utbildning')}
      </button>
    </div>
  )
}

function SkillsStep({ cvData, setCvData }: StepProps) {
  const { t } = useTranslation()
  const [newSkill, setNewSkill] = useState('')
  const skills = cvData.skills || []

  const addSkill = () => {
    if (newSkill.trim()) {
      const skill: Skill = {
        id: Date.now().toString(),
        name: newSkill.trim(),
        level: 3,
        category: 'other',
      }
      setCvData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skill]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (id: string) => {
    setCvData(prev => ({
      ...prev,
      skills: (prev.skills || []).filter(s => s.id !== id)
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-base font-medium text-stone-700 dark:text-stone-300 mb-2">
          {t('focusCV.fields.addSkill', 'Lägg till kompetens')}
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('focusCV.placeholders.skill', 't.ex. Excel, Projektledning, Engelska')}
            className={cn(
              'flex-1 px-4 py-4 text-lg rounded-xl border-2 transition-colors',
              'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700',
              'focus:border-[var(--c-solid)] focus:ring-0 focus:outline-none',
              'placeholder:text-stone-400'
            )}
          />
          <button
            onClick={addSkill}
            disabled={!newSkill.trim()}
            className={cn(
              'px-6 py-4 rounded-xl font-medium transition-colors',
              'bg-[var(--c-solid)] text-white hover:bg-[var(--c-solid)]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map(skill => (
            <span
              key={skill.id}
              className="inline-flex items-center gap-1 px-4 py-2 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)] rounded-full"
            >
              {skill.name}
              <button
                onClick={() => removeSkill(skill.id)}
                className="ml-1 text-[var(--c-text)] dark:text-[var(--c-text)] hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      )}

      {skills.length === 0 && (
        <p className="text-center text-stone-500 dark:text-stone-400 py-4">
          {t('focusCV.skills.empty', 'Skriv en kompetens och tryck Enter för att lägga till.')}
        </p>
      )}
    </div>
  )
}

interface PreviewStepProps {
  cvData: CVData
  onSave: () => void
  isSaving: boolean
}

function PreviewStep({ cvData, onSave, isSaving }: PreviewStepProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">
          {t('focusCV.preview.ready', 'Ditt CV är redo!')}
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {t('focusCV.preview.description', 'Granska ditt CV nedan. Du kan alltid komma tillbaka och redigera senare.')}
        </p>
      </div>

      <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
        <div className="bg-stone-100 dark:bg-stone-800 p-4 max-h-[500px] overflow-y-auto">
          <CVPreview data={cvData} template={cvData.template || 'minimal'} scale={0.6} />
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={isSaving}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-colors',
          'bg-[var(--c-solid)] text-white hover:bg-[var(--c-solid)]',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isSaving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Save className="w-5 h-5" />
        )}
        {t('focusCV.saveAndFinish', 'Spara CV')}
      </button>
    </div>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

interface FocusInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'tel' | 'month'
  autoFocus?: boolean
}

function FocusInput({ label, value, onChange, placeholder, type = 'text', autoFocus }: FocusInputProps) {
  return (
    <div>
      <label className="block text-base font-medium text-stone-700 dark:text-stone-300 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full px-4 py-4 text-lg rounded-xl border-2 transition-colors',
          'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700',
          'focus:border-[var(--c-solid)] focus:ring-0 focus:outline-none',
          'placeholder:text-stone-400'
        )}
      />
    </div>
  )
}

export default FocusCVBuilder
