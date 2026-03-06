import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  TrendingUp,
  Filter,
  Briefcase,
  Map,
  Mic,
  Bookmark,
  History,
  SlidersHorizontal,
  X,
  RotateCcw,
  Loader2,
  MapPin,
} from 'lucide-react';
import {
  searchPlatsbanken,
  getJobDetails,
  POPULAR_QUERIES,
  PlatsbankenJob,
} from '@/services/arbetsformedlingenApi';
import { SwedenMap } from '@/components/map/SwedenMap';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { cn } from '@/lib/utils';

// Sökfilters-interface
interface JobFilters {
  search: string;
  location: string;
  region: string;
  employmentType: string[];
  publishedWithin: 'today' | 'week' | 'month' | 'all';
}

const defaultFilters: JobFilters = {
  search: '',
  location: '',
  region: '',
  employmentType: [],
  publishedWithin: 'all',
};

// Konvertera Platsbanken-job till internt format
function convertJob(job: PlatsbankenJob) {
  return {
    id: job.id,
    title: job.headline || 'Titel ej angiven',
    company: job.employer?.name || 'Arbetsgivare ej angiven',
    location:
      job.workplace_address?.municipality ||
      job.workplace_address?.city ||
      'Ort ej angiven',
    description: job.description?.text
      ? job.description.text.substring(0, 300) + '...'
      : 'Ingen beskrivning',
    employmentType: job.employment_type?.label || 'Ej angiven',
    publishedDate: job.publication_date,
    deadline: job.last_publication_date,
    url: job.application_details?.url || '#',
  };
}

export default function JobSearch() {
  const [jobs, setJobs] = useState<ReturnType<typeof convertJob>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filters, setFilters] = useState<JobFilters>(defaultFilters);
  const [selectedJob, setSelectedJob] = useState<PlatsbankenJob | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Sök jobb när filter ändras
  useEffect(() => {
    searchJobs();
  }, [filters]);

  const searchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Beräkna published-after datum
      let publishedAfter: string | undefined;
      if (filters.publishedWithin === 'today') {
        publishedAfter = new Date().toISOString().split('T')[0];
      } else if (filters.publishedWithin === 'week') {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        publishedAfter = date.toISOString().split('T')[0];
      } else if (filters.publishedWithin === 'month') {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        publishedAfter = date.toISOString().split('T')[0];
      }

      // Anropa AF API
      const result = await searchPlatsbanken({
        q: filters.search,
        municipality: filters.location,
        region: filters.region,
        published_after: publishedAfter,
        limit: 50,
      });

      setJobs(result.hits.map(convertJob));
      setTotalJobs(result.total.value);
    } catch (err) {
      console.error('Search error:', err);
      setError('Kunde inte söka jobb. Försök igen senare.');
      setJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = async (jobId: string) => {
    const job = await getJobDetails(jobId);
    if (job) {
      setSelectedJob(job);
    }
  };

  const hasActiveFilters =
    filters.location ||
    filters.region ||
    filters.employmentType.length > 0 ||
    filters.publishedWithin !== 'all';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Sök jobb
            </h1>
            <p className="text-slate-600 mt-1">
              Hitta lediga jobb från Platsbanken
              {totalJobs > 0 && (
                <span className="ml-2 text-violet-600 font-medium">
                  • {totalJobs} jobb
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Sök efter yrke, företag eller nyckelord..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors',
              showFilters
                ? 'bg-violet-100 text-violet-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            <SlidersHorizontal size={20} />
            Filter
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-violet-600 text-white text-xs rounded-full">
                !
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kommun/Ort
              </label>
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="t.ex. Stockholm"
                  value={filters.location}
                  onChange={(e) =>
                    setFilters({ ...filters, location: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Län
              </label>
              <select
                value={filters.region}
                onChange={(e) =>
                  setFilters({ ...filters, region: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Alla län</option>
                <option value="SE110">Stockholms län</option>
                <option value="SE232">Västra Götalands län</option>
                <option value="SE224">Skåne län</option>
                <option value="SE121">Uppsala län</option>
                <option value="SE123">Östergötlands län</option>
                <option value="SE211">Jönköpings län</option>
                <option value="SE212">Kronobergs län</option>
                <option value="SE213">Kalmar län</option>
                <option value="SE221">Blekinge län</option>
                <option value="SE231">Hallands län</option>
                <option value="SE311">Värmlands län</option>
                <option value="SE124">Örebro län</option>
                <option value="SE125">Västmanlands län</option>
                <option value="SE312">Dalarnas län</option>
                <option value="SE313">Gävleborgs län</option>
                <option value="SE321">Västernorrlands län</option>
                <option value="SE322">Jämtlands län</option>
                <option value="SE331">Västerbottens län</option>
                <option value="SE332">Norrbottens län</option>
              </select>
            </div>

            {/* Employment type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Anställningsform
              </label>
              <select
                value={filters.employmentType[0] || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    employmentType: e.target.value ? [e.target.value] : [],
                  })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Alla typer</option>
                <option value="Heltid">Heltid</option>
                <option value="Deltid">Deltid</option>
                <option value="Tillsvidare">Tillsvidare</option>
                <option value="Projekt">Projekt/Visstid</option>
                <option value="Sommarjobb">Sommarjobb</option>
              </select>
            </div>

            {/* Published date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Publicerad
              </label>
              <select
                value={filters.publishedWithin}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    publishedWithin: e.target.value as any,
                  })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="all">När som helst</option>
                <option value="today">Idag</option>
                <option value="week">Senaste veckan</option>
                <option value="month">Senaste månaden</option>
              </select>
            </div>
          </div>
        )}

        {/* Popular searches */}
        {!filters.search && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500 mb-2">Populära sökningar:</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_QUERIES.map((query) => (
                <button
                  key={query.label}
                  onClick={() =>
                    setFilters({ ...filters, search: query.query })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-colors"
                >
                  <span>{query.icon}</span>
                  {query.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active filters */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Aktiva filter:</span>
          {filters.location && (
            <span className="px-3 py-1 bg-violet-100 text-violet-700 text-sm rounded-full flex items-center gap-2">
              📍 {filters.location}
              <button
                onClick={() => setFilters({ ...filters, location: '' })}
                className="hover:text-violet-900"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {filters.region && (
            <span className="px-3 py-1 bg-violet-100 text-violet-700 text-sm rounded-full flex items-center gap-2">
              🗺️ {filters.region}
              <button
                onClick={() => setFilters({ ...filters, region: '' })}
                className="hover:text-violet-900"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {filters.employmentType.map((type) => (
            <span
              key={type}
              className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center gap-2"
            >
              💼 {type}
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    employmentType: filters.employmentType.filter(
                      (t) => t !== type
                    ),
                  })
                }
                className="hover:text-blue-900"
              >
                <X size={14} />
              </button>
            </span>
          ))}
          <button
            onClick={() => setFilters(defaultFilters)}
            className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <RotateCcw size={14} />
            Rensa alla
          </button>
        </div>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job list */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
              <LoadingState
                message="Söker jobb..."
                submessage="Hämtar från Platsbanken"
                size="md"
              />
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <ErrorState
                title="Något gick fel"
                message={error}
                onRetry={searchJobs}
              />
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleJobClick(job.id)}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-violet-200 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {job.title}
                      </h3>
                      <p className="text-slate-600 font-medium">
                        {job.company}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {job.location}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded">
                          {job.employmentType}
                        </span>
                        <span>
                          Publicerad:{' '}
                          {new Date(job.publishedDate).toLocaleDateString(
                            'sv-SE'
                          )}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-3 line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <Search className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Inga jobb hittades
              </h3>
              <p className="text-slate-600 mb-6">
                Prova att ändra dina sökkriterier eller sök på något annat.
              </p>
              <button
                onClick={() => setFilters(defaultFilters)}
                className="px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
              >
                Rensa alla filter
              </button>
            </div>
          )}
        </div>

        {/* Sidebar - Map & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <SwedenMap
            selectedRegion={filters.region || null}
            onRegionSelect={(region) =>
              setFilters({ ...filters, region: region || '' })
            }
            jobData={{
              SE110: totalJobs > 0 ? Math.floor(totalJobs * 0.4) : 0,
              SE232: totalJobs > 0 ? Math.floor(totalJobs * 0.25) : 0,
              SE224: totalJobs > 0 ? Math.floor(totalJobs * 0.15) : 0,
              SE121: totalJobs > 0 ? Math.floor(totalJobs * 0.08) : 0,
              SE123: totalJobs > 0 ? Math.floor(totalJobs * 0.05) : 0,
            }}
          />
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedJob.headline}
              </h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-600 mb-4">
                <Briefcase size={18} />
                <span className="font-medium">
                  {selectedJob.employer?.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 mb-4">
                <MapPin size={18} />
                <span>
                  {selectedJob.workplace_address?.municipality ||
                    'Ort ej angiven'}
                </span>
              </div>
              <div
                className="prose max-w-none mt-4"
                dangerouslySetInnerHTML={{
                  __html:
                    selectedJob.description?.text_formatted ||
                    selectedJob.description?.text ||
                    '',
                }}
              />
              <div className="mt-6 pt-6 border-t border-slate-100 flex gap-3">
                <a
                  href={selectedJob.application_details?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-6 py-3 bg-violet-600 text-white text-center rounded-xl font-medium hover:bg-violet-700 transition-colors"
                >
                  Ansök på Arbetsförmedlingen
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
