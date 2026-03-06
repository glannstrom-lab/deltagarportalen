import { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Calendar, X, Building2, ExternalLink, Filter } from 'lucide-react';
import { searchJobs, getJobDetails, getAutocomplete, POPULAR_QUERIES, type PlatsbankenJob } from '@/services/arbetsformedlingenApi';

import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { cn } from '@/lib/utils';

interface SearchFilters {
  query: string;
  municipality: string;
  region: string;
  employmentType: string;
  publishedWithin: 'today' | 'week' | 'month' | 'all';
}

const defaultFilters: SearchFilters = {
  query: '',
  municipality: '',
  region: '',
  employmentType: '',
  publishedWithin: 'all',
};

const REGIONS = [
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

export default function JobSearch() {
  const [jobs, setJobs] = useState<PlatsbankenJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [selectedJob, setSelectedJob] = useState<PlatsbankenJob | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sök när filter ändras (med debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  // Hämta autocomplete-förslag
  useEffect(() => {
    if (filters.query.length >= 2) {
      getAutocomplete(filters.query).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [filters.query]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await searchJobs({
        query: filters.query,
        municipality: filters.municipality,
        region: filters.region,
        employmentType: filters.employmentType,
        publishedWithin: filters.publishedWithin,
        limit: 50,
      });

      setJobs(result.hits);
      setTotalJobs(result.total.value);
    } catch (err) {
      console.error('Search error:', err);
      setError('Kunde inte söka jobb. Försök igen.');
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

  const hasActiveFilters = filters.municipality || filters.region || filters.employmentType || filters.publishedWithin !== 'all';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Sök jobb</h1>
        <p className="text-slate-600 mt-1">
          Hitta lediga jobb från Arbetsförmedlingen
          {!loading && totalJobs > 0 && (
            <span className="ml-2 text-violet-600 font-medium">• {totalJobs} träffar</span>
          )}
        </p>
      </div>

      {/* Sökruta */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
        {/* Huvudsök */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Vad vill du jobba med? (t.ex. kundtjänst, lärare, programmerare...)"
            value={filters.query}
            onChange={(e) => {
              setFilters({ ...filters, query: e.target.value });
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-lg"
          />
          
          {/* Autocomplete */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setFilters({ ...filters, query: suggestion });
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-violet-50 first:rounded-t-xl last:rounded-b-xl"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filterknapp */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              showFilters ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            <Filter size={18} />
            Filtrera
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 bg-violet-500 rounded-full" />
            )}
          </button>

          {/* Snabbsökningar */}
          <div className="hidden sm:flex items-center gap-2 overflow-x-auto">
            {POPULAR_QUERIES.slice(0, 4).map((q) => (
              <button
                key={q.label}
                onClick={() => setFilters({ ...filters, query: q.query })}
                className="px-3 py-1.5 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 rounded-lg text-sm text-slate-700 hover:text-violet-700 transition-colors whitespace-nowrap"
              >
                {q.icon} {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filterpanel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Kommun */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <MapPin size={14} className="inline mr-1" />
                Stad/Kommun
              </label>
              <input
                type="text"
                placeholder="t.ex. Stockholm, Göteborg..."
                value={filters.municipality}
                onChange={(e) => setFilters({ ...filters, municipality: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Län */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Län
              </label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Alla län</option>
                {REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Anställningstyp */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Briefcase size={14} className="inline mr-1" />
                Anställningsform
              </label>
              <select
                value={filters.employmentType}
                onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Alla typer</option>
                <option value="Heltid">Heltid</option>
                <option value="Deltid">Deltid</option>
              </select>
            </div>

            {/* Publicerad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Calendar size={14} className="inline mr-1" />
                Publicerad
              </label>
              <select
                value={filters.publishedWithin}
                onChange={(e) => setFilters({ ...filters, publishedWithin: e.target.value as any })}
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
      </div>

      {/* Aktiva filter */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Aktiva filter:</span>
          {filters.municipality && (
            <span className="px-3 py-1 bg-violet-100 text-violet-700 text-sm rounded-full flex items-center gap-2">
              📍 {filters.municipality}
              <button onClick={() => setFilters({ ...filters, municipality: '' })}><X size={14} /></button>
            </span>
          )}
          {filters.region && (
            <span className="px-3 py-1 bg-violet-100 text-violet-700 text-sm rounded-full flex items-center gap-2">
              🗺️ {REGIONS.find(r => r.code === filters.region)?.name}
              <button onClick={() => setFilters({ ...filters, region: '' })}><X size={14} /></button>
            </span>
          )}
          {filters.employmentType && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center gap-2">
              💼 {filters.employmentType}
              <button onClick={() => setFilters({ ...filters, employmentType: '' })}><X size={14} /></button>
            </span>
          )}
          {filters.publishedWithin !== 'all' && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full flex items-center gap-2">
              📅 {filters.publishedWithin === 'today' ? 'Idag' : filters.publishedWithin === 'week' ? 'Senaste veckan' : 'Senaste månaden'}
              <button onClick={() => setFilters({ ...filters, publishedWithin: 'all' })}><X size={14} /></button>
            </span>
          )}
          <button
            onClick={() => setFilters(defaultFilters)}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Rensa alla
          </button>
        </div>
      )}

      {/* Resultat */}
      <div>
        {/* Jobblista */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
              <LoadingState message="Söker jobb..." submessage="Hämtar från Arbetsförmedlingen" size="md" />
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <ErrorState title="Något gick fel" message={error} onRetry={performSearch} />
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleJobClick(job.id)}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-violet-300 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{job.headline}</h3>
                      <p className="text-slate-600 font-medium flex items-center gap-2">
                        <Building2 size={16} className="text-slate-400" />
                        {job.employer?.name || 'Arbetsgivare ej angiven'}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {job.workplace_address?.municipality || job.workplace_address?.city || 'Ort ej angiven'}
                          {job.workplace_address?.region && `, ${job.workplace_address.region}`}
                        </span>
                        {job.employment_type?.label && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                            {job.employment_type.label}
                          </span>
                        )}
                        <span className="text-slate-400">
                          Publicerad: {new Date(job.publication_date).toLocaleDateString('sv-SE')}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-3 line-clamp-2 text-sm">
                        {job.description?.text?.substring(0, 200)}...
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
                {filters.query || hasActiveFilters ? 'Inga jobb hittades' : 'Börja söka'}
              </h3>
              <p className="text-slate-600 mb-4">
                {filters.query || hasActiveFilters 
                  ? 'Prova att ändra dina sökkriterier eller sök på något annat.'
                  : 'Skriv in ett yrke eller välj en kategori ovan för att se lediga jobb.'}
              </p>
              {(filters.query || hasActiveFilters) && (
                <button
                  onClick={() => setFilters(defaultFilters)}
                  className="px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
                >
                  Rensa filter
                </button>
              )}
            </div>
          )}
        </div>

      {/* Jobbdetaljer Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedJob(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedJob.headline}</h2>
                <p className="text-slate-600 flex items-center gap-2 mt-1">
                  <Building2 size={16} />
                  {selectedJob.employer?.name}
                </p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                <span className="flex items-center gap-1">
                  <MapPin size={16} />
                  {selectedJob.workplace_address?.municipality || 'Ort ej angiven'}
                  {selectedJob.workplace_address?.street_address && `, ${selectedJob.workplace_address.street_address}`}
                </span>
                {selectedJob.employment_type?.label && (
                  <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded">
                    {selectedJob.employment_type.label}
                  </span>
                )}
              </div>

              <div className="prose max-w-none">
                <div 
                  className="text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedJob.description?.text_formatted || selectedJob.description?.text || '' 
                  }}
                />
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="font-semibold text-slate-900 mb-2">Ansökan</h4>
                <p className="text-slate-600 text-sm mb-4">
                  Sista ansökningsdatum: {selectedJob.last_publication_date 
                    ? new Date(selectedJob.last_publication_date).toLocaleDateString('sv-SE')
                    : 'Ej angivet'}
                </p>
                <a
                  href={selectedJob.application_details?.url || `https://arbetsformedlingen.se/platsbanken/annonser/${selectedJob.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
                >
                  <ExternalLink size={18} />
                  Gå till ansökan på Arbetsförmedlingen
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
