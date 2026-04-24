/**
 * JobSearchSection - Job search preferences, mobility, status
 * Combines: Jobbsökning tab content
 */

import { useTranslation } from 'react-i18next'
import {
  Clock, FileText, Building2, Car, AlertCircle, Wallet
} from '@/components/ui/icons'
import { useProfileStore } from '@/stores/profileStore'
import { SectionCard, CompactInput, CompactSelect, CompactTextarea, ChipSelect } from '../forms'
import {
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPES,
  REMOTE_WORK_OPTIONS,
  CV_STATUSES,
  REFERENCE_STATUSES,
  AF_PROGRAMS,
  SUPPORT_NEEDS,
  DRIVERS_LICENSES,
  SECTORS,
  SWEDISH_REGIONS,
  INDUSTRIES,
  BENEFITS
} from '../constants'

export function JobSearchSection() {
  const { t } = useTranslation()
  const { preferences, updatePreferences } = useProfileStore()

  // Helper to update nested preferences
  const updateAvailability = (updates: typeof preferences.availability) => {
    updatePreferences({ availability: { ...preferences.availability, ...updates } })
  }

  const updateMobility = (updates: typeof preferences.mobility) => {
    updatePreferences({ mobility: { ...preferences.mobility, ...updates } })
  }

  const updateSalary = (updates: typeof preferences.salary) => {
    updatePreferences({ salary: { ...preferences.salary, ...updates } })
  }

  const updateLaborMarketStatus = (updates: typeof preferences.labor_market_status) => {
    updatePreferences({ labor_market_status: { ...preferences.labor_market_status, ...updates } })
  }

  const updateWorkPreferences = (updates: typeof preferences.work_preferences) => {
    updatePreferences({ work_preferences: { ...preferences.work_preferences, ...updates } })
  }

  const updateConsultantData = (updates: typeof preferences.consultant_data) => {
    updatePreferences({ consultant_data: { ...preferences.consultant_data, ...updates } })
  }

  return (
    <div
      role="tabpanel"
      id="tabpanel-jobbsok"
      aria-labelledby="tab-jobbsok"
      className="grid gap-4 md:grid-cols-2"
    >
      {/* Status & availability */}
      <SectionCard title={t('profile.jobSearch.statusAvailability')} icon={<Clock className="w-4 h-4" />} colorScheme="sky">
        <div className="space-y-4">
          <ChipSelect
            label={t('profile.jobSearch.currentStatus')}
            options={[...EMPLOYMENT_STATUSES]}
            selected={preferences.availability?.status || ''}
            onChange={(v) => updateAvailability({ status: v as string })}
          />
          <ChipSelect
            label={t('profile.jobSearch.desiredEmployment')}
            options={[...EMPLOYMENT_TYPES]}
            selected={preferences.availability?.employmentTypes || []}
            onChange={(v) => updateAvailability({ employmentTypes: v as string[] })}
            multiple
          />
          <ChipSelect
            label={t('profile.jobSearch.remoteWork')}
            options={[...REMOTE_WORK_OPTIONS]}
            selected={preferences.availability?.remoteWork || ''}
            onChange={(v) => updateAvailability({ remoteWork: v as string })}
          />
        </div>
      </SectionCard>

      {/* CV & Activity */}
      <SectionCard title={t('profile.jobSearch.cvActivity')} icon={<FileText className="w-4 h-4" />} colorScheme="sky">
        <div className="space-y-4">
          <ChipSelect
            label={t('profile.jobSearch.cvStatus')}
            options={[...CV_STATUSES]}
            selected={preferences.consultant_data?.cvStatus || ''}
            onChange={(v) => updateConsultantData({ cvStatus: v as string })}
          />
          <div className="grid grid-cols-3 gap-2">
            <CompactInput
              label={t('profile.jobSearch.applications')}
              type="number"
              value={preferences.consultant_data?.activityLevel?.applicationsSent?.toString() || ''}
              onChange={(v) => updateConsultantData({
                activityLevel: {
                  ...preferences.consultant_data?.activityLevel,
                  applicationsSent: parseInt(v) || 0
                }
              })}
              placeholder="0"
            />
            <CompactInput
              label={t('profile.jobSearch.interviews')}
              type="number"
              value={preferences.consultant_data?.activityLevel?.interviews?.toString() || ''}
              onChange={(v) => updateConsultantData({
                activityLevel: {
                  ...preferences.consultant_data?.activityLevel,
                  interviews: parseInt(v) || 0
                }
              })}
              placeholder="0"
            />
            <CompactInput
              label={t('profile.jobSearch.contacts')}
              type="number"
              value={preferences.consultant_data?.activityLevel?.employerContacts?.toString() || ''}
              onChange={(v) => updateConsultantData({
                activityLevel: {
                  ...preferences.consultant_data?.activityLevel,
                  employerContacts: parseInt(v) || 0
                }
              })}
              placeholder="0"
            />
          </div>
          <ChipSelect
            label={t('profile.jobSearch.references')}
            options={[...REFERENCE_STATUSES]}
            selected={preferences.consultant_data?.references || ''}
            onChange={(v) => updateConsultantData({ references: v as string })}
          />
        </div>
      </SectionCard>

      {/* Labor market status */}
      <SectionCard title={t('profile.jobSearch.laborMarketStatus')} icon={<Building2 className="w-4 h-4" />} colorScheme="teal">
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.labor_market_status?.registeredAtAF || false}
              onChange={(e) => updateLaborMarketStatus({ registeredAtAF: e.target.checked })}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 focus:ring-teal-500 dark:bg-stone-700"
            />
            <span className="text-sm text-stone-700 dark:text-stone-300">
              {t('profile.jobSearch.registeredAF')}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.labor_market_status?.participatingInProgram || false}
              onChange={(e) => updateLaborMarketStatus({ participatingInProgram: e.target.checked })}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 focus:ring-teal-500 dark:bg-stone-700"
            />
            <span className="text-sm text-stone-700 dark:text-stone-300">{t('profile.jobSearch.participatingInProgram')}</span>
          </label>
          {preferences.labor_market_status?.participatingInProgram && (
            <CompactSelect
              label={t('profile.jobSearch.program')}
              options={[...AF_PROGRAMS]}
              value={preferences.labor_market_status?.programName || ''}
              onChange={(v) => updateLaborMarketStatus({ programName: v })}
            />
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.labor_market_status?.hasActivitySupport || false}
              onChange={(e) => updateLaborMarketStatus({ hasActivitySupport: e.target.checked })}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 focus:ring-teal-500 dark:bg-stone-700"
            />
            <span className="text-sm text-stone-700 dark:text-stone-300">
              {t('profile.jobSearch.hasActivitySupport')}
            </span>
          </label>
        </div>
      </SectionCard>

      {/* Mobility */}
      <SectionCard title={t('profile.jobSearch.mobility')} icon={<Car className="w-4 h-4" />} colorScheme="teal">
        <div className="space-y-4">
          <ChipSelect
            label={t('profile.jobSearch.driversLicense')}
            options={DRIVERS_LICENSES.map(l => ({ value: l, label: l }))}
            selected={preferences.mobility?.driversLicense || []}
            onChange={(v) => updateMobility({ driversLicense: v as string[] })}
            multiple
          />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.mobility?.hasCar || false}
                onChange={(e) => updateMobility({ hasCar: e.target.checked })}
                className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 dark:bg-stone-700"
              />
              <span className="text-sm text-stone-700 dark:text-stone-300">{t('profile.jobSearch.hasCar')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.mobility?.willingToRelocate || false}
                onChange={(e) => updateMobility({ willingToRelocate: e.target.checked })}
                className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 dark:bg-stone-700"
              />
              <span className="text-sm text-stone-700 dark:text-stone-300">{t('profile.jobSearch.canRelocate')}</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              {t('profile.jobSearch.maxCommute', { minutes: preferences.mobility?.maxCommuteMinutes || 45 })}
            </label>
            <input
              type="range"
              min={15}
              max={120}
              step={15}
              value={preferences.mobility?.maxCommuteMinutes || 45}
              onChange={(e) => updateMobility({ maxCommuteMinutes: parseInt(e.target.value) })}
              aria-label={t('profile.jobSearch.maxCommuteAria')}
              aria-valuemin={15}
              aria-valuemax={120}
              aria-valuenow={preferences.mobility?.maxCommuteMinutes || 45}
              className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full appearance-none cursor-pointer accent-teal-500"
            />
          </div>
        </div>
      </SectionCard>

      {/* Support needs (positive language) */}
      <SectionCard title={t('profile.jobSearch.supportNeeds')} icon={<AlertCircle className="w-4 h-4" />} colorScheme="amber">
        <div className="space-y-4">
          <ChipSelect
            label={t('profile.jobSearch.supportAreas')}
            options={[...SUPPORT_NEEDS]}
            selected={preferences.consultant_data?.workBarriers || []}
            onChange={(v) => updateConsultantData({ workBarriers: v as string[] })}
            multiple
            hint={t('profile.jobSearch.supportHint')}
          />
          {(preferences.consultant_data?.workBarriers?.length || 0) > 0 && (
            <CompactTextarea
              label={t('profile.jobSearch.describeMore')}
              value={preferences.consultant_data?.barrierDetails || ''}
              onChange={(v) => updateConsultantData({ barrierDetails: v })}
              rows={2}
              placeholder={t('profile.jobSearch.supportPlaceholder')}
            />
          )}
        </div>
      </SectionCard>

      {/* Salary & benefits */}
      <SectionCard title={t('profile.jobSearch.salaryBenefits')} icon={<Wallet className="w-4 h-4" />} colorScheme="sky">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <CompactInput
              label={t('profile.jobSearch.minSalary')}
              type="number"
              value={preferences.salary?.expectationMin?.toString() || ''}
              onChange={(v) => updateSalary({ expectationMin: parseInt(v) || undefined })}
              placeholder="25 000"
            />
            <CompactInput
              label={t('profile.jobSearch.desiredSalary')}
              type="number"
              value={preferences.salary?.expectationMax?.toString() || ''}
              onChange={(v) => updateSalary({ expectationMax: parseInt(v) || undefined })}
              placeholder="35 000"
            />
          </div>
          <ChipSelect
            label={t('profile.jobSearch.importantBenefits')}
            options={BENEFITS.map(b => ({ value: b, label: b }))}
            selected={preferences.salary?.importantBenefits || []}
            onChange={(v) => updateSalary({ importantBenefits: v as string[] })}
            multiple
          />
        </div>
      </SectionCard>

      {/* Work preferences */}
      <SectionCard title={t('profile.jobSearch.workPreferences')} icon={<Building2 className="w-4 h-4" />} colorScheme="sky" className="md:col-span-2">
        <div className="grid gap-4 md:grid-cols-3">
          <ChipSelect
            label={t('profile.jobSearch.sector')}
            options={[...SECTORS]}
            selected={preferences.work_preferences?.sectors || []}
            onChange={(v) => updateWorkPreferences({ sectors: v as string[] })}
            multiple
          />
          <ChipSelect
            label={t('profile.jobSearch.geographicArea')}
            options={SWEDISH_REGIONS.slice(0, 10).map(r => ({ value: r, label: r }))}
            selected={preferences.consultant_data?.geographicScope || []}
            onChange={(v) => updateConsultantData({ geographicScope: v as string[] })}
            multiple
          />
          <ChipSelect
            label={t('profile.jobSearch.industries')}
            options={INDUSTRIES.map(i => ({ value: i, label: i }))}
            selected={preferences.consultant_data?.targetIndustries || []}
            onChange={(v) => updateConsultantData({ targetIndustries: v as string[] })}
            multiple
          />
        </div>
      </SectionCard>
    </div>
  )
}
