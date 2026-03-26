/**
 * Education Page - Sök och utforska utbildningar
 * Integrerar med Susa-navet (Skolverket) och JobEd Connect (Arbetsförmedlingen)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  Button,
  Input,
  Select,
  LoadingState,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { PageLayout, PageSection } from '@/components/layout';
import {
  educationApi,
  type Education,
  type EducationType,
  type SearchResult,
  type EducationTypeOption,
  type RegionOption,
} from '@/services/educationApi';

// ============== CONSTANTS ==============

const TYPE_COLORS: Record<string, string> = {
  yrkeshogskola: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  hogskola: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  universitet: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
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
  const typeColorClass = TYPE_COLORS[education.type] || 'bg-stone-100 text-stone-800';

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-violet-300 dark:hover:border-violet-700">
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
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 line-clamp-2 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
              {education.title}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
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
          <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 mb-3">
            {education.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500 dark:text-stone-400">
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
            <span className="text-stone-400 dark:text-stone-500">
              {education.pace}
            </span>
          )}
          {education.credits && (
            <span className="text-stone-400 dark:text-stone-500">
              {education.credits} hp
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
          {education.applicationDeadline && (
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {t('education.deadline')}: {new Date(education.applicationDeadline).toLocaleDateString('sv-SE')}
            </span>
          )}
          {education.url && (
            <a
              href={education.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors ml-auto"
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
        'hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md',
        'transition-all duration-200'
      )}
    >
      <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
        <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
      </div>
      <div>
        <h4 className="font-medium text-stone-900 dark:text-stone-100">{title}</h4>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-stone-400 ml-auto self-center" />
    </button>
  );
}

// ============== MAIN COMPONENT ==============

export default function Education() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState<EducationType>(
    (searchParams.get('type') as EducationType) || 'all'
  );
  const [selectedRegion, setSelectedRegion] = useState(searchParams.get('region') || '');
  const [showFilters, setShowFilters] = useState(false);

  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

  // Search function
  const performSearch = useCallback(async (
    query: string,
    type: EducationType,
    region: string
  ) => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const result = await educationApi.search({
        query: query || undefined,
        type,
        region: region || undefined,
        limit: 20,
      });
      setSearchResult(result);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult({ educations: [], total: 0, hasMore: false, source: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle search submit
  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();

    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedType !== 'all') params.set('type', selectedType);
    if (selectedRegion) params.set('region', selectedRegion);
    setSearchParams(params, { replace: true });

    performSearch(searchQuery, selectedType, selectedRegion);
  }, [searchQuery, selectedType, selectedRegion, setSearchParams, performSearch]);

  // Quick search handlers
  const handleQuickSearch = useCallback((query: string, type?: EducationType) => {
    setSearchQuery(query);
    if (type) setSelectedType(type);
    performSearch(query, type || 'all', selectedRegion);
  }, [selectedRegion, performSearch]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedRegion('');
    setSearchParams({}, { replace: true });
    setSearchResult(null);
    setHasSearched(false);
  }, [setSearchParams]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedType !== 'all' || selectedRegion;

  // Initial search from URL params
  useEffect(() => {
    const q = searchParams.get('q');
    const type = searchParams.get('type') as EducationType;
    const region = searchParams.get('region');

    if (q || type || region) {
      performSearch(q || '', type || 'all', region || '');
    }
  }, []); // Only run on mount

  return (
    <PageLayout
      title={t('education.title')}
      description={t('education.description')}
      showTabs={false}
    >
      {/* Search Section */}
      <PageSection>
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('education.searchPlaceholder')}
                className="pl-10"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && 'bg-violet-50 border-violet-300')}
            >
              <Filter className="w-4 h-4 mr-2" />
              {t('education.filters')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                t('education.search')
              )}
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  {t('education.educationType')}
                </label>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as EducationType)}
                >
                  {educationTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  {t('education.region')}
                </label>
                <Select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                >
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-stone-500">{t('education.activeFilters')}:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-violet-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {educationTypes.find(t => t.id === selectedType)?.label}
                  <button onClick={() => setSelectedType('all')} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedRegion && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {regions.find(r => r.id === selectedRegion)?.label}
                  <button onClick={() => setSelectedRegion('')} className="hover:text-emerald-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-stone-500 hover:text-stone-700 underline"
              >
                {t('education.clearAll')}
              </button>
            </div>
          )}
        </form>
      </PageSection>

      {/* Quick Actions (shown when no search) */}
      {!hasSearched && (
        <div className="mt-6 space-y-6">
          {/* Info Banner */}
          <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border-violet-200 dark:border-violet-800">
            <div className="p-4 sm:p-5 flex items-start gap-4">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Info className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                  {t('education.infoBanner.title')}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                  {t('education.infoBanner.description')}
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Search Options */}
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
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
              className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors"
            >
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-stone-900 dark:text-stone-100">
                  {t('education.links.interestGuide.title')}
                </h4>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {t('education.links.interestGuide.description')}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-400" />
            </Link>
            <Link
              to="/skills-gap-analysis"
              className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors"
            >
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-stone-900 dark:text-stone-100">
                  {t('education.links.skillsGap.title')}
                </h4>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {t('education.links.skillsGap.description')}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-400" />
            </Link>
          </div>
        </div>
      )}

      {/* Search Results */}
      {hasSearched && (
        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <EducationSkeleton key={i} />
              ))}
            </div>
          ) : searchResult && searchResult.educations.length > 0 ? (
            <>
              {/* Results header */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {t('education.resultsCount', { count: searchResult.total })}
                  {searchResult.source === 'fallback-mock' && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                      ({t('education.demoData')})
                    </span>
                  )}
                </p>
              </div>

              {/* Results grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {searchResult.educations.map((education) => (
                  <EducationCard key={education.id} education={education} />
                ))}
              </div>

              {/* Load more */}
              {searchResult.hasMore && (
                <div className="mt-6 text-center">
                  <Button variant="outline" onClick={() => {
                    // Load more logic
                  }}>
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
    </PageLayout>
  );
}
