/**
 * Education Page - Sök och utforska utbildningar
 * Integrerar med Susa-navet (Skolverket) och JobEd Connect (Arbetsförmedlingen)
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import {
  GraduationCap,
  Search,
  MapPin,
  Clock,
  ExternalLink,
  Filter,
  X,
  Building2,
  Laptop,
  BookOpen,
  Target,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Info,
  Lightbulb,
  Globe,
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import {
  Card,
  Button,
  Input,
  Select,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { PageLayout, PageSection } from '@/components/layout/PageLayout';
import { HelpButton } from '@/components/HelpButton';
import { helpContent } from '@/data/helpContent';
import {
  educationApi,
  type Education,
  type EducationType,
  type SearchResult,
  type EducationTypeOption,
  type RegionOption,
} from '@/services/educationApi';
import { useEducationSearch } from '@/hooks/useEducationSearch';

// ============== CONSTANTS ==============

const TYPE_COLORS: Record<string, string> = {
  yrkeshogskola: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  hogskola: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  universitet: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  komvux: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  folkhogskola: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  yrkeshogskola: Target,
  hogskola: BookOpen,
  universitet: GraduationCap,
  komvux: Lightbulb,
  folkhogskola: Building2,
};

// ============== COMPONENTS ==============

function EducationCard({ education }: { education: Education }) {
  const { t } = useTranslation();
  const TypeIcon = TYPE_ICONS[education.type] || GraduationCap;
  const typeColorClass = TYPE_COLORS[education.type] || 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300';

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-teal-300 dark:hover:border-teal-600 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn(
            'p-2 rounded-lg flex-shrink-0',
            typeColorClass.replace('text-', 'bg-').split(' ')[0] + '/20'
          )}>
            <TypeIcon className="w-5 h-5 text-current" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              {education.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {education.provider}
            </p>
          </div>
        </div>

        {/* Type Badge */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
            typeColorClass
          )}>
            {education.typeLabel}
          </span>
          {education.distance && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              <Laptop className="w-3 h-3" />
              {t('education.distance')}
            </span>
          )}
        </div>

        {/* Description */}
        {education.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {education.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
          {education.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {education.location}
            </span>
          )}
          {education.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {education.duration}
            </span>
          )}
          {education.pace && (
            <span className="text-gray-600 dark:text-gray-400">
              {education.pace}
            </span>
          )}
          {education.credits && (
            <span className="text-gray-600 dark:text-gray-400">
              {education.credits} hp
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
          {education.applicationDeadline && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('education.deadline')}: {new Date(education.applicationDeadline).toLocaleDateString('sv-SE')}
            </span>
          )}
          {education.url && (
            <a
              href={education.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors ml-auto"
            >
              {t('education.readMore')}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

function EducationSkeleton() {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </Card>
  );
}

function QuickSearchCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl text-left w-full',
        'bg-gradient-to-br from-white to-stone-50 dark:from-stone-800 dark:to-stone-900',
        'border-2 border-stone-200 dark:border-stone-700',
        'hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md',
        'transition-all duration-200'
      )}
    >
      <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
        <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
      </div>
      <div>
        <h4 className="font-medium text-gray-800 dark:text-gray-100">{title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400 ml-auto self-center" />
    </button>
  );
}

// ============== MAIN COMPONENT ==============

export default function Education() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Real-time search hook
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    educationType: selectedType,
    setEducationType: setSelectedType,
    region: selectedRegion,
    setRegion: setSelectedRegion,
    distanceOnly,
    setDistanceOnly,
    results,
    total,
    hasMore,
    source,
    isLoading,
    isSearching,
    hasSearched,
    error,
    loadMore,
    clearFilters: clearAllFilters,
  } = useEducationSearch({
    debounceDelay: 300,
    autoSearch: true,
    minQueryLength: 0,
    initialLimit: 20,
  });

  const [educationTypes, setEducationTypes] = useState<EducationTypeOption[]>([]);
  const [regions, setRegions] = useState<RegionOption[]>([]);

  // Load filter options
  useEffect(() => {
    async function loadOptions() {
      const [types, regs] = await Promise.all([
        educationApi.getTypes(),
        educationApi.getRegions(),
      ]);
      setEducationTypes(types);
      setRegions(regs);
    }
    loadOptions();
  }, []);

  // Sync URL params with search state
  useEffect(() => {
    if (!hasSearched) return;

    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedType !== 'all') params.set('type', selectedType);
    if (selectedRegion) params.set('region', selectedRegion);
    if (distanceOnly) params.set('distance', 'true');
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedType, selectedRegion, distanceOnly, hasSearched, setSearchParams]);

  // Initialize from URL params on mount
  useEffect(() => {
    const q = searchParams.get('q');
    const type = searchParams.get('type') as EducationType;
    const region = searchParams.get('region');
    const distance = searchParams.get('distance') === 'true';

    if (q) setSearchQuery(q);
    if (type) setSelectedType(type);
    if (region) setSelectedRegion(region);
    if (distance) setDistanceOnly(true);
  }, []); // Only run on mount

  // Quick search handlers
  const handleQuickSearch = useCallback((query: string, type?: EducationType) => {
    setSearchQuery(query);
    if (type) setSelectedType(type);
  }, [setSearchQuery, setSelectedType]);

  // Clear filters
  const clearFilters = useCallback(() => {
    clearAllFilters();
    setSearchParams({}, { replace: true });
  }, [clearAllFilters, setSearchParams]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedType !== 'all' || selectedRegion || distanceOnly;

  return (
    <PageLayout
      title={t('education.title')}
      description={t('education.description')}
      showTabs={false}
    >
      {/* Search Section */}
      <PageSection>
        <div className="space-y-4">
          {/* Search Bar - Real-time filtering (no submit required) */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('education.searchPlaceholder')}
                className="pl-10 bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600"
                aria-label={t('education.searchPlaceholder')}
              />
              {isSearching && (
                <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500 animate-spin" />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && 'bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-600')}
              aria-expanded={showFilters}
              aria-controls="education-filters"
            >
              <Filter className="w-4 h-4 mr-2" />
              {t('education.filters')}
            </Button>
          </div>

          {/* Filters - Changes trigger instant search */}
          {showFilters && (
            <div
              id="education-filters"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('education.educationType')}
                </label>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as EducationType)}
                  className="bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600"
                >
                  {educationTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('education.region')}
                </label>
                <Select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600"
                >
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('education.studyFormat', 'Studieform')}
                </label>
                <div className="flex items-center gap-4 h-10">
                  <button
                    type="button"
                    onClick={() => setDistanceOnly(!distanceOnly)}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      distanceOnly
                        ? 'bg-sky-100 text-sky-700 border-2 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-600'
                        : 'bg-white text-gray-600 border border-gray-300 hover:border-sky-300 dark:bg-stone-700 dark:text-gray-300 dark:border-stone-600'
                    )}
                    aria-pressed={distanceOnly}
                  >
                    <Globe className="w-4 h-4" />
                    {t('education.distanceOnly', 'Endast distans')}
                  </button>
                  {distanceOnly && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t('education.distanceHint', 'Visar utbildningar på distans')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('education.activeFilters')}:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-teal-900 dark:hover:text-teal-200" aria-label={t('education.removeFilter')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                  {educationTypes.find(t => t.id === selectedType)?.label}
                  <button onClick={() => setSelectedType('all')} className="hover:text-teal-900 dark:hover:text-teal-200" aria-label={t('education.removeFilter')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedRegion && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {regions.find(r => r.id === selectedRegion)?.label}
                  <button onClick={() => setSelectedRegion('')} className="hover:text-emerald-900 dark:hover:text-emerald-200" aria-label={t('education.removeFilter')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {distanceOnly && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                  <Globe className="w-3 h-3" />
                  {t('education.distanceOnly', 'Distans')}
                  <button onClick={() => setDistanceOnly(false)} className="hover:text-sky-900 dark:hover:text-sky-200" aria-label={t('education.removeFilter')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
              >
                {t('education.clearAll')}
              </button>
            </div>
          )}
        </div>
      </PageSection>

      {/* Quick Actions (shown when no search) */}
      {!hasSearched && (
        <div className="mt-6 space-y-6">
          {/* Info Banner */}
          <Card className="bg-gradient-to-r from-teal-50 to-sky-50 dark:from-teal-900/20 dark:to-sky-900/20 border-teal-200 dark:border-teal-800">
            <div className="p-4 sm:p-5 flex items-start gap-4">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                <Info className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  {t('education.infoBanner.title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {t('education.infoBanner.description')}
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Search Options */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              {t('education.quickSearch.title')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickSearchCard
                icon={Target}
                title={t('education.quickSearch.yh.title')}
                description={t('education.quickSearch.yh.description')}
                onClick={() => handleQuickSearch('', 'yrkeshogskola')}
              />
              <QuickSearchCard
                icon={GraduationCap}
                title={t('education.quickSearch.university.title')}
                description={t('education.quickSearch.university.description')}
                onClick={() => handleQuickSearch('', 'hogskola')}
              />
              <QuickSearchCard
                icon={Laptop}
                title={t('education.quickSearch.it.title')}
                description={t('education.quickSearch.it.description')}
                onClick={() => handleQuickSearch('programmering webbutveckling')}
              />
              <QuickSearchCard
                icon={Building2}
                title={t('education.quickSearch.healthcare.title')}
                description={t('education.quickSearch.healthcare.description')}
                onClick={() => handleQuickSearch('vård omsorg sjuksköterska')}
              />
              <QuickSearchCard
                icon={Lightbulb}
                title={t('education.quickSearch.business.title')}
                description={t('education.quickSearch.business.description')}
                onClick={() => handleQuickSearch('ekonomi redovisning')}
              />
              <QuickSearchCard
                icon={Sparkles}
                title={t('education.quickSearch.creative.title')}
                description={t('education.quickSearch.creative.description')}
                onClick={() => handleQuickSearch('design media')}
              />
            </div>
          </div>

          {/* Links to related pages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/interest-guide"
              className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
            >
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 dark:text-gray-100">
                  {t('education.links.interestGuide.title')}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('education.links.interestGuide.description')}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </Link>
            <Link
              to="/skills-gap-analysis"
              className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
            >
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 dark:text-gray-100">
                  {t('education.links.skillsGap.title')}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('education.links.skillsGap.description')}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </Link>
          </div>
        </div>
      )}

      {/* Search Results */}
      {hasSearched && (
        <div className="mt-6">
          {/* Error state */}
          {error && (
            <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {isSearching ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <EducationSkeleton key={i} />
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              {/* Results header */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400" role="status" aria-live="polite">
                  {t('education.resultsCount', { count: total })}
                  {source === 'fallback-mock' && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                      ({t('education.demoData')})
                    </span>
                  )}
                </p>
              </div>

              {/* Results grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {results.map((education) => (
                  <EducationCard key={education.id} education={education} />
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isLoading}
                    className="min-w-[150px]"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {t('education.loadMore')}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={<GraduationCap className="w-12 h-12" />}
              title={t('education.noResults.title')}
              description={t('education.noResults.description')}
              action={
                <Button variant="outline" onClick={clearFilters}>
                  {t('education.noResults.action')}
                </Button>
              }
            />
          )}
        </div>
      )}
      <HelpButton content={helpContent.education} />
    </PageLayout>
  );
}
