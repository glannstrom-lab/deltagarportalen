import { useState, useEffect, useMemo, useRef, useId } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useTranslation } from 'react-i18next';
import {
  Search, MapPin, Briefcase, X, Building2,
  ExternalLink, Filter, ChevronDown,
  ChevronLeft, ChevronRight, Sparkles, Heart, FileText,
  Bookmark, Send, Bell, MoreVertical,
  Trash2, CheckCircle, Clock, MessageSquare,
  Star, Mic
} from '@/components/ui/icons';
import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { searchJobs, getJobDetails, getAutocomplete, SWEDISH_MUNICIPALITIES, type PlatsbankenJob } from '@/services/arbetsformedlingenApi';
import { useSavedJobs, type SavedJob } from '@/hooks/useSavedJobs';
import { sanitizeHTMLWithLineBreaks } from '@/utils/sanitize';

import { PageLayout } from '@/components/layout/index';
import {
  LoadingState,
  ErrorState,
  EmptySearch,
  Button,
  Card,
} from '@/components/ui';
import { InterviewPrepPanel, CommutePlannerPanel } from '@/components/ai';
import { cn } from '@/lib/utils';
import { CreateApplicationModal } from '@/components/workflow';

// Import tab components
import { AlertsTab } from '@/components/jobs/AlertsTab';
import { MatchesTab } from '@/components/jobs/MatchesTab';
import { DailyJobTab } from '@/components/jobs/DailyJobTab';

// Tab definitions with i18n keys
// Note: CRM, Culture, and Applications tabs moved to dedicated /applications page
const jobSearchTabDefs = [
  { id: 'search', labelKey: 'jobSearch.tabs.search', path: '/job-search', icon: Search },
  { id: 'daily', labelKey: 'jobSearch.tabs.daily', path: '/job-search/daily', icon: Star },
  { id: 'saved', labelKey: 'jobSearch.tabs.saved', path: '/job-search/saved', icon: Bookmark },
  { id: 'matches', labelKey: 'jobSearch.tabs.matches', path: '/job-search/matches', icon: Sparkles },
];

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

// Main Search Tab Component
function SearchTab() {
  const { t, i18n } = useTranslation();
  const [jobs, setJobs] = useState<PlatsbankenJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [selectedJob, setSelectedJob] = useState<PlatsbankenJob | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isListening, setIsListening] = useState(false);

  // Saved jobs hook
  const { savedJobs, saveJob, removeJob, isSaved, getStats } = useSavedJobs()

  // Create Application Modal state
  const [applicationModalJob, setApplicationModalJob] = useState<PlatsbankenJob | null>(null)

  // AI panel state
  const [showInterviewPrep, setShowInterviewPrep] = useState(false)

  // Focus trap for job detail modal
  const jobModalRef = useFocusTrap<HTMLDivElement>(!!selectedJob, {
    onEscape: () => setSelectedJob(null),
    restoreFocus: true,
  })
  const [showCommutePlanner, setShowCommutePlanner] = useState(false)

  // Sök när filter ändras (med debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  // Hämta autocomplete-förslag (med debounce för att minska API-anrop)
  useEffect(() => {
    if (filters.query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await getAutocomplete(filters.query);
        setSuggestions(results);
      } catch (err) {
        console.error('Autocomplete error:', err);
        setSuggestions([]);
      }
    }, 200); // 200ms debounce

    return () => clearTimeout(timer);
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
        limit: JOBS_PER_PAGE, // Hämta endast det som visas per sida för snabbare LCP
      });

      setJobs(result.hits);
      setTotalJobs(result.total.value);
    } catch (err) {
      console.error('Search error:', err);
      setError(t('jobSearch.couldNotSearch'));
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

  // Voice search
  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language === 'en' ? 'en-US' : 'sv-SE';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFilters({ ...filters, query: transcript });
    };

    recognition.start();
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
    <div className="space-y-4">
      {/* Collapsible Search & Filter Section */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden shadow-sm">
        {/* Header - Always visible, clickable to toggle */}
        <button
          onClick={() => setIsSearchExpanded(!isSearchExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--c-solid)] rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">{t('jobSearch.searchAndFilter')}</h3>
              <p className="text-sm text-stone-700 dark:text-stone-400">
                {filters.query || activeFilterCount > 0
                  ? `${filters.query ? `"${filters.query}"` : ''} ${activeFilterCount > 0 ? `• ${t('jobSearch.filtersActive', { count: activeFilterCount })}` : ''}`
                  : t('jobSearch.clickToSearch')}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-stone-600 dark:text-stone-400 transition-transform duration-200 ${isSearchExpanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Expandable Content */}
        {isSearchExpanded && (
          <div className="px-4 pb-4 border-t border-stone-100 dark:border-stone-700 space-y-4">
            {/* Search Input */}
            <div className="pt-4 relative">
              <label htmlFor="job-search-input" className="sr-only">
                {t('jobSearch.whatDoYouWantToWork')}
              </label>
              <Search className="absolute left-3 top-1/2 mt-2 -translate-y-1/2 text-stone-600 dark:text-stone-400" size={20} aria-hidden="true" />
              <input
                id="job-search-input"
                type="text"
                placeholder={t('jobSearch.whatDoYouWantToWork')}
                value={filters.query}
                onChange={(e) => {
                  setFilters({ ...filters, query: e.target.value });
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10 pr-12 py-3 border border-stone-200 dark:border-stone-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] dark:focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                role="combobox"
                aria-expanded={showSuggestions && suggestions.length > 0}
                aria-controls="job-search-suggestions"
                aria-autocomplete="list"
              />
              {/* Voice search button */}
              {(window.SpeechRecognition || window.webkitSpeechRecognition) && (
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  className={cn(
                    "absolute right-3 top-1/2 mt-2 -translate-y-1/2 p-1.5 rounded-lg transition-colors",
                    isListening
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse"
                      : "hover:bg-stone-100 dark:hover:bg-stone-600 text-stone-500 dark:text-stone-400"
                  )}
                  aria-label={isListening ? t('jobSearch.listening') : t('jobSearch.voiceSearch')}
                >
                  <Mic size={18} />
                </button>
              )}

              {/* Autocomplete */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  id="job-search-suggestions"
                  role="listbox"
                  aria-label={t('jobSearch.suggestions')}
                  className="absolute z-20 w-full mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg"
                >
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        setFilters({ ...filters, query: suggestion });
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[var(--c-bg)] dark:hover:bg-[var(--c-bg)]/30 first:rounded-t-xl last:rounded-b-xl border-b border-stone-100 dark:border-stone-700 last:border-0 text-stone-900 dark:text-stone-100"
                    >
                      <Search size={16} className="inline mr-2 text-stone-600 dark:text-stone-400" aria-hidden="true" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location Filters */}
            <fieldset>
              <legend className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" aria-hidden="true" />
                {t('jobSearch.location')}
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="filter-municipality" className="sr-only">{t('jobSearch.municipality')}</label>
                  <select
                    id="filter-municipality"
                    value={filters.municipality}
                    onChange={(e) => setFilters({ ...filters, municipality: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] dark:focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="">{t('jobSearch.allMunicipalities')}</option>
                    {SWEDISH_MUNICIPALITIES.map((m) => (
                      <option key={m.concept_id} value={m.label}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-region" className="sr-only">{t('jobSearch.region')}</label>
                  <select
                    id="filter-region"
                    value={filters.region}
                    onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] dark:focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="">{t('jobSearch.allRegions')}</option>
                    {REGIONS.map((r) => (
                      <option key={r.code} value={r.code}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Job Type Filters */}
            <fieldset>
              <legend className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Briefcase className="w-3 h-3" aria-hidden="true" />
                {t('jobSearch.jobType')}
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="filter-employment-type" className="sr-only">{t('jobSearch.employmentType')}</label>
                  <select
                    id="filter-employment-type"
                    value={filters.employmentType}
                    onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] dark:focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="">{t('jobSearch.allTypes')}</option>
                    <option value="Heltid">{t('jobSearch.fullTime')}</option>
                    <option value="Deltid">{t('jobSearch.partTime')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-published" className="sr-only">{t('jobSearch.publishedWithin')}</label>
                  <select
                    id="filter-published"
                    value={filters.publishedWithin}
                    onChange={(e) => setFilters({ ...filters, publishedWithin: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] dark:focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                  >
                    <option value="all">{t('jobSearch.publishedAnytime')}</option>
                    <option value="today">{t('jobSearch.today')}</option>
                    <option value="week">{t('jobSearch.lastWeek')}</option>
                    <option value="month">{t('jobSearch.lastMonth')}</option>
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Active Filters & Clear */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-700">
                <div className="flex flex-wrap gap-2">
                  {filters.municipality && (
                    <span className="inline-flex items-center gap-1 px-3 py-2 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)] rounded-lg text-sm min-h-[44px]">
                      📍 {filters.municipality}
                      <button
                        onClick={() => setFilters({ ...filters, municipality: '' })}
                        aria-label={t('jobSearch.removeFilter', { filter: filters.municipality }) || `Ta bort filter: ${filters.municipality}`}
                        className="ml-1 p-1 hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] hover:bg-[var(--c-accent)]/60 dark:hover:bg-[var(--c-text)] rounded min-w-[28px] min-h-[28px] flex items-center justify-center"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </span>
                  )}
                  {filters.region && (
                    <span className="inline-flex items-center gap-1 px-3 py-2 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)] rounded-lg text-sm min-h-[44px]">
                      🗺️ {REGIONS.find(r => r.code === filters.region)?.name}
                      <button
                        onClick={() => setFilters({ ...filters, region: '' })}
                        aria-label={t('jobSearch.removeFilter', { filter: REGIONS.find(r => r.code === filters.region)?.name }) || `Ta bort filter: ${REGIONS.find(r => r.code === filters.region)?.name}`}
                        className="ml-1 p-1 hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] hover:bg-[var(--c-accent)]/60 dark:hover:bg-[var(--c-text)] rounded min-w-[28px] min-h-[28px] flex items-center justify-center"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </span>
                  )}
                  {filters.employmentType && (
                    <span className="inline-flex items-center gap-1 px-3 py-2 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)] rounded-lg text-sm min-h-[44px]">
                      💼 {filters.employmentType}
                      <button
                        onClick={() => setFilters({ ...filters, employmentType: '' })}
                        aria-label={t('jobSearch.removeFilter', { filter: filters.employmentType }) || `Ta bort filter: ${filters.employmentType}`}
                        className="ml-1 p-1 hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] hover:bg-[var(--c-accent)]/60 dark:hover:bg-[var(--c-text)] rounded min-w-[28px] min-h-[28px] flex items-center justify-center"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </span>
                  )}
                  {filters.publishedWithin !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-3 py-2 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)] rounded-lg text-sm min-h-[44px]">
                      📅 {filters.publishedWithin === 'today' ? t('jobSearch.today') : filters.publishedWithin === 'week' ? t('jobSearch.lastWeek') : t('jobSearch.lastMonth')}
                      <button
                        onClick={() => setFilters({ ...filters, publishedWithin: 'all' })}
                        aria-label={t('jobSearch.removeFilter', { filter: t('jobSearch.' + filters.publishedWithin) }) || `Ta bort datumfilter`}
                        className="ml-1 p-1 hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] hover:bg-[var(--c-accent)]/60 dark:hover:bg-[var(--c-text)] rounded min-w-[28px] min-h-[28px] flex items-center justify-center"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setFilters(defaultFilters)}
                  className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                >
                  {t('common.clearAll')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        {loading ? (
          <Card className="p-8 sm:p-12">
            <LoadingState title={t('jobSearch.searchingJobs')} message={t('jobSearch.fetchingFromAF')} />
          </Card>
        ) : error ? (
          <Card className="p-8 sm:p-12">
            <ErrorState title={t('jobSearch.somethingWentWrong')} message={error} onRetry={performSearch} />
          </Card>
        ) : paginatedJobs.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Results count - announced to screen readers */}
            <p className="text-sm text-stone-700 dark:text-stone-400" role="status" aria-live="polite" aria-atomic="true">
              {t('jobSearch.showingXofY', { shown: paginatedJobs.length, total: totalJobs })}
            </p>

            {paginatedJobs.map((job) => (
              <div
                key={job.id}
                role="button"
                tabIndex={0}
                onClick={() => handleJobClick(job.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleJobClick(job.id)
                  }
                }}
                aria-label={`${job.headline} - ${job.employer?.name || t('common.employerNotSpecified')}`}
                className="bg-white dark:bg-stone-800 rounded-xl sm:rounded-2xl border border-stone-200 dark:border-stone-700 p-4 sm:p-5 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)] hover:shadow-[var(--shadow-hover)] transition-[border-color,box-shadow] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] focus:ring-offset-2 dark:focus:ring-offset-stone-900"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1 line-clamp-2">{job.headline}</h3>
                    <p className="text-stone-600 dark:text-stone-400 text-sm font-medium flex items-center gap-2">
                      <Building2 size={16} className="text-stone-600 dark:text-stone-400 flex-shrink-0" />
                      <span className="truncate">{job.employer?.name || t('common.employerNotSpecified')}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs sm:text-sm text-stone-700 dark:text-stone-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span className="truncate max-w-[150px] sm:max-w-none">
                          {job.workplace_address?.municipality || job.workplace_address?.city || t('common.locationNotSpecified')}
                        </span>
                      </span>
                      {job.employment_type?.label && (
                        <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-700 rounded text-stone-600 dark:text-stone-300">
                          {job.employment_type.label}
                        </span>
                      )}
                      <span className="text-stone-600 dark:text-stone-400">
                        {new Date(job.publication_date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE')}
                      </span>
                    </div>

                    <p className="text-stone-600 dark:text-stone-400 mt-3 line-clamp-2 text-sm hidden sm:block">
                      {job.description?.text?.substring(0, 200)}...
                    </p>

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
                            ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                            : "bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600"
                        )}
                      >
                        <Heart size={16} className={isSaved(job.id) ? "fill-current" : ""} />
                        {isSaved(job.id) ? t('jobSearch.saved') : t('jobSearch.save')}
                      </button>

                      <Link
                        to={`/cover-letter?jobId=${job.id}&company=${encodeURIComponent(job.employer?.name || '')}&title=${encodeURIComponent(job.headline)}&desc=${encodeURIComponent(job.description?.text?.substring(0, 500) || '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)] hover:bg-[var(--c-accent)]/40 dark:hover:bg-[var(--c-bg)]/50 transition-colors"
                      >
                        <FileText size={16} />
                        {t('jobSearch.writeLetter')}
                      </Link>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setApplicationModalJob(job)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--c-solid)] dark:bg-[var(--c-solid)] text-white hover:bg-[var(--c-solid)]/90 dark:hover:bg-[var(--c-solid)] transition-colors"
                      >
                        <Send size={16} />
                        {t('jobSearch.apply')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 pt-4" aria-label={t('jobSearch.pagination') || 'Sidnavigering'}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label={t('jobSearch.previousPage') || 'Föregående sida'}
                  className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <span className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400" aria-current="page">
                  {t('jobSearch.pageXofY', { current: currentPage, total: totalPages })}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label={t('jobSearch.nextPage') || 'Nästa sida'}
                  className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              </nav>
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
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setSelectedJob(null)}
        >
          <div
            ref={jobModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-modal-title"
            className="bg-white dark:bg-stone-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-stone-800 border-b border-stone-100 dark:border-stone-700 p-3 sm:p-4 flex items-center justify-between">
              <h2 id="job-modal-title" className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100 pr-8 line-clamp-1">{selectedJob.headline}</h2>
              <button
                onClick={() => setSelectedJob(null)}
                aria-label={t('common.close')}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={24} className="text-stone-700 dark:text-stone-300" aria-hidden="true" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                  <Building2 size={20} className="text-stone-600 dark:text-stone-400" />
                  <span className="font-medium">{selectedJob.employer?.name}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedJob.workplace_address?.municipality && (
                    <span className="px-3 py-1 bg-stone-100 dark:bg-stone-700 rounded-full text-sm text-stone-600 dark:text-stone-300">
                      📍 {selectedJob.workplace_address.municipality}
                    </span>
                  )}
                  {selectedJob.employment_type?.label && (
                    <span className="px-3 py-1 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 rounded-full text-sm text-[var(--c-text)] dark:text-[var(--c-text)]">
                      💼 {selectedJob.employment_type.label}
                    </span>
                  )}
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div
                    className="text-stone-700 dark:text-stone-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeHTMLWithLineBreaks(selectedJob.description?.text) }}
                  />
                </div>

                {/* AI Feature Buttons */}
                <div className="flex gap-2 pt-4 border-t border-stone-100 dark:border-stone-700">
                  <button
                    onClick={() => setShowInterviewPrep(!showInterviewPrep)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      showInterviewPrep
                        ? "bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)] border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50"
                        : "bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-text)] hover:bg-[var(--c-accent)]/40 dark:hover:bg-[var(--c-bg)]/40"
                    )}
                  >
                    <MessageSquare size={16} />
                    Intervjuförberedelse
                  </button>
                  <button
                    onClick={() => setShowCommutePlanner(!showCommutePlanner)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      showCommutePlanner
                        ? "bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)] border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50"
                        : "bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-text)] hover:bg-[var(--c-accent)]/40 dark:hover:bg-[var(--c-bg)]/40"
                    )}
                  >
                    <Train size={16} />
                    Pendlingsinfo
                  </button>
                </div>

                {/* Interview Prep Panel */}
                {showInterviewPrep && (
                  <InterviewPrepPanel
                    companyName={selectedJob.employer?.name || ''}
                    jobTitle={selectedJob.headline}
                    jobDescription={selectedJob.description?.text?.substring(0, 2000)}
                  />
                )}

                {/* Commute Planner Panel */}
                {showCommutePlanner && (
                  <CommutePlannerPanel
                    workAddress={selectedJob.workplace_address?.street_address
                      ? `${selectedJob.workplace_address.street_address}, ${selectedJob.workplace_address.municipality || ''}`
                      : selectedJob.workplace_address?.municipality || ''}
                    workCompanyName={selectedJob.employer?.name}
                  />
                )}

                <div className="space-y-2 sm:space-y-3 pt-4 border-t border-stone-100 dark:border-stone-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
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
                          ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800"
                          : "bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600"
                      )}
                    >
                      <Heart size={18} className={isSaved(selectedJob.id) ? "fill-current" : ""} />
                      <span className="text-sm sm:text-base">{isSaved(selectedJob.id) ? t('jobSearch.saved') : t('jobSearch.saveJob')}</span>
                    </button>

                    <Link
                      to={`/cover-letter?jobId=${selectedJob.id}&company=${encodeURIComponent(selectedJob.employer?.name || '')}&title=${encodeURIComponent(selectedJob.headline)}&desc=${encodeURIComponent(selectedJob.description?.text?.substring(0, 1000) || '')}`}
                      onClick={() => setSelectedJob(null)}
                      className="flex items-center justify-center gap-2 py-3 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)] hover:bg-[var(--c-accent)]/40 dark:hover:bg-[var(--c-bg)]/50 rounded-xl font-medium transition-colors border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 min-h-[48px]"
                    >
                      <FileText size={18} />
                      <span className="text-sm sm:text-base">{t('jobSearch.writePersonalLetter')}</span>
                    </Link>
                  </div>

                  <button
                    onClick={() => {
                      setApplicationModalJob(selectedJob)
                      setSelectedJob(null)
                    }}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--c-solid)] dark:bg-[var(--c-solid)] text-white rounded-xl font-medium hover:bg-[var(--c-solid)]/90 dark:hover:bg-[var(--c-solid)] transition-colors min-h-[48px]"
                  >
                    <Send size={18} />
                    <span className="text-sm sm:text-base">{t('jobSearch.createApplication')}</span>
                  </button>

                  {selectedJob.application_details?.url && (
                    <a
                      href={selectedJob.application_details.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors min-h-[48px]"
                    >
                      <ExternalLink size={18} />
                      <span className="text-sm sm:text-base">{t('jobSearch.applyDirectlyAtAF')}</span>
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
          onSuccess={() => getStats()}
        />
      )}
    </div>
  );
}

// Enhanced Saved Jobs Tab
function SavedJobsTab() {
  const { t } = useTranslation();
  const { savedJobs, removeJob, updateJobStatus, isLoaded } = useSavedJobs();
  const [filter, setFilter] = useState<'all' | SavedJob['status']>('all');
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'status'>('date');

  // Filter to only show saved jobs (not applications)
  const onlySaved = useMemo(() =>
    savedJobs.filter(j => j.status === 'saved'),
    [savedJobs]
  );

  const filteredJobs = useMemo(() => {
    let jobs = filter === 'all' ? onlySaved : onlySaved.filter(j => j.status === filter);

    // Sort
    return jobs.sort((a, b) => {
      switch (sortBy) {
        case 'company':
          return (a.jobData?.employer?.name || '').localeCompare(b.jobData?.employer?.name || '');
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
        default:
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
      }
    });
  }, [onlySaved, filter, sortBy]);

  const handleMarkAsApplied = async (jobId: string) => {
    await updateJobStatus(jobId, 'applied');
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c-solid)] dark:border-[var(--c-solid)]" />
      </div>
    );
  }

  if (onlySaved.length === 0) {
    return (
      <Card className="p-12 text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="w-16 h-16 bg-stone-100 dark:bg-stone-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Bookmark className="w-8 h-8 text-stone-600 dark:text-stone-400" />
        </div>
        <h3 className="text-xl font-semibold text-stone-700 dark:text-stone-200 mb-2">{t('jobSearch.noSavedJobsTitle')}</h3>
        <p className="text-stone-700 dark:text-stone-400 mb-4">{t('jobSearch.noSavedJobsDesc')}</p>
        <Link to="/job-search">
          <Button>{t('jobSearch.title')}</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Sparade jobb</h2>
          <p className="text-sm text-stone-700 dark:text-stone-400">{onlySaved.length} jobb sparade</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-sm border border-stone-200 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] dark:focus:ring-[var(--c-solid)] bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
          >
            <option value="date">Senast sparade</option>
            <option value="company">Företag A-Ö</option>
          </select>
        </div>
      </div>

      {/* Jobs list */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredJobs.map((job) => {
          const jobData = job.jobData;
          return (
            <Card key={job.id} className="p-5 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)] hover:shadow-[var(--shadow-hover)] transition-[border-color,box-shadow] bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
              <div className="flex items-start gap-4">
                {/* Company logo placeholder */}
                <div className="w-12 h-12 bg-stone-100 dark:bg-stone-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-stone-600 dark:text-stone-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100 line-clamp-1">
                    {jobData?.headline || 'Okänd tjänst'}
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    {jobData?.employer?.name || 'Okänt företag'}
                  </p>
                  {jobData?.workplace_address?.municipality && (
                    <p className="text-sm text-stone-700 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {jobData.workplace_address.municipality}
                    </p>
                  )}

                  {/* Saved date */}
                  <p className="text-xs text-stone-600 dark:text-stone-500 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Sparad {new Date(job.savedAt).toLocaleDateString('sv-SE')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleMarkAsApplied(job.id)}
                    className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                    title="Markera som ansökt"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Ta bort detta sparade jobb?')) {
                        removeJob(job.id);
                      }
                    }}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-stone-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Ta bort"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Footer with link */}
              {jobData?.webpage_url && (
                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-700 flex justify-end">
                  <a
                    href={jobData.webpage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-[var(--c-text)] dark:text-[var(--c-text)] hover:text-[var(--c-text)] dark:hover:text-[var(--c-text)] font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visa annons
                  </a>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ApplicationsTab, AlertsTab, MatchesTab are imported from @/components/jobs/

// Main component with routing
export default function JobSearch() {
  const location = useLocation();
  const { t } = useTranslation();

  // Build tabs with translated labels
  const jobSearchTabs = jobSearchTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
  }));

  return (
    <>
      <PageLayout
        title={t('jobSearch.title')}
        subtitle={t('jobSearch.subtitle')}
        tabs={jobSearchTabs}
        tabVariant="glass"
        className="max-w-7xl mx-auto"
        domain="activity"
      >
        <Routes>
          <Route index element={<SearchTab />} />
          <Route path="daily" element={<DailyJobTab />} />
          <Route path="saved" element={<SavedJobsTab />} />
          <Route path="alerts" element={<AlertsTab />} />
          <Route path="matches" element={<MatchesTab />} />
          {/* Redirect old paths to the dedicated Applications page */}
          <Route path="applications" element={<Navigate to="/applications" replace />} />
          <Route path="crm" element={<Navigate to="/applications/contacts" replace />} />
          <Route path="culture" element={<Navigate to="/applications" replace />} />
          <Route path="*" element={<Navigate to="/job-search" replace />} />
        </Routes>
      </PageLayout>
    </>
  );
}
