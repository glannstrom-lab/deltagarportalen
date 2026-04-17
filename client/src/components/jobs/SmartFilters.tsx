/**
 * Smart Filters Component
 * Feature #8: Konkurrens-Indikator - uppskattad konkurrens baserat på hur länge annonser ligger uppe
 * Feature #9: Säsongsanpassade Jobb - visa sommarjobb/julextra vid rätt tidpunkt
 * Feature #10: Språkbaserad Matchning - hitta jobb där språkkunskaper efterfrågas
 */
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Sun,
  Snowflake,
  Languages,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  ChevronDown,
} from '@/components/ui/icons';
import { Card, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { searchJobs, type PlatsbankenJob } from '@/services/arbetsformedlingenApi';

// Competition level based on job posting age
type CompetitionLevel = 'low' | 'medium' | 'high';

// Language options for search
const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'Engelska', nameEn: 'English', searchTerms: ['english', 'engelska'] },
  { code: 'sv', name: 'Svenska', nameEn: 'Swedish', searchTerms: ['svenska', 'swedish'] },
  { code: 'de', name: 'Tyska', nameEn: 'German', searchTerms: ['tyska', 'german', 'deutsch'] },
  { code: 'fr', name: 'Franska', nameEn: 'French', searchTerms: ['franska', 'french', 'français'] },
  { code: 'es', name: 'Spanska', nameEn: 'Spanish', searchTerms: ['spanska', 'spanish', 'español'] },
  { code: 'ar', name: 'Arabiska', nameEn: 'Arabic', searchTerms: ['arabiska', 'arabic', 'العربية'] },
  { code: 'zh', name: 'Kinesiska', nameEn: 'Chinese', searchTerms: ['kinesiska', 'chinese', 'mandarin'] },
  { code: 'fi', name: 'Finska', nameEn: 'Finnish', searchTerms: ['finska', 'finnish', 'suomi'] },
  { code: 'no', name: 'Norska', nameEn: 'Norwegian', searchTerms: ['norska', 'norwegian', 'norsk'] },
  { code: 'da', name: 'Danska', nameEn: 'Danish', searchTerms: ['danska', 'danish', 'dansk'] },
  { code: 'pl', name: 'Polska', nameEn: 'Polish', searchTerms: ['polska', 'polish', 'polski'] },
  { code: 'ru', name: 'Ryska', nameEn: 'Russian', searchTerms: ['ryska', 'russian', 'русский'] },
];

// Seasonal job categories
const SEASONAL_CATEGORIES = {
  summer: {
    icon: Sun,
    label: { sv: 'Sommarjobb', en: 'Summer Jobs' },
    months: [4, 5, 6, 7, 8], // April-August
    searchTerms: ['sommar', 'summer', 'säsong', 'extra', 'visstid'],
    color: 'amber',
  },
  winter: {
    icon: Snowflake,
    label: { sv: 'Julextra & Vinter', en: 'Holiday & Winter' },
    months: [10, 11, 12, 1, 2], // October-February
    searchTerms: ['jul', 'christmas', 'holiday', 'vinter', 'winter', 'extra'],
    color: 'sky',
  },
};

// Calculate competition level based on job age
function getCompetitionLevel(job: PlatsbankenJob): CompetitionLevel {
  const publishDate = new Date(job.publication_date);
  const now = new Date();
  const daysOld = Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24));

  // Fresh jobs = high competition (many applicants per day)
  // Old jobs = either low competition or filled
  if (daysOld <= 3) return 'high';
  if (daysOld <= 10) return 'medium';
  return 'low';
}

// Competition indicator component
interface CompetitionIndicatorProps {
  job: PlatsbankenJob;
}

export function CompetitionIndicator({ job }: CompetitionIndicatorProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const level = getCompetitionLevel(job);

  const config = {
    low: {
      icon: TrendingDown,
      label: lang === 'en' ? 'Low competition' : 'Låg konkurrens',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
      description: lang === 'en' ? 'Fewer applicants likely' : 'Troligen färre sökande',
    },
    medium: {
      icon: Minus,
      label: lang === 'en' ? 'Medium' : 'Medel',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      description: lang === 'en' ? 'Average competition' : 'Normal konkurrens',
    },
    high: {
      icon: TrendingUp,
      label: lang === 'en' ? 'High competition' : 'Hög konkurrens',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      description: lang === 'en' ? 'Many applicants expected' : 'Många sökande förväntas',
    },
  };

  const { icon: Icon, label, color, bg, description } = config[level];

  return (
    <div className={cn('px-2 py-1 rounded-lg flex items-center gap-1.5', bg)}>
      <Icon className={cn('w-3.5 h-3.5', color)} />
      <span className={cn('text-xs font-medium', color)}>{label}</span>
    </div>
  );
}

// Check if job matches language requirement
function jobMatchesLanguage(job: PlatsbankenJob, languageTerms: string[]): boolean {
  const text = [
    job.headline,
    job.description?.text,
    job.occupation?.label,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return languageTerms.some((term) => text.includes(term.toLowerCase()));
}

// Check if job is seasonal
function isSeasonalJob(job: PlatsbankenJob, terms: string[]): boolean {
  const text = [job.headline, job.description?.text]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return terms.some((term) => text.includes(term.toLowerCase()));
}

// Main Smart Filters component
export function SmartFilters() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [jobs, setJobs] = useState<PlatsbankenJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'none' | 'competition' | 'seasonal' | 'language'>('none');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  // Determine current season
  const currentMonth = new Date().getMonth() + 1;
  const currentSeason = SEASONAL_CATEGORIES.summer.months.includes(currentMonth)
    ? 'summer'
    : SEASONAL_CATEGORIES.winter.months.includes(currentMonth)
    ? 'winter'
    : null;

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const result = await searchJobs({ limit: 50 });
        setJobs(result.hits);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Filter jobs based on active filter
  const filteredJobs = useMemo(() => {
    if (activeFilter === 'competition') {
      // Sort by competition level (low first)
      return [...jobs].sort((a, b) => {
        const levels = { low: 0, medium: 1, high: 2 };
        return levels[getCompetitionLevel(a)] - levels[getCompetitionLevel(b)];
      });
    }

    if (activeFilter === 'seasonal' && currentSeason) {
      const terms = SEASONAL_CATEGORIES[currentSeason].searchTerms;
      return jobs.filter((job) => isSeasonalJob(job, terms));
    }

    if (activeFilter === 'language' && selectedLanguages.length > 0) {
      const allTerms = selectedLanguages.flatMap((code) => {
        const lang = LANGUAGE_OPTIONS.find((l) => l.code === code);
        return lang?.searchTerms || [];
      });
      return jobs.filter((job) => jobMatchesLanguage(job, allTerms));
    }

    return jobs;
  }, [jobs, activeFilter, selectedLanguages, currentSeason]);

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Competition filter */}
        <button
          onClick={() =>
            setActiveFilter(activeFilter === 'competition' ? 'none' : 'competition')
          }
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors border-2',
            activeFilter === 'competition'
              ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-transparent hover:bg-stone-200 dark:hover:bg-stone-700'
          )}
        >
          <Users className="w-4 h-4" />
          {lang === 'en' ? 'Low Competition' : 'Låg konkurrens'}
          {activeFilter === 'competition' && (
            <CheckCircle className="w-4 h-4" />
          )}
        </button>

        {/* Seasonal filter */}
        {currentSeason && (
          <button
            onClick={() =>
              setActiveFilter(activeFilter === 'seasonal' ? 'none' : 'seasonal')
            }
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors border-2',
              activeFilter === 'seasonal'
                ? currentSeason === 'summer'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                  : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-700'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-transparent hover:bg-stone-200 dark:hover:bg-stone-700'
            )}
          >
            {currentSeason === 'summer' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Snowflake className="w-4 h-4" />
            )}
            {SEASONAL_CATEGORIES[currentSeason].label[lang === 'en' ? 'en' : 'sv']}
            {activeFilter === 'seasonal' && (
              <CheckCircle className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Language filter */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageSelector(!showLanguageSelector)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors border-2',
              activeFilter === 'language' && selectedLanguages.length > 0
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-transparent hover:bg-stone-200 dark:hover:bg-stone-700'
            )}
          >
            <Languages className="w-4 h-4" />
            {selectedLanguages.length > 0
              ? `${selectedLanguages.length} ${lang === 'en' ? 'languages' : 'språk'}`
              : lang === 'en'
              ? 'Language Skills'
              : 'Språkkunskaper'}
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform',
                showLanguageSelector && 'rotate-180'
              )}
            />
          </button>

          {/* Language dropdown */}
          {showLanguageSelector && (
            <Card className="absolute top-full left-0 mt-2 p-3 z-20 w-64 shadow-lg">
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                {lang === 'en' ? 'Select languages you speak:' : 'Välj språk du talar:'}
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {LANGUAGE_OPTIONS.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => {
                      toggleLanguage(language.code);
                      setActiveFilter('language');
                    }}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                      selectedLanguages.includes(language.code)
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : 'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                    )}
                  >
                    {lang === 'en' ? language.nameEn : language.name}
                  </button>
                ))}
              </div>
              {selectedLanguages.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedLanguages([]);
                    setActiveFilter('none');
                  }}
                  className="w-full mt-2 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                >
                  {lang === 'en' ? 'Clear all' : 'Rensa alla'}
                </button>
              )}
            </Card>
          )}
        </div>

        {/* Clear filter */}
        {activeFilter !== 'none' && (
          <button
            onClick={() => {
              setActiveFilter('none');
              setSelectedLanguages([]);
            }}
            className="px-3 py-2 text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
          >
            {lang === 'en' ? 'Clear' : 'Rensa'}
          </button>
        )}
      </div>

      {/* Active filter info */}
      {activeFilter !== 'none' && (
        <Card
          className={cn(
            'p-3',
            activeFilter === 'competition' && 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
            activeFilter === 'seasonal' && currentSeason === 'summer' && 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
            activeFilter === 'seasonal' && currentSeason === 'winter' && 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
            activeFilter === 'language' && 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
          )}
        >
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {activeFilter === 'competition' &&
              (lang === 'en'
                ? '💡 Showing jobs sorted by competition level. Jobs posted longer ago typically have fewer applicants.'
                : '💡 Visar jobb sorterade efter konkurrens. Äldre annonser har oftast färre sökande.')}
            {activeFilter === 'seasonal' &&
              (lang === 'en'
                ? `🎯 Showing ${currentSeason} seasonal jobs available now.`
                : `🎯 Visar ${currentSeason === 'summer' ? 'sommar' : 'säsongs'}jobb tillgängliga nu.`)}
            {activeFilter === 'language' &&
              (lang === 'en'
                ? `🌍 Showing jobs where your language skills (${selectedLanguages.join(', ')}) are valuable.`
                : `🌍 Visar jobb där dina språkkunskaper efterfrågas.`)}
          </p>
        </Card>
      )}

      {/* Results summary */}
      <p className="text-sm text-stone-600 dark:text-stone-400">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            {lang === 'en' ? 'Loading...' : 'Laddar...'}
          </span>
        ) : (
          `${filteredJobs.length} ${lang === 'en' ? 'jobs found' : 'jobb hittade'}`
        )}
      </p>

      {/* Jobs list */}
      <div className="space-y-3">
        {filteredJobs.slice(0, 20).map((job) => (
          <Card key={job.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-stone-800 dark:text-stone-100 line-clamp-1">
                  {job.headline}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                  {job.employer?.name}
                  {job.workplace_address?.municipality &&
                    ` • ${job.workplace_address.municipality}`}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {/* Competition indicator always shown */}
                  <CompetitionIndicator job={job} />

                  {/* Seasonal badge */}
                  {currentSeason &&
                    isSeasonalJob(job, SEASONAL_CATEGORIES[currentSeason].searchTerms) && (
                      <span
                        className={cn(
                          'px-2 py-1 rounded-lg flex items-center gap-1.5 text-xs font-medium',
                          currentSeason === 'summer'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400'
                        )}
                      >
                        {currentSeason === 'summer' ? (
                          <Sun className="w-3.5 h-3.5" />
                        ) : (
                          <Snowflake className="w-3.5 h-3.5" />
                        )}
                        {SEASONAL_CATEGORIES[currentSeason].label[lang === 'en' ? 'en' : 'sv']}
                      </span>
                    )}

                  {/* Language badges */}
                  {selectedLanguages.map((langCode) => {
                    const langOption = LANGUAGE_OPTIONS.find((l) => l.code === langCode);
                    if (
                      langOption &&
                      jobMatchesLanguage(job, langOption.searchTerms)
                    ) {
                      return (
                        <span
                          key={langCode}
                          className="px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium flex items-center gap-1"
                        >
                          <Languages className="w-3.5 h-3.5" />
                          {lang === 'en' ? langOption.nameEn : langOption.name}
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              {/* Days old indicator */}
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {(() => {
                    const daysOld = Math.floor(
                      (Date.now() - new Date(job.publication_date).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    if (daysOld === 0) return lang === 'en' ? 'Today' : 'Idag';
                    if (daysOld === 1) return lang === 'en' ? 'Yesterday' : 'Igår';
                    return lang === 'en' ? `${daysOld} days ago` : `${daysOld} dagar sedan`;
                  })()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default SmartFilters;
