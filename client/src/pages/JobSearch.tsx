import { useState, useEffect } from 'react';
import { 
  Search, MapPin, Briefcase, Calendar, X, Building2, 
  ExternalLink, Filter, ChevronDown, SlidersHorizontal,
  ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
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

const JOBS_PER_PAGE = 20;

export default function JobSearch() {
  const [jobs, setJobs] = useState<PlatsbankenJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [selectedJob, setSelectedJob] = useState<PlatsbankenJob | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPopularQueries, setShowPopularQueries] = useState(false);

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

  // Reset pagination när filter ändras
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.query, filters.municipality, filters.region, filters.employmentType, filters.publishedWithin]);

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
        limit: 100, // Hämta fler för pagination
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

  // Pagination
  const totalPages = Math.ceil(jobs.length / JOBS_PER_PAGE);
  const paginatedJobs = jobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE);

  // Mobile filter drawer komponent
  const MobileFilterDrawer = () => {
    if (!showMobileFilters) return null;

    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 transition-opacity"
          onClick={() => setShowMobileFilters(false)}
        />
        
        {/* Drawer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Filtrera jobb</h2>
            <button 
              onClick={() => setShowMobileFilters(false)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} className="text-slate-500" />
            </button>
          </div>
          
          {/* Filter content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Kommun */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Stad/Kommun
              </label>
              <input
                type="text"
                placeholder="t.ex. Stockholm..."
                value={filters.municipality}
                onChange={(e) => setFilters({ ...filters, municipality: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-base"
              />
            </div>

            {/* Län */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Län
              </label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-base bg-white"
              >
                <option value="">Alla län</option>
                {REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Anställningstyp */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Briefcase size={16} className="inline mr-1" />
                Anställningsform
              </label>
              <select
                value={filters.employmentType}
                onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-base bg-white"
              >
                <option value="">Alla typer</option>
                <option value="Heltid">Heltid</option>
                <option value="Deltid">Deltid</option>
              </select>
            </div>

            {/* Publicerad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Publicerad
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all', label: 'När som' },
                  { value: 'today', label: 'Idag' },
                  { value: 'week', label: 'Senaste veckan' },
                  { value: 'month', label: 'Senaste månaden' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilters({ ...filters, publishedWithin: opt.value as any })}
                    className={cn(
                      "px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                      filters.publishedWithin === opt.value
                        ? "bg-violet-500 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-slate-100 space-y-3 bg-white">
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setFilters(defaultFilters);
                }}
                className="w-full py-3 text-violet-600 font-medium hover:bg-violet-50 rounded-xl transition-colors"
              >
                Rensa alla filter
              </button>
            )}
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full py-3 bg-violet-500 text-white font-medium rounded-xl hover:bg-violet-600 transition-colors"
            >
              Visa {totalJobs} träffar
            </button>
          </div>
        </div>
      </div>
    );
  };

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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
        {/* Huvudsök */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Vad vill du jobba med?"
            value={filters.query}
            onChange={(e) => {
              setFilters({ ...filters, query: e.target.value });
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-base"
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
                  className="w-full text-left px-4 py-3 hover:bg-violet-50 first:rounded-t-xl last:rounded-b-xl border-b border-slate-100 last:border-0"
                >
                  <Search size={16} className="inline mr-2 text-slate-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filterknappar rad */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mobile filterknapp */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className={cn(
              "lg:hidden flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors min-h-[48px]",
              showMobileFilters || hasActiveFilters
                ? "bg-violet-500 text-white" 
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            <SlidersHorizontal size={18} />
            Filter
            {hasActiveFilters && (
              <span className="ml-1 w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center">
                {[filters.municipality, filters.region, filters.employmentType, filters.publishedWithin !== 'all' ? '1' : ''].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Desktop: Visa filter knapp */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={cn(
              "hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              showMobileFilters ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            <Filter size={18} />
            Filtrera
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 bg-violet-500 rounded-full" />
            )}
          </button>

          {/* Snabbsökningar dropdown på mobil */}
          <div className="relative flex-1 min-w-[140px] lg:hidden">
            <button
              onClick={() => setShowPopularQueries(!showPopularQueries)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 min-h-[48px]"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                Snabbsökningar
              </span>
              <ChevronDown size={16} className={cn("transition-transform", showPopularQueries && "rotate-180")} />
            </button>
            
            {showPopularQueries && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg">
                {POPULAR_QUERIES.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => {
                      setFilters({ ...filters, query: q.query });
                      setShowPopularQueries(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl border-b border-slate-100 last:border-0"
                  >
                    <span className="mr-2">{q.icon}</span>
                    {q.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop snabbsökningar */}
          <div className="hidden lg:flex items-center gap-2 overflow-x-auto flex-1">
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

        {/* Desktop filterpanel */}
        <div className="hidden lg:block">
          {showMobileFilters && (
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-4 gap-4">
              {/* Kommun */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <MapPin size={14} className="inline mr-1" />
                  Stad/Kommun
                </label>
                <input
                  type="text"
                  placeholder="t.ex. Stockholm..."
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
      </div>

      {/* Aktiva filter tags */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Aktiva filter:</span>
          {filters.municipality && (
            <span className="px-3 py-1.5 bg-violet-100 text-violet-700 text-sm rounded-full flex items-center gap-2">
              📍 {filters.municipality}
              <button onClick={() => setFilters({ ...filters, municipality: '' })} className="hover:bg-violet-200 rounded-full p-0.5">
                <X size={14} />
              </button>
            </span>
          )}
          {filters.region && (
            <span className="px-3 py-1.5 bg-violet-100 text-violet-700 text-sm rounded-full flex items-center gap-2">
              🗺️ {REGIONS.find(r => r.code === filters.region)?.name}
              <button onClick={() => setFilters({ ...filters, region: '' })} className="hover:bg-violet-200 rounded-full p-0.5">
                <X size={14} />
              </button>
            </span>
          )}
          {filters.employmentType && (
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center gap-2">
              💼 {filters.employmentType}
              <button onClick={() => setFilters({ ...filters, employmentType: '' })} className="hover:bg-blue-200 rounded-full p-0.5">
                <X size={14} />
              </button>
            </span>
          )}
          {filters.publishedWithin !== 'all' && (
            <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-full flex items-center gap-2">
              📅 {filters.publishedWithin === 'today' ? 'Idag' : filters.publishedWithin === 'week' ? 'Senaste veckan' : 'Senaste månaden'}
              <button onClick={() => setFilters({ ...filters, publishedWithin: 'all' })} className="hover:bg-green-200 rounded-full p-0.5">
                <X size={14} />
              </button>
            </span>
          )}
          <button
            onClick={() => setFilters(defaultFilters)}
            className="text-sm text-red-500 hover:text-red-700 font-medium px-2"
          >
            Rensa alla
          </button>
        </div>
      )}

      {/* Resultat */}
      <div>
        {/* Jobblista */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
            <LoadingState message="Söker jobb..." submessage="Hämtar från Arbetsförmedlingen" size="md" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center">
            <ErrorState title="Något gick fel" message={error} onRetry={performSearch} />
          </div>
        ) : paginatedJobs.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {paginatedJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleJobClick(job.id)}
                className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 hover:shadow-md hover:border-violet-300 transition-all cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Job info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 line-clamp-2">{job.headline}</h3>
                    <p className="text-slate-600 text-sm font-medium flex items-center gap-2">
                      <Building2 size={16} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{job.employer?.name || 'Arbetsgivare ej angiven'}</span>
                    </p>
                    
                    {/* Tags rad */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs sm:text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span className="truncate max-w-[150px] sm:max-w-none">
                          {job.workplace_address?.municipality || job.workplace_address?.city || 'Ort ej angiven'}
                        </span>
                      </span>
                      {job.employment_type?.label && (
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                          {job.employment_type.label}
                        </span>
                      )}
                      <span className="text-slate-400 hidden sm:inline">
                        {new Date(job.publication_date).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                    
                    {/* Description - hidden on mobile */}
                    <p className="text-slate-600 mt-3 line-clamp-2 text-sm hidden sm:block">
                      {job.description?.text?.substring(0, 200)}...
                    </p>
                  </div>
                  
                  {/* Action på mobil */}
                  <div className="sm:hidden flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                      {new Date(job.publication_date).toLocaleDateString('sv-SE')}
                    </span>
                    <ExternalLink size={18} className="text-violet-500" />
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <span className="px-4 py-2 text-sm text-slate-600">
                  Sida {currentPage} av {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center">
            <Search className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
              {filters.query || hasActiveFilters ? 'Inga jobb hittades' : 'Börja söka'}
            </h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm sm:text-base">
              {filters.query || hasActiveFilters 
                ? 'Prova att ändra sökord eller filter för att hitta fler jobb.'
                : 'Ange ett yrke eller sökord ovan för att hitta lediga jobb.'}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer />

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 pr-8">{selectedJob.headline}</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} className="text-slate-500" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 size={20} className="text-slate-400" />
                  <span className="font-medium">{selectedJob.employer?.name}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {selectedJob.workplace_address?.municipality && (
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-600">
                      📍 {selectedJob.workplace_address.municipality}
                    </span>
                  )}
                  {selectedJob.employment_type?.label && (
                    <span className="px-3 py-1 bg-violet-100 rounded-full text-sm text-violet-700">
                      💼 {selectedJob.employment_type.label}
                    </span>
                  )}
                </div>

                <div className="prose prose-slate max-w-none">
                  <div 
                    className="text-slate-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedJob.description?.text?.replace(/\n/g, '<br/>') || '' }}
                  />
                </div>

                {selectedJob.application_details?.url && (
                  <a
                    href={selectedJob.application_details.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 transition-colors min-h-[48px]"
                  >
                    <ExternalLink size={18} />
                    Ansök på Arbetsförmedlingen
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
