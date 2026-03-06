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
  Building2,
  Calendar,
} from 'lucide-react';
import {
  searchPlatsbanken,
  getJobDetails,
  getMunicipalities,
  POPULAR_QUERIES,
  PlatsbankenJob,
} from '@/services/arbetsformedlingenApi';
import { SwedenMap } from '@/components/map/SwedenMap';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { cn } from '@/lib/utils';

// Sökfilters-interface
interface JobFilters {
  search: string;
  municipality: string;
  region: string;
  employmentType: string;
  publishedWithin: 'today' | 'week' | 'month' | 'all';
}

const defaultFilters: JobFilters = {
  search: '',
  municipality: '',
  region: '',
  employmentType: '',
  publishedWithin: 'all',
};

// Län alternativ
const REGION_OPTIONS = [
  { code: 'SE110', name: 'Stockholms län' },
  { code: 'SE232', name: 'Västra Götalands län' },
  { code: 'SE224', name: 'Skåne län' },
  { code: 'SE121', name: 'Uppsala län' },
  { code: 'SE123', name: 'Östergötlands län' },
  { code: 'SE211', name: 'Jönköpings län' },
  { code: 'SE212', name: 'Kronobergs län' },
  { code: 'SE213', name: 'Kalmar län' },
  { code: 'SE221', name: 'Blekinge län' },
  { code: 'SE231', name: 'Hallands län' },
  { code: 'SE311', name: 'Värmlands län' },
  { code: 'SE124', name: 'Örebro län' },
  { code: 'SE125', name: 'Västmanlands län' },
  { code: 'SE312', name: 'Dalarnas län' },
  { code: 'SE313', name: 'Gävleborgs län' },
  { code: 'SE321', name: 'Västernorrlands län' },
  { code: 'SE322', name: 'Jämtlands län' },
  { code: 'SE331', name: 'Västerbottens län' },
  { code: 'SE332', name: 'Norrbottens län' },
];

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
    region: job.workplace_address?.region || '',
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
  const [municipalities, setMunicipalities] = useState<Array<{id: string, name: string}>>([]);
  const [municipalitySearch, setMunicipalitySearch] = useState('');

  // Ladda kommuner vid start
  useEffect(() => {
    loadMunicipalities();
  }, []);

  // Sök jobb när filter ändras
  useEffect(() => {
    searchJobs();
  }, [filters]);

  const loadMunicipalities = async () => {
    const munis = await getMunicipalities();
    // Sortera alfabetiskt
    const sorted = munis.sort((a, b) => a.name.localeCompare(b.name, 'sv'));
    setMunicipalities(sorted);
  };

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
        municipality: filters.municipality,
        region: filters.region,
        employment_type: filters.employmentType,
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
    filters.municipality ||
    filters.region ||
    filters.employmentType ||
    filters.publishedWithin !== 'all';

  // Filtrera kommuner baserat på sökning
  const filteredMunicipalities = municipalitySearch
    ? municipalities.filter(m => 
        m.name.toLowerCase().includes(municipalitySearch.toLowerCase())
      ).slice(0, 10)
    : municipalities.slice(0, 20);

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
                  • {totalJobs} jobb hittade
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
            {/* Municipality - med dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <MapPin size={14} className="inline mr-1" />
                Kommun
              </label>
              <div className="relative">
                {filters.municipality ? (
                  <div className="flex items-center justify-between w-full px-3 py-2 border border-slate-200 rounded-lg bg-violet-50">
                    <span className="text-violet-700">
                      {municipalities.find(m => m.id === filters.municipality)?.name || filters.municipality}
                    </span>
                    <button
                      onClick={() => setFilters({ ...filters, municipality: '' })}
                      className="text-violet-400 hover:text-violet-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Sök kommun..."
                      value={municipalitySearch}
                      onChange={(e) => setMunicipalitySearch(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    {municipalitySearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredMunicipalities.map((muni) => (
                          <button
                            key={muni.id}
                            onClick={() => {
                              setFilters({ ...filters, municipality: muni.id });
                              setMunicipalitySearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-violet-50 text-sm"
                          >
                            {muni.name}
                          </button>
                        ))}
                        {filteredMunicipalities.length === 0 && (
                          <div className="px-3 py-2 text-sm text-slate-500">
                            Inga kommuner hittades
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Map size={14} className="inline mr-1" />
                Län
              </label>
              <select
                value={filters.region}
                onChange={(e) =>
                  setFilters({ ...filters, region: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Alla län</option>
                {REGION_OPTIONS.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Employment type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Briefcase size={14} className="inline mr-1" />
                Anställningsform
              </label>
              <select
                value={filters.employmentType}
                onChange={(e) =>
                  setFilters({ ...filters, employmentType: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Alla typer</option>
                <option value="Heltid">Heltid</option>
                <option value="Deltid">Deltid</option>
                <option value="Tillsvidare">Tillsvidare</option>
                <option value="Visstid">Visstid / Projekt</option>
                <option value="Sommarjobb">Sommarjobb</option>
              </select>
            </div>

            {/* Published date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Calendar size={14} className="inline mr-1" />
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
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
          {filters.municipality && (
            <span className="px-3 py-1 bg-violet-100 text-violet-700 text-sm rounded-full flex items-center gap-2">
              <MapPin size={14} />
              {municipalities.find(m => m.id === filters.municipality)?.name || filters.municipality}
              <button
                onClick={() => setFilters({ ...filters, municipality: '' })}
                className="hover:text-violet-900"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {filters.region && (
            <span className="px-3 py-1 bg-violet-100 text-violet-700 text-sm rounded-full flex items-center gap-2">
              <Map size={14} />
              {REGION_OPTIONS.find(r => r.code === filters.region)?.name}
              <button
                onClick={() => setFilters({ ...filters, region: '' })}
                className="hover:text-violet-900"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {filters.employmentType && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center gap-2">
              <Briefcase size={14} />
              {filters.employmentType}
              <button
                onClick={() =>
                  setFilters({ ...filters, employmentType: '' })
                }
                className="hover:text-blue-900"
              >
                <X size={14} />
              </button>
            </span>
          )}
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
                <Building2 size={18} />
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
                {selectedJob.workplace_address?.region && (
                  <span className="text-slate-400">
                    ({selectedJob.workplace_address.region})
                  </span>
                )}
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
