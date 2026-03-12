/**
 * Hook to manage and persist user's energy level preference
 */

import { useState, useEffect, useCallback } from 'react'

type EnergyLevel = 'low' | 'medium' | 'high'

export function useEnergyLevel() {
  const [energyLevel, setEnergyLevelState] = useState<EnergyLevel>('medium')
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('energy-level') as EnergyLevel | null
    if (saved && ['low', 'medium', 'high'].includes(saved)) {
      setEnergyLevelState(saved)
    }
    setIsLoaded(true)
  }, [])
  
  // Save to localStorage when changed
  const setEnergyLevel = useCallback((level: EnergyLevel) => {
    setEnergyLevelState(level)
    localStorage.setItem('energy-level', level)
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('energy-level-change', { detail: level }))
  }, [])
  
  return [energyLevel, setEnergyLevel, isLoaded] as const
}

// Get energy-appropriate content filter
export function useEnergyFilter() {
  const [energyLevel] = useEnergyLevel()
  
  const getReadingTimeLimit = () => {
    switch (energyLevel) {
      case 'low': return 5
      case 'medium': return 15
      case 'high': return Infinity
    }
  }
  
  const getRecommendedDifficulty = () => {
    switch (energyLevel) {
      case 'low': return ['easy']
      case 'medium': return ['easy', 'medium']
      case 'high': return ['easy', 'medium', 'detailed']
    }
  }
  
  return {
    energyLevel,
    readingTimeLimit: getReadingTimeLimit(),
    recommendedDifficulty: getRecommendedDifficulty(),
  }
}
