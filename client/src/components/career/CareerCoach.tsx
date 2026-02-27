import { useState, useEffect } from 'react';
import { Target, TrendingUp, GraduationCap, Briefcase, Award, ArrowRight, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Autocomplete } from '@/components/common/Autocomplete';
import { taxonomyApi, trendsApi, jobEdApi } from '@/services/api';
import type { AutocompleteOption } from '@/components/common/Autocomplete';

interface CareerStep {
  order: number;
  title: string;
  description: string;
  timeframe: string;
  actions: string[];
  education?: string[];
}

interface CareerPath {
  current: {
    occupation: string;
    experience: string;
    salary: number;
  };
  target: {
    occupation: string;
    salary: number;
    demand: 'high' | 'medium' | 'low';
  };
  steps: CareerStep[];
  timeline: string;
  salaryIncrease: number;
}

export default function CareerCoach() {
  const [currentOccupation, setCurrentOccupation] = useState<AutocompleteOption | null>(null);
  const [targetOccupation, setTargetOccupation] = useState<AutocompleteOption | null>(null);
  const [currentExperience, setCurrentExperience] = useState('3');
  const [careerPath, setCareerPath] = useState<CareerPath | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOccupations = async (query: string) => {
    return taxonomyApi.autocompleteOccupations(query);
  };

  const generateCareerPath = async () => {
    if (!currentOccupation || !targetOccupation) return;
    
    setLoading(true);
    
    // Simulera AI-genererad karriärväg (i verkligheten skulle detta vara mer komplext)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockPath: CareerPath = {
      current: {
        occupation: currentOccupation.label,
        experience: `${currentExperience} år`,
        salary: 42000,
      },
      target: {
        occupation: targetOccupation.label,
        salary: 58000,
        demand: 'high',
      },
      timeline: '2-3 år',
      salaryIncrease: 16000,
      steps: [
        {
          order: 1,
          title: 'Bygg specialistkompetens',
          description: 'Utveckla djup kompetens inom ditt nuvarande område för att bli en uppskattad expert.',
          timeframe: '6-12 månader',
          actions: [
            'Ta lead på ett komplext projekt',
            'Mentorera juniora kollegor',
            'Bygg en stark portfolio',
          ],
          education: [
            'Avancerad kurs inom din specialisering',
            'Certifiering inom aktuellt område',
          ],
        },
        {
          order: 2,
          title: 'Utveckla ledarskapsförmåga',
          description: 'Börja ta mer ansvar och utveckla färdigheter för att leda andra.',
          timeframe: '6-12 månader',
          actions: [
            'Bli projektledare för mindre projekt',
            'Delta i interna ledarskapsprogram',
            'Bygg nätverk inom organisationen',
          ],
          education: [
            'Ledarskapsutbildning (YH eller motsvarande)',
            'Kurs i projektledning',
          ],
        },
        {
          order: 3,
          title: 'Strategisk kompetens',
          description: 'Utveckla förmågan att se helheten och arbeta strategiskt.',
          timeframe: '6-12 månader',
          actions: [
            'Delta i strategiska beslut',
            'Bygg relationer med nyckelpersoner',
            'Visa resultat och påverkan',
          ],
          education: [
            'Kurs i affärsstrategi',
            'Nätverkande och relationsskapande',
          ],
        },
        {
          order: 4,
          title: 'Sök ledarroller',
          description: 'Nu är du redo att ta nästa steg och söka din måltitel.',
          timeframe: '3-6 månader',
          actions: [
            'Uppdatera CV med ny kompetens',
            'Aktivt nätverka i branschen',
            'Sök ledarroller internt och externt',
          ],
        },
      ],
    };
    
    setCareerPath(mockPath);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#4f46e5] to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Target size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Karriärcoachen</h2>
            <p className="text-white/80">Planera din väg framåt i karriären</p>
          </div>
        </div>
        
        <p className="text-white/90 max-w-2xl">
          Berätta var du är idag och vart du vill komma. Vi analyserar din väg 
          och ger dig en konkret handlingsplan med tidslinje, kompetensutveckling 
          och löneprognoser.
        </p>
      </div>

      {/* Input-formulär */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-4">Din karriärsituation</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nuvarande yrke
            </label>
            <Autocomplete
              placeholder="T.ex. Systemutvecklare"
              value={currentOccupation?.label || ''}
              onChange={() => {}}
              onSelect={setCurrentOccupation}
              fetchSuggestions={fetchOccupations}
              showCategories={false}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nuvarande erfarenhet
            </label>
            <select
              value={currentExperience}
              onChange={(e) => setCurrentExperience(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="0">Ingen erfarenhet (nyexaminerad)</option>
              <option value="1">1 år</option>
              <option value="2">2 år</option>
              <option value="3">3 år</option>
              <option value="5">5 år</option>
              <option value="7">7 år</option>
              <option value="10">10+ år</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Målyrke (dit du vill komma)
            </label>
            <Autocomplete
              placeholder="T.ex. Tech Lead"
              value={targetOccupation?.label || ''}
              onChange={() => {}}
              onSelect={setTargetOccupation}
              fetchSuggestions={fetchOccupations}
              showCategories={false}
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateCareerPath}
              disabled={!currentOccupation || !targetOccupation || loading}
              className="w-full py-2.5 bg-[#4f46e5] text-white rounded-xl font-medium hover:bg-[#4338ca] disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Analyserar...' : 'Generera karriärväg'}
            </button>
          </div>
        </div>
      </div>

      {/* Resultat */}
      {loading && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
          <div className="animate-spin w-10 h-10 border-3 border-[#4f46e5] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Analyserar din karriärväg...</p>
          <p className="text-sm text-slate-400 mt-2">Vi tittar på marknadstrender, lönestatistik och kompetenskrav</p>
        </div>
      )}

      {!loading && careerPath && (
        <>
          {/* Översikt */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm text-slate-500">Nu</p>
                  <p className="font-semibold text-slate-800">{careerPath.current.occupation}</p>
                  <p className="text-sm text-slate-600">{careerPath.current.salary.toLocaleString()} kr/mån</p>
                </div>
                
                <ArrowRight className="text-slate-400" size={24} />
                
                <div className="text-center">
                  <p className="text-sm text-slate-500">Mål</p>
                  <p className="font-semibold text-slate-800">{careerPath.target.occupation}</p>
                  <p className="text-sm text-slate-600">{careerPath.target.salary.toLocaleString()} kr/mån</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center px-4 py-2 bg-green-50 rounded-xl">
                  <p className="text-xs text-slate-500">Löneökning</p>
                  <p className="text-lg font-bold text-green-600">+{careerPath.salaryIncrease.toLocaleString()} kr</p>
                </div>
                <div className="text-center px-4 py-2 bg-blue-50 rounded-xl">
                  <p className="text-xs text-slate-500">Tidslinje</p>
                  <p className="text-lg font-bold text-blue-600">{careerPath.timeline}</p>
                </div>
                <div className="text-center px-4 py-2 bg-purple-50 rounded-xl">
                  <p className="text-xs text-slate-500">Efterfrågan</p>
                  <p className="text-lg font-bold text-purple-600">
                    {careerPath.target.demand === 'high' ? 'Hög' : careerPath.target.demand === 'medium' ? 'Medel' : 'Låg'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Steg-för-steg */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">Din väg framåt</h3>
            
            {careerPath.steps.map((step, index) => (
              <div
                key={step.order}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#4f46e5] text-white rounded-full flex items-center justify-center font-bold shrink-0">
                    {step.order}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-slate-800">{step.title}</h4>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        <Calendar size={12} className="inline mr-1" />
                        {step.timeframe}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 mb-4">{step.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2"> konkreta åtgärder:</p>
                        <ul className="space-y-1">
                          {step.actions.map((action, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                              <ArrowRight size={14} className="text-[#4f46e5]" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {step.education && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-2">Rekommenderad utbildning:</p>
                          <ul className="space-y-1">
                            {step.education.map((edu, i) => (
                              <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                                <GraduationCap size={14} className="text-[#4f46e5]" />
                                {edu}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex gap-4">
            <button className="flex-1 py-3 bg-[#4f46e5] text-white rounded-xl font-medium hover:bg-[#4338ca] transition-colors">
              Spara min karriärväg
            </button>
            <button className="flex-1 py-3 bg-white border-2 border-[#4f46e5] text-[#4f46e5] rounded-xl font-medium hover:bg-[#4f46e5]/5 transition-colors">
              Hitta utbildningar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
