import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  Filter,
  ExternalLink,
  Heart,
  Bell,
  AlertCircle,
  Loader2,
  X,
  ChevronDown,
  Building2,
  Calendar,
  TrendingUp,
  Bookmark,
  Share2,
  Check
} from 'lucide-react';
import { afApi, type JobAd, type SearchFilters } from '@/services/arbetsformedlingenApi';
import { JobCard } from './JobCard';

// Sökfilter-gränssnitt
interface FilterState {
  q: string;
  municipality: string;
  region: string;
  employment_type: string;
  experience: boolean | null;
  remote: boolean | null;
}

// Spara sökning för jobbalerts
interface SavedSearch {
  id: string;
  name: string;
  filters: FilterState;
  notify: boolean;
  createdAt: string;
}

// Sparat jobb
interface SavedJob {
  id: string;
  jobId: string;
  jobData: JobAd;
  savedAt: string;
  notes?: string;
}

export default function PlatsbankenIntegration() {
  // Sök- och filtertillstånd
  const [filters, setFilters] = useState<FilterState>({
    q: '',
    municipality: '',
    region: '',
    employment_type: '',
    experience: null,
    remote: null
  });
  
  const [jobs, setJobs] = useState<JobAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  
  // Sparade jobb och sökningar
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSavedJobs, setShowSavedJobs] = useState(false);
  
  // Filter-panel
  const [showFilters, setShowFilters] = useState(false);
  
  // Notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const LIMIT = 20;

  // Ladda sparade jobb och sökningar från localStorage
  useEffect(() => {
    const saved = localStorage.getItem('platsbanken_saved_jobs');
    if (saved) {
      try {
        setSavedJobs(JSON.parse(saved));
      } catch (e) {
        console.error('Kunde inte ladda sparade jobb:', e);
      }
    }
    
    const searches = localStorage.getItem('platsbanken_saved_searches');
    if (searches) {
      try {
        setSavedSearches(JSON.parse(searches));
      } catch (e) {
        console.error('Kunde inte ladda sparade sökningar:', e);
      }
    }
  }, []);

  // Spara sparade jobb till localStorage
  useEffect(() => {
    localStorage.setItem('platsbanken_saved_jobs', JSON.stringify(savedJobs));
  }, [savedJobs]);

  // Spara sparade sökningar till localStorage
  useEffect(() => {
    localStorage.setItem('platsbanken_saved_searches', JSON.stringify(savedSearches));
  }, [savedSearches]);

  // Ladda kommuner och regioner vid mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const [munResult, regResult] = await Promise.all([
          afApi.getMunicipalities(),
          afApi.getRegions()
        ]);
        
        if (munResult.success) {
          setMunicipalities(munResult.data);
        }
        if (regResult.success) {
          setRegions(regResult.data);
        }
      } catch (e) {
        console.error('Kunde inte ladda platser:', e);
      }
    };
    
    loadLocations();
  }, []);

  // Visa notification
  const showNotification = (message: string, type: 'success' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Sök jobb
  const searchJobs = useCallback(async (resetOffset = true) => {
    setLoading(true);
    setError(null);
    
    if (resetOffset) {
      setOffset(0);
    }
    
    try {
      const searchFilters: SearchFilters = {
        ...filters,
        limit: LIMIT,
        offset: resetOffset ? 0 : offset
      };
      
      // Ta bort tomma filter
      Object.keys(searchFilters).forEach(key => {
        if (searchFilters[key as keyof SearchFilters] === '' || searchFilters[key as keyof SearchFilters] === null) {
          delete searchFilters[key as keyof SearchFilters];
        }
      });
      
      const result = await afApi.searchJobsSafe(searchFilters);
      
      if (result.success) {
        const newJobs = result.data.hits;
        setJobs(prev => resetOffset ? newJobs : [...prev, ...newJobs]);
        setTotalJobs(result.data.total?.value || 0);
        setIsMockData(!!result.fromCache || !!result.isMockData);
        setHasMore(newJobs.length === LIMIT);
        
        if (result.error) {
          setError(result.error);
        }
      } else {
        setError(result.error || 'Kunde inte hämta jobb');
        setJobs([]);
      }
    } catch (err) {
      setError('Ett fel inträffade vid sökning');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  // Sök vid enter
  const handleSearch = () => {
    searchJobs(true);
  };

  // Ladda fler jobb
  const loadMore = () => {
    setOffset(prev => prev + LIMIT);
    searchJobs(false);
  };

  // Autocomplete
  const handleInputChange = async (value: string) => {
    setFilters(prev => ({ ...prev, q: value }));
    
    if (value.length >= 2) {
      try {
        const result = await afApi.getAutocomplete(value, 'occupation');
        if (result.success && result.data) {
          setSuggestions(result.data.map((item: any) => item.label || item).slice(0, 5));
          setShowSuggestions(true);
        }
      } catch (e) {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Välj förslag
  const selectSuggestion = (suggestion: string) => {
    setFilters(prev => ({ ...prev, q: suggestion }));
    setShowSuggestions(false);
    searchJobs(true);
  };

  // Spara/ta bort jobb
  const toggleSaveJob = (job: JobAd) => {
    const isSaved = savedJobs.some(sj => sj.jobId === job.id);
    
    if (isSaved) {
      setSavedJobs(prev => prev.filter(sj => sj.jobId !== job.id));
      showNotification('Jobb borttaget från sparade', 'info');
    } else {
      const savedJob: SavedJob = {
        id: `saved-${Date.now()}`,
        jobId: job.id,
        jobData: job,
        savedAt: new Date().toISOString()
      };
      setSavedJobs(prev => [savedJob, ...prev]);
      showNotification('Jobb sparat!', 'success');
    }
  };

  const isJobSaved = (jobId: string) => savedJobs.some(sj => sj.jobId === jobId);

  // Spara sökning
  const saveSearch = () => {
    const name = filters.q || 'Min sökning';
    const newSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      name: `${name} (${new Date().toLocaleDateString('sv-SE')})`,
      filters: { ...filters },
      notify: false,
      createdAt: new Date().toISOString()
    };
    
    setSavedSearches(prev => [newSearch, ...prev]);
    showNotification('Sökning sparad!', 'success');
  };

  // Ta bort sparad sökning
  const deleteSavedSearch = (id: string) => {
    setSavedSearches(prev => prev.filter(s => s.id !== id));
    showNotification('Sökning borttagen', 'info');
  };

  // Aktivera sparad sökning
  const activateSearch = (savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters);
    searchJobs(true);
  };

  // Toggle jobbalert för sparad sökning
  const toggleAlert = (id: string) => {
    setSavedSearches(prev => prev.map(s => 
      s.id === id ? { ...s, notify: !s.notify } : s
    ));
    showNotification('Jobbalert uppdaterat', 'info');
  };

  // Rensa filter
  const clearFilters = () => {
    setFilters({
      q: '',
      municipality: '',
      region: '',
      employment_type: '',
      experience: null,
      remote: null
    });
    setJobs([]);
    setTotalJobs(0);
    setError(null);
    setIsMockData(false);
  };

  // Öppna ansökan på Arbetsförmedlingen
  const openApplication = (job: JobAd) => {
    const url = job.application_details?.url || 
      `https://arbetsformedlingen.se/for-arbetssokande/lediga-jobb/${job.id}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Anställningstyper
  const employmentTypes = [
    { value: '', label: 'Alla typer' },
    { value: 'Vanlig anställning', label: 'Tillsvidare' },
    { value: 'Tidsbegränsad anställning', label: 'Visstid' },
    { value: 'Heltid', label: 'Heltid' },
    { value: 'Deltid', label: 'Deltid' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Platsbanken</h1>
              <p className="text-sm text-slate-500">Sök bland tusentals lediga jobb från Arbetsförmedlingen</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSavedJobs(!showSavedJobs)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  showSavedJobs 
                    ? 'bg-teal-100 text-teal-700' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Bookmark size={18} />
                Sparade jobb
                {savedJobs.length > 0 && (
                  <span className="bg-teal-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {savedJobs.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Sökfält */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={20} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={filters.q}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Sök på yrke, titel eller nyckelord..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              
              {/* Autocomplete-förslag */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                showFilters 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Filter size={18} />
              Filter
              {(filters.municipality || filters.region || filters.employment_type) && (
                <span className="bg-teal-800 text-white text-xs px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </button>
            
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sök'}
            </button>
          </div>

          {/* Filter-panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Län</label>
                  <select
                    value={filters.region}
                    onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Alla län</option>
                    {regions.map(region => (
                      <option key={region.concept_id} value={region.label}>
                        {region.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kommun */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kommun</label>
                  <select
                    value={filters.municipality}
                    onChange={(e) => setFilters(prev => ({ ...prev, municipality: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Alla kommuner</option>
                    {municipalities.map(mun => (
                      <option key={mun.concept_id} value={mun.label}>
                        {mun.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Anställningstyp */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Anställningstyp</label>
                  <select
                    value={filters.employment_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, employment_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {employmentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkbox-filter */}
              <div className="flex flex-wrap gap-4 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.experience === false}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      experience: e.target.checked ? false : null 
                    }))}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">Ingen erfarenhet krävs</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.remote === true}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      remote: e.target.checked ? true : null 
                    }))}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">Distansarbete möjligt</span>
                </label>
              </div>

              {/* Filter-actions */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={clearFilters}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Rensa filter
                </button>
                <button
                  onClick={saveSearch}
                  className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  <Bell size={16} />
                  Spara sökning med jobbalert
                </button>
              </div>
            </div>
          )}

          {/* Sparade sökningar */}
          {savedSearches.length > 0 && !showSavedJobs && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-slate-500 py-1">Sparade sökningar:</span>
              {savedSearches.map(search => (
                <div
                  key={search.id}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-sm"
                >
                  <button
                    onClick={() => activateSearch(search)}
                    className="text-slate-700 hover:text-teal-600"
                  >
                    {search.name}
                  </button>
                  <button
                    onClick={() => toggleAlert(search.id)}
                    className={`p-0.5 rounded ${search.notify ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
                    title={search.notify ? 'Stäng av jobbalert' : 'Aktivera jobbalert'}
                  >
                    <Bell size={12} fill={search.notify ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => deleteSavedSearch(search.id)}
                    className="p-0.5 text-slate-400 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-slate-800 text-white'
        }`}>
          {notification.type === 'success' ? <Check size={18} /> : <Bell size={18} />}
          {notification.message}
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Mock-data varning */}
        {isMockData && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-amber-800 font-medium">
                Data kan vara föråldrad
              </p>
              <p className="text-amber-700 text-sm">
                Arbetsförmedlingens API är för närvarande otillgängligt. Visar exempeldata för demonstration.
              </p>
            </div>
          </div>
        )}

        {showSavedJobs ? (
          /* Sparade jobb-vy */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800">
                Sparade jobb ({savedJobs.length})
              </h2>
              <button
                onClick={() => setShowSavedJobs(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {savedJobs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <Bookmark size={48} className="text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">Inga sparade jobb</h3>
                <p className="text-slate-500 mb-4">Spara intressanta jobb för att hitta dem lättare senare</p>
                <button
                  onClick={() => setShowSavedJobs(false)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Sök jobb
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedJobs.map(savedJob => (
                  <div key={savedJob.id} className="bg-white rounded-xl p-5 border border-slate-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 text-lg">
                          {savedJob.jobData.headline}
                        </h3>
                        <p className="text-slate-600">{savedJob.jobData.employer?.name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {savedJob.jobData.workplace_address?.municipality || 'Ort ej angiven'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            Sparat {new Date(savedJob.savedAt).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openApplication(savedJob.jobData)}
                          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                          <ExternalLink size={16} />
                          Ansök
                        </button>
                        <button
                          onClick={() => toggleSaveJob(savedJob.jobData)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Heart size={20} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Sökresultat */
          <div>
            {/* Resultat-info */}
            {jobs.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-600">
                  Visar <span className="font-semibold">{jobs.length}</span> av{' '}
                  <span className="font-semibold">{totalJobs.toLocaleString('sv-SE')}</span> jobb
                </p>
                <button
                  onClick={saveSearch}
                  className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700"
                >
                  <Bell size={16} />
                  Skapa jobbalert
                </button>
              </div>
            )}

            {/* Jobb-lista */}
            <div className="space-y-4">
              {jobs.map(job => (
                <div key={job.id} className="relative">
                  <JobCard
                    job={job}
                    isSaved={isJobSaved(job.id)}
                    onSave={() => toggleSaveJob(job)}
                    onApply={() => openApplication(job)}
                    showMatch={false}
                    showApplyButton={true}
                  />
                </div>
              ))}
            </div>

            {/* Ladda fler */}
            {jobs.length > 0 && hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Laddar...
                    </span>
                  ) : (
                    'Ladda fler jobb'
                  )}
                </button>
              </div>
            )}

            {/* Tomt tillstånd */}
            {!loading && jobs.length === 0 && !error && (
              <div className="text-center py-12">
                <Search size={64} className="text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  Börja söka jobb
                </h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">
                  Ange ett sökord ovan för att hitta lediga jobb från Arbetsförmedlingen. 
                  Du kan filtrera på plats, anställningstyp och mer.
                </p>
                
                {/* Snabbsökningar */}
                <div className="flex flex-wrap justify-center gap-2">
                  {['Undersköterska', 'Lagerarbetare', 'Kundtjänst', 'Säljare', 'Kock'].map(term => (
                    <button
                      key={term}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, q: term }));
                        searchJobs(true);
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Felmeddelande */}
            {error && jobs.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle size={64} className="text-red-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  Något gick fel
                </h3>
                <p className="text-slate-500 mb-4">{error}</p>
                <button
                  onClick={() => searchJobs(true)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Försök igen
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
