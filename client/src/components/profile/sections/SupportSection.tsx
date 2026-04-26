/**
 * SupportSection - Energy, adaptation needs, goals, timeline
 * Clean design with positive language and improved visual hierarchy
 */

import { useTranslation } from 'react-i18next'
import {
  Zap, Activity, Accessibility, TrendingUp, Target,
  Calendar, Users, FileText, X, Plus
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/stores/profileStore'
import { SectionCard, CompactInput, CompactTextarea, ChipSelect, ProgressSlider } from '../forms'
import { CareerTimeline, ProfileHistory } from '../index'
import {
  ADAPTATION_NEEDS,
  FUNCTIONAL_LEVELS,
  REHABILITATION_PHASES,
  BEST_TIME_OPTIONS
} from '../constants'

export function SupportSection() {
  const { t } = useTranslation()
  const { preferences, updatePreferences } = useProfileStore()

  // Helpers
  const updateTherapistData = (updates: typeof preferences.therapist_data) => {
    updatePreferences({ therapist_data: { ...preferences.therapist_data, ...updates } })
  }

  const updateSupportGoals = (updates: typeof preferences.support_goals) => {
    updatePreferences({ support_goals: { ...preferences.support_goals, ...updates } })
  }

  const updateConsultantData = (updates: typeof preferences.consultant_data) => {
    updatePreferences({ consultant_data: { ...preferences.consultant_data, ...updates } })
  }

  return (
    <div
      role="tabpanel"
      id="tabpanel-stod"
      aria-labelledby="tab-stod"
      className="grid gap-4 lg:grid-cols-2"
    >
      {/* Energy & capacity */}
      <SectionCard title={t('profile.support.energy')} icon={<Zap className="w-4 h-4" />} colorScheme="amber">
        <div className="space-y-4">
          <ProgressSlider
            label={t('profile.support.sustainableHours')}
            value={preferences.therapist_data?.energyLevel?.sustainableHoursPerDay || 8}
            onChange={(v) => updateTherapistData({
              energyLevel: { ...preferences.therapist_data?.energyLevel, sustainableHoursPerDay: v }
            })}
            min={1}
            max={10}
            step={1}
            unit={t('profile.support.hours')}
            colorScheme="amber"
          />
          <ProgressSlider
            label={t('profile.support.sustainableDays')}
            value={preferences.therapist_data?.energyLevel?.sustainableDaysPerWeek || 5}
            onChange={(v) => updateTherapistData({
              energyLevel: { ...preferences.therapist_data?.energyLevel, sustainableDaysPerWeek: v }
            })}
            min={1}
            max={7}
            step={1}
            unit={t('profile.support.days')}
            colorScheme="amber"
          />
          <ChipSelect
            label={t('profile.support.bestTimeOfDay')}
            options={[...BEST_TIME_OPTIONS]}
            selected={preferences.therapist_data?.energyLevel?.bestTimeOfDay || ''}
            onChange={(v) => updateTherapistData({
              energyLevel: { ...preferences.therapist_data?.energyLevel, bestTimeOfDay: v as string }
            })}
          />
        </div>
      </SectionCard>

      {/* Functional level (positive framing) */}
      <SectionCard title={t('profile.support.myCapacity')} icon={<Activity className="w-4 h-4" />} colorScheme="amber">
        <div className="space-y-4">
          <ChipSelect
            label={t('profile.support.physicalCapacity')}
            options={[...FUNCTIONAL_LEVELS]}
            selected={preferences.therapist_data?.functionalLevel?.physical || ''}
            onChange={(v) => updateTherapistData({
              functionalLevel: { ...preferences.therapist_data?.functionalLevel, physical: v as string }
            })}
          />
          <ChipSelect
            label={t('profile.support.cognitiveCapacity')}
            options={[...FUNCTIONAL_LEVELS]}
            selected={preferences.therapist_data?.functionalLevel?.cognitive || ''}
            onChange={(v) => updateTherapistData({
              functionalLevel: { ...preferences.therapist_data?.functionalLevel, cognitive: v as string }
            })}
          />
          <ChipSelect
            label={t('profile.support.socialCapacity')}
            options={[...FUNCTIONAL_LEVELS]}
            selected={preferences.therapist_data?.functionalLevel?.social || ''}
            onChange={(v) => updateTherapistData({
              functionalLevel: { ...preferences.therapist_data?.functionalLevel, social: v as string }
            })}
          />
        </div>
      </SectionCard>

      {/* Adaptation needs (positive framing) */}
      <SectionCard title={t('profile.support.howIWorkBest')} icon={<Accessibility className="w-4 h-4" />} colorScheme="teal">
        <div className="space-y-4">
          <p className="text-xs text-stone-500 dark:text-stone-400 -mt-1 mb-2">
            {t('profile.support.chooseWorkConditions')}
          </p>
          <ChipSelect
            options={[...ADAPTATION_NEEDS]}
            selected={preferences.therapist_data?.adaptationNeeds || []}
            onChange={(v) => updateTherapistData({ adaptationNeeds: v as string[] })}
            multiple
          />
          {(preferences.therapist_data?.adaptationNeeds?.length || 0) > 0 && (
            <CompactTextarea
              label={t('profile.support.describeMore')}
              value={preferences.therapist_data?.adaptationDetails || ''}
              onChange={(v) => updateTherapistData({ adaptationDetails: v })}
              rows={2}
              placeholder={t('profile.support.specificNeedsPlaceholder')}
            />
          )}
        </div>
      </SectionCard>

      {/* Rehabilitation */}
      <SectionCard title={t('profile.support.rehabilitation')} icon={<TrendingUp className="w-4 h-4" />} colorScheme="teal">
        <div className="space-y-4">
          <ChipSelect
            label={t('profile.support.rehabilitationPhase')}
            options={[...REHABILITATION_PHASES]}
            selected={preferences.therapist_data?.rehabilitationPhase || ''}
            onChange={(v) => updateTherapistData({ rehabilitationPhase: v as string })}
          />
          <CompactInput
            label={t('profile.support.nextFollowUp')}
            type="date"
            value={preferences.therapist_data?.followUpDate || ''}
            onChange={(v) => updateTherapistData({ followUpDate: v })}
          />
          <CompactTextarea
            label={t('profile.support.notes')}
            value={preferences.therapist_data?.followUpNotes || ''}
            onChange={(v) => updateTherapistData({ followUpNotes: v })}
            rows={2}
            placeholder={t('profile.support.ownNotesPlaceholder')}
          />
        </div>
      </SectionCard>

      {/* Short-term goal */}
      <SectionCard title={t('profile.support.shortTermGoal')} icon={<Target className="w-4 h-4" />} colorScheme="teal">
        <div className="space-y-4">
          <CompactTextarea
            label={t('profile.support.goal')}
            value={preferences.support_goals?.shortTerm?.goal || ''}
            onChange={(v) => updateSupportGoals({
              shortTerm: { ...preferences.support_goals?.shortTerm, goal: v }
            })}
            rows={2}
            placeholder={t('profile.support.shortTermPlaceholder')}
          />
          <CompactInput
            label={t('profile.support.deadline')}
            type="date"
            value={preferences.support_goals?.shortTerm?.deadline || ''}
            onChange={(v) => updateSupportGoals({
              shortTerm: { ...preferences.support_goals?.shortTerm, deadline: v }
            })}
          />
          <ProgressSlider
            label={t('profile.support.progress')}
            value={preferences.support_goals?.shortTerm?.progress || 0}
            onChange={(v) => updateSupportGoals({
              shortTerm: { ...preferences.support_goals?.shortTerm, progress: v }
            })}
            colorScheme="teal"
          />
        </div>
      </SectionCard>

      {/* Long-term goal */}
      <SectionCard title={t('profile.support.longTermGoal')} icon={<TrendingUp className="w-4 h-4" />} colorScheme="sky">
        <div className="space-y-4">
          <CompactTextarea
            label={t('profile.support.goal')}
            value={preferences.support_goals?.longTerm?.goal || ''}
            onChange={(v) => updateSupportGoals({
              longTerm: { ...preferences.support_goals?.longTerm, goal: v }
            })}
            rows={2}
            placeholder={t('profile.support.longTermPlaceholder')}
          />
          <CompactInput
            label={t('profile.support.deadline')}
            type="date"
            value={preferences.support_goals?.longTerm?.deadline || ''}
            onChange={(v) => updateSupportGoals({
              longTerm: { ...preferences.support_goals?.longTerm, deadline: v }
            })}
          />
          <ProgressSlider
            label={t('profile.support.progress')}
            value={preferences.support_goals?.longTerm?.progress || 0}
            onChange={(v) => updateSupportGoals({
              longTerm: { ...preferences.support_goals?.longTerm, progress: v }
            })}
            colorScheme="sky"
          />
        </div>
      </SectionCard>

      {/* Internship/Work training */}
      <SectionCard title={t('profile.support.internship')} icon={<Users className="w-4 h-4" />} colorScheme="amber">
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={preferences.consultant_data?.internship?.active || false}
              onChange={(e) => updateConsultantData({
                internship: { ...preferences.consultant_data?.internship, active: e.target.checked }
              })}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 dark:bg-stone-700"
            />
            <span className="text-sm text-stone-700 dark:text-stone-300">
              {t('profile.support.ongoingInternship')}
            </span>
          </label>
          {preferences.consultant_data?.internship?.active && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <CompactInput
                  label={t('profile.support.company')}
                  value={preferences.consultant_data?.internship?.company || ''}
                  onChange={(v) => updateConsultantData({
                    internship: { ...preferences.consultant_data?.internship, company: v }
                  })}
                  placeholder={t('profile.support.companyName')}
                />
                <CompactInput
                  label={t('profile.support.supervisor')}
                  value={preferences.consultant_data?.internship?.supervisor || ''}
                  onChange={(v) => updateConsultantData({
                    internship: { ...preferences.consultant_data?.internship, supervisor: v }
                  })}
                  placeholder={t('profile.support.name')}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <CompactInput
                  label={t('profile.support.startDate')}
                  type="date"
                  value={preferences.consultant_data?.internship?.startDate || ''}
                  onChange={(v) => updateConsultantData({
                    internship: { ...preferences.consultant_data?.internship, startDate: v }
                  })}
                />
                <CompactInput
                  label={t('profile.support.endDate')}
                  type="date"
                  value={preferences.consultant_data?.internship?.endDate || ''}
                  onChange={(v) => updateConsultantData({
                    internship: { ...preferences.consultant_data?.internship, endDate: v }
                  })}
                />
              </div>
            </>
          )}
        </div>
      </SectionCard>

      {/* Next steps */}
      <SectionCard title={t('profile.support.nextSteps')} icon={<Calendar className="w-4 h-4" />} colorScheme="teal">
        <div className="space-y-2">
          {(preferences.consultant_data?.nextSteps || []).length === 0 && (
            <p className="text-xs text-stone-400 dark:text-stone-500 italic py-2">
              Inga aktiviteter tillagda ännu
            </p>
          )}
          {(preferences.consultant_data?.nextSteps || []).map((step, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-stone-50 dark:bg-stone-800 rounded-lg group">
              <input
                type="checkbox"
                id={`step-${i}`}
                checked={step.completed}
                onChange={(e) => {
                  const steps = [...(preferences.consultant_data?.nextSteps || [])]
                  steps[i] = { ...steps[i], completed: e.target.checked }
                  updateConsultantData({ nextSteps: steps })
                }}
                className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 dark:bg-stone-700"
              />
              <label
                htmlFor={`step-${i}`}
                className={cn(
                  'flex-1 text-sm text-stone-700 dark:text-stone-300 cursor-pointer',
                  step.completed && 'line-through text-stone-400 dark:text-stone-500'
                )}
              >
                {step.activity}
              </label>
              <span className="text-xs text-stone-400 dark:text-stone-500">{step.date}</span>
              <button
                onClick={() => {
                  const steps = (preferences.consultant_data?.nextSteps || []).filter((_, idx) => idx !== i)
                  updateConsultantData({ nextSteps: steps })
                }}
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-opacity"
                aria-label={t('common.removeTag', { tag: step.activity })}
              >
                <X className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" aria-hidden="true" />
              </button>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder={t('profile.support.newActivity')}
              className="flex-1 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const steps = [...(preferences.consultant_data?.nextSteps || []), {
                    activity: e.currentTarget.value.trim(),
                    date: new Date().toISOString().split('T')[0],
                    completed: false
                  }]
                  updateConsultantData({ nextSteps: steps })
                  e.currentTarget.value = ''
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement
                if (input?.value.trim()) {
                  const steps = [...(preferences.consultant_data?.nextSteps || []), {
                    activity: input.value.trim(),
                    date: new Date().toISOString().split('T')[0],
                    completed: false
                  }]
                  updateConsultantData({ nextSteps: steps })
                  input.value = ''
                }
              }}
              className="px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Notes */}
      <SectionCard title={t('profile.support.notesTitle')} icon={<FileText className="w-4 h-4" />} colorScheme="sky" className="lg:col-span-2">
        <CompactTextarea
          label=""
          value={preferences.support_goals?.notes || ''}
          onChange={(v) => updateSupportGoals({ notes: v })}
          rows={4}
          placeholder={t('profile.support.notesPlaceholder')}
        />
      </SectionCard>

      {/* Career Timeline */}
      <SectionCard title={t('profile.support.careerTimeline')} icon={<Calendar className="w-4 h-4" />} colorScheme="teal">
        <CareerTimeline />
      </SectionCard>

      {/* Profile History */}
      <SectionCard title={t('profile.support.changeHistory')} icon={<Activity className="w-4 h-4" />} colorScheme="sky">
        <ProfileHistory />
      </SectionCard>
    </div>
  )
}
