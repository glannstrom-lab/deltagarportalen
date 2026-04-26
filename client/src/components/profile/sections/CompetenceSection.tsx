/**
 * CompetenceSection - Skills, AI summary, documents, completion guide
 * Combines: Kompetenser + Dokument tabs
 */

import { useTranslation } from 'react-i18next'
import { Star, Sparkles, CheckCircle, FileText, Linkedin } from '@/components/ui/icons'
import { useProfileStore } from '@/stores/profileStore'
import { SectionCard } from '../forms'
import {
  SkillsSection,
  DocumentsSection,
  AISummary,
  CompletionGuide
} from '../index'

export function CompetenceSection() {
  const { t } = useTranslation()
  const { profile, cvData, enhancements } = useProfileStore()

  return (
    <div
      role="tabpanel"
      id="tabpanel-kompetens"
      aria-labelledby="tab-kompetens"
      className="grid gap-4 md:grid-cols-2"
    >
      {/* Skills Section */}
      <SectionCard
        title={t('profile.competenceSection.mySkills')}
        icon={<Star className="w-4 h-4" />}
        colorScheme="amber"
        className="md:col-span-2"
      >
        <SkillsSection />
      </SectionCard>

      {/* AI Summary */}
      <SectionCard
        title={t('profile.competenceSection.profileSummary')}
        icon={<Sparkles className="w-4 h-4" />}
        colorScheme="teal"
        className="md:col-span-2"
      >
        <AISummary />
      </SectionCard>

      {/* Documents */}
      <SectionCard
        title={t('profile.competenceSection.certificatesDocuments')}
        icon={<FileText className="w-4 h-4" />}
        colorScheme="sky"
      >
        <DocumentsSection />
      </SectionCard>

      {/* LinkedIn Import (placeholder) */}
      <div className="p-6 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-2xl border border-sky-200 dark:border-sky-800/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0077b5] flex items-center justify-center flex-shrink-0">
            <Linkedin className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sky-800 dark:text-sky-300">{t('profile.competenceSection.importFromLinkedIn')}</p>
            <p className="text-sm text-sky-600 dark:text-sky-400">
              {t('profile.competenceSection.importFromLinkedInDesc')}
            </p>
          </div>
          <button
            disabled
            className="px-4 py-2 bg-[#0077b5] text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
          >
            {t('profile.competenceSection.comingSoon')}
          </button>
        </div>
      </div>

      {/* Completion Guide */}
      <SectionCard
        title={t('profile.competenceSection.completionGuide')}
        icon={<CheckCircle className="w-4 h-4" />}
        colorScheme="sky"
        className="md:col-span-2"
      >
        <CompletionGuide
          profile={profile}
          cv={cvData}
          skillsCount={enhancements.skillsCount}
          documentsCount={enhancements.documentsCount}
          hasSummary={enhancements.hasSummary}
        />
      </SectionCard>
    </div>
  )
}
