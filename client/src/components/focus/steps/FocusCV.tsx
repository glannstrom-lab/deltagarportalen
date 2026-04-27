/**
 * FocusCV - Förenklad CV-byggare för fokusläget
 * Baserat på QuickCVMode med inbäddad guide
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cvApi, type CVData } from '@/services/supabaseApi'
import { useAuthStore } from '@/stores/authStore'
import {
  FileText, Briefcase, GraduationCap, Star,
  ArrowRight, Check, Loader2, SkipForward, Plus, Trash2
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface FocusCVProps {
  onComplete: () => void
  onSkip: () => void
  onBack: () => void
}

interface WorkExperience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

interface Education {
  id: string
  school: string
  degree: string
  field: string
  startDate: string
  endDate: string
}

const CV_STEPS = [
  { id: 'title', icon: Briefcase, titleKey: 'focusGuide.cv.titleStep', titleDefault: 'Vad jobbar du som?' },
  { id: 'experience', icon: Briefcase, titleKey: 'focusGuide.cv.experienceStep', titleDefault: 'Arbetslivserfarenhet' },
  { id: 'education', icon: GraduationCap, titleKey: 'focusGuide.cv.educationStep', titleDefault: 'Utbildning' },
  { id: 'skills', icon: Star, titleKey: 'focusGuide.cv.skillsStep', titleDefault: 'Kompetenser' },
] as const

export function FocusCV({ onComplete, onSkip, onBack }: FocusCVProps) {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(0)

  // Form state
  const [title, setTitle] = useState('')
  const [experience, setExperience] = useState<WorkExperience[]>([])
  const [education, setEducation] = useState<Education[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')

  // Load existing CV data
  const { data: cvData, isLoading } = useQuery({
    queryKey: ['cv'],
    queryFn: cvApi.getCV
  })

  // Initialize form with existing data
  useEffect(() => {
    if (cvData) {
      setTitle(cvData.title || '')
      setExperience(cvData.workExperience?.map(exp => ({
        id: exp.id || crypto.randomUUID(),
        company: exp.company || '',
        position: exp.position || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        current: exp.current || false,
        description: exp.description || ''
      })) || [])
      setEducation(cvData.education?.map(edu => ({
        id: edu.id || crypto.randomUUID(),
        school: edu.school || '',
        degree: edu.degree || '',
        field: edu.field || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || ''
      })) || [])
      setSkills(cvData.skills?.map(s => s.name) || [])
    }
  }, [cvData])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<CVData>) => {
      return cvApi.saveCV(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cv'] })
    }
  })

  const step = CV_STEPS[currentStep]
  const StepIcon = step.icon
  const isLastStep = currentStep === CV_STEPS.length - 1
  const progress = ((currentStep + 1) / CV_STEPS.length) * 100

  const handleNext = async () => {
    if (isLastStep) {
      // Save CV
      const cvDataToSave: Partial<CVData> = {
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        title,
        workExperience: experience.map(exp => ({
          ...exp,
          location: ''
        })),
        education: education.map(edu => ({
          ...edu,
          description: ''
        })),
        skills: skills.map((name, i) => ({
          id: String(i + 1),
          name,
          level: 3,
          category: 'technical' as const
        }))
      }

      try {
        await saveMutation.mutateAsync(cvDataToSave)
        onComplete()
      } catch (error) {
        console.error('Failed to save CV:', error)
        onComplete() // Continue anyway
      }
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  // Experience helpers
  const addExperience = () => {
    setExperience(prev => [...prev, {
      id: crypto.randomUUID(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    }])
  }

  const updateExperience = (id: string, field: keyof WorkExperience, value: string | boolean) => {
    setExperience(prev => prev.map(exp =>
      exp.id === id ? { ...exp, [field]: value } : exp
    ))
  }

  const removeExperience = (id: string) => {
    setExperience(prev => prev.filter(exp => exp.id !== id))
  }

  // Education helpers
  const addEducation = () => {
    setEducation(prev => [...prev, {
      id: crypto.randomUUID(),
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: ''
    }])
  }

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setEducation(prev => prev.map(edu =>
      edu.id === id ? { ...edu, [field]: value } : edu
    ))
  }

  const removeEducation = (id: string) => {
    setEducation(prev => prev.filter(edu => edu.id !== id))
  }

  // Skills helpers
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-teal-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">
          {t('focusGuide.cv.title', 'Skapa ditt CV')}
        </h2>
        <p className="text-stone-500 dark:text-stone-400">
          {t('focusGuide.cv.subtitle', 'Vi tar det steg för steg')}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-stone-500 dark:text-stone-400">
            {t('focusGuide.stepOf', 'Steg {{current}} av {{total}}', {
              current: currentStep + 1,
              total: CV_STEPS.length
            })}
          </span>
          <span className="font-medium text-teal-600 dark:text-teal-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {CV_STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = i === currentStep
            const isDone = i < currentStep

            return (
              <div
                key={s.id}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                  isActive && 'bg-teal-500 text-white ring-4 ring-teal-500/20',
                  isDone && 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400',
                  !isActive && !isDone && 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                )}
              >
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current step form */}
      <div className="bg-white dark:bg-stone-800/50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
            <StepIcon className="w-6 h-6 text-teal-500" />
          </div>
          <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            {t(step.titleKey, step.titleDefault)}
          </h3>
        </div>

        {/* Title step */}
        {step.id === 'title' && (
          <div>
            <label
              htmlFor="job-title"
              className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2"
            >
              {t('cv.title', 'Yrkestitel')}
            </label>
            <input
              id="job-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('cv.titlePlaceholder', 't.ex. Projektledare, Säljare, Utvecklare')}
              className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              autoFocus
            />
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">
              {t('focusGuide.cv.titleHint', 'Den roll du söker eller arbetar som')}
            </p>
          </div>
        )}

        {/* Experience step */}
        {step.id === 'experience' && (
          <div className="space-y-4">
            {experience.length === 0 ? (
              <p className="text-stone-500 dark:text-stone-400 text-center py-4">
                {t('focusGuide.cv.noExperience', 'Ingen erfarenhet tillagd ännu')}
              </p>
            ) : (
              experience.map((exp, index) => (
                <div
                  key={exp.id}
                  className="p-4 bg-stone-50 dark:bg-stone-900/50 rounded-xl space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-stone-500">
                      {t('focusGuide.cv.job', 'Jobb')} {index + 1}
                    </span>
                    <button
                      onClick={() => removeExperience(exp.id)}
                      className="text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                    placeholder={t('cv.position', 'Befattning')}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                    placeholder={t('cv.company', 'Företag')}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                      placeholder={t('cv.startDate', 'Startdatum')}
                      className="flex-1 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    />
                    <input
                      type="text"
                      value={exp.current ? '' : exp.endDate}
                      onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                      placeholder={exp.current ? t('cv.current', 'Pågående') : t('cv.endDate', 'Slutdatum')}
                      disabled={exp.current}
                      className="flex-1 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                      className="rounded border-stone-300 text-teal-500 focus:ring-teal-500"
                    />
                    {t('cv.currentPosition', 'Jag jobbar här just nu')}
                  </label>
                </div>
              ))
            )}

            <button
              onClick={addExperience}
              className="flex items-center gap-2 w-full py-3 px-4 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl text-stone-500 dark:text-stone-400 hover:border-teal-500 hover:text-teal-500 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('focusGuide.cv.addExperience', 'Lägg till erfarenhet')}
            </button>

            <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
              {t('focusGuide.cv.experienceHint', 'Du kan hoppa över om du inte har någon erfarenhet')}
            </p>
          </div>
        )}

        {/* Education step */}
        {step.id === 'education' && (
          <div className="space-y-4">
            {education.length === 0 ? (
              <p className="text-stone-500 dark:text-stone-400 text-center py-4">
                {t('focusGuide.cv.noEducation', 'Ingen utbildning tillagd ännu')}
              </p>
            ) : (
              education.map((edu, index) => (
                <div
                  key={edu.id}
                  className="p-4 bg-stone-50 dark:bg-stone-900/50 rounded-xl space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-stone-500">
                      {t('focusGuide.cv.education', 'Utbildning')} {index + 1}
                    </span>
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={edu.school}
                    onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                    placeholder={t('cv.school', 'Skola/Universitet')}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                    placeholder={t('cv.field', 'Inriktning/Program')}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>
              ))
            )}

            <button
              onClick={addEducation}
              className="flex items-center gap-2 w-full py-3 px-4 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl text-stone-500 dark:text-stone-400 hover:border-teal-500 hover:text-teal-500 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('focusGuide.cv.addEducation', 'Lägg till utbildning')}
            </button>
          </div>
        )}

        {/* Skills step */}
        {step.id === 'skills' && (
          <div className="space-y-4">
            {/* Existing skills */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1 px-3 py-1.5 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-1 text-teal-500 hover:text-teal-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add skill input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill()
                  }
                }}
                placeholder={t('cv.skillPlaceholder', 'Skriv en kompetens...')}
                className="flex-1 px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
              <button
                onClick={addSkill}
                disabled={!newSkill.trim()}
                className="px-4 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Skill suggestions */}
            <div>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
                {t('focusGuide.cv.skillSuggestions', 'Vanliga kompetenser:')}
              </p>
              <div className="flex flex-wrap gap-2">
                {['Kommunikation', 'Samarbete', 'Microsoft Office', 'Problemlösning', 'Kundservice'].map((suggestion) => (
                  !skills.includes(suggestion) && (
                    <button
                      key={suggestion}
                      onClick={() => {
                        if (!skills.includes(suggestion)) {
                          setSkills(prev => [...prev, suggestion])
                        }
                      }}
                      className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full text-sm hover:bg-teal-100 hover:text-teal-700 dark:hover:bg-teal-900/50 dark:hover:text-teal-300 transition-colors"
                    >
                      + {suggestion}
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleNext}
          disabled={saveMutation.isPending}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-lg transition-all',
            'bg-teal-500 text-white hover:bg-teal-600',
            'focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('common.saving', 'Sparar...')}
            </>
          ) : isLastStep ? (
            <>
              <Check className="w-5 h-5" />
              {t('focusGuide.cv.save', 'Spara CV')}
            </>
          ) : (
            <>
              {t('common.next', 'Nästa')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <button
          onClick={onSkip}
          className="flex items-center justify-center gap-2 py-3 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          {t('focusGuide.skipStep', 'Hoppa över detta steg')}
        </button>
      </div>
    </div>
  )
}
