import { useState, useEffect, useCallback } from 'react';
import { 
  Search, MapPin, Briefcase, Calendar, X, Building2, 
  ExternalLink, Filter, ChevronDown, SlidersHorizontal,
  ChevronLeft, ChevronRight, Sparkles, Heart, FileText,
  Bookmark, CheckCircle2, Send
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchJobs, getJobDetails, getAutocomplete, POPULAR_QUERIES, type PlatsbankenJob } from '@/services/arbetsformedlingenApi';
import { useSavedJobs } from '@/hooks/useSavedJobs';

import { PageLayout } from '@/components/layout';
import { 
  LoadingState, 
  ErrorState, 
  EmptySearch,
  Button,
  IconButton,
  FilterSheet,
  Card,
  Input,
  Select
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { CreateApplicationModal } from '@/components/workflow';

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

  // Saved jobs hook
  const { savedJobs, saveJob, removeJob, isSaved, getStats } = useSavedJobs()
  const [showSavedOnly, setShowSavedOnly] = useState(false)

  // Create Application Modal state
  const [applicationModalJob, setApplicationModalJob] = useState<PlatsbankenJob | null>(null)

  // Sök när filter ändras (med debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  // Hämta autocomplete-förslag
  useEffect(() => {
    const fetchAutocomplete = async () => {
      if (filters.query.length >= 2) {
        try {
          const results = await getAutocomplete(filters.query);
          setSuggestions(results);
        } catch (err) {
          console.error('Autocomplete error:', err);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };
    fetchAutocomplete();
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

  // Filter count for badge
  const activeFilterCount = [
    filters.municipality,
    filters.region,
    filters.employmentType,
    filters.publishedWithin !== 'all' ? '1' : ''
  ].filter(Boolean).length;

  return (
    <PageLayout
      title="Sök jobb"
      description={!loading && totalJobs > 0 ? `${totalJobs} lediga jobb från Arbetsförmedlingen` : 'Hitta lediga jobb från Arbetsförmedlingen'}
      showTabs={false}
      className="max-w-7xl mx-auto"
    >

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
              try {
                setFilters({ ...filters, query: e.target.value });
                setShowSuggestions(true);
              } catch (err) {
                console.error('Error in search input onChange:', err);
              }
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

      {/* Filter Sheet för mobil */}
      <FilterSheet
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        title="Filtrera jobb"
        filterCount={activeFilterCount}
        onClear={() => setFilters(defaultFilters)}
        onApply={() => setShowMobileFilters(false)}
      >
        <div className="space-y-4">
          <Input
            label="Stad/Kommun"
            placeholder="t.ex. Stockholm..."
            value={filters.municipality}
            onChange={(e) => setFilters({ ...filters, municipality: e.target.value })}
            leftIcon={<MapPin size={16} />}
          />
          
          <Select
            label="Län"
            value={filters.region}
            onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            options={[
              { value: '', label: 'Alla län' },
              ...REGIONS.map((r) => ({ value: r.code, label: r.name }))
            ]}
          />
          
          <Select
            label="Anställningsform"
            value={filters.employmentType}
            onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
            options={[
              { value: '', label: 'Alla typer' },
              { value: 'Heltid', label: 'Heltid' },
              { value: 'Deltid', label: 'Deltid' },
            ]}
          />
          
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
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterSheet>

      {/* Resultat */}
      <div>
        {/* Jobblista */}
        {loading ? (
          <Card className="p-8 sm:p-12">
            <LoadingState title="Söker jobb..." message="Hämtar från Arbetsförmedlingen" />
          </Card>
        ) : error ? (
          <Card className="p-8 sm:p-12">
            <ErrorState title="Något gick fel" message={error} onRetry={performSearch} />
          </Card>
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
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isSaved(job.id)) {
                            removeJob(job.id)
                          } else {
                            saveJob(job)
                          }
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                          isSaved(job.id)
                            ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        <Heart size={16} className={isSaved(job.id) ? "fill-current" : ""} />
                        {isSaved(job.id) ? 'Sparad' : 'Spara'}
                      </button>
                      
                      <Link
                        to={`/cover-letter?jobId=${job.id}&company=${encodeURIComponent(job.employer?.name || '')}&title=${encodeURIComponent(job.headline)}&desc=${encodeURIComponent(job.description?.text?.substring(0, 500) || '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors"
                      >
                        <FileText size={16} />
                        Skriv brev
                      </Link>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setApplicationModalJob(job)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                      >
                        <Send size={16} />
                        Skapa ansökan
                      </button>
                    </div>
                  </div>
                  
                  {/* Action på mobil */}
                  <div className="sm:hidden flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isSaved(job.id)) {
                            removeJob(job.id)
                          } else {
                            saveJob(job)
                          }
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isSaved(job.id) ? "text-rose-500" : "text-slate-400"
                        )}
                      >
                        <Heart size={20} className={isSaved(job.id) ? "fill-current" : ""} />
                      </button>
                      <Link
                        to={`/cover-letter?jobId=${job.id}&company=${encodeURIComponent(job.employer?.name || '')}&title=${encodeURIComponent(job.headline)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-teal-500 rounded-lg"
                      >
                        <FileText size={20} />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setApplicationModalJob(job)
                        }}
                        className="p-2 text-violet-500 rounded-lg"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(job.publication_date).toLocaleDateString('sv-SE')}
                    </span>
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
          <Card className="p-8 sm:p-12">
            <EmptySearch
              query={filters.query}
              onClear={() => setFilters(defaultFilters)}
              suggestions={!filters.query && !hasActiveFilters ? ['Programmerare', 'Sjuksköterska', 'Lärare', 'Projektledare'] : undefined}
            />
          </Card>
        )}
      </div>



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

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  {/* Save & Cover Letter Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        if (isSaved(selectedJob.id)) {
                          removeJob(selectedJob.id)
                        } else {
                          saveJob(selectedJob)
                        }
                      }}
                      className={cn(
                        "flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors min-h-[48px]",
                        isSaved(selectedJob.id)
                          ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      )}
                    >
                      <Heart size={20} className={isSaved(selectedJob.id) ? "fill-current" : ""} />
                      {isSaved(selectedJob.id) ? 'Sparad' : 'Spara jobb'}
                    </button>
                    
                    <Link
                      to={`/cover-letter?jobId=${selectedJob.id}&company=${encodeURIComponent(selectedJob.employer?.name || '')}&title=${encodeURIComponent(selectedJob.headline)}&desc=${encodeURIComponent(selectedJob.description?.text?.substring(0, 1000) || '')}`}
                      onClick={() => setSelectedJob(null)}
                      className="flex items-center justify-center gap-2 py-3 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-xl font-medium transition-colors min-h-[48px] border border-teal-200"
                    >
                      <FileText size={20} />
                      Skriv personligt brev
                    </Link>
                  </div>

                  {/* Create Application Button */}
                  <button
                    onClick={() => {
                      setApplicationModalJob(selectedJob)
                      setSelectedJob(null)
                    }}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 transition-colors min-h-[48px]"
                  >
                    <Send size={18} />
                    Skapa ansökan
                  </button>

                  {/* Apply Button */}
                  {selectedJob.application_details?.url && (
                    <a
                      href={selectedJob.application_details.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors min-h-[48px]"
                    >
                      <ExternalLink size={18} />
                      Ansök direkt på Arbetsförmedlingen
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Application Modal */}
      {applicationModalJob && (
        <CreateApplicationModal
          job={applicationModalJob}
          isOpen={!!applicationModalJob}
          onClose={() => setApplicationModalJob(null)}
          onSuccess={() => {
            // Refresh saved jobs stats
            getStats()
          }}
        />
      )}
    </PageLayout>
  );
}
