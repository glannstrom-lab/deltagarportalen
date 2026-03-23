/**
 * ResourcesTab - Goal Templates, Job Collections, and Best Practices
 * Resource library for consultants to use with participants
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Target,
  Briefcase,
  BookOpen,
  FileText,
  Search,
  Plus,
  Copy,
  Star,
  ChevronRight,
  Clock,
  Users,
  Lightbulb,
  CheckCircle,
  Folder,
  Tag,
  Download,
  Share2,
  MoreVertical,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface GoalTemplate {
  id: string
  title: string
  category: 'cv' | 'job_search' | 'interview' | 'networking' | 'skills'
  description: string
  specific: string
  measurable: string
  achievable: string
  relevant: string
  timeBound: string
  usageCount: number
  isStarred: boolean
}

interface JobCollection {
  id: string
  name: string
  description: string
  industry: string
  jobCount: number
  createdAt: string
  sharedWith: number
}

interface BestPractice {
  id: string
  title: string
  category: 'onboarding' | 'coaching' | 'followup' | 'crisis'
  description: string
  steps: string[]
}

// Template Card Component
function TemplateCard({
  template,
  onUse,
  onStar,
}: {
  template: GoalTemplate
  onUse: (template: GoalTemplate) => void
  onStar: (id: string) => void
}) {
  const categoryLabels = {
    cv: { label: 'CV', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    job_search: { label: 'Jobbsökning', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    interview: { label: 'Intervju', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
    networking: { label: 'Nätverk', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    skills: { label: 'Kompetens', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  }

  const category = categoryLabels[template.category]

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', category.color)}>
          {category.label}
        </span>
        <button
          onClick={() => onStar(template.id)}
          className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
        >
          <Star className={cn(
            'w-4 h-4',
            template.isStarred ? 'fill-amber-400 text-amber-400' : 'text-stone-400'
          )} />
        </button>
      </div>
      <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">
        {template.title}
      </h4>
      <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-4">
        {template.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-400 flex items-center gap-1">
          <Users className="w-3 h-3" />
          Använd {template.usageCount} gånger
        </span>
        <Button size="sm" onClick={() => onUse(template)}>
          <Copy className="w-3 h-3 mr-1.5" />
          Använd
        </Button>
      </div>
    </Card>
  )
}

// Job Collection Card Component
function JobCollectionCard({
  collection,
  onView,
  onShare,
}: {
  collection: JobCollection
  onView: (collection: JobCollection) => void
  onShare: (id: string) => void
}) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-xl">
          <Folder className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <button className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
          <MoreVertical className="w-4 h-4 text-stone-400" />
        </button>
      </div>
      <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
        {collection.name}
      </h4>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
        {collection.description}
      </p>
      <div className="flex items-center gap-3 text-xs text-stone-400 mb-4">
        <span className="flex items-center gap-1">
          <Briefcase className="w-3 h-3" />
          {collection.jobCount} jobb
        </span>
        <span className="flex items-center gap-1">
          <Tag className="w-3 h-3" />
          {collection.industry}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onView(collection)}>
          Visa
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onShare(collection.id)}>
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}

// Best Practice Card Component
function BestPracticeCard({
  practice,
  onView,
}: {
  practice: BestPractice
  onView: (practice: BestPractice) => void
}) {
  const categoryLabels = {
    onboarding: { label: 'Onboarding', icon: Users },
    coaching: { label: 'Coachning', icon: Lightbulb },
    followup: { label: 'Uppföljning', icon: Clock },
    crisis: { label: 'Krishantering', icon: Target },
  }

  const category = categoryLabels[practice.category]
  const Icon = category.icon

  return (
    <button
      onClick={() => onView(practice)}
      className="w-full text-left p-4 bg-stone-50 dark:bg-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white dark:bg-stone-900 rounded-lg shadow-sm">
          <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-stone-900 dark:text-stone-100 mb-1">
            {practice.title}
          </h4>
          <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2">
            {practice.description}
          </p>
          <span className="inline-flex items-center gap-1 mt-2 text-xs text-violet-600">
            {practice.steps.length} steg
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </button>
  )
}

export function ResourcesTab() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<'templates' | 'collections' | 'practices'>('templates')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Mock data - TODO: Fetch from database
  const goalTemplates: GoalTemplate[] = [
    {
      id: '1',
      title: 'Förbättra CV till 80+ poäng',
      category: 'cv',
      description: 'Ett stegvist mål för att förbättra CV-kvaliteten med fokus på ATS-optimering och relevanta nyckelord.',
      specific: 'Förbättra mitt CV så att det får minst 80 poäng i ATS-systemet',
      measurable: 'CV-poäng ökar från nuvarande till minst 80/100',
      achievable: 'Genomförbart genom att följa CV-guiden och få feedback',
      relevant: 'Högre CV-poäng ökar chansen att passera första urvalet',
      timeBound: '2 veckor',
      usageCount: 47,
      isStarred: true,
    },
    {
      id: '2',
      title: 'Skicka 10 ansökningar per vecka',
      category: 'job_search',
      description: 'Systematiskt jobbsökande med fokus på kvalitativa ansökningar.',
      specific: 'Skicka 10 kvalitativa jobbansökningar varje vecka',
      measurable: '10 ansökningar loggade i systemet per vecka',
      achievable: 'Ca 2 ansökningar per dag, 5 dagar i veckan',
      relevant: 'Fler ansökningar ökar chansen att få intervjuer',
      timeBound: 'Pågående, utvärdering varje fredag',
      usageCount: 34,
      isStarred: false,
    },
    {
      id: '3',
      title: 'Förbereda för intervju',
      category: 'interview',
      description: 'Strukturerad förberedelse inför en kommande intervju.',
      specific: 'Förbereda svar på vanliga frågor och researcha företaget',
      measurable: '10 förberedda svar, 5 frågor till arbetsgivaren',
      achievable: 'Använd intervjusimulatorn och guider',
      relevant: 'God förberedelse ökar chansen att imponera',
      timeBound: '3 dagar före intervjun',
      usageCount: 28,
      isStarred: true,
    },
    {
      id: '4',
      title: 'Utöka LinkedIn-nätverket',
      category: 'networking',
      description: 'Strategiskt nätverkande på LinkedIn för att öka synlighet.',
      specific: 'Anslut med 20 nya relevanta kontakter inom min bransch',
      measurable: '20 nya accepterade kontakter',
      achievable: 'Skicka personliga inbjudningar dagligen',
      relevant: 'Större nätverk ökar chansen att hitta dolda jobb',
      timeBound: '1 månad',
      usageCount: 19,
      isStarred: false,
    },
    {
      id: '5',
      title: 'Lära sig ny kompetens',
      category: 'skills',
      description: 'Strukturerat lärande av en efterfrågad kompetens.',
      specific: 'Genomföra en online-kurs inom vald kompetens',
      measurable: 'Kurs genomförd med certifikat',
      achievable: '1-2 timmar per dag under kursen',
      relevant: 'Ökar anställningsbarhet och löneutrymme',
      timeBound: '4 veckor',
      usageCount: 15,
      isStarred: false,
    },
  ]

  const jobCollections: JobCollection[] = [
    {
      id: '1',
      name: 'IT & Tech - Stockholm',
      description: 'Aktuella IT-jobb i Stockholmsområdet',
      industry: 'IT',
      jobCount: 24,
      createdAt: new Date().toISOString(),
      sharedWith: 3,
    },
    {
      id: '2',
      name: 'Ekonomi & Administration',
      description: 'Ekonomijobb för nyutexaminerade',
      industry: 'Ekonomi',
      jobCount: 18,
      createdAt: new Date().toISOString(),
      sharedWith: 5,
    },
    {
      id: '3',
      name: 'Vård & Omsorg',
      description: 'Jobb inom vårdsektorn',
      industry: 'Vård',
      jobCount: 31,
      createdAt: new Date().toISOString(),
      sharedWith: 2,
    },
  ]

  const bestPractices: BestPractice[] = [
    {
      id: '1',
      title: 'Första mötet med ny deltagare',
      category: 'onboarding',
      description: 'Checklista och tips för att skapa en bra start med nya deltagare.',
      steps: [
        'Välkomna och presentera dig',
        'Gå igenom deltagarens bakgrund och mål',
        'Förklara hur portalen fungerar',
        'Sätt upp första SMARTA-målet tillsammans',
        'Boka nästa möte',
      ],
    },
    {
      id: '2',
      title: 'Effektiv coachning-session',
      category: 'coaching',
      description: 'Struktur för en 30-minuters coachning-session.',
      steps: [
        'Check-in: Hur mår deltagaren? (5 min)',
        'Review: Genomgång av mål och framsteg (10 min)',
        'Fokus: Djupdyk i aktuellt område (10 min)',
        'Action: Sätt nya delmål (5 min)',
      ],
    },
    {
      id: '3',
      title: 'Uppföljning av inaktiv deltagare',
      category: 'followup',
      description: 'Hur du återengagerar en deltagare som blivit inaktiv.',
      steps: [
        'Skicka vänligt meddelande',
        'Ring om inget svar inom 2 dagar',
        'Fråga om hinder och utmaningar',
        'Anpassa målen om nödvändigt',
        'Sätt upp kort uppföljning',
      ],
    },
    {
      id: '4',
      title: 'Hantera motgångar och avslag',
      category: 'crisis',
      description: 'Stötta deltagare som fått avslag eller känner sig nedstämda.',
      steps: [
        'Lyssna aktivt och validera känslor',
        'Normalisera: avslag är en del av processen',
        'Analysera: vad kan vi lära oss?',
        'Fokusera framåt: nästa steg',
        'Följ upp inom kort',
      ],
    },
  ]

  const filteredTemplates = goalTemplates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveSection('templates')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap',
            activeSection === 'templates'
              ? 'bg-violet-600 text-white'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
          )}
        >
          <Target className="w-5 h-5" />
          Målmallar
        </button>
        <button
          onClick={() => setActiveSection('collections')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap',
            activeSection === 'collections'
              ? 'bg-violet-600 text-white'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
          )}
        >
          <Briefcase className="w-5 h-5" />
          Jobbsamlingar
        </button>
        <button
          onClick={() => setActiveSection('practices')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap',
            activeSection === 'practices'
              ? 'bg-violet-600 text-white'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
          )}
        >
          <BookOpen className="w-5 h-5" />
          Best Practices
        </button>
      </div>

      {/* Goal Templates Section */}
      {activeSection === 'templates' && (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Sök mallar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 rounded-xl',
                  'bg-stone-100 dark:bg-stone-800',
                  'border-2 border-transparent focus:border-violet-500',
                  'text-stone-900 dark:text-stone-100'
                )}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className={cn(
                'px-4 py-2.5 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-2 border-transparent',
                'text-stone-900 dark:text-stone-100'
              )}
            >
              <option value="all">Alla kategorier</option>
              <option value="cv">CV</option>
              <option value="job_search">Jobbsökning</option>
              <option value="interview">Intervju</option>
              <option value="networking">Nätverk</option>
              <option value="skills">Kompetens</option>
            </select>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Skapa mall
            </Button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={t => console.log('Use template:', t)}
                onStar={id => console.log('Star template:', id)}
              />
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <Card className="p-12 text-center">
              <Target className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
              <p className="text-stone-500 dark:text-stone-400">
                Inga mallar matchade din sökning
              </p>
            </Card>
          )}
        </>
      )}

      {/* Job Collections Section */}
      {activeSection === 'collections' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-stone-500 dark:text-stone-400">
              Skapa och dela jobbsamlingar med dina deltagare
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ny samling
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobCollections.map(collection => (
              <JobCollectionCard
                key={collection.id}
                collection={collection}
                onView={c => console.log('View collection:', c)}
                onShare={id => console.log('Share collection:', id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Best Practices Section */}
      {activeSection === 'practices' && (
        <>
          <p className="text-stone-500 dark:text-stone-400">
            Beprövade metoder och checklistor för effektivt konsulentarbete
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestPractices.map(practice => (
              <BestPracticeCard
                key={practice.id}
                practice={practice}
                onView={p => console.log('View practice:', p)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
