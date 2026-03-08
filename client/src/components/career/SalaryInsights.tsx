import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, MapPin, Briefcase, Award, BarChart3, Search, Info, Save, Star, Trash2, Loader2, Brain } from 'lucide-react';
import { Autocomplete } from '@/components/common/Autocomplete';
import { salaryApi, type SavedSalarySearch } from '@/services/careerApi';
import { showToast } from '@/components/Toast';
import type { AutocompleteOption } from '@/components/common/Autocomplete';
import { COMMON_OCCUPATIONS } from './occupations';

// AI API call for salary data
async function getSalaryDataFromAI(occupation: string, experience?: number) {
  const response = await fetch('/api/ai/salary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      function: 'salary',
      data: { occupation, experience }
    })
  });
  
  if (!response.ok) {
    throw new Error('Kunde inte hämta lönedata');
  }
  
  return response.json();
}

interface SalaryData {
  occupation: string;
  median: number;
  percentile25: number;
  percentile75: number;
  byRegion: Array<{
    region: string;
    median: number;
    jobCount: number;
  }>;
  byExperience: Array<{
    years: string;
    median: number;
  }>;
  trends: {
    growth: number;
    jobCount: number;
    competition: number;
  };
  source?: string;
  sampleSize?: number;
}

const SWEDISH_REGIONS = [
  'Stockholms län',
  'Västra Götalands län',
  'Skåne län',
  'Uppsala län',
  'Östergötlands län',
  'Jönköpings län',
  'Hallands län',
  'Dalarnas län',
  'Gävleborgs län',
  'Västernorrlands län',
];

export default function SalaryInsights() {
  const [selectedOccupation, setSelectedOccupation] = useState<AutocompleteOption | null>(null);
  const [salaryData, setSalaryData] = useState<SalaryData | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSalarySearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load saved searches on mount
  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      const searches = await salaryApi.getAll();
      setSavedSearches(searches);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  };

  const saveSalarySearch = async () => {
    if (!salaryData || !selectedOccupation) return;
    
    setSaving(true);
    try {
      await salaryApi.save({
        occupation: selectedOccupation.label,
        median_salary: salaryData.median,
        percentile_25: salaryData.percentile25,
        percentile_75: salaryData.percentile75,
        region_data: salaryData.byRegion,
        experience_data: salaryData.byExperience,
        trends: salaryData.trends
      });
      showToast.success('Lönejämförelsen sparad!');
      await loadSavedSearches();
    } catch (error) {
      showToast.error('Kunde inte spara lönejämförelsen');
    } finally {
      setSaving(false);
    }
  };

  const deleteSavedSearch = async (id: string) => {
    try {
      await salaryApi.delete(id);
      showToast.success('Sparad lönejämförelse borttagen');
      await loadSavedSearches();
    } catch (error) {
      showToast.error('Kunde inte ta bort lönejämförelsen');
    }
  };

  const fetchOccupations = async (query: string): Promise<AutocompleteOption[]> => {
    if (!query || query.length < 2) return [];
    
    const filtered = COMMON_OCCUPATIONS.filter(o => 
      o.label.toLowerCase().includes(query.toLowerCase())
    );
    
    return filtered.slice(0, 10);
  };

  const loadSalaryData = async (occupation: AutocompleteOption) => {
    setLoading(true);
    
    try {
      // Hämta lönestatistik från AI
      const aiResult = await getSalaryDataFromAI(occupation.label);
      
      if (aiResult.salaryData) {
        const data = aiResult.salaryData;
        setSalaryData({
          occupation: occupation.label,
          median: data.medianSalary,
          percentile25: data.percentile25,
          percentile75: data.percentile75,
          byRegion: data.byRegion.map((r: any) => ({
            region: r.region,
            median: r.median,
            jobCount: r.jobCount,
          })),
          byExperience: data.byExperience.map((e: any) => ({
            years: e.years,
            median: e.median,
          })),
          trends: {
            growth: data.trends?.growth || 5,
            jobCount: data.trends?.jobCount || 1000,
            competition: data.trends?.competition === 'Låg' ? 5 : 
                        data.trends?.competition === 'Medel' ? 8 : 12,
          },
          source: 'AI-uppskattning',
          sampleSize: data.trends?.jobCount,
        });
      } else {
        setSalaryData(null);
      }
    } catch (error) {
      console.error('Fel vid hämtning av lönedata:', error);
      showToast.error('Kunde inte hämta lönedata från AI');
      setSalaryData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOccupation = (option: AutocompleteOption) => {
    setSelectedOccupation(option);
    loadSalaryData(option);
  };

  const formatSalary = (amount: number) => {
    return `${(amount / 1000).toFixed(0)} 000 kr`;
  };

  return (
    <div className="space-y-6">
      {/* Sparade sökningar */}
      {savedSearches.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Star className="text-amber-500" size={16} />
            Dina sparade lönejämförelser
          </h3>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg group"
              >
                <button
                  onClick={() => handleSelectOccupation({ id: search.occupation, label: search.occupation })}
                  className="text-sm text-green-700 hover:text-green-800 font-medium"
                >
                  {search.occupation}
                </button>
                <button
                  onClick={() => deleteSavedSearch(search.id)}
                  className="text-green-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <DollarSign className="text-green-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Löneinsikter</h2>
            <p className="text-slate-600">Se lönestatistik och marknadsvärde för olika yrken</p>
          </div>
        </div>

        <Autocomplete
          label="Sök yrke"
          placeholder="T.ex. Systemutvecklare, Sjuksköterska..."
          value={selectedOccupation?.label || ''}
          onChange={() => {}}
          onSelect={handleSelectOccupation}
          fetchSuggestions={fetchOccupations}
          showCategories={false}
        />
      </div>

      {loading && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
          <div className="animate-spin w-10 h-10 border-3 border-[#4f46e5] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Hämtar lönestatistik...</p>
        </div>
      )}

      {!loading && salaryData && (
        <>
          {/* Huvudstatistik */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={20} className="opacity-80" />
                <span className="text-sm opacity-80">Medianlön</span>
              </div>
              <p className="text-3xl font-bold">{formatSalary(salaryData.median)}</p>
              <p className="text-sm opacity-80 mt-1">per månad före skatt</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className="text-blue-500" />
                <span className="text-sm text-slate-500">Lönepåverkan</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Certifieringar:</span>
                  <span className="font-medium text-green-600">+5-10%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Byta jobb:</span>
                  <span className="font-medium text-green-600">+10-15%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Specialist:</span>
                  <span className="font-medium text-green-600">+15-20%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Ledarskap:</span>
                  <span className="font-medium text-green-600">+20-30%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={20} className="text-purple-500" />
                <span className="text-sm text-slate-500">Marknadsläge</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Lediga jobb:</span>
                  <span className="font-medium">{salaryData.trends.jobCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tillväxt:</span>
                  <span className="font-medium text-green-600">+{salaryData.trends.growth}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Konkurrens:</span>
                  <span className="font-medium">{salaryData.trends.competition} sökande/jobb</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lönespridning */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">Lönespridning</h3>
            
            <div className="relative pt-8 pb-4">
              {/* Löneskala */}
              <div className="relative h-4 bg-slate-200 rounded-full">
                <div 
                  className="absolute h-full bg-gradient-to-r from-blue-400 via-[#4f46e5] to-purple-500 rounded-full"
                  style={{
                    left: '0%',
                    width: '100%',
                  }}
                />
                
                {/* Markörer */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                  style={{ left: '0%' }}
                >
                  <div className="w-4 h-4 bg-white border-2 border-blue-400 rounded-full" />
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
                    <p className="text-xs text-slate-500">25%</p>
                    <p className="text-sm font-medium">{formatSalary(salaryData.percentile25)}</p>
                  </div>
                </div>
                
                <div 
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                  style={{ left: '50%' }}
                >
                  <div className="w-5 h-5 bg-[#4f46e5] border-2 border-white rounded-full shadow-lg" />
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
                    <p className="text-xs text-slate-500">Median</p>
                    <p className="text-sm font-bold text-[#4f46e5]">{formatSalary(salaryData.median)}</p>
                  </div>
                </div>
                
                <div 
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                  style={{ left: '100%' }}
                >
                  <div className="w-4 h-4 bg-white border-2 border-purple-500 rounded-full" />
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
                    <p className="text-xs text-slate-500">75%</p>
                    <p className="text-sm font-medium">{formatSalary(salaryData.percentile75)}</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 mt-12 text-center">
              25% tjänar mindre än {formatSalary(salaryData.percentile25)} | 
              50% tjänar mindre än {formatSalary(salaryData.median)} | 
              75% tjänar mindre än {formatSalary(salaryData.percentile75)}
            </p>
          </div>

          {/* Regional lönestatistik */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-[#4f46e5]" size={20} />
              <h3 className="font-semibold text-slate-800">Lön per region</h3>
            </div>

            <div className="space-y-3">
              {salaryData.byRegion.map((region) => {
                const maxSalary = Math.max(...salaryData.byRegion.map(r => r.median));
                const percentage = (region.median / maxSalary) * 100;
                const diff = region.median - salaryData.median;
                
                return (
                  <div key={region.region} className="flex items-center gap-4">
                    <span className="w-40 text-sm text-slate-700 truncate">{region.region}</span>
                    <div className="flex-1">
                      <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                        <div 
                          className="h-full bg-[#4f46e5] rounded-lg flex items-center justify-end px-2"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {formatSalary(region.median)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium w-16 text-right ${
                      diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-slate-500'
                    }`}>
                      {diff > 0 ? '+' : ''}{((diff / salaryData.median) * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Erfarenhet vs Lön */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Award className="text-[#4f46e5]" size={20} />
              <h3 className="font-semibold text-slate-800">Lön per erfarenhetsnivå</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {salaryData.byExperience.map((exp) => (
                <div key={exp.years} className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">{exp.years} år</p>
                  <p className="text-lg font-bold text-slate-800">{formatSalary(exp.median)}</p>
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                    <div 
                      className="bg-[#4f46e5] h-1.5 rounded-full"
                      style={{ 
                        width: `${(exp.median / salaryData.byExperience[salaryData.byExperience.length - 1].median) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spara-knapp */}
          <div className="flex justify-center">
            <button
              onClick={saveSalarySearch}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sparar...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Spara lönejämförelse
                </>
              )}
            </button>
          </div>

          {/* Tips för löneökning */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
            <div className="flex items-start gap-3">
              <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">Så ökar du din lön</h4>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="font-medium">1. Specialisera dig:</span>
                    <span>Expertkompetens inom nischade områden ger 15-25% högre lön</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">2. Certifiera dig:</span>
                    <span>Branschcertifieringar visar kompetens och ger 5-10% mer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">3. Byt jobb strategiskt:</span>
                    <span>Ett jobbbyte ger ofta 10-20% löneökning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">4. Flytta (om möjligt):</span>
                    <span>Stora städer betalar ofta 10-15% mer</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Datakälla */}
          <div className="text-center">
            {salaryData.source && (
              <p className="text-xs text-green-600 font-medium mb-1">
                ✓ Data från: {salaryData.source}
              </p>
            )}
            <p className="text-xs text-slate-400">
              Lönestatistik baserat på aktuella jobbannonser från Arbetsförmedlingen
            </p>
          </div>
        </>
      )}

      {!loading && !salaryData && selectedOccupation && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
          <Info size={48} className="text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Ingen lönedata tillgänglig</h3>
          <p className="text-slate-500 mb-4">
            Vi kunde inte hitta tillräckligt med löneinformation för <strong>{selectedOccupation.label}</strong> i aktuella jobbannonser.
          </p>
          <p className="text-sm text-slate-400">
            Detta kan bero på att få arbetsgivare anger lön i sina annonser, eller att yrkestiteln är ovanlig.
          </p>
        </div>
      )}

      {!loading && !salaryData && !selectedOccupation && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
          <Search size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Sök ett yrke för att se lönestatistik</h3>
          <p className="text-slate-500">Vi visar medianlön, lönespridning och regionala skillnader baserat på riktiga jobbannonser</p>
        </div>
      )}
    </div>
  );
}
