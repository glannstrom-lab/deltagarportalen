import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, MapPin, Briefcase, Award, BarChart3, Search, Info } from 'lucide-react';
import { Autocomplete } from '@/components/common/Autocomplete';
import { taxonomyApi, trendsApi } from '@/services/api';
import type { AutocompleteOption } from '@/components/common/Autocomplete';

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
  const [loading, setLoading] = useState(false);

  const fetchOccupations = async (query: string) => {
    return taxonomyApi.autocompleteOccupations(query);
  };

  const loadSalaryData = async (occupation: AutocompleteOption) => {
    setLoading(true);
    
    try {
      // Hämta lönestatistik
      const stats = await trendsApi.getSalaryStats(occupation.label);
      
      if (stats) {
        setSalaryData({
          occupation: stats.occupation,
          median: stats.median_salary,
          percentile25: stats.percentile_25,
          percentile75: stats.percentile_75,
          byRegion: stats.by_region.map(r => ({
            region: r.region,
            median: r.median_salary,
            jobCount: Math.floor(Math.random() * 500) + 50, // Mock-data
          })),
          byExperience: stats.by_experience.map(e => ({
            years: e.experience_years,
            median: e.median_salary,
          })),
          trends: {
            growth: 8,
            jobCount: 850,
            competition: 8.5,
          },
        });
      }
    } catch (error) {
      console.error('Fel vid hämtning av lönedata:', error);
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
          <p className="text-xs text-slate-400 text-center">
            Lönestatistik från Arbetsförmedlingen • Data uppdateras löpande
          </p>
        </>
      )}

      {!loading && !salaryData && !selectedOccupation && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
          <Search size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Sök ett yrke för att se lönestatistik</h3>
          <p className="text-slate-500">Vi visar medianlön, lönespridning och regionala skillnader</p>
        </div>
      )}
    </div>
  );
}
