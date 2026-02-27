/**
 * Interaktiv Sverigekarta för jobbsökning
 * Visar antal jobb per region och möjliggör geografisk filtrering
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Briefcase, X } from 'lucide-react';

interface Region {
  id: string;
  name: string;
  jobCount: number;
  coords: { x: number; y: number }; // Position på kartan (0-100)
}

const SWEDISH_REGIONS: Region[] = [
  { id: 'SE110', name: 'Stockholms län', jobCount: 0, coords: { x: 70, y: 65 } },
  { id: 'SE121', name: 'Uppsala län', jobCount: 0, coords: { x: 72, y: 55 } },
  { id: 'SE122', name: 'Södermanlands län', jobCount: 0, coords: { x: 65, y: 70 } },
  { id: 'SE123', name: 'Östergötlands län', jobCount: 0, coords: { x: 60, y: 75 } },
  { id: 'SE124', name: 'Örebro län', jobCount: 0, coords: { x: 50, y: 60 } },
  { id: 'SE125', name: 'Västmanlands län', jobCount: 0, coords: { x: 55, y: 55 } },
  { id: 'SE211', name: 'Jönköpings län', jobCount: 0, coords: { x: 50, y: 80 } },
  { id: 'SE212', name: 'Kronobergs län', jobCount: 0, coords: { x: 45, y: 85 } },
  { id: 'SE213', name: 'Kalmar län', jobCount: 0, coords: { x: 60, y: 85 } },
  { id: 'SE214', name: 'Gotlands län', jobCount: 0, coords: { x: 85, y: 80 } },
  { id: 'SE221', name: 'Blekinge län', jobCount: 0, coords: { x: 55, y: 92 } },
  { id: 'SE224', name: 'Skåne län', jobCount: 0, coords: { x: 45, y: 95 } },
  { id: 'SE231', name: 'Hallands län', jobCount: 0, coords: { x: 40, y: 85 } },
  { id: 'SE232', name: 'Västra Götalands län', jobCount: 0, coords: { x: 35, y: 75 } },
  { id: 'SE311', name: 'Värmlands län', jobCount: 0, coords: { x: 35, y: 55 } },
  { id: 'SE312', name: 'Dalarnas län', jobCount: 0, coords: { x: 55, y: 40 } },
  { id: 'SE313', name: 'Gävleborgs län', jobCount: 0, coords: { x: 65, y: 40 } },
  { id: 'SE321', name: 'Västernorrlands län', jobCount: 0, coords: { x: 60, y: 25 } },
  { id: 'SE322', name: 'Jämtlands län', jobCount: 0, coords: { x: 45, y: 30 } },
  { id: 'SE331', name: 'Västerbottens län', jobCount: 0, coords: { x: 55, y: 10 } },
  { id: 'SE332', name: 'Norrbottens län', jobCount: 0, coords: { x: 60, y: -5 } },
];

interface SwedenMapProps {
  onRegionSelect?: (region: string) => void;
  selectedRegion?: string | null;
  jobData?: Record<string, number>; // regionId -> jobCount
  className?: string;
}

export const SwedenMap: React.FC<SwedenMapProps> = ({
  onRegionSelect,
  selectedRegion,
  jobData = {},
  className = '',
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>(SWEDISH_REGIONS);

  // Uppdatera jobb-räknare från props
  useEffect(() => {
    setRegions(prev =>
      prev.map(region => ({
        ...region,
        jobCount: jobData[region.id] || region.jobCount,
      }))
    );
  }, [jobData]);

  // Beräkna färg baserat på antal jobb
  const getColor = (count: number): string => {
    if (count === 0) return '#e5e7eb'; // gray-200
    if (count < 100) return '#bfdbfe'; // blue-200
    if (count < 500) return '#60a5fa'; // blue-400
    if (count < 1000) return '#3b82f6'; // blue-500
    return '#1d4ed8'; // blue-700
  };

  const maxJobs = Math.max(...regions.map(r => r.jobCount), 1);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary-600" />
            Jobb i Sverige
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Klicka på en region för att se lediga jobb
          </p>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-2 text-xs">
          <span>Färre jobb</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded bg-gray-200" />
            <div className="w-4 h-4 rounded bg-blue-200" />
            <div className="w-4 h-4 rounded bg-blue-400" />
            <div className="w-4 h-4 rounded bg-blue-500" />
            <div className="w-4 h-4 rounded bg-blue-700" />
          </div>
          <span>Fler jobb</span>
        </div>
      </div>

      {/* Karta */}
      <div className="relative aspect-[4/5] bg-gradient-to-b from-blue-50 to-white rounded-lg overflow-hidden">
        {/* Sverige outline (förenklad) */}
        <svg
          viewBox="0 0 100 120"
          className="absolute inset-0 w-full h-full"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
        >
          {/* Förenklad Sverige-kontur */}
          <path
            d="M45,115 L40,110 L35,100 L30,90 L25,80 L20,70 L25,60 L30,50 L35,40 L40,30 L45,20 L50,10 L55,5 L60,0 L65,5 L70,15 L75,25 L80,35 L85,45 L80,55 L75,65 L70,75 L65,85 L60,95 L55,105 L50,115 Z"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="0.5"
          />
        </svg>

        {/* Regions-punkter */}
        {regions.map(region => {
          const isSelected = selectedRegion === region.id;
          const isHovered = hoveredRegion === region.id;
          const size = Math.max(8, Math.min(24, (region.jobCount / maxJobs) * 20 + 8));

          return (
            <button
              key={region.id}
              onClick={() => onRegionSelect?.(region.id)}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
              style={{
                left: `${region.coords.x}%`,
                top: `${region.coords.y}%`,
                zIndex: isHovered || isSelected ? 10 : 1,
              }}
            >
              {/* Cirkel */}
              <div
                className={`
                  rounded-full transition-all duration-200
                  ${isSelected ? 'ring-4 ring-primary-300' : ''}
                  ${isHovered ? 'scale-125' : ''}
                `}
                style={{
                  width: size,
                  height: size,
                  backgroundColor: getColor(region.jobCount),
                  border: isSelected ? '2px solid #1d4ed8' : '1px solid rgba(255,255,255,0.5)',
                }}
              />

              {/* Tooltip */}
              {(isHovered || isSelected) && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                    <div className="font-semibold">{region.name}</div>
                    <div className="flex items-center gap-1 mt-1 text-gray-300">
                      <Briefcase className="w-3 h-3" />
                      {region.jobCount.toLocaleString()} lediga jobb
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Lista över regioner */}
      <div className="mt-6 max-h-48 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Regioner med flest jobb</h3>
        <div className="space-y-2">
          {regions
            .filter(r => r.jobCount > 0)
            .sort((a, b) => b.jobCount - a.jobCount)
            .slice(0, 10)
            .map(region => (
              <button
                key={region.id}
                onClick={() => onRegionSelect?.(region.id)}
                className={`
                  w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors
                  ${selectedRegion === region.id 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'hover:bg-gray-100'
                  }
                `}
              >
                <span className="font-medium">{region.name}</span>
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold
                  ${selectedRegion === region.id 
                    ? 'bg-primary-200 text-primary-800' 
                    : 'bg-gray-200 text-gray-700'
                  }
                `}>
                  {region.jobCount.toLocaleString()}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Selected region info */}
      {selectedRegion && (
        <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-primary-900">
                {regions.find(r => r.id === selectedRegion)?.name}
              </h4>
              <p className="text-primary-700 text-sm mt-1">
                {regions.find(r => r.id === selectedRegion)?.jobCount.toLocaleString()} lediga jobb
              </p>
            </div>
            <button
              onClick={() => onRegionSelect?.('')}
              className="text-primary-400 hover:text-primary-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwedenMap;
