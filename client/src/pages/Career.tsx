import { useState } from 'react';
import { Target, DollarSign, TrendingUp, Briefcase, GraduationCap, ArrowRight, Award, MapPin } from 'lucide-react';
import CareerCoach from '@/components/career/CareerCoach';
import SalaryInsights from '@/components/career/SalaryInsights';

type CareerTab = 'coach' | 'salary' | 'skills' | 'education';

export default function Career() {
  const [activeTab, setActiveTab] = useState<CareerTab>('coach');

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Karriär</h1>
        <p className="text-slate-600">
          Planera din karriärväg, utforska lönestatistik och utveckla dina kompetenser
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setActiveTab('coach')}
          className={`p-6 rounded-2xl border-2 text-left transition-all ${
            activeTab === 'coach'
              ? 'border-[#4f46e5] bg-[#4f46e5]/5'
              : 'border-slate-200 bg-white hover:border-[#4f46e5]/50'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            activeTab === 'coach' ? 'bg-[#4f46e5] text-white' : 'bg-[#4f46e5]/10 text-[#4f46e5]'
          }`}>
            <Target size={24} />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Karriärcoachen</h3>
          <p className="text-sm text-slate-500">Planera din väg framåt med konkreta steg</p>
        </button>

        <button
          onClick={() => setActiveTab('salary')}
          className={`p-6 rounded-2xl border-2 text-left transition-all ${
            activeTab === 'salary'
              ? 'border-green-500 bg-green-50'
              : 'border-slate-200 bg-white hover:border-green-300'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            activeTab === 'salary' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600'
          }`}>
            <DollarSign size={24} />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Löneinsikter</h3>
          <p className="text-sm text-slate-500">Se lönestatistik och marknadsvärde</p>
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`p-6 rounded-2xl border-2 text-left transition-all ${
            activeTab === 'skills'
              ? 'border-purple-500 bg-purple-50'
              : 'border-slate-200 bg-white hover:border-purple-300'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            activeTab === 'skills' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600'
          }`}>
            <TrendingUp size={24} />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Kompetensutveckling</h3>
          <p className="text-sm text-slate-500">Se vilka kompetenser som efterfrågas</p>
        </button>

        <button
          onClick={() => setActiveTab('education')}
          className={`p-6 rounded-2xl border-2 text-left transition-all ${
            activeTab === 'education'
              ? 'border-amber-500 bg-amber-50'
              : 'border-slate-200 bg-white hover:border-amber-300'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            activeTab === 'education' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600'
          }`}>
            <GraduationCap size={24} />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Utbildningsvägar</h3>
          <p className="text-sm text-slate-500">Hitta utbildningar för ditt drömjobb</p>
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {activeTab === 'coach' && <CareerCoach />}
        {activeTab === 'salary' && <SalaryInsights />}
        {activeTab === 'skills' && <SkillsDevelopment />}
        {activeTab === 'education' && <EducationOverview />}
      </div>
    </div>
  );
}

// Placeholder för Kompetensutveckling
function SkillsDevelopment() {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
      <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <TrendingUp className="text-purple-600" size={32} />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Kompetensutveckling</h2>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">
        Analysera vilka kompetenser som efterfrågas på arbetsmarknaden och 
        skapa en personlig utvecklingsplan.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm">
        <Award size={16} />
        Kommer snart
      </div>
    </div>
  );
}

// Placeholder för Utbildningsvägar
function EducationOverview() {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <GraduationCap className="text-amber-600" size={32} />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Utbildningsvägar</h2>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">
        Utforska olika utbildningsvägar som leder till ditt drömjobb. 
        Jämför längd, kostnad och jobbmöjligheter.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm">
        <MapPin size={16} />
        Kommer snart
      </div>
    </div>
  );
}
