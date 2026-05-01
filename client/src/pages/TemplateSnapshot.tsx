/**
 * Dev-route som renderar en CV-mall med rik exempeldata för screenshot.
 * Används av e2e/cv-template-snapshots.cjs för att generera thumbnail-bilder
 * till client/public/templates/. Inte länkad i någon UI — bara åtkomlig via
 * direkt URL /#/template-snapshot/<templateId>.
 *
 * Templates: sidebar | centered | minimal | creative | executive | nordic
 */

import { useParams } from 'react-router-dom'
import { CVPreview } from '@/components/cv/CVPreview'
import type { CVData } from '@/services/supabaseApi'

const SAMPLE: CVData = {
  firstName: 'Anna',
  lastName: 'Lindqvist',
  title: 'Senior Projektledare',
  email: 'anna.lindqvist@example.se',
  phone: '070-123 45 67',
  location: 'Stockholm',
  summary:
    'Erfaren projektledare med över 12 års bakgrund inom digital transformation och teamutveckling. Driver komplexa initiativ från strategi till leverans, alltid med människan i centrum. Specialiserad på agila metoder och cross-functional samarbete.',
  skills: [
    { id: '1', name: 'Projektledning', level: 5, category: 'technical' },
    { id: '2', name: 'Agila metoder', level: 5, category: 'technical' },
    { id: '3', name: 'Stakeholder management', level: 4, category: 'soft' },
    { id: '4', name: 'Budget & resursplanering', level: 4, category: 'technical' },
    { id: '5', name: 'Kommunikation', level: 5, category: 'soft' },
    { id: '6', name: 'Förändringsledning', level: 4, category: 'soft' },
  ],
  workExperience: [
    {
      id: '1',
      company: 'Tech Nordic AB',
      title: 'Senior Projektledare',
      location: 'Stockholm',
      startDate: '2021-01',
      endDate: '',
      current: true,
      description:
        'Leder digital transformation av kundresan för 200+ medarbetare. Levererade plattformsmigration på 18 månader, 30% under budget.',
    },
    {
      id: '2',
      company: 'Innovation Labs',
      title: 'Projektledare',
      location: 'Göteborg',
      startDate: '2017-03',
      endDate: '2020-12',
      current: false,
      description:
        'Drev 8 parallella IT-projekt med totalt 25 MSEK budget. Införde agila arbetssätt vilket minskade time-to-market med 40%.',
    },
    {
      id: '3',
      company: 'StartupHub',
      title: 'Junior Projektledare',
      location: 'Stockholm',
      startDate: '2014-06',
      endDate: '2017-02',
      current: false,
      description: 'Koordinerade produktlanseringar och drev cross-team-initiativ för en snabbväxande organisation.',
    },
  ],
  education: [
    {
      id: '1',
      school: 'Handelshögskolan i Stockholm',
      degree: 'Civilekonom',
      field: 'Strategy & Operations',
      location: 'Stockholm',
      startDate: '2010-08',
      endDate: '2014-05',
      description: '',
    },
    {
      id: '2',
      school: 'KTH',
      degree: 'Diplomerad agil projektledare',
      field: '',
      location: 'Stockholm',
      startDate: '2018-01',
      endDate: '2018-06',
      description: '',
    },
  ],
  languages: [
    { id: '1', language: 'Svenska', level: 'native' },
    { id: '2', language: 'Engelska', level: 'fluent' },
    { id: '3', language: 'Tyska', level: 'good' },
  ],
  certificates: [
    { id: '1', name: 'PMP - Project Management Professional', issuer: 'PMI', date: '2019-06' },
    { id: '2', name: 'Scrum Master Certified', issuer: 'Scrum Alliance', date: '2018-03' },
  ],
  links: [],
  template: 'sidebar',
  colorScheme: 'indigo',
  font: 'inter',
  profileImage: null,
}

const VALID = ['sidebar', 'centered', 'minimal', 'creative', 'executive', 'nordic'] as const

export default function TemplateSnapshot() {
  const { templateId } = useParams<{ templateId: string }>()
  const tpl = (VALID as readonly string[]).includes(templateId || '') ? templateId! : 'sidebar'

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <div style={{ width: '794px', margin: '0 auto', boxShadow: '0 0 0 1px #E5E7EB' }}>
        <CVPreview data={{ ...SAMPLE, template: tpl }} />
      </div>
    </div>
  )
}
