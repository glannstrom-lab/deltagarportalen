import { useState, useEffect } from 'react';
import { GraduationCap, ExternalLink, Search, Loader2, BookOpen, Clock, Award, Filter } from 'lucide-react';
import { Autocomplete } from '@/components/common/Autocomplete';
import { afDirectApi } from '@/services/afDirectApi';
import type { AutocompleteOption } from '@/components/common/Autocomplete';
import type { EducationInfo } from '@/services/afDirectApi';

interface EducationFilter {
  type: 'all' | 'yrkeshogskola' | 'universitet' | 'komvux' | 'folkhogskola' | 'arbetsmarknadsutbildning';
  duration: 'all' | 'short' | 'medium' | 'long';
}

export default function EducationOverview() {
  const [occupation, setOccupation] = useState<AutocompleteOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<EducationInfo[]>([]);
  const [filter, setFilter] = useState<EducationFilter>({
    type: 'all',
    duration: 'all'
  });
  const [filteredCourses, setFilteredCourses] = useState<EducationInfo[]>([]);

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
    const labels: Record<string, string> = {
      all: 'Alla typer',
      yrkeshogskola: 'Yrkeshögskola',
      universitet: 'Universitet/Högskola',
      komvux: 'Komvux',
      folkhogskola: 'Folkhögskola',
      arbetsmarknadsutbildning: 'Arbetsmarknadsutbildning'
    };
    return labels[type] || type;
  };

  const getDurationLabel = (dur: string) => {
    const labels: Record<string, string> = {
      all: 'Alla längder',
      short: 'Kort (veckor)',
      medium: 'Medel (månader)',
      long: 'Lång (år)'
    };
    return labels[dur] || dur;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Utbildning</h2>
            <p className="text-white/80">Hitta rätt utbildning för din karriär</p>
          </div>
        </div>
        
        <p className="text-white/90 max-w-2xl">
          Sök bland tusentals yrkesutbildningar från Yrkeshögskolan, universitet, 
          Komvux och andra utbildningsanordnare. Hitta utbildningar som leder till jobb.
        </p>
      </div>

      {/* Sök och filter */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        {/* Sök */}
        <div className="flex flex-col md:flex-row gap-4">
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
                const res = await fetch(`/api/taxonomy/autocomplete?q=${encodeURIComponent(q)}`);
                return res.ok ? res.json() : [];
              }}
              showCategories={false}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={searchEducation}
              disabled={!occupation || loading}
              className="w-full md:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Söker...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Sök utbildning
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter */}
        {courses.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-500 mr-2">
              <Filter size={16} />
              Filtrera:
            </div>
            
            <select
              value={filter.type}
              onChange={(e) => setFilter(f => ({ ...f, type: e.target.value as any }))}
              className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{getTypeLabel('all')}</option>
              <option value="yrkeshogskola">{getTypeLabel('yrkeshogskola')}</option>
              <option value="universitet">{getTypeLabel('universitet')}</option>
              <option value="komvux">{getTypeLabel('komvux')}</option>
              <option value="folkhogskola">{getTypeLabel('folkhogskola')}</option>
              <option value="arbetsmarknadsutbildning">{getTypeLabel('arbetsmarknadsutbildning')}</option>
            </select>
            
            <select
              value={filter.duration}
              onChange={(e) => setFilter(f => ({ ...f, duration: e.target.value as any }))}
              className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{getDurationLabel('all')}</option>
              <option value="short">{getDurationLabel('short')}</option>
              <option value="medium">{getDurationLabel('medium')}</option>
              <option value="long">{getDurationLabel('long')}</option>
            </select>
          </div>
        )}
      </div>

      {/* Resultat */}
      {!loading && filteredCourses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">
              Hittade {filteredCourses.length} utbildningar
            </h3>
            {filteredCourses.length !== courses.length && (
              <button
                onClick={() => setFilter({ type: 'all', duration: 'all' })}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Rensa filter
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {filteredCourses.map((course, idx) => (
              <div
                key={course.code || idx}
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <BookOpen size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{course.title}</h4>
                        {course.type && (
                          <p className="text-sm text-slate-500">{course.type}</p>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                      {course.description || 'Ingen beskrivning tillgänglig.'}
                    </p>
                    
                    <div className="flex flex-wrap gap-3 text-sm">
                      {course.duration_months && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock size={14} />
                          {course.duration_months} månader
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col gap-2">
                    {course.url && (
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                      >
                        Läs mer
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      onClick={() => {/* TODO: Spara intresse */}}
                      className="flex items-center justify-center gap-1 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      <Award size={14} />
                      Spara
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && courses.length > 0 && filteredCourses.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
          <Filter size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Inga utbildningar matchar filtren</h3>
          <p className="text-slate-500 mb-4">
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

      {!loading && courses.length === 0 && occupation && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
          <BookOpen size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Inga utbildningar hittades</h3>
          <p className="text-slate-500">
            Kunde inte hitta utbildningar för detta yrke. Prova med ett annat sökord eller yrke.
          </p>
        </div>
      )}

      {!loading && !occupation && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
          <GraduationCap size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Hitta din utbildning</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-4">
            Sök efter utbildningar för ditt drömyrke. Vi söker bland Yrkeshögskolan, 
            universitet, Komvux och andra utbildningsanordnare.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">Yrkeshögskola</span>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full">Universitet</span>
            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full">Komvux</span>
            <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full">Folkhögskola</span>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0">
            <Award size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Studiemedel och CSN</h4>
            <p className="text-blue-800 text-sm mb-3">
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
    </div>
  );
}
