/**
 * OnboardingFlow
 * Interaktiv onboarding för nya användare
 */

import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Target, Sparkles, FileText, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  action: string;
  route: string;
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Välkommen till Deltagarportalen!',
    description: 'Detta är din plattform för att hitta nytt jobb. Vi har samlat allt du behöver på ett ställe.',
    icon: Sparkles,
    action: 'Kom igång',
    route: '/',
  },
  {
    id: 2,
    title: 'Skapa ditt CV',
    description: 'Ett bra CV är nyckeln till jobbintervjuer. Vår CV-byggare hjälper dig steg för steg.',
    icon: FileText,
    action: 'Bygg CV',
    route: '/cv',
  },
  {
    id: 3,
    title: 'Gör intresseguiden',
    description: 'Förstå dina styrkor och intressen. Få personliga yrkesförslag baserat på dina svar.',
    icon: Target,
    action: 'Starta guiden',
    route: '/interest-guide',
  },
  {
    id: 4,
    title: 'Sök jobb',
    description: 'Sök bland tusentals jobb från Arbetsförmedlingen. Filtrera efter plats, yrke och mer.',
    icon: Briefcase,
    action: 'Sök jobb',
    route: '/job-search',
  },
  {
    id: 5,
    title: 'Du är redo!',
    description: 'Nu har du allt du behöver för att komma igång. Din konsulent finns här för att hjälpa dig.',
    icon: CheckCircle2,
    action: 'Gå till dashboard',
    route: '/',
  },
];

export const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const handleNext = () => {
    if (currentStep >= steps.length - 1) {
      setShowOnboarding(false);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleAction = () => {
    const step = steps[currentStep];
    setShowOnboarding(false);
    navigate(step.route);
  };

  const handleSkip = () => {
    setShowOnboarding(false);
  };

  if (!showOnboarding) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="h-1 bg-gray-200">
          <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-gray-500">Steg {currentStep + 1} av {steps.length}</span>
            <button onClick={handleSkip} className="text-sm text-gray-400 hover:text-gray-600">Hoppa över</button>
          </div>

          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon className="w-10 h-10 text-primary-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">{step.title}</h2>
          <p className="text-gray-600 text-center mb-8 leading-relaxed">{step.description}</p>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Tillbaka
              </button>
            )}
            <button
              onClick={currentStep === steps.length - 1 ? handleAction : handleNext}
              className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center gap-2"
            >
              {step.action}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
