/**
 * Contextual Knowledge Widget - Fas 2
 * 
 * Visar relevanta artiklar baserat på kontext (vilken sida användaren är på)
 */

import { useState, useEffect } from 'react'
import { 
  BookOpen, ChevronRight, Lightbulb, 
  FileText, Search, MessageSquare, Target, Award
} from '@/components/ui/icons'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { articleData } from '@/services/articleData'

// ============================================
// TYPES
// ============================================

export type KnowledgeContext = 
  | 'cv-building'
  | 'cover-letter-writing'
  | 'job-searching'
  | 'interview-prep'
  | 'rejection-handling'
  | 'salary-negotiation'
  | 'career-planning'
  | 'general'

interface ContextualArticle {
  id: string
  title: string
  excerpt: string
  context: KnowledgeContext
  readTime: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  icon: React.ComponentType<{ size: number; className?: string }>
}

// ============================================
// CONTEXT MAPPING
// ============================================

/**
 * Mappa URL-path till kunskapskontext
 */
function getContextFromPath(path: string): KnowledgeContext {
  if (path.includes('cv')) return 'cv-building'
  if (path.includes('cover-letter')) return 'cover-letter-writing'
  if (path.includes('job-search')) return 'job-searching'
  if (path.includes('job-tracker')) return 'interview-prep'
  if (path.includes('interest-guide') || path.includes('career')) return 'career-planning'
  return 'general'
}

/**
 * Hämta kontextuella artiklar baserat på nuvarande sida
 */
function getContextualArticles(context: KnowledgeContext): ContextualArticle[] {
  const articles: Record<KnowledgeContext, ContextualArticle[]> = {
    'cv-building': [
      {
        id: 'cv-1',
        title: 'Så skriver du en sammanfattning som fångar intresse',
        excerpt: 'Lär dig hur du skapar en stark öppning som gör rekryterare nyfikna på att läsa mer.',
        context: 'cv-building',
        readTime: 5,
        difficulty: 'beginner',
        icon: FileText
      },
      {
        id: 'cv-2',
        title: 'ATS-optimering: 10 saker rekryterare letar efter',
        excerpt: 'Få ditt CV att passera automatiska screening-system och nå fram till rekryteraren.',
        context: 'cv-building',
        readTime: 8,
        difficulty: 'intermediate',
        icon: Target
      },
      {
        id: 'cv-3',
        title: 'Vanliga CV-misstag och hur du undviker dem',
        excerpt: 'De vanligaste fällorna som får CV:n att hamna i papperskorgen - och hur du slipper undan.',
        context: 'cv-building',
        readTime: 6,
        difficulty: 'beginner',
        icon: Lightbulb
      },
      {
        id: 'cv-4',
        title: 'Från plikter till prestationer: Skriv resultatorienterat',
        excerpt: 'Så formulerar du dina erfarenheter för att visa vad du faktiskt åstadkommit.',
        context: 'cv-building',
        readTime: 7,
        difficulty: 'intermediate',
        icon: Award
      }
    ],
    'cover-letter-writing': [
      {
        id: 'pb-1',
        title: 'Personligt brev - struktur som fungerar',
        excerpt: 'En beprövad uppbyggnad som hjälper dig komma igång och hålla fokus.',
        context: 'cover-letter-writing',
        readTime: 5,
        difficulty: 'beginner',
        icon: FileText
      },
      {
        id: 'pb-2',
        title: 'Så anpassar du brevet till varje jobb',
        excerpt: 'Varför personlig anpassning är värt tiden och hur du gör det effektivt.',
        context: 'cover-letter-writing',
        readTime: 6,
        difficulty: 'intermediate',
        icon: Target
      },
      {
        id: 'pb-3',
        title: 'Öppningar som fångar intresse (och att undvika)',
        excerpt: 'Exempel på starka öppningar och klichéer som dödar intresset direkt.',
        context: 'cover-letter-writing',
        readTime: 5,
        difficulty: 'beginner',
        icon: Lightbulb
      }
    ],
    'job-searching': [
      {
        id: 'search-1',
        title: 'Effektiv jobbsökning: Kvalitet framför kvantitet',
        excerpt: 'Varför 5 välgenomtänkta ansökningar slår 50 generiska varje gång.',
        context: 'job-searching',
        readTime: 6,
        difficulty: 'beginner',
        icon: Search
      },
      {
        id: 'search-2',
        title: 'Dolda jobbmarknaden: Nätverka dig till drömjobbet',
        excerpt: 'Så hittar du jobb som aldrig annonseras och bygger relationer som ger resultat.',
        context: 'job-searching',
        readTime: 10,
        difficulty: 'advanced',
        icon: Lightbulb
      },
      {
        id: 'search-3',
        title: 'Så tolkar du jobbannonser mellan raderna',
        excerpt: 'Lär dig identifiera vad arbetsgivaren egentligen letar efter.',
        context: 'job-searching',
        readTime: 7,
        difficulty: 'intermediate',
        icon: Target
      }
    ],
    'interview-prep': [
      {
        id: 'interview-1',
        title: '15 vanliga intervjufrågor och hur du svarar',
        excerpt: 'Förbered dig på klassikerna som "Beskriv dig själv" och "Varför ska vi anställa dig?"',
        context: 'interview-prep',
        readTime: 12,
        difficulty: 'beginner',
        icon: MessageSquare
      },
      {
        id: 'interview-2',
        title: 'Så förbereder du dig på en video-intervju',
        excerpt: 'Tekniska tips och vanliga misstag att undvika vid digitala intervjuer.',
        context: 'interview-prep',
        readTime: 6,
        difficulty: 'beginner',
        icon: Target
      },
      {
        id: 'interview-3',
        title: 'Att klä sig för framgång: Guide till intervju-outfits',
        excerpt: 'Vad du ska ha på dig för att göra ett professionellt intryck.',
        context: 'interview-prep',
        readTime: 5,
        difficulty: 'beginner',
        icon: Award
      },
      {
        id: 'interview-4',
        title: 'Frågor DU bör ställa i intervjun',
        excerpt: 'Visa engagemang och få insikter som hjälper dig fatta rätt beslut.',
        context: 'interview-prep',
        readTime: 6,
        difficulty: 'intermediate',
        icon: Lightbulb
      }
    ],
    'rejection-handling': [
      {
        id: 'reject-1',
        title: 'Hantera avslag konstruktivt',
        excerpt: 'Så bearbetar du besvikelsen och använder avslaget som drivkraft.',
        context: 'rejection-handling',
        readTime: 5,
        difficulty: 'beginner',
        icon: Lightbulb
      },
      {
        id: 'reject-2',
        title: 'Begär feedback på din ansökan',
        excerpt: 'Konkreta tips på hur du ber om återkoppling - och vad du ska göra med den.',
        context: 'rejection-handling',
        readTime: 4,
        difficulty: 'intermediate',
        icon: MessageSquare
      }
    ],
    'salary-negotiation': [
      {
        id: 'salary-1',
        title: 'Lönesamtalet: Så förbereder och genomför du det',
        excerpt: 'Strategier för att känna dig säker och få det du är värd.',
        context: 'salary-negotiation',
        readTime: 8,
        difficulty: 'advanced',
        icon: Award
      }
    ],
    'career-planning': [
      {
        id: 'career-1',
        title: 'Sätta karriärmål som fungerar',
        excerpt: 'SMARTA mål som ger riktning och motivation i din karriär.',
        context: 'career-planning',
        readTime: 7,
        difficulty: 'beginner',
        icon: Target
      },
      {
        id: 'career-2',
        title: 'Från intresse till yrke: Nästa steg',
        excerpt: 'Så använder du dina intressen för att hitta rätt utbildning och jobb.',
        context: 'career-planning',
        readTime: 6,
        difficulty: 'beginner',
        icon: Lightbulb
      }
    ],
    'general': [
      {
        id: 'general-1',
        title: 'Jobbsökningens psykologi: Håll motivationen uppe',
        excerpt: 'Strategier för att orka fortsätta när det känns tufft.',
        context: 'general',
        readTime: 6,
        difficulty: 'beginner',
        icon: Lightbulb
      },
      {
        id: 'general-2',
        title: 'Ditt personliga varumärke i jobbsökningen',
        excerpt: 'Så förmedlar du vem du är och vad du står för.',
        context: 'general',
        readTime: 8,
        difficulty: 'intermediate',
        icon: Award
      }
    ]
  }
  
  return articles[context] || articles.general
}

// ============================================
// COMPONENT
// ============================================

interface ContextualKnowledgeWidgetProps {
  context?: KnowledgeContext
  maxArticles?: number
  variant?: 'compact' | 'full'
  className?: string
}

export function ContextualKnowledgeWidget({
  context,
  maxArticles = 3,
  variant = 'compact',
  className
}: ContextualKnowledgeWidgetProps) {
  const location = useLocation()
  const [articles, setArticles] = useState<ContextualArticle[]>([])
  const [currentContext, setCurrentContext] = useState<KnowledgeContext>('general')

  useEffect(() => {
    const detectedContext = context || getContextFromPath(location.pathname)
    setCurrentContext(detectedContext)
    setArticles(getContextualArticles(detectedContext).slice(0, maxArticles))
  }, [location.pathname, context, maxArticles])

  const getContextTitle = (ctx: KnowledgeContext): string => {
    switch (ctx) {
      case 'cv-building': return 'Tips för ditt CV'
      case 'cover-letter-writing': return 'Skriva personligt brev'
      case 'job-searching': return 'Jobbsökning'
      case 'interview-prep': return 'Förbered dig för intervjun'
      case 'rejection-handling': return 'Hantera avslag'
      case 'salary-negotiation': return 'Löneförhandling'
      case 'career-planning': return 'Karriärplanering'
      default: return 'Rekommenderat för dig'
    }
  }

  const getContextIcon = (ctx: KnowledgeContext) => {
    switch (ctx) {
      case 'cv-building': return FileText
      case 'cover-letter-writing': return FileText
      case 'job-searching': return Search
      case 'interview-prep': return MessageSquare
      default: return Lightbulb
    }
  }

  const Icon = getContextIcon(currentContext)

  if (variant === 'compact') {
    return (
      <div className={cn(
        "bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4",
        className
      )}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <Icon size={18} className="text-amber-600" />
          </div>
          <h3 className="font-semibold text-stone-900">{getContextTitle(currentContext)}</h3>
        </div>
        
        <div className="space-y-2">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/knowledge-base/article/${article.id}`}
              className="block bg-white/70 hover:bg-white rounded-lg p-3 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <article.icon size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-stone-900 text-sm line-clamp-1 group-hover:text-amber-700">
                    {article.title}
                  </h4>
                  <p className="text-xs text-stone-700 mt-0.5 line-clamp-1">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-600">
                    <span>{article.readTime} min läsning</span>
                    <span>•</span>
                    <span className={cn(
                      article.difficulty === 'beginner' ? "text-green-600" :
                      article.difficulty === 'intermediate' ? "text-amber-600" :
                      "text-rose-600"
                    )}>
                      {article.difficulty === 'beginner' ? 'Nybörjare' :
                       article.difficulty === 'intermediate' ? 'Medel' : 'Avancerad'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-stone-300 group-hover:text-amber-400 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
        
        <Link
          to="/knowledge-base"
          className="flex items-center justify-center gap-1 mt-3 text-sm text-amber-700 hover:text-amber-800 font-medium"
        >
          <BookOpen size={14} />
          Se alla artiklar
        </Link>
      </div>
    )
  }

  // Full variant
  return (
    <div className={cn(
      "bg-white rounded-xl shadow-sm border border-stone-200 p-6",
      className
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Icon size={20} className="text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-stone-900">{getContextTitle(currentContext)}</h3>
          <p className="text-sm text-stone-700">Artiklar valda för där du är nu</p>
        </div>
      </div>

      <div className="space-y-3">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/knowledge-base/article/${article.id}`}
            className="flex items-start gap-4 p-4 rounded-xl hover:bg-stone-50 transition-colors group"
          >
            <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
              <article.icon size={20} className="text-stone-600 group-hover:text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-stone-900 group-hover:text-[var(--c-text)] transition-colors">
                {article.title}
              </h4>
              <p className="text-sm text-stone-700 mt-1 line-clamp-2">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-stone-600">
                <span>{article.readTime} min läsning</span>
                <span className={cn(
                  article.difficulty === 'beginner' ? "text-green-600" :
                  article.difficulty === 'intermediate' ? "text-amber-600" :
                  "text-rose-600"
                )}>
                  {article.difficulty === 'beginner' ? 'Nybörjare' :
                   article.difficulty === 'intermediate' ? 'Medel' : 'Avancerad'}
                </span>
              </div>
            </div>
            <ChevronRight size={20} className="text-stone-300 group-hover:text-[var(--c-solid)] flex-shrink-0 mt-1" />
          </Link>
        ))}
      </div>
    </div>
  )
}

// ============================================
// SMART CONTEXT WIDGET (auto-detect from tracker status)
// ============================================

interface SmartContextWidgetProps {
  jobStatus?: 'applied' | 'interview' | 'rejected'
  className?: string
}

/**
 * Smart widget som ändrar innehåll baserat på jobbstatus
 */
export function SmartContextWidget({ jobStatus, className }: SmartContextWidgetProps) {
  const getContextFromStatus = (): KnowledgeContext => {
    switch (jobStatus) {
      case 'interview': return 'interview-prep'
      case 'rejected': return 'rejection-handling'
      default: return 'job-searching'
    }
  }

  const getStatusMessage = () => {
    switch (jobStatus) {
      case 'interview':
        return {
          title: '🎯 Intervju på gång!',
          subtitle: 'Förbered dig för att göra ditt bästa intryck'
        }
      case 'rejected':
        return {
          title: '💪 Bara ett avslag, inte ett misslyckande',
          subtitle: 'Tips för att komma tillbaka starkare'
        }
      default:
        return {
          title: '💡 Tips för din jobbsökning',
          subtitle: 'Artiklar valda för där du är nu'
        }
    }
  }

  const message = getStatusMessage()

  return (
    <div className={cn("space-y-3", className)}>
      <div className="bg-[var(--c-bg)] rounded-xl p-4 border border-[var(--c-accent)]/40">
        <h4 className="font-semibold text-[var(--c-text)]">{message.title}</h4>
        <p className="text-sm text-[var(--c-text)]">{message.subtitle}</p>
      </div>
      <ContextualKnowledgeWidget 
        context={getContextFromStatus()} 
        variant="compact"
        maxArticles={2}
      />
    </div>
  )
}
