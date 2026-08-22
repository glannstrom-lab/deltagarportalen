/**
 * Education Page - Sök och utforska utbildningar
 *
 * Datan kommer från **JobEd Connect** (JobTech/Arbetsförmedlingen) via
 * edge-funktionen `education-search`. Docstringen påstod till 2026-08-22 att
 * sidan också integrerar med "Susa-navet (Skolverket)" — det gör den inte,
 * och har aldrig gjort. Ordet "Susa" finns inte i någon annan fil i repot.
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
  Lightbulb,
  Globe,
  AlertCircle,
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { sakerUrl } from '@/lib/sakerUrl';
import {
  Card,
  Button,
  Input,
  Select,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { PageLayout, PageSection } from '@/components/layout/PageLayout';
import {
  educationApi,
  type Education,
  type EducationType,
  type EducationTypeOption,
  type RegionOption,
} from '@/services/educationApi';
import { useEducationSearch } from '@/hooks/useEducationSearch';
import { useFocusMode } from '@/components/FocusModeProvider';
import { FokusVaxel } from '@/components/focus/shell/FokusVaxel';
import { FocusEducationWizard } from '@/components/focus/pages/FocusEducationWizard';
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel';

// ============== CONSTANTS ==============

/**
 * Ikon per utbildningsform.
 *
 * FÄRGERNA ÄR BORTA. Tidigare fanns en `TYPE_COLORS`-tabell i lila, amber och
 * stone, plus ett trick som byggde ikonplattans bakgrundsklass i runtime
 * (`typeColorClass.replace('text-','bg-')…`). Tre fel på en gång:
 *  - Karriär-hubbens färg är rosa (`--coaching-*`), inte lila. Lilan kom från
 *    `tailwind.config.js`, som Tailwind 4 aldrig läser (inget `@config`).
 *  - Klassen som tricket byggde (`bg-purple-50/20`) finns inte i bygget —
 *    Tailwind skannar statiska strängar, inte strängar som sätts ihop i JS.
 *    Plattan hade alltså ingen bakgrund alls.
 *  - En sida = en hubbfärg (DESIGN.md §4). Variation kommer från ikonen.
 */
const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  yrkeshogskola: Target,
  hogskola: GraduationCap,
  komvux: Lightbulb,
  folkhogskola: Building2,
  arbetsmarknadsutbildning: Building2,
  kku: Sparkles,
};

/** Snabbvalen som data i stället för sex kopior av samma JSX. */
const SNABBVAL: Array<{
  nyckel: string;
  icon: React.ComponentType<{ className?: string }>;
  query: string;
  type?: EducationType;
}> = [
  { nyckel: 'yh', icon: Target, query: '', type: 'yrkeshogskola' },
  { nyckel: 'university', icon: GraduationCap, query: '', type: 'hogskola' },
  { nyckel: 'it', icon: Laptop, query: 'programmering webbutveckling' },
  { nyckel: 'healthcare', icon: Building2, query: 'vård omsorg sjuksköterska' },
  { nyckel: 'business', icon: BookOpen, query: 'ekonomi redovisning' },
  { nyckel: 'creative', icon: Sparkles, query: 'design media' },
];

/** Så många orter räknas upp innan resten blir "+ N till". */
const MAX_ORTER = 3;

// ============== COMPONENTS ==============

function EducationCard({ education }: { education: Education }) {
  const { t } = useTranslation();
  const TypeIcon = TYPE_ICONS[education.type] || GraduationCap;

  // Fältet kom som `{lang, content}` från API:t ända till 2026-08-22, och
  // `href={objekt}` blev `href="[object Object]"` — varje "Läs mer" ledde till
  // portalens egen startsida. Edgen är lagad, men vakten står kvar: en
  // formändring uppströms ska ge en länk som saknas, inte en som ljuger.
  const lank = sakerUrl(education.url);

  const orter = education.locations?.length
    ? education.locations
    : education.location
      ? [education.location]
      : [];
  const synligaOrter = orter.slice(0, MAX_ORTER);
  const fler = orter.length - synligaOrter.length;
  const visaProvider = !!education.provider && !orter.includes(education.provider);

  return (
    <Card
      padding="none"
      className="group h-full flex transition-colors duration-150 hover:border-[var(--c-accent)] bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700"
    >
      {/* Flexkolumn: korten i en rad jämnas ut till samma höjd, och utan det
          här hamnade luften UNDER "Läs mer" i stället för ovanför. */}
      <div className="p-4 sm:p-5 flex flex-col w-full">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg flex-shrink-0 bg-[var(--c-bg)] text-[var(--c-solid)]">
            <TypeIcon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-stone-900 dark:text-stone-100 line-clamp-2 group-hover:text-[var(--c-solid)] transition-colors"
              title={education.title}
            >
              {education.title}
            </h3>
            {/* Komvuxposternas "anordnare" ÄR kommunen, och samma namn står
                som ort en rad ner. Visa det en gång. */}
            {visaProvider && (
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                {education.provider}
              </p>
            )}
          </div>
        </div>

        {/* Type Badge */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--c-bg)] text-[var(--c-text)] border border-[var(--c-accent)]">
            {education.typeLabel}
          </span>
          {education.distance && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-200">
              <Laptop className="w-3 h-3" aria-hidden="true" />
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-4 text-sm text-stone-600 dark:text-stone-400">
          {synligaOrter.length > 0 && (
            <span className="inline-flex items-center gap-1 min-w-0">
              <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">
                {synligaOrter.join(', ')}
                {fler > 0 && ` ${t('education.moreLocations', { count: fler })}`}
              </span>
            </span>
          )}
          {education.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" aria-hidden="true" />
              {education.duration}
            </span>
          )}
          {education.pace && <span>{education.pace}</span>}
          {/* Poängen bär numera sin enhet. Tidigare visades samma tal två
              gånger — "1900 YH-poäng" och "1900 hp" — om en komvuxkurs som
              är 1900 gymnasiepoäng. */}
          {education.creditsLabel && <span>{education.creditsLabel}</span>}
        </div>

        {/* Actions */}
        {lank && (
          <div className="flex flex-wrap items-center justify-end gap-2 mt-auto pt-4 border-t border-stone-100 dark:border-stone-700">
            <a
              href={lank}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--c-solid)] hover:text-[var(--c-text)] transition-colors"
              aria-label={t('education.readMoreAbout', { title: education.title })}
            >
              {t('education.readMore')}
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}

function EducationSkeleton() {
  // Samma geometri som EducationCard: `padding="none"` + inre `p-4 sm:p-5`.
  // Skelettet ärvde tidigare Cards `md:p-6` medan kortet la på ytterligare
  // padding — innehållet hoppade ~40 px i sidled när skeletten byttes ut.
  return (
    <Card padding="none" className="h-full">
      <div className="p-4 sm:p-5">
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
        'bg-white dark:bg-stone-800',
        'border-2 border-stone-300 dark:border-stone-700',
        'hover:border-[var(--c-accent)] hover:shadow-[0_4px_8px_rgb(0_0_0/0.04)]',
        'transition-colors duration-150'
      )}
    >
      <div className="p-2 rounded-lg bg-[var(--c-bg)] flex-shrink-0">
        <Icon className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-stone-900 dark:text-stone-100">{title}</h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-stone-500 dark:text-stone-400 ml-auto self-center flex-shrink-0" aria-hidden="true" />
    </button>
  );
}

/** Chip för ett aktivt filter. Ta-bort-knappen säger VILKET filter den tar
 *  bort — tidigare hade alla fyra samma aria-label, och den var dessutom en
 *  rå i18n-nyckel ("education.removeFilter") eftersom nyckeln aldrig lades in
 *  i språkfilerna. */
function FilterChip({
  text,
  icon: Icon,
  onRemove,
}: {
  text: string;
  icon?: React.ComponentType<{ className?: string }>;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full text-xs bg-[var(--c-bg)] text-[var(--c-text)] border border-[var(--c-accent)]">
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
      <span className="max-w-[12rem] truncate">{text}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 p-1 rounded-full hover:bg-[var(--c-accent)] transition-colors"
        aria-label={t('education.removeFilter', { filter: text })}
      >
        <X className="w-3 h-3" aria-hidden="true" />
      </button>
    </span>
  );
}

// ============== MAIN COMPONENT ==============

/**
 * Fokusläget DÖLJER normalvyn i stället för att avmontera den.
 *
 * Tidigare stod här `if (isFocusMode) return <PageFocusShell…>` — en tidig
 * return, alltså en avmontering. Att slå på fokusläget mitt i en sökning
 * slängde träfflistan, alla sidor man laddat med "Visa fler", den öppna
 * filterpanelen och det man just hunnit skriva (URL-synken hinner inte med
 * inom debouncens 300 ms). Samma bugg har lagats en sida i taget fem gånger;
 * `FokusVaxel` finns för att sluta göra det.
 */
export default function Education() {
  const { t } = useTranslation();
  const { leaveWizard } = useFocusMode();

  // Frågan guiden lämnar över. Nonce i stället för bara texten: söker man på
  // samma ord två gånger i rad ändras inte strängen, och effekten i
  // EducationInner hade inte kört om.
  const [guideFraga, setGuideFraga] = useState<{ text: string; nonce: number } | null>(null);

  return (
    <FokusVaxel
      title={t('education.title', 'Utbildning')}
      icon={GraduationCap}
      domain="coaching"
      guide={
        <FocusEducationWizard
          onExit={leaveWizard}
          onSok={(fraga) => setGuideFraga({ text: fraga, nonce: Date.now() })}
        />
      }
    >
      <EducationInner guideFraga={guideFraga} />
    </FokusVaxel>
  );
}

function EducationInner({ guideFraga }: { guideFraga?: { text: string; nonce: number } | null }) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  // Id i stället för ref: `Button` är ingen forwardRef-komponent, och att
  // skicka `ref` genom dess propstyp går inte utan att ändra den delade
  // komponenten. Escape ska bara lämna tillbaka fokus, inget mer.
  const FILTER_KNAPP_ID = 'education-filter-toggle';

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
    isLoading,
    isSearching,
    hasSearched,
    error,
    search,
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
    let avbruten = false;
    async function loadOptions() {
      const [types, regs] = await Promise.all([
        educationApi.getTypes(),
        educationApi.getRegions(),
      ]);
      if (avbruten) return;
      setEducationTypes(types);
      setRegions(regs);
    }
    loadOptions();
    return () => { avbruten = true; };
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

  // Överlämning från fokuslägets guide. Normalvyn ligger kvar monterad bakom
  // guiden (FokusVaxel), så den läser inte om URL:en — frågan måste skickas
  // in som prop.
  useEffect(() => {
    if (guideFraga?.text) setSearchQuery(guideFraga.text);
    // setSearchQuery är stabil (useState-settern ur hooken).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideFraga?.nonce]);

  // Quick search handlers
  const handleQuickSearch = useCallback((query: string, type?: EducationType) => {
    setSearchQuery(query);
    setSelectedType(type ?? 'all');
  }, [setSearchQuery, setSelectedType]);

  // Clear filters
  const clearFilters = useCallback(() => {
    clearAllFilters();
    setSearchParams({}, { replace: true });
  }, [clearAllFilters, setSearchParams]);

  const hasActiveFilters = !!searchQuery || selectedType !== 'all' || !!selectedRegion || distanceOnly;

  const typLabel = educationTypes.find((typ) => typ.id === selectedType)?.label;
  const regionLabel = regions.find((r) => r.id === selectedRegion)?.label;

  // Utbildningsformen är ett exklusivt val och sidans vanligaste avgränsning.
  // Den bor i skenan i stället för i en dropdown bakom en filterknapp — dels
  // för att den hör hemma där, dels för att skenan annars bara innehöll
  // rubriken och beskrivningen på en 186 px bred kolumn.
  const sidoflikar = useMemo(() => {
    if (educationTypes.length < 2) return undefined;
    return {
      poster: educationTypes.map((typ) => ({ id: typ.id, etikett: typ.label })),
      aktiv: selectedType,
      vidVal: (id: string) => setSelectedType(id as EducationType),
    };
  }, [educationTypes, selectedType, setSelectedType]);

  /** Vad skärmläsaren ska höra om sökningens tillstånd. Liveregionen ligger
   *  permanent i DOM:en längre ner — en region som monteras samtidigt som
   *  sin text annonseras normalt inte alls. */
  const statusText = isSearching
    ? t('education.searching')
    : error
      ? t('education.error.title')
      : hasSearched
        ? (results.length > 0
            ? t('education.resultsCount', { count: total })
            : t('education.noResults.title'))
        : '';

  const visaResultatyta = hasSearched || isSearching;

  return (
    <PageLayout
      title={t('education.title')}
      description={t('education.description')}
      showTabs={false}
      sidoflikar={sidoflikar}
      domain="coaching"
      className="sidbredd"
>
      {/* Search Section */}
      <PageSection>
        <div className="space-y-4">
          {/* Search Bar - Real-time filtering (no submit required) */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                type="text"
                label={t('education.searchLabel')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('education.searchPlaceholder')}
                leftIcon={<Search className="w-5 h-5" />}
                rightIcon={
                  isSearching
                    ? <RefreshCw className="w-4 h-4 text-[var(--c-solid)] animate-spin" aria-hidden="true" />
                    : undefined
                }
              />
            </div>
            <Button
              id={FILTER_KNAPP_ID}
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex-shrink-0',
                showFilters && 'bg-[var(--c-bg)] border-[var(--c-accent)]'
              )}
              aria-expanded={showFilters}
              aria-controls="education-filters"
            >
              <Filter className="w-4 h-4 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">{t('education.filters')}</span>
              <span className="sr-only sm:hidden">{t('education.filters')}</span>
            </Button>
          </div>

          {/* Filters - Changes trigger instant search
              Renderas ALLTID och döljs med `hidden`. `aria-controls` på knappen
              pekade tidigare på ett element som bara fanns när panelen var
              öppen — alltså en död referens i sidans utgångsläge. */}
          <div
            id="education-filters"
            hidden={!showFilters}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowFilters(false);
                document.getElementById(FILTER_KNAPP_ID)?.focus();
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700"
          >
            <Select
              label={t('education.region')}
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              options={regions.map((region) => ({ value: region.id, label: region.label }))}
            />
            {/* `role="group"` + `aria-labelledby` i stället för fieldset/legend.
                Semantiskt likvärdigt för skärmläsare — men `accessibility.css`
                har en OLAGRAD regel `fieldset { border: 1px solid; padding: 1rem }`,
                och olagrad CSS slår Tailwinds `@layer utilities` oavsett
                specificitet. `border-0 p-0` bet alltså inte, och gruppen fick
                en egen ram inuti filterpanelen som region-fältet bredvid saknar. */}
            <div className="min-w-0" role="group" aria-labelledby="education-studieform">
              <span
                id="education-studieform"
                className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5"
              >
                {t('education.studyFormat')}
              </span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-h-10">
                <button
                  type="button"
                  onClick={() => setDistanceOnly(!distanceOnly)}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border-2',
                    distanceOnly
                      ? 'bg-[var(--c-bg)] text-[var(--c-text)] border-[var(--c-accent)]'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-[var(--c-accent)] dark:bg-stone-700 dark:text-stone-200 dark:border-stone-600'
                  )}
                  aria-pressed={distanceOnly}
                >
                  <Globe className="w-4 h-4" aria-hidden="true" />
                  {t('education.distanceOnly')}
                </button>
                {distanceOnly && (
                  <span className="text-xs text-stone-600 dark:text-stone-400">
                    {t('education.distanceHint')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-stone-600 dark:text-stone-400">{t('education.activeFilters')}:</span>
              {searchQuery && (
                <FilterChip text={`"${searchQuery}"`} onRemove={() => setSearchQuery('')} />
              )}
              {selectedType !== 'all' && typLabel && (
                <FilterChip text={typLabel} onRemove={() => setSelectedType('all')} />
              )}
              {selectedRegion && regionLabel && (
                <FilterChip text={regionLabel} onRemove={() => setSelectedRegion('')} />
              )}
              {distanceOnly && (
                <FilterChip
                  text={t('education.distanceOnly')}
                  icon={Globe}
                  onRemove={() => setDistanceOnly(false)}
                />
              )}
              <button
                onClick={clearFilters}
                className="px-2 py-1 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 underline"
              >
                {t('education.clearAll')}
              </button>
            </div>
          )}
        </div>
      </PageSection>

      <RadgivarTips pathname="/education" index={0} />

      {/* Permanent liveregion. Måste finnas i DOM:en INNAN texten skrivs —
          en region som monteras tillsammans med sitt innehåll annonseras
          normalt inte. Tidigare låg den inuti resultatgrenen, som revs och
          byggdes om vid varje debounce. */}
      <p role="status" aria-live="polite" className="sr-only">
        {statusText}
      </p>

      {/* Quick Actions (shown when no search) */}
      {!visaResultatyta && (
        <div className="mt-6 space-y-6">
          {/*
            Rubriken "Hitta rätt utbildning för dig" sa samma sak som skenans
            "Sök och utforska utbildningar från hela Sverige", 200 px till
            vänster, och panelen runt den tog ~120 px. Kvar står den enda
            uppgift raden faktiskt bar: vilka källor sökningen täcker. Den hör
            till sökrutan ovanför, inte till en egen yta.
          */}
          <p className="-mt-2 text-sm text-stone-600 dark:text-stone-400 max-w-3xl">
            {t('education.infoBanner.description')}
          </p>

          {/* Quick Search Options */}
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
              {t('education.quickSearch.title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SNABBVAL.map((val) => (
                <QuickSearchCard
                  key={val.nyckel}
                  icon={val.icon}
                  title={t(`education.quickSearch.${val.nyckel}.title`)}
                  description={t(`education.quickSearch.${val.nyckel}.description`)}
                  onClick={() => handleQuickSearch(val.query, val.type)}
                />
              ))}
            </div>
          </div>

          {/* Links to related pages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/interest-guide"
              className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 hover:border-[var(--c-accent)] transition-colors"
            >
              <div className="p-2 rounded-lg bg-[var(--c-bg)] flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-stone-900 dark:text-stone-100">
                  {t('education.links.interestGuide.title')}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {t('education.links.interestGuide.description')}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-500 dark:text-stone-400 flex-shrink-0" aria-hidden="true" />
            </Link>
            <Link
              to="/skills-gap-analysis"
              className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 hover:border-[var(--c-accent)] transition-colors"
            >
              <div className="p-2 rounded-lg bg-[var(--c-bg)] flex-shrink-0">
                <Target className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-stone-900 dark:text-stone-100">
                  {t('education.links.skillsGap.title')}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {t('education.links.skillsGap.description')}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-500 dark:text-stone-400 flex-shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {/* Search Results */}
      {visaResultatyta && (
        <div className="mt-6" aria-busy={isSearching}>
          {isSearching ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" aria-hidden="true">
              {[...Array(6)].map((_, i) => (
                <EducationSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            /* Ett avbrott är inte ett besked om utbudet.
               Sidan visade tidigare "Inga utbildningar hittades — prova att
               ändra dina sökfilter" när API:t föll, och knappen därunder
               RADERADE det användaren skrivit. Servicen kastar inte, den
               returnerar `source: 'error'`; hooken läser det numera. */
            <div
              role="alert"
              className="flex flex-col items-center gap-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-6 py-10 text-center"
            >
              <AlertCircle className="w-8 h-8 text-[var(--c-solid)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                {t('education.error.title')}
              </h2>
              <p className="max-w-md text-sm text-stone-600 dark:text-stone-400">
                {t('education.error.description')}
              </p>
              <Button variant="outline" onClick={() => search()}>
                {t('education.error.action')}
              </Button>
            </div>
          ) : results.length > 0 ? (
            <>
              {/* Results header */}
              <div className="mb-4">
                <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {t('education.resultsCount', { count: total })}
                </h2>
                <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
                  {t('education.mergedNote')}
                </p>
              </div>

              {/* Results grid */}
              <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 list-none p-0 m-0">
                {results.map((education) => (
                  <li key={education.id}>
                    <EducationCard education={education} />
                  </li>
                ))}
              </ul>

              {/* Load more.
                  `disabled` flyttade fokus till <body> i samma render som
                  klicket — nästa Tab startade om från sidans topp, efter att
                  20 nya kort just lagts till. `aria-disabled` + tidig retur
                  låter knappen behålla fokus. */}
              {hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={() => { if (!isLoading) loadMore(); }}
                    aria-disabled={isLoading}
                    className={cn('min-w-[150px]', isLoading && 'opacity-60')}
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
                    ) : null}
                    {t('education.loadMore')}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              illustration="karriar"
              title={t('education.noResults.title')}
              description={t('education.noResults.description')}
              action={{
                label: t('education.noResults.action'),
                onClick: clearFilters,
                variant: 'outline'
              }}
            />
          )}
        </div>
      )}
    </PageLayout>
  );
}
