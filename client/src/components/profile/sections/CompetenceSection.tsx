/**
 * CompetenceSection - Skills, AI summary, documents, completion guide
 * Clean design with improved visual hierarchy
 */

import { useTranslation } from 'react-i18next'
import { Star, Sparkles, CheckCircle, FileText, Linkedin, ExternalLink } from '@/components/ui/icons'
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
      className="grid gap-4 lg:grid-cols-2"
    >
      {/* Skills Section */}
      <SectionCard
        title={t('profile.competenceSection.mySkills')}
        icon={<Star className="w-4 h-4" />}
        colorScheme="amber"
        className="lg:col-span-2"
      >
        <SkillsSection />
      </SectionCard>

      {/* AI Summary */}
      <SectionCard
        title={t('profile.competenceSection.profileSummary')}
        icon={<Sparkles className="w-4 h-4" />}
        colorScheme="teal"
        className="lg:col-span-2"
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

      {/* LinkedIn Import */}
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-xl p-5 border border-sky-200 dark:border-sky-800/50">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#0077b5] flex items-center justify-center flex-shrink-0">
            <Linkedin className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sky-800 dark:text-sky-300 text-sm">{t('profile.competenceSection.importFromLinkedIn')}</p>
            <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
              {t('profile.competenceSection.importFromLinkedInDesc')}
            </p>
            <button
              disabled
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0077b5]/10 text-[#0077b5] dark:text-sky-400 rounded-lg text-xs font-medium opacity-60 cursor-not-allowed"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t('profile.competenceSection.comingSoon')}
            </button>
          </div>
        </div>
      </div>

      {/* Completion Guide */}
      <SectionCard
        title={t('profile.competenceSection.completionGuide')}
        icon={<CheckCircle className="w-4 h-4" />}
        colorScheme="teal"
        className="lg:col-span-2"
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
