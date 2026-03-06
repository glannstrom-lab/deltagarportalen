import { useState } from 'react';
import { 
  Target, DollarSign, TrendingUp, GraduationCap, Users,
  ChevronDown, LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  CareerCoach, 
  SalaryInsights, 
  SkillsDevelopment, 
  EducationOverview, 
  NetworkingGuide 
} from '@/components/career';

type CareerTab = 'coach' | 'salary' | 'skills' | 'education' | 'networking';

interface TabConfig {
  id: CareerTab;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  activeBg: string;
  activeBorder: string;
  inactiveHover: string;
}

const TABS: TabConfig[] = [
  {
    id: 'coach',
    title: 'Karriärcoachen',
    description: 'Planera din väg framåt',
    icon: Target,
    color: 'bg-[#4f46e5] text-[#4f46e5]',
    activeBg: 'bg-[#4f46e5]',
    activeBorder: 'border-[#4f46e5]',
    inactiveHover: 'hover:border-[#4f46e5]/50',
  },
  {
    id: 'salary',
    title: 'Löneinsikter',
    description: 'Se lönestatistik',
    icon: DollarSign,
    color: 'bg-green-500 text-green-600',
    activeBg: 'bg-green-500',
    activeBorder: 'border-green-500',
    inactiveHover: 'hover:border-green-300',
  },
  {
    id: 'skills',
    title: 'Kompetens',
    description: 'Utveckla dina skills',
    icon: TrendingUp,
    color: 'bg-purple-500 text-purple-600',
    activeBg: 'bg-purple-500',
    activeBorder: 'border-purple-500',
    inactiveHover: 'hover:border-purple-300',
  },
  {
    id: 'education',
    title: 'Utbildning',
    description: 'Hitta utbildningar',
    icon: GraduationCap,
    color: 'bg-amber-500 text-amber-600',
    activeBg: 'bg-amber-500',
    activeBorder: 'border-amber-500',
    inactiveHover: 'hover:border-amber-300',
  },
  {
    id: 'networking',
    title: 'Nätverkande',
    description: 'Bygg relationer',
    icon: Users,
    color: 'bg-rose-500 text-rose-600',
    activeBg: 'bg-rose-500',
    activeBorder: 'border-rose-500',
    inactiveHover: 'hover:border-rose-300',
  },
];

export default function Career() {
  const [activeTab, setActiveTab] = useState<CareerTab>('coach');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const activeTabConfig = TABS.find(t => t.id === activeTab)!;
  const ActiveIcon = activeTabConfig.icon;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header - Responsiv */}
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Karriär</h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Planera din karriärväg, utforska lönestatistik och utveckla dina kompetenser
        </p>
      </div>

      {/* Mobile: Dropdown navigation */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
            activeTabConfig.activeBorder,
            "bg-white"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              activeTabConfig.color.split(' ')[0],
              "text-white"
            )}>
              <ActiveIcon size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-800">{activeTabConfig.title}</h3>
              <p className="text-xs text-slate-500">{activeTabConfig.description}</p>
            </div>
          </div>
          <ChevronDown 
            size={20} 
            className={cn(
              "text-slate-400 transition-transform",
              showMobileMenu && "rotate-180"
            )} 
          />
        </button>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="mt-2 bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-lg">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowMobileMenu(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 text-left transition-colors border-b border-slate-100 last:border-0",
                    isActive 
                      ? `${tab.activeBg.replace('bg-', 'bg-opacity-10 bg-')} ${tab.color.split(' ')[1]}` 
                      : 'hover:bg-slate-50'
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    isActive ? tab.activeBg : tab.color.split(' ')[0].replace('500', '100'),
                    isActive ? 'text-white' : tab.color.split(' ')[1]
                  )}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(
                      "font-medium",
                      isActive ? 'text-slate-900' : 'text-slate-700'
                    )}>
                      {tab.title}
                    </h3>
                    <p className="text-xs text-slate-500">{tab.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop: Navigation Cards - Compact för tablet, full för desktop */}
      <div className="hidden lg:grid grid-cols-5 gap-3 xl:gap-4 mb-8">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "p-4 xl:p-6 rounded-2xl border-2 text-left transition-all",
                isActive
                  ? `${tab.activeBorder} ${tab.activeBg.replace('bg-', 'bg-opacity-5 bg-')}`
                  : `border-slate-200 bg-white ${tab.inactiveHover}`
              )}
            >
              <div className={cn(
                "w-10 h-10 xl:w-12 xl:h-12 rounded-xl flex items-center justify-center mb-3",
                isActive ? tab.activeBg : tab.color.split(' ')[0].replace('500', '100'),
                isActive ? 'text-white' : tab.color.split(' ')[1]
              )}>
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1 text-sm xl:text-base">{tab.title}</h3>
              <p className="text-xs xl:text-sm text-slate-500 line-clamp-2">{tab.description}</p>
            </button>
          );
        })}
      </div>

      {/* Tablet: Horizontal scrollable cards */}
      <div className="hidden md:grid lg:hidden grid-cols-3 gap-4 mb-6">
        {TABS.slice(0, 3).map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                isActive
                  ? `${tab.activeBorder} ${tab.activeBg.replace('bg-', 'bg-opacity-5 bg-')}`
                  : `border-slate-200 bg-white ${tab.inactiveHover}`
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center mb-2",
                isActive ? tab.activeBg : tab.color.split(' ')[0].replace('500', '100'),
                isActive ? 'text-white' : tab.color.split(' ')[1]
              )}>
                <Icon size={18} />
              </div>
              <h3 className="font-medium text-slate-800 text-sm">{tab.title}</h3>
            </button>
          );
        })}
      </div>
      
      <div className="hidden md:grid lg:hidden grid-cols-2 gap-4 mb-6">
        {TABS.slice(3).map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                isActive
                  ? `${tab.activeBorder} ${tab.activeBg.replace('bg-', 'bg-opacity-5 bg-')}`
                  : `border-slate-200 bg-white ${tab.inactiveHover}`
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center mb-2",
                isActive ? tab.activeBg : tab.color.split(' ')[0].replace('500', '100'),
                isActive ? 'text-white' : tab.color.split(' ')[1]
              )}>
                <Icon size={18} />
              </div>
              <h3 className="font-medium text-slate-800 text-sm">{tab.title}</h3>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[400px] sm:min-h-[600px]">
        {activeTab === 'coach' && <CareerCoach />}
        {activeTab === 'salary' && <SalaryInsights />}
        {activeTab === 'skills' && <SkillsDevelopment />}
        {activeTab === 'education' && <EducationOverview />}
        {activeTab === 'networking' && <NetworkingGuide />}
      </div>
    </div>
  );
}
