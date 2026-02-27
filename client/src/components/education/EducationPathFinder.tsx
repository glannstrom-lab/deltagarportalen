import { useState } from 'react';
import { GraduationCap, Search, ChevronRight, Clock, Building2, BookOpen } from 'lucide-react';
import { Autocomplete } from '@/components/common/Autocomplete';
import { taxonomyApi, jobEdApi } from '@/services/api';
import type { AutocompleteOption } from '@/components/common/Autocomplete';

interface Education {
  title: string;
  type: string;
  duration: string;
  description: string;
  provider?: string;
}

export default function EducationPathFinder() {
  const [selectedOccupation, setSelectedOccupation] = useState<AutocompleteOption | null>(null);
  const [educations, setEducations] = useState<Education[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOccupations = async (query: string) => {
    return taxonomyApi.autocompleteOccupations(query);
  };

  const handleSelectOccupation = async (option: AutocompleteOption) => {
    setSelectedOccupation(option);
    setLoading(true);
    
    try {
      const result = await jobEdApi.getEducationsForOccupation(option.id);
      
      if (result?.recommended_educations && result.recommended_educations.length > 0) {
        setEducations(result.recommended_educations.map(e => ({
          title: e.education_title,
          type: e.education_type,
          duration: e.duration_months ? `${e.duration_months} månader` : 'Varierar',
          description: `Utbildning for ${option.label}`,
          provider: e.provider,
        })));
      } else {
        setEducations([]);
      }
    } catch (error) {
      console.error('Fel vid hämtning av utbildningar:', error);
      setEducations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-[#4f46e5]/10 rounded-xl flex items-center justify-center">
          <GraduationCap className="text-[#4f46e5]" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Hitta din utbildningsvag</h2>
          <p className="text-slate-600">Se vilka utbildningar som leder till ditt dromjobb</p>
        </div>
      </div>

      <div className="mb-6">
        <Autocomplete
          label="Vilket yrke ar du intresserad av?"
          placeholder="T.ex. sjukskoterska, programmerare..."
          value={selectedOccupation?.label || ''}
          onChange={() => {}}
          onSelect={handleSelectOccupation}
          fetchSuggestions={fetchOccupations}
          showCategories={false}
        />
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-[#4f46e5] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Hamtar utbildningsinformation...</p>
        </div>
      )}

      {!loading && selectedOccupation && educations.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800">
            Utbildningar for {selectedOccupation.label}:
          </h3>
          
          {educations.map((education, index) => (
            <div
              key={index}
              className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#4f46e5]/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800">{education.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{education.description}</p>
                  
                  <div className="flex flex-wrap gap-3 mt-3">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-white px-2 py-1 rounded-lg">
                      <Building2 size={12} />
                      {education.type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-white px-2 py-1 rounded-lg">
                      <Clock size={12} />
                      {education.duration}
                    </span>
                    {education.provider && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-white px-2 py-1 rounded-lg">
                        <BookOpen size={12} />
                        {education.provider}
                      </span>
                    )}
                  </div>
                </div>
                
                <button className="p-2 text-[#4f46e5] hover:bg-[#4f46e5]/10 rounded-lg transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))}
          
          <p className="text-xs text-slate-500 mt-4">
            Information fran Arbetsformedlingens JobEd Connect
          </p>
        </div>
      )}

      {!loading && selectedOccupation && educations.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
          <p>Inga specifika utbildningar hittades for detta yrke.</p>
          <p className="text-sm mt-1">Prova att soka pa ett liknande yrke.</p>
        </div>
      )}

      {!selectedOccupation && (
        <div className="text-center py-8 text-slate-400">
          <Search size={48} className="mx-auto mb-3 opacity-50" />
          <p>Borja skriva for att hitta utbildningar</p>
        </div>
      )}
    </div>
  );
}
