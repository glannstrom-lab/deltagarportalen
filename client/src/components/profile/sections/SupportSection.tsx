/**
 * SupportSection - Energy, adaptation needs, goals, timeline
 * Combines: Stöd + Mål + Tidslinje tabs with positive language
 */

import { useState } from 'react'
import {
  Zap, Activity, Accessibility, TrendingUp, Target,
  Calendar, Users, FileText, X, ClipboardList, Brain
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
  const { preferences, updatePreferences } = useProfileStore()

  // Helpers
  const updateTherapistData = (updates: typeof preferences.therapist_data) => {
    updatePreferences({ therapist_data: { ...preferences.therapist_data, ...updates } })
  }

  const updatePhysicalRequirements = (updates: typeof preferences.physical_requirements) => {
    updatePreferences({ physical_requirements: { ...preferences.physical_requirements, ...updates } })
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
      className="grid gap-4 md:grid-cols-2"
    >
      {/* Energy & capacity */}
      <SectionCard title="Energi & ork" icon={<Zap className="w-4 h-4" />} colorScheme="amber">
        <div className="space-y-4">
          <ProgressSlider
            label="Hållbar arbetstid per dag"
            value={preferences.therapist_data?.energyLevel?.sustainableHoursPerDay || 8}
            onChange={(v) => updateTherapistData({
              energyLevel: { ...preferences.therapist_data?.energyLevel, sustainableHoursPerDay: v }
            })}
            min={1}
            max={10}
            step={1}
            unit=" tim"
            colorScheme="amber"
          />
          <ProgressSlider
            label="Hållbara dagar per vecka"
            value={preferences.therapist_data?.energyLevel?.sustainableDaysPerWeek || 5}
            onChange={(v) => updateTherapistData({
              energyLevel: { ...preferences.therapist_data?.energyLevel, sustainableDaysPerWeek: v }
            })}
            min={1}
            max={7}
            step={1}
            unit=" dagar"
            colorScheme="amber"
          />
          <ChipSelect
            label="Bästa tid på dagen"
            options={[...BEST_TIME_OPTIONS]}
            selected={preferences.therapist_data?.energyLevel?.bestTimeOfDay || ''}
            onChange={(v) => updateTherapistData({
              energyLevel: { ...preferences.therapist_data?.energyLevel, bestTimeOfDay: v as string }
            })}
          />
        </div>
      </SectionCard>

      {/* Functional level (positive framing) */}
      <SectionCard title="Min kapacitet" icon={<Activity className="w-4 h-4" />} colorScheme="amber">
        <div className="space-y-4">
          <ChipSelect
            label="Fysisk kapacitet"
            options={[...FUNCTIONAL_LEVELS]}
            selected={preferences.therapist_data?.functionalLevel?.physical || ''}
            onChange={(v) => updateTherapistData({
              functionalLevel: { ...preferences.therapist_data?.functionalLevel, physical: v as string }
            })}
          />
          <ChipSelect
            label="Kognitiv kapacitet"
            options={[...FUNCTIONAL_LEVELS]}
            selected={preferences.therapist_data?.functionalLevel?.cognitive || ''}
            onChange={(v) => updateTherapistData({
              functionalLevel: { ...preferences.therapist_data?.functionalLevel, cognitive: v as string }
            })}
          />
          <ChipSelect
            label="Social kapacitet"
            options={[...FUNCTIONAL_LEVELS]}
            selected={preferences.therapist_data?.functionalLevel?.social || ''}
            onChange={(v) => updateTherapistData({
              functionalLevel: { ...preferences.therapist_data?.functionalLevel, social: v as string }
            })}
          />
        </div>
      </SectionCard>

      {/* Adaptation needs (positive framing) */}
      <SectionCard title="Hur jag jobbar bäst" icon={<Accessibility className="w-4 h-4" />} colorScheme="teal">
        <div className="space-y-4">
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
            Välj de arbetsförhållanden som passar dig bäst
          </p>
          <ChipSelect
            options={[...ADAPTATION_NEEDS]}
            selected={preferences.therapist_data?.adaptationNeeds || []}
            onChange={(v) => updateTherapistData({ adaptationNeeds: v as string[] })}
            multiple
          />
          {(preferences.therapist_data?.adaptationNeeds?.length || 0) > 0 && (
            <CompactTextarea
              label="Beskriv närmare (valfritt)"
              value={preferences.therapist_data?.adaptationDetails || ''}
              onChange={(v) => updateTherapistData({ adaptationDetails: v })}
              rows={2}
              placeholder="Beskriv dina specifika behov..."
            />
          )}
        </div>
      </SectionCard>

      {/* Rehabilitation */}
      <SectionCard title="Rehabilitering" icon={<TrendingUp className="w-4 h-4" />} colorScheme="teal">
        <div className="space-y-4">
          <ChipSelect
            label="Rehabiliteringsfas"
            options={[...REHABILITATION_PHASES]}
            selected={preferences.therapist_data?.rehabilitationPhase || ''}
            onChange={(v) => updateTherapistData({ rehabilitationPhase: v as string })}
          />
          <CompactInput
            label="Nästa uppföljning"
            type="date"
            value={preferences.therapist_data?.followUpDate || ''}
            onChange={(v) => updateTherapistData({ followUpDate: v })}
          />
          <CompactTextarea
            label="Anteckningar"
            value={preferences.therapist_data?.followUpNotes || ''}
            onChange={(v) => updateTherapistData({ followUpNotes: v })}
            rows={2}
            placeholder="Egna anteckningar..."
          />
        </div>
      </SectionCard>

      {/* Short-term goal */}
      <SectionCard title="Kortsiktigt mål" icon={<Target className="w-4 h-4" />} colorScheme="teal">
        <div className="space-y-4">
          <CompactTextarea
            label="Mål"
            value={preferences.support_goals?.shortTerm?.goal || ''}
            onChange={(v) => updateSupportGoals({
              shortTerm: { ...preferences.support_goals?.shortTerm, goal: v }
            })}
            rows={2}
            placeholder="T.ex. Skicka 5 ansökningar i veckan"
          />
          <CompactInput
            label="Deadline"
            type="date"
            value={preferences.support_goals?.shortTerm?.deadline || ''}
            onChange={(v) => updateSupportGoals({
              shortTerm: { ...preferences.support_goals?.shortTerm, deadline: v }
            })}
          />
          <ProgressSlider
            label="Framsteg"
            value={preferences.support_goals?.shortTerm?.progress || 0}
            onChange={(v) => updateSupportGoals({
              shortTerm: { ...preferences.support_goals?.shortTerm, progress: v }
            })}
            colorScheme="teal"
          />
        </div>
      </SectionCard>

      {/* Long-term goal */}
      <SectionCard title="Långsiktigt mål" icon={<TrendingUp className="w-4 h-4" />} colorScheme="sky">
        <div className="space-y-4">
          <CompactTextarea
            label="Mål"
            value={preferences.support_goals?.longTerm?.goal || ''}
            onChange={(v) => updateSupportGoals({
              longTerm: { ...preferences.support_goals?.longTerm, goal: v }
            })}
            rows={2}
            placeholder="T.ex. Få fast anställning inom mitt område"
          />
          <CompactInput
            label="Deadline"
            type="date"
            value={preferences.support_goals?.longTerm?.deadline || ''}
            onChange={(v) => updateSupportGoals({
              longTerm: { ...preferences.support_goals?.longTerm, deadline: v }
            })}
          />
          <ProgressSlider
            label="Framsteg"
            value={preferences.support_goals?.longTerm?.progress || 0}
            onChange={(v) => updateSupportGoals({
              longTerm: { ...preferences.support_goals?.longTerm, progress: v }
            })}
            colorScheme="sky"
          />
        </div>
      </SectionCard>

      {/* Internship/Work training */}
      <SectionCard title="Praktik / Arbetsträning" icon={<Users className="w-4 h-4" />} colorScheme="amber">
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.consultant_data?.internship?.active || false}
              onChange={(e) => updateConsultantData({
                internship: { ...preferences.consultant_data?.internship, active: e.target.checked }
              })}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 dark:bg-stone-700"
            />
            <span className="text-sm text-stone-700 dark:text-stone-300">
              Pågående praktik/arbetsträning
            </span>
          </label>
          {preferences.consultant_data?.internship?.active && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <CompactInput
                  label="Företag"
                  value={preferences.consultant_data?.internship?.company || ''}
                  onChange={(v) => updateConsultantData({
                    internship: { ...preferences.consultant_data?.internship, company: v }
                  })}
                  placeholder="Företagsnamn"
                />
                <CompactInput
                  label="Handledare"
                  value={preferences.consultant_data?.internship?.supervisor || ''}
                  onChange={(v) => updateConsultantData({
                    internship: { ...preferences.consultant_data?.internship, supervisor: v }
                  })}
                  placeholder="Namn"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <CompactInput
                  label="Startdatum"
                  type="date"
                  value={preferences.consultant_data?.internship?.startDate || ''}
                  onChange={(v) => updateConsultantData({
                    internship: { ...preferences.consultant_data?.internship, startDate: v }
                  })}
                />
                <CompactInput
                  label="Slutdatum"
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
      <SectionCard title="Nästa steg" icon={<Calendar className="w-4 h-4" />} colorScheme="teal">
        <div className="space-y-2">
          {(preferences.consultant_data?.nextSteps || []).map((step, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
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
              <span className="text-xs text-stone-500 dark:text-stone-400">{step.date}</span>
              <button
                onClick={() => {
                  const steps = (preferences.consultant_data?.nextSteps || []).filter((_, idx) => idx !== i)
                  updateConsultantData({ nextSteps: steps })
                }}
                className="p-1 hover:bg-stone-200 dark:hover:bg-stone-600 rounded"
                aria-label={`Ta bort: ${step.activity}`}
              >
                <X className="w-3 h-3 text-stone-400 dark:text-stone-500" aria-hidden="true" />
              </button>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Ny aktivitet..."
              className="flex-1 px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
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
          </div>
        </div>
      </SectionCard>

      {/* Notes */}
      <SectionCard title="Anteckningar" icon={<FileText className="w-4 h-4" />} colorScheme="sky" className="md:col-span-2">
        <CompactTextarea
          label=""
          value={preferences.support_goals?.notes || ''}
          onChange={(v) => updateSupportGoals({ notes: v })}
          rows={4}
          placeholder="Övriga anteckningar, observationer eller reflektioner..."
        />
      </SectionCard>

      {/* Career Timeline */}
      <SectionCard title="Karriärtidslinje" icon={<Calendar className="w-4 h-4" />} colorScheme="teal">
        <CareerTimeline />
      </SectionCard>

      {/* Profile History */}
      <SectionCard title="Ändringshistorik" icon={<Activity className="w-4 h-4" />} colorScheme="sky">
        <ProfileHistory />
      </SectionCard>
    </div>
  )
}
