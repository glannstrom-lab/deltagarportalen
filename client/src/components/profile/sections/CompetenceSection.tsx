/**
 * CompetenceSection - Skills, AI summary, documents, completion guide
 * Clean design with improved visual hierarchy
 */

import { useTranslation } from 'react-i18next'
import { Star, Sparkles, CheckCircle, FileText } from '@/components/ui/icons'
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

      {/* LinkedIn-import borttagen 2026-07-10 (B4): var en "Kommer snart"-teaser
          med permanent inaktiverad knapp — återinförs när funktionen finns */}

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
