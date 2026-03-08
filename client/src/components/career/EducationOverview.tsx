import { useState, useEffect } from 'react';
import { 
  GraduationCap, ExternalLink, Search, Loader2, BookOpen, 
  Clock, Award, Filter, ChevronDown, X, SlidersHorizontal,
  MapPin, Building2, Heart, CheckCircle, Bookmark
} from 'lucide-react';
import { showToast } from '@/components/Toast';
import { educationApi, type SavedEducation } from '@/services/careerApi';
import { Autocomplete } from '@/components/common/Autocomplete';
import { afDirectApi } from '@/services/afDirectApi';
import type { AutocompleteOption } from '@/components/common/Autocomplete';
import type { EducationInfo } from '@/services/afDirectApi';
import { cn } from '@/lib/utils';
import { COMMON_OCCUPATIONS } from './occupations';

interface EducationFilter {
  type: 'all' | 'yrkeshogskola' | 'universitet' | 'komvux' | 'folkhogskola' | 'arbetsmarknadsutbildning';
  duration: 'all' | 'short' | 'medium' | 'long';
}

const EDUCATION_TYPES = [
  { value: 'all', label: 'Alla typer', color: 'bg-slate-100 text-slate-700' },
  { value: 'yrkeshogskola', label: 'Yrkeshögskola', color: 'bg-blue-100 text-blue-700' },
  { value: 'universitet', label: 'Universitet', color: 'bg-purple-100 text-purple-700' },
  { value: 'komvux', label: 'Komvux', color: 'bg-green-100 text-green-700' },
  { value: 'folkhogskola', label: 'Folkhögskola', color: 'bg-orange-100 text-orange-700' },
  { value: 'arbetsmarknadsutbildning', label: 'Arbetsmarknad', color: 'bg-red-100 text-red-700' },
] as const;

const DURATION_OPTIONS = [
  { value: 'all', label: 'Alla längder' },
  { value: 'short', label: 'Kort', description: 'Veckor' },
  { value: 'medium', label: 'Medel', description: 'Månader' },
  { value: 'long', label: 'Lång', description: 'År' },
] as const;

export default function EducationOverview() {
  const [occupation, setOccupation] = useState<AutocompleteOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<EducationInfo[]>([]);
  const [filter, setFilter] = useState<EducationFilter>({
    type: 'all',
    duration: 'all'
  });
  const [filteredCourses, setFilteredCourses] = useState<EducationInfo[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [savedEducations, setSavedEducations] = useState<SavedEducation[]>([]);

  // Load saved educations on mount
  useEffect(() => {
    loadSavedEducations();
  }, []);

  const loadSavedEducations = async () => {
    try {
      const educations = await educationApi.getAll();
      setSavedEducations(educations);
    } catch (error) {
      console.error('Failed to load saved educations:', error);
    }
  };

  const isEducationSaved = (code: string) => {
    return savedEducations.some(e => e.education_code === code);
  };

  const saveEducation = async (course: EducationInfo) => {
    if (!occupation) return;
    
    try {
      await educationApi.save({
        education_code: course.code || course.title,
        title: course.title,
        type: course.type || 'Övrig',
        description: course.description,
        duration_months: course.duration_months,
        location: course.location,
        url: course.url,
        provider: course.provider,
        target_occupation: occupation.label,
        status: 'interested',
        notes: ''
      });
      showToast.success('Utbildningen sparad!');
      await loadSavedEducations();
    } catch (error) {
      showToast.error('Kunde inte spara utbildningen');
    }
  };

  const updateEducationStatus = async (id: string, status: SavedEducation['status']) => {
    try {
      await educationApi.update(id, { status });
      showToast.success('Status uppdaterad!');
      await loadSavedEducations();
    } catch (error) {
      showToast.error('Kunde inte uppdatera status');
    }
  };

  const searchEducation = async () => {
    if (!occupation) return;
    
    setLoading(true);
    
    try {
      const results = await afDirectApi.searchEducations(occupation.label);
      
      setCourses(results);
      setFilteredCourses(results);
    } catch (error) {
      console.error('Fel vid sökning efter utbildningar:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrera kurser när filter eller kurser ändras
  useEffect(() => {
    if (!Array.isArray(courses)) {
      setFilteredCourses([]);
      return;
    }
    
    let filtered = courses;
    
    if (filter.type !== 'all') {
      const filterValue = filter.type.toLowerCase();
      filtered = filtered.filter(c => {
        const typeMatch = c.type?.toLowerCase().includes(filterValue);
        const titleMatch = c.title?.toLowerCase().includes(filterValue);
        return typeMatch || titleMatch;
      });
    }
    
    if (filter.duration !== 'all') {
      filtered = filtered.filter(c => {
        const months = c.duration_months || 0;
        if (filter.duration === 'short') return months > 0 && months <= 3;
        if (filter.duration === 'medium') return months > 3 && months <= 12;
        if (filter.duration === 'long') return months > 12;
        return true;
      });
    }
    
    setFilteredCourses(filtered);
  }, [filter, courses]);

  const getTypeLabel = (type: string) => {
    const found = EDUCATION_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  const getTypeColor = (type: string) => {
    const found = EDUCATION_TYPES.find(t => t.value === type);
    return found?.color || 'bg-slate-100 text-slate-700';
  };

  const getDurationLabel = (dur: string) => {
    const found = DURATION_OPTIONS.find(d => d.value === dur);
    return found?.label || dur;
  };

  // Mobile filter drawer
  const MobileFilterDrawer = () => {
    if (!showMobileFilters) return null;

    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={() => setShowMobileFilters(false)}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Filtrera utbildningar</h2>
            <button 
              onClick={() => setShowMobileFilters(false)}
              className="p-2 hover:bg-slate-100 rounded-full"
            >
              <X size={24} className="text-slate-500" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Typ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                <Building2 size={16} className="inline mr-1" />
                Utbildningstyp
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EDUCATION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFilter(f => ({ ...f, type: type.value as any }))}
                    className={cn(
                      "px-3 py-3 rounded-xl text-sm font-medium transition-colors text-left",
                      filter.type === type.value
                        ? type.color.replace('bg-', 'ring-2 ring-').replace('100', '500') + ' ' + type.color
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Längd */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                <Clock size={16} className="inline mr-1" />
                Längd
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map((dur) => (
                  <button
                    key={dur.value}
                    onClick={() => setFilter(f => ({ ...f, duration: dur.value as any }))}
                    className={cn(
                      "px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                      filter.duration === dur.value
                        ? "bg-blue-500 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    <div>{dur.label}</div>
                    <div className="text-xs opacity-70">{dur.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-100 space-y-3 bg-white">
            {(filter.type !== 'all' || filter.duration !== 'all') && (
              <button
                onClick={() => setFilter({ type: 'all', duration: 'all' })}
                className="w-full py-3 text-blue-600 font-medium hover:bg-blue-50 rounded-xl"
              >
                Rensa filter
              </button>
            )}
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600"
            >
              Visa {filteredCourses.length} utbildningar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsiv */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold">Utbildning</h2>
            <p className="text-white/80 text-sm sm:text-base">
              Hitta rätt utbildning för din karriär
            </p>
          </div>
        </div>
        
        <p className="text-white/90 mt-4 text-sm sm:text-base max-w-2xl">
          Sök bland tusentals yrkesutbildningar från Yrkeshögskolan, universitet, 
          Komvux och andra utbildningsanordnare.
        </p>
      </div>

      {/* Sparade utbildningar */}
      {savedEducations.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Bookmark className="text-blue-500" size={16} />
            Dina sparade utbildningar ({savedEducations.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {savedEducations.map((edu) => (
              <div
                key={edu.id}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg"
              >
                <a
                  href={edu.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-700 hover:text-blue-800 font-medium truncate max-w-[200px]"
                >
                  {edu.title}
                </a>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  edu.status === 'interested' ? 'bg-slate-200 text-slate-600' :
                  edu.status === 'applied' ? 'bg-yellow-100 text-yellow-700' :
                  edu.status === 'enrolled' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {edu.status === 'interested' ? 'Intresserad' :
                   edu.status === 'applied' ? 'Ansökt' :
                   edu.status === 'enrolled' ? 'Antagen' : 'Avslutad'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sök och filter */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        {/* Sök */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sök utbildning för yrke
            </label>
            <Autocomplete
              placeholder="T.ex. Systemutvecklare, Sjuksköterska..."
              value={occupation?.label || ''}
              onChange={() => {}}
              onSelect={setOccupation}
              fetchSuggestions={async (q) => {
                if (!q || q.length < 2) return [];
                const filtered = COMMON_OCCUPATIONS.filter(o => 
                  o.label.toLowerCase().includes(q.toLowerCase())
                );
                return filtered.slice(0, 10);
              }}
              showCategories={false}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={searchEducation}
              disabled={!occupation || loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-[48px]"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="hidden sm:inline">Söker...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span className="hidden sm:inline">Sök</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter - Desktop */}
        {courses.length > 0 && (
          <div className="hidden lg:flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Filter size={16} />
              Filtrera:
            </div>
            
            <select
              value={filter.type}
              onChange={(e) => setFilter(f => ({ ...f, type: e.target.value as any }))}
              className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {EDUCATION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            
            <select
              value={filter.duration}
              onChange={(e) => setFilter(f => ({ ...f, duration: e.target.value as any }))}
              className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {DURATION_OPTIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label} ({d.description})</option>
              ))}
            </select>

            {(filter.type !== 'all' || filter.duration !== 'all') && (
              <button
                onClick={() => setFilter({ type: 'all', duration: 'all' })}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Rensa
              </button>
            )}
          </div>
        )}

        {/* Filter - Mobile knapp */}
        {courses.length > 0 && (
          <div className="lg:hidden pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowMobileFilters(true)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors",
                filter.type !== 'all' || filter.duration !== 'all'
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-slate-700"
              )}
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal size={18} />
                Filtrera utbildningar
              </span>
              <div className="flex items-center gap-2">
                {(filter.type !== 'all' || filter.duration !== 'all') && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {[filter.type !== 'all' ? '1' : '', filter.duration !== 'all' ? '1' : ''].filter(Boolean).length}
                  </span>
                )}
                <ChevronDown size={18} />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Resultat */}
      {!loading && filteredCourses.length > 0 && (
        <div className="space-y-4">
          {/* Resultat-header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-800">
              Hittade {filteredCourses.length} utbildningar
            </h3>
            {filteredCourses.length !== courses.length && (
              <button
                onClick={() => setFilter({ type: 'all', duration: 'all' })}
                className="text-sm text-blue-600 hover:text-blue-700 self-start sm:self-auto"
              >
                Rensa filter
              </button>
            )}
          </div>
          
          {/* Utbildningskort */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {filteredCourses.map((course, idx) => (
              <div
                key={course.code || idx}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Innehåll */}
                  <div className="flex-1 min-w-0">
                    {/* Header med ikon och typ */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <BookOpen size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 text-base sm:text-lg line-clamp-2">
                          {course.title}
                        </h4>
                        {course.type && (
                          <span className={cn(
                            "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            getTypeColor(course.type.toLowerCase().replace(/\s+/g, '') as any)
                          )}>
                            {course.type}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Beskrivning */}
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2 sm:line-clamp-3">
                      {course.description || 'Ingen beskrivning tillgänglig.'}
                    </p>
                    
                    {/* Meta-info */}
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500">
                      {course.duration_months && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {course.duration_months} månader
                        </span>
                      )}
                      {course.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span className="truncate max-w-[120px] sm:max-w-none">{course.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Knappar */}
                  <div className="flex flex-row lg:flex-col gap-2 sm:gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {course.url && (
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors min-h-[44px]"
                      >
                        Läs mer
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      onClick={() => saveEducation(course)}
                      disabled={isEducationSaved(course.code || course.title)}
                      className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                        isEducationSaved(course.code || course.title)
                          ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isEducationSaved(course.code || course.title) ? (
                        <>
                          <CheckCircle size={14} />
                          Sparad
                        </>
                      ) : (
                        <>
                          <Heart size={14} />
                          Spara
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inga resultat med filter */}
      {!loading && courses.length > 0 && filteredCourses.length === 0 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 text-center">
          <Filter size={40} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2">
            Inga utbildningar matchar filtren
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Prova att ändra eller rensa filtren för att se fler resultat.
          </p>
          <button
            onClick={() => setFilter({ type: 'all', duration: 'all' })}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Rensa filter
          </button>
        </div>
      )}

      {/* Inga utbildningar hittades */}
      {!loading && courses.length === 0 && occupation && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 text-center">
          <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2">
            Inga utbildningar hittades
          </h3>
          <p className="text-slate-500 text-sm">
            Kunde inte hitta utbildningar för detta yrke. Prova med ett annat sökord.
          </p>
        </div>
      )}

      {/* Tomt tillstånd - välkomst */}
      {!loading && !occupation && (
        <div className="bg-white rounded-2xl p-6 sm:p-12 shadow-sm border border-slate-200 text-center">
          <GraduationCap size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-slate-800 mb-2">
            Hitta din utbildning
          </h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm sm:text-base">
            Sök efter utbildningar för ditt drömyrke. Vi söker bland Yrkeshögskolan, 
            universitet, Komvux och andra utbildningsanordnare.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs sm:text-sm">
            {EDUCATION_TYPES.filter(t => t.value !== 'all').map((type) => (
              <span key={type.value} className={cn("px-3 py-1 rounded-full", type.color)}>
                {type.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Info-kort */}
      <div className="bg-blue-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0">
            <Award size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Studiemedel och CSN</h4>
            <p className="text-blue-800 text-sm mb-2">
              De flesta utbildningar på Yrkeshögskola, universitet och Komvux är 
              avgiftsfria och berättigar till studiemedel från CSN.
            </p>
            <a 
              href="https://www.csn.se" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-800 font-medium"
            >
              Läs mer på csn.se
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer />
    </div>
  );
}
