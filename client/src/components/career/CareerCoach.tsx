import { useState, useEffect } from 'react';
import { Target, TrendingUp, GraduationCap, Briefcase, Award, ArrowRight, MapPin, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { Autocomplete } from '@/components/common/Autocomplete';
import { taxonomyApi } from '@/services/api';
import { afDirectApi } from '@/services/afDirectApi';
import { searchJobs } from '@/services/arbetsformedlingenApi';
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
    jobCount: number;
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
    
    try {
      // Hämta lönedata för båda yrkena DIREKT från AF API (CORS tillåtet)
      const [currentSalary, targetSalary] = await Promise.all([
        afDirectApi.getSalaryStats(currentOccupation.label),
        afDirectApi.getSalaryStats(targetOccupation.label)
      ]);

      // Hämta antal lediga jobb för målyrket
      const jobSearch = await searchJobs({
        query: targetOccupation.label,
        limit: 1
      });

      const currentSalaryValue = currentSalary?.median_salary || 35000;
      const targetSalaryValue = targetSalary?.median_salary || 45000;
      const jobCount = jobSearch.total?.value || 0;
      
      // Bestäm efterfrågan baserat på jobbantal
      let demand: 'high' | 'medium' | 'low' = 'medium';
      if (jobCount > 100) demand = 'high';
      else if (jobCount < 10) demand = 'low';

      // Beräkna tidslinje baserat på erfarenhet och löneskillnad
      const expYears = parseInt(currentExperience);
      const salaryDiff = targetSalaryValue - currentSalaryValue;
      const estimatedYears = Math.max(1, Math.min(4, Math.ceil(salaryDiff / 10000) - Math.floor(expYears / 3)));
      
      const path: CareerPath = {
        current: {
          occupation: currentOccupation.label,
          experience: `${currentExperience} år`,
          salary: currentSalaryValue,
        },
        target: {
          occupation: targetOccupation.label,
          salary: targetSalaryValue,
          demand,
          jobCount,
        },
        timeline: `${estimatedYears}-${estimatedYears + 1} år`,
        salaryIncrease: targetSalaryValue - currentSalaryValue,
        steps: generateSteps(currentOccupation.label, targetOccupation.label, expYears, estimatedYears),
      };
      
      setCareerPath(path);
    } catch (error) {
      console.error('Fel vid generering av karriärväg:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generera karriärsteg baserat på yrken och erfarenhet
  function generateSteps(current: string, target: string, expYears: number, timelineYears: number): CareerStep[] {
    const steps: CareerStep[] = [
      {
        order: 1,
        title: 'Stärk din bas',
        description: `Utveckla djup kompetens inom ${current} för att bli en erkänd expert innan du byter fokus.`,
        timeframe: `${Math.ceil(timelineYears * 0.3)}-6 månader`,
        actions: [
          'Ta lead på ett komplext projekt inom ditt nuvarande område',
          'Dokumentera dina resultat med konkreta siffror',
          'Bygg en portfolio som visar din expertis',
          'Nätverka inom branschen på LinkedIn'
        ],
        education: [
          'Avancerad certifiering inom din specialisering',
          'Workshop i personligt varumärke'
        ],
      },
      {
        order: 2,
        title: 'Brobyggande kompetens',
        description: `Börja utveckla färdigheter som är relevanta för ${target} samtidigt som du utnyttjar din ${current}-bakgrund.`,
        timeframe: `${Math.ceil(timelineYears * 0.3)}-6 månader`,
        actions: [
          'Identifiera överförbara färdigheter mellan yrkena',
          'Ta ett sidoprojekt eller konsultuppdrag inom målområdet',
          'Hitta en mentor som jobbar med ${target}',
          'Delta i branschträffar och webinarier'
        ],
        education: [
          'Online-kurs inom målområdet',
          'Kurs i projektledning eller ledarskap'
        ],
      },
      {
        order: 3,
        title: 'Praktisk erfarenhet',
        description: 'Skaffa konkret erfarenhet av målyrket genom praktiska projekt.',
        timeframe: `${Math.ceil(timelineYears * 0.2)}-4 månader`,
        actions: [
          'Sök volontäruppdrag eller praktik inom målområdet',
          'Erbjud hjälp med ett projekt för att bygga portfolio',
          'Dokumentera allt du lär dig',
          'Be om referenser och rekommendationer'
        ],
        education: [
          'Yrkeshögskoleutbildning eller motsvarande',
          'Branschspecifik certifiering'
        ],
      },
      {
        order: 4,
        title: 'Positionering för bytet',
        description: `Gör dig redo att söka ${target}-roller med en stark pitch som kopplar din bakgrund till det nya.`,
        timeframe: '2-4 månader',
        actions: [
          'Uppdatera CV och LinkedIn med ny kompetens',
          'Skriv ett personligt brev som berättar din övergångsberättelse',
          'Aktivt nätverka med rekryterare i målbranschen',
          'Sök roller internt eller externt'
        ],
      },
    ];

    return steps;
  }

  const formatSalary = (amount: number) => {
    return `${amount.toLocaleString()} kr`;
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
            <p className="text-white/80">Planera din väg framåt med data från Arbetsförmedlingen</p>
          </div>
        </div>
        
        <p className="text-white/90 max-w-2xl">
          Berätta var du är idag och vart du vill komma. Vi analyserar marknadslön, 
          efterfrågan och ger dig en konkret handlingsplan baserat på riktiga data.
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
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Analyserar...
                </span>
              ) : 'Generera karriärväg'}
            </button>
          </div>
        </div>
      </div>

      {/* Resultat */}
      {loading && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
          <div className="animate-spin w-10 h-10 border-3 border-[#4f46e5] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Analyserar din karriärväg...</p>
          <p className="text-sm text-slate-400 mt-2">Hämtar lönestatistik och marknadsdata från Arbetsförmedlingen</p>
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
                  <p className="text-sm text-slate-600">{formatSalary(careerPath.current.salary)}/mån</p>
                </div>
                
                <ArrowRight className="text-slate-400" size={24} />
                
                <div className="text-center">
                  <p className="text-sm text-slate-500">Mål</p>
                  <p className="font-semibold text-slate-800">{careerPath.target.occupation}</p>
                  <p className="text-sm text-slate-600">{formatSalary(careerPath.target.salary)}/mån</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center px-4 py-2 bg-green-50 rounded-xl">
                  <p className="text-xs text-slate-500">Löneökning</p>
                  <p className="text-lg font-bold text-green-600">+{formatSalary(careerPath.salaryIncrease)}</p>
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
                  <p className="text-xs text-slate-400">{careerPath.target.jobCount} lediga jobb</p>
                </div>
              </div>
            </div>
          </div>

          {/* Steg-för-steg */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">Din väg framåt</h3>
            
            {careerPath.steps.map((step) => (
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
                        <p className="text-sm font-medium text-slate-700 mb-2">Konkreta åtgärder:</p>
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
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex-1 py-3 bg-[#4f46e5] text-white rounded-xl font-medium hover:bg-[#4338ca] transition-colors"
            >
              Justera min plan
            </button>
            <a
              href="/job-search"
              className="flex-1 py-3 bg-white border-2 border-[#4f46e5] text-[#4f46e5] rounded-xl font-medium hover:bg-[#4f46e5]/5 transition-colors text-center"
            >
              Sök jobb inom {careerPath.target.occupation}
            </a>
          </div>
        </>
      )}

      {!loading && !careerPath && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
          <Target size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Planera din karriär</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Fyll i ditt nuvarande yrke och vart du vill komma så analyserar vi marknadslön, 
            efterfrågan och skapar en personlig handlingsplan.
          </p>
        </div>
      )}
    </div>
  );
}
