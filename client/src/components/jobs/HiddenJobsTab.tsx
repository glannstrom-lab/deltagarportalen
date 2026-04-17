/**
 * Hidden Jobs Tab - Externa jobb från LinkedIn, Indeed, etc
 * Feature #4: Dolda Jobbmarknaden
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Eye,
  Briefcase,
  MapPin,
  Building2,
  TrendingUp,
  Globe,
} from '@/components/ui/icons';
import { Card, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  searchExternalJobs,
  getExternalJobStats,
  getSourceColors,
  type ExternalJob,
  type ExternalJobStats,
} from '@/services/jobAdLinksApi';

export function HiddenJobsTab() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [stats, setStats] = useState<ExternalJobStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [jobsResult, statsResult] = await Promise.all([
        searchExternalJobs(searchQuery || undefined, 50),
        getExternalJobStats(),
      ]);

      setJobs(jobsResult.jobs);
      setStats(statsResult);
    } catch (err) {
      console.error('Failed to fetch external jobs:', err);
      setError(
        lang === 'en'
          ? 'Could not load external jobs. Try again later.'
          : 'Kunde inte ladda externa jobb. Försök igen senare.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Check if source filtering is reliable (sources are not all "Extern")
  const hasReliableSources = jobs.some((job) => job.source && job.source !== 'Extern');

  const filteredJobs = selectedSource && hasReliableSources
    ? jobs.filter((job) => job.source === selectedSource)
    : jobs;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mr-3" aria-hidden="true" />
        <span className="text-stone-600 dark:text-stone-400">
          {lang === 'en' ? 'Loading hidden jobs...' : 'Laddar dolda jobb...'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-stone-600 dark:text-stone-400 mb-4">{error}</p>
        <Button onClick={fetchData}>
          {lang === 'en' ? 'Try again' : 'Försök igen'}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with explanation */}
      <Card className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {lang === 'en' ? 'Hidden Job Market' : 'Dolda jobbmarknaden'}
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
              {lang === 'en'
                ? 'Jobs from LinkedIn, Indeed, and other sources not listed on Platsbanken. These ~51,000 jobs are often missed by regular job seekers!'
                : 'Jobb från LinkedIn, Indeed och andra källor som inte finns på Platsbanken. Dessa ~51 000 jobb missas ofta av vanliga jobbsökare!'}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
            <Globe className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">
              {stats.totalJobs.toLocaleString('sv-SE')}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">
              {lang === 'en' ? 'External jobs' : 'Externa jobb'}
            </div>
          </Card>

          {stats.sourceDistribution.slice(0, 3).map((source, i) => (
            <Card
              key={source.source}
              className={cn(
                'p-4 text-center cursor-pointer transition-all',
                selectedSource === source.source
                  ? 'ring-2 ring-teal-500 dark:ring-teal-400'
                  : 'hover:shadow-md',
                getSourceColors(source.source).bg,
                getSourceColors(source.source).border
              )}
              onClick={() =>
                setSelectedSource(
                  selectedSource === source.source ? null : source.source
                )
              }
            >
              <div className="text-2xl mb-1">{source.icon}</div>
              <div className="text-lg font-bold text-stone-800 dark:text-stone-100">
                {source.count.toLocaleString('sv-SE')}
              </div>
              <div className="text-xs text-stone-600 dark:text-stone-400">
                {source.source}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            size={20}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'en'
                ? 'Search external jobs...'
                : 'Sök bland externa jobb...'
            }
            className="w-full pl-10 pr-4 py-3 border border-stone-200 dark:border-stone-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
          />
        </div>
        <Button type="submit" className="px-6">
          {lang === 'en' ? 'Search' : 'Sök'}
        </Button>
      </form>

      {/* Source filter chips - only show when source data is reliable */}
      {stats && hasReliableSources && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSource(null)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              !selectedSource
                ? 'bg-teal-500 text-white'
                : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
            )}
          >
            {lang === 'en' ? 'All sources' : 'Alla källor'}
          </button>
          {stats.sourceDistribution.map((source) => (
            <button
              key={source.source}
              onClick={() =>
                setSelectedSource(
                  selectedSource === source.source ? null : source.source
                )
              }
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
                selectedSource === source.source
                  ? 'bg-teal-500 text-white'
                  : cn(
                      getSourceColors(source.source).bg,
                      getSourceColors(source.source).text,
                      'hover:opacity-80'
                    )
              )}
            >
              <span>{source.icon}</span>
              {source.source}
            </button>
          ))}
        </div>
      )}

      {/* Info when source filtering isn't available */}
      {stats && !hasReliableSources && jobs.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          {lang === 'en'
            ? 'Source filtering is not available for these jobs. Showing all external jobs.'
            : 'Källfiltrering är inte tillgänglig för dessa jobb. Visar alla externa jobb.'}
        </div>
      )}

      {/* Jobs list */}
      <div className="space-y-3">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {lang === 'en'
            ? `Showing ${filteredJobs.length} external jobs`
            : `Visar ${filteredJobs.length} externa jobb`}
          {selectedSource && (
            <span className="ml-1">
              {lang === 'en' ? 'from' : 'från'} {selectedSource}
            </span>
          )}
        </p>

        {filteredJobs.length === 0 ? (
          <Card className="p-8 text-center">
            <Globe className="w-12 h-12 text-stone-400 mx-auto mb-4" />
            <p className="text-stone-600 dark:text-stone-400">
              {lang === 'en'
                ? 'No external jobs found. Try a different search.'
                : 'Inga externa jobb hittades. Prova en annan sökning.'}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredJobs.map((job) => {
              const colors = getSourceColors(job.source);
              return (
                <Card
                  key={job.id}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg',
                        colors.bg
                      )}
                    >
                      {job.source === 'LinkedIn'
                        ? '💼'
                        : job.source === 'Indeed'
                        ? '🔍'
                        : job.source === 'Monster'
                        ? '👹'
                        : '🌐'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-stone-800 dark:text-stone-100 line-clamp-2">
                        {job.headline}
                      </h3>

                      {job.employer && (
                        <p className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-1 mt-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {job.employer}
                        </p>
                      )}

                      {job.location && (
                        <p className="text-sm text-stone-500 dark:text-stone-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            colors.bg,
                            colors.text
                          )}
                        >
                          {job.source}
                        </span>

                        {job.sourceUrl && (
                          <a
                            href={job.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium ml-auto"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {lang === 'en' ? 'View job' : 'Visa jobb'}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-stone-500 dark:text-stone-400 py-4">
        <p>
          {lang === 'en'
            ? 'External job data via JobTech Links API'
            : 'Extern jobbdata via JobTech Links API'}
        </p>
      </div>
    </div>
  );
}

export default HiddenJobsTab;
