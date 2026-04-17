/**
 * Energy-Adapted Search - Energianpassad Sökning
 * Feature #3: Filtrera på deltid/distans när användaren har låg energi
 * Feature #6: Förenklade Jobbkort - progressiv informationsvisning
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Home,
  Clock,
  Briefcase,
  MapPin,
  Building2,
  ChevronDown,
  ChevronUp,
  Heart,
  ExternalLink,
  Zap,
  Sparkles,
  RefreshCw,
} from '@/components/ui/icons';
import { Card, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { searchJobs, searchJobsSafe, type PlatsbankenJob } from '@/services/arbetsformedlingenApi';
import { useSavedJobs } from '@/hooks/useSavedJobs';

type EnergyLevel = 'low' | 'medium' | 'high';

const ENERGY_CONFIG = {
  low: {
    icon: BatteryLow,
    color: 'amber',
    label: { en: 'Low Energy', sv: 'Låg energi' },
    description: {
      en: 'Showing part-time and remote jobs to match your current energy',
      sv: 'Visar deltids- och distansjobb som passar din energinivå',
    },
    filters: {
      remote: true,
      employmentType: 'Deltid',
    },
  },
  medium: {
    icon: BatteryMedium,
    color: 'sky',
    label: { en: 'Medium Energy', sv: 'Medel energi' },
    description: {
      en: 'Showing flexible jobs with good work-life balance',
      sv: 'Visar flexibla jobb med bra balans',
    },
    filters: {
      remote: null,
      employmentType: '',
    },
  },
  high: {
    icon: BatteryFull,
    color: 'green',
    label: { en: 'High Energy', sv: 'Hög energi' },
    description: {
      en: 'Showing all job types including full-time positions',
      sv: 'Visar alla jobbtyper inklusive heltidstjänster',
    },
    filters: {
      remote: null,
      employmentType: 'Heltid',
    },
  },
};

interface SimpleJobCardProps {
  job: PlatsbankenJob;
  isExpanded: boolean;
  onToggle: () => void;
  isSaved: boolean;
  onSave: () => void;
}

// Simplified Job Card with progressive disclosure
function SimpleJobCard({ job, isExpanded, onToggle, isSaved, onSave }: SimpleJobCardProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300',
        isExpanded ? 'bg-white dark:bg-stone-800' : 'bg-stone-50 dark:bg-stone-800/50'
      )}
    >
      {/* Collapsed view - minimal info */}
      <div
        onClick={onToggle}
        className="p-4 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 truncate">
              {job.headline}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-2 mt-1">
              {job.employer?.name && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">{job.employer.name}</span>
                </span>
              )}
              {job.workplace_address?.municipality && (
                <span className="flex items-center gap-1 text-stone-500 dark:text-stone-500">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.workplace_address.municipality}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isSaved
                  ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                  : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600'
              )}
            >
              <Heart className={cn('w-4 h-4', isSaved && 'fill-current')} />
            </button>

            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-stone-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-stone-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded view - more details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-stone-100 dark:border-stone-700 pt-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {job.employment_type?.label && (
              <span className="px-2 py-1 text-xs font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded">
                <Clock className="w-3 h-3 inline mr-1" />
                {job.employment_type.label}
              </span>
            )}
            {job.remote_work?.option === 'yes' && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                <Home className="w-3 h-3 inline mr-1" />
                {lang === 'en' ? 'Remote' : 'Distans'}
              </span>
            )}
          </div>

          {/* Description preview */}
          {job.description?.text && (
            <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-4 mb-4">
              {job.description.text.substring(0, 300)}...
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {job.application_details?.url && (
              <a
                href={job.application_details.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-teal-500 dark:bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {lang === 'en' ? 'View & Apply' : 'Visa & Ansök'}
              </a>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export function EnergySearch() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { saveJob, removeJob, isSaved } = useSavedJobs();

  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [jobs, setJobs] = useState<PlatsbankenJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const config = ENERGY_CONFIG[energyLevel];
  const IconComponent = config.icon;

  // Fetch jobs based on energy level
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);

      try {
        const result = await searchJobsSafe({
          remote: config.filters.remote,
          employmentType: config.filters.employmentType,
          limit: 30,
        });

        setJobs(result.data.hits);
      } catch (error) {
        console.error('Failed to fetch energy-adapted jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [energyLevel]);

  const handleSaveJob = (job: PlatsbankenJob) => {
    if (isSaved(job.id)) {
      removeJob(job.id);
    } else {
      saveJob(job);
    }
  };

  const colorClasses = {
    low: {
      bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-600 dark:text-amber-400',
      btnActive: 'bg-amber-500 text-white',
      btnInactive: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    },
    medium: {
      bg: 'from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20',
      border: 'border-sky-200 dark:border-sky-800',
      text: 'text-sky-600 dark:text-sky-400',
      btnActive: 'bg-sky-500 text-white',
      btnInactive: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
    },
    high: {
      bg: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-600 dark:text-green-400',
      btnActive: 'bg-green-500 text-white',
      btnInactive: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    },
  };

  const currentColors = colorClasses[energyLevel];

  return (
    <div className="space-y-6">
      {/* Energy selector */}
      <Card
        className={cn(
          'p-5 bg-gradient-to-br',
          currentColors.bg,
          currentColors.border
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              energyLevel === 'low'
                ? 'bg-amber-100 dark:bg-amber-900/50'
                : energyLevel === 'medium'
                ? 'bg-sky-100 dark:bg-sky-900/50'
                : 'bg-green-100 dark:bg-green-900/50'
            )}
          >
            <IconComponent className={cn('w-6 h-6', currentColors.text)} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {lang === 'en' ? 'Energy-Adapted Search' : 'Energianpassad sökning'}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              {config.description[lang === 'en' ? 'en' : 'sv']}
            </p>
          </div>
        </div>

        {/* Energy level buttons */}
        <div className="flex gap-2 mt-4">
          {(Object.entries(ENERGY_CONFIG) as [EnergyLevel, typeof ENERGY_CONFIG[EnergyLevel]][]).map(
            ([level, cfg]) => {
              const Icon = cfg.icon;
              const isActive = energyLevel === level;
              const colors = colorClasses[level];

              return (
                <button
                  key={level}
                  onClick={() => setEnergyLevel(level)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all',
                    isActive
                      ? cn(colors.btnActive, 'shadow-lg')
                      : cn(colors.btnInactive, 'hover:opacity-80')
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    {cfg.label[lang === 'en' ? 'en' : 'sv']}
                  </span>
                </button>
              );
            }
          )}
        </div>

        {/* Tips based on energy level */}
        <div className="mt-4 p-3 bg-white/50 dark:bg-stone-900/30 rounded-lg">
          <p className="text-sm text-stone-600 dark:text-stone-400 flex items-start gap-2">
            <Sparkles className={cn('w-4 h-4 mt-0.5 flex-shrink-0', currentColors.text)} />
            {energyLevel === 'low' && (
              <span>
                {lang === 'en'
                  ? "It's okay to take it slow. Part-time and remote jobs can be a great stepping stone."
                  : 'Det är okej att ta det lugnt. Deltids- och distansjobb kan vara ett bra första steg.'}
              </span>
            )}
            {energyLevel === 'medium' && (
              <span>
                {lang === 'en'
                  ? "You're in a good place. Look for jobs with flexibility and growth potential."
                  : 'Du är på god väg. Leta efter jobb med flexibilitet och utvecklingsmöjligheter.'}
              </span>
            )}
            {energyLevel === 'high' && (
              <span>
                {lang === 'en'
                  ? "You're feeling energized! This is a great time to explore full-time opportunities."
                  : 'Du känner dig energisk! Nu är ett bra tillfälle att utforska heltidsmöjligheter.'}
              </span>
            )}
          </p>
        </div>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mr-2" />
          <span className="text-stone-600 dark:text-stone-400">
            {lang === 'en' ? 'Finding jobs...' : 'Söker jobb...'}
          </span>
        </div>
      ) : jobs.length === 0 ? (
        <Card className="p-8 text-center">
          <Zap className="w-12 h-12 text-stone-400 mx-auto mb-4" />
          <p className="text-stone-600 dark:text-stone-400">
            {lang === 'en'
              ? 'No jobs found for this energy level. Try adjusting.'
              : 'Inga jobb hittades för denna energinivå. Prova att justera.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {lang === 'en' ? `${jobs.length} jobs found` : `${jobs.length} jobb hittade`}
          </p>

          {jobs.map((job) => (
            <SimpleJobCard
              key={job.id}
              job={job}
              isExpanded={expandedJobId === job.id}
              onToggle={() =>
                setExpandedJobId(expandedJobId === job.id ? null : job.id)
              }
              isSaved={isSaved(job.id)}
              onSave={() => handleSaveJob(job)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default EnergySearch;
