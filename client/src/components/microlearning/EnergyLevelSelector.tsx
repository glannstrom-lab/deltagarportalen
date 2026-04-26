import { Battery, BatteryMedium, BatteryFull } from '@/components/ui/icons';

interface EnergyLevelSelectorProps {
  value: 'LOW' | 'MEDIUM' | 'HIGH';
  onChange: (level: 'LOW' | 'MEDIUM' | 'HIGH') => void;
}

interface EnergyOption {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  icon: typeof Battery;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const ENERGY_OPTIONS: EnergyOption[] = [
  {
    level: 'LOW',
    icon: Battery,
    label: 'Låg energi',
    description: 'Visa endast korta kurser (under 15 min)',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-200'
  },
  {
    level: 'MEDIUM',
    icon: BatteryMedium,
    label: 'Lagom',
    description: 'Visa medellånga kurser (15-30 min)',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    borderColor: 'border-amber-200'
  },
  {
    level: 'HIGH',
    icon: BatteryFull,
    label: 'Bra energi',
    description: 'Visa alla kurser (oavsett längd)',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    borderColor: 'border-indigo-200'
  }
];

export default function EnergyLevelSelector({ value, onChange }: EnergyLevelSelectorProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <BatteryFull className="text-slate-600" size={20} />
        <h3 className="font-medium text-slate-700">Hur är din energi idag?</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ENERGY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.level;
          
          return (
            <button
              key={option.level}
              onClick={() => onChange(option.level)}
              className={`
                flex flex-col items-center p-4 rounded-xl border-2 transition-all
                ${isSelected 
                  ? `${option.bgColor} ${option.borderColor} ring-2 ring-offset-2 ring-${option.color.split('-')[1]}-500` 
                  : 'bg-white border-slate-200 hover:border-slate-300'
                }
              `}
            >
              <Icon 
                size={32} 
                className={`mb-2 ${isSelected ? option.color : 'text-slate-600'}`} 
              />
              <span className={`font-medium ${isSelected ? option.color : 'text-slate-700'}`}>
                {option.label}
              </span>
              <span className="text-xs text-slate-700 text-center mt-1">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
      
      <p className="text-xs text-slate-700 mt-4 text-center">
        Vi anpassar rekommendationerna efter din energinivå. 
        Du kan ändra detta när som helst.
      </p>
    </div>
  );
}
