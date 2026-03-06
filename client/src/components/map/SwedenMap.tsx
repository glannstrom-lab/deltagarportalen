/**
 * Förbättrad interaktiv Sverigekarta för jobbsökning
 * Visar jobbfördelning per region med färgkodning
 */

import React, { useState, useEffect, useMemo } from 'react'
import { MapPin, Briefcase, X, Navigation, Map as MapIcon, List, Grid3X3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Region {
  id: string
  name: string
  jobCount: number
  coords: { x: number; y: number }
  population: number
}

// Faktiska Sverige-regioner med korrekta koordinater (0-100 skala)
const SWEDISH_REGIONS: Region[] = [
  { id: 'SE110', name: 'Stockholms län', jobCount: 0, coords: { x: 72, y: 70 }, population: 2400000 },
  { id: 'SE121', name: 'Uppsala län', jobCount: 0, coords: { x: 70, y: 58 }, population: 390000 },
  { id: 'SE122', name: 'Södermanlands län', jobCount: 0, coords: { x: 65, y: 72 }, population: 300000 },
  { id: 'SE123', name: 'Östergötlands län', jobCount: 0, coords: { x: 60, y: 78 }, population: 470000 },
  { id: 'SE124', name: 'Örebro län', jobCount: 0, coords: { x: 52, y: 62 }, population: 305000 },
  { id: 'SE125', name: 'Västmanlands län', jobCount: 0, coords: { x: 56, y: 58 }, population: 275000 },
  { id: 'SE211', name: 'Jönköpings län', jobCount: 0, coords: { x: 52, y: 82 }, population: 365000 },
  { id: 'SE212', name: 'Kronobergs län', jobCount: 0, coords: { x: 48, y: 88 }, population: 200000 },
  { id: 'SE213', name: 'Kalmar län', jobCount: 0, coords: { x: 62, y: 88 }, population: 245000 },
  { id: 'SE214', name: 'Gotlands län', jobCount: 0, coords: { x: 88, y: 82 }, population: 61000 },
  { id: 'SE221', name: 'Blekinge län', jobCount: 0, coords: { x: 56, y: 95 }, population: 159000 },
  { id: 'SE224', name: 'Skåne län', jobCount: 0, coords: { x: 46, y: 96 }, population: 1380000 },
  { id: 'SE231', name: 'Hallands län', jobCount: 0, coords: { x: 42, y: 88 }, population: 340000 },
  { id: 'SE232', name: 'Västra Götalands län', jobCount: 0, coords: { x: 38, y: 78 }, population: 1750000 },
  { id: 'SE311', name: 'Värmlands län', jobCount: 0, coords: { x: 38, y: 60 }, population: 283000 },
  { id: 'SE312', name: 'Dalarnas län', jobCount: 0, coords: { x: 55, y: 45 }, population: 288000 },
  { id: 'SE313', name: 'Gävleborgs län', jobCount: 0, coords: { x: 62, y: 42 }, population: 288000 },
  { id: 'SE321', name: 'Västernorrlands län', jobCount: 0, coords: { x: 58, y: 28 }, population: 245000 },
  { id: 'SE322', name: 'Jämtlands län', jobCount: 0, coords: { x: 48, y: 35 }, population: 132000 },
  { id: 'SE331', name: 'Västerbottens län', jobCount: 0, coords: { x: 55, y: 15 }, population: 272000 },
  { id: 'SE332', name: 'Norrbottens län', jobCount: 0, coords: { x: 60, y: 5 }, population: 251000 },
]

interface SwedenMapProps {
  onRegionSelect?: (region: string) => void
  selectedRegion?: string | null
  jobData?: Record<string, number>
  className?: string
}

type ViewMode = 'map' | 'list' | 'grid'

export const SwedenMap: React.FC<SwedenMapProps> = ({
  onRegionSelect,
  selectedRegion,
  jobData = {},
  className = '',
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [sortBy, setSortBy] = useState<'jobs' | 'name'>('jobs')

  // Uppdatera regioner med jobbdata
  const regions = useMemo(() => {
    return SWEDISH_REGIONS.map(region => ({
      ...region,
      jobCount: jobData[region.id] || 0,
    }))
  }, [jobData])

  // Beräkna statistik
  const totalJobs = useMemo(() => 
    regions.reduce((sum, r) => sum + r.jobCount, 0),
  [regions])

  const maxJobs = useMemo(() => 
    Math.max(...regions.map(r => r.jobCount), 1),
  [regions])

  // Färg-skala baserat på antal jobb
  const getColorIntensity = (count: number): string => {
    if (count === 0) return 'bg-slate-100'
    const ratio = count / maxJobs
    if (ratio < 0.2) return 'bg-blue-100'
    if (ratio < 0.4) return 'bg-blue-200'
    if (ratio < 0.6) return 'bg-blue-300'
    if (ratio < 0.8) return 'bg-blue-400'
    return 'bg-blue-500'
  }

  const getTextColor = (count: number): string => {
    if (count === 0) return 'text-slate-400'
    const ratio = count / maxJobs
    if (ratio < 0.6) return 'text-blue-700'
    return 'text-white'
  }

  // Sorterade regioner för list/gridsikt
  const sortedRegions = useMemo(() => {
    const sorted = [...regions].filter(r => r.jobCount > 0)
    if (sortBy === 'jobs') {
      sorted.sort((a, b) => b.jobCount - a.jobCount)
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
    }
    return sorted
  }, [regions, sortBy])

  // Sverige SVG path (förenklad men igenkännbar kontur)
  const swedenPath = `
    M 48,118
    L 42,112
    L 36,104
    L 30,94
    L 24,84
    L 20,72
    L 22,60
    L 28,48
    L 34,38
    L 40,28
    L 46,18
    L 52,10
    L 58,5
    L 64,2
    L 70,8
    L 76,18
    L 82,28
    L 88,38
    L 84,50
    L 78,62
    L 72,74
    L 66,86
    L 60,98
    L 54,110
    Z
  `

  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <MapIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Jobb i Sverige</h3>
              <p className="text-xs text-slate-500">
                {totalJobs.toLocaleString()} lediga jobb
              </p>
            </div>
          </div>
          
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'map' ? "bg-white shadow-sm text-blue-600" : "text-slate-500"
              )}
              title="Kartvy"
            >
              <Navigation size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'list' ? "bg-white shadow-sm text-blue-600" : "text-slate-500"
              )}
              title="Listvy"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'grid' ? "bg-white shadow-sm text-blue-600" : "text-slate-500"
              )}
              title="Rutnät"
            >
              <Grid3X3 size={16} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Färre jobb</span>
          <div className="flex gap-1">
            <div className="w-6 h-3 rounded bg-slate-100" />
            <div className="w-6 h-3 rounded bg-blue-100" />
            <div className="w-6 h-3 rounded bg-blue-200" />
            <div className="w-6 h-3 rounded bg-blue-300" />
            <div className="w-6 h-3 rounded bg-blue-400" />
            <div className="w-6 h-3 rounded bg-blue-500" />
          </div>
          <span className="text-slate-500">Fler jobb</span>
        </div>
      </div>

      {/* Content based on view mode */}
      <div className="p-4">
        {viewMode === 'map' && (
          <>
            {/* Karta */}
            <div className="relative aspect-[3/4] max-h-[400px]">
              {/* Bakgrund */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white rounded-xl" />
              
              {/* Sverige SVG */}
              <svg
                viewBox="0 0 100 120"
                className="absolute inset-0 w-full h-full"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
              >
                {/* Sverige-kontur */}
                <path
                  d={swedenPath}
                  fill="white"
                  stroke="#e2e8f0"
                  strokeWidth="0.8"
                />
                
                {/* Region-gränser (förenklade) */}
                <g stroke="#f1f5f9" strokeWidth="0.3" fill="none">
                  <line x1="45" y1="20" x2="45" y2="90" />
                  <line x1="30" y1="50" x2="75" y2="50" />
                  <line x1="25" y1="75" x2="85" y2="75" />
                </g>
              </svg>

              {/* Region-punkter */}
              {regions.map(region => {
                const isSelected = selectedRegion === region.id
                const isHovered = hoveredRegion === region.id
                const hasJobs = region.jobCount > 0
                
                // Storlek baserat på antal jobb (min 12px, max 40px)
                const size = hasJobs 
                  ? Math.max(16, Math.min(40, (region.jobCount / maxJobs) * 32 + 16))
                  : 12
                
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
                      zIndex: isHovered || isSelected ? 20 : hasJobs ? 10 : 1,
                    }}
                  >
                    {/* Cirkel */}
                    <div
                      className={cn(
                        "rounded-full flex items-center justify-center transition-all duration-200 border-2",
                        getColorIntensity(region.jobCount),
                        isSelected 
                          ? "border-blue-600 ring-4 ring-blue-100" 
                          : isHovered 
                            ? "border-blue-400 ring-2 ring-blue-50"
                            : hasJobs 
                              ? "border-white shadow-md"
                              : "border-slate-200",
                        isHovered && "scale-110"
                      )}
                      style={{
                        width: size,
                        height: size,
                        minWidth: size,
                        minHeight: size,
                      }}
                    >
                      {/* Jobb-räknare för stora regioner */}
                      {region.jobCount > 500 && (
                        <span className={cn(
                          "text-[10px] font-bold",
                          getTextColor(region.jobCount)
                        )}>
                          {region.jobCount > 999 ? '1k+' : region.jobCount}
                        </span>
                      )}
                    </div>

                    {/* Tooltip */}
                    {(isHovered || isSelected) && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none z-30">
                        <div className="bg-slate-900 text-white text-sm rounded-xl py-2 px-3 shadow-xl whitespace-nowrap">
                          <div className="font-semibold">{region.name}</div>
                          <div className="flex items-center gap-1.5 mt-1 text-slate-300 text-xs">
                            <Briefcase className="w-3.5 h-3.5" />
                            {region.jobCount.toLocaleString()} lediga jobb
                          </div>
                          {/* Pil */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-slate-900" />
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Snabbval för stora städer */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: 'SE110', name: 'Stockholm', icon: '🏙️' },
                { id: 'SE232', name: 'Göteborg', icon: '⚓' },
                { id: 'SE224', name: 'Malmö', icon: '🏖️' },
                { id: 'SE121', name: 'Uppsala', icon: '🎓' },
              ].map(city => {
                const region = regions.find(r => r.id === city.id)
                if (!region) return null
                return (
                  <button
                    key={city.id}
                    onClick={() => onRegionSelect?.(city.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                      selectedRegion === city.id
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent"
                    )}
                  >
                    <span>{city.icon}</span>
                    <span className="font-medium">{city.name}</span>
                    {region.jobCount > 0 && (
                      <span className="text-xs opacity-70">
                        ({region.jobCount.toLocaleString()})
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {viewMode === 'list' && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {/* Sort toggle */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">
                {sortedRegions.length} regioner med jobb
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'jobs' | 'name')}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1"
              >
                <option value="jobs">Sortera: Flest jobb</option>
                <option value="name">Sortera: Namn</option>
              </select>
            </div>

            {sortedRegions.map(region => (
              <button
                key={region.id}
                onClick={() => onRegionSelect?.(region.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left",
                  selectedRegion === region.id
                    ? "bg-blue-50 border-2 border-blue-200"
                    : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    getColorIntensity(region.jobCount)
                  )}>
                    <MapPin size={18} className={region.jobCount > 0 ? "text-blue-600" : "text-slate-400"} />
                  </div>
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{region.name}</div>
                    <div className="text-xs text-slate-500">
                      {region.population.toLocaleString()} invånare
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-800">
                    {region.jobCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">jobb</div>
                </div>
              </button>
            ))}

            {sortedRegions.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Inga jobb hittades i någon region</p>
                <p className="text-sm mt-1">Ändra dina sökkriterier</p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
            {sortedRegions.map(region => (
              <button
                key={region.id}
                onClick={() => onRegionSelect?.(region.id)}
                className={cn(
                  "p-3 rounded-xl transition-colors text-left",
                  selectedRegion === region.id
                    ? "bg-blue-50 border-2 border-blue-200"
                    : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                  getColorIntensity(region.jobCount)
                )}>
                  <Briefcase size={14} className={region.jobCount > 0 ? "text-blue-600" : "text-slate-400"} />
                </div>
                <div className="font-medium text-slate-800 text-sm truncate">{region.name}</div>
                <div className="text-lg font-semibold text-slate-700">
                  {region.jobCount.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">lediga jobb</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected region info */}
      {selectedRegion && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">
                  {regions.find(r => r.id === selectedRegion)?.name}
                </h4>
                <p className="text-slate-600 text-sm">
                  {regions.find(r => r.id === selectedRegion)?.jobCount.toLocaleString()} lediga jobb
                </p>
              </div>
            </div>
            <button
              onClick={() => onRegionSelect?.('')}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SwedenMap
