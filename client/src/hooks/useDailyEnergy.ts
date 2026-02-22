import { useState, useEffect, useCallback } from 'react'
import type { EnergyLevel } from '@/components/gamification/EnergyFilter'

const STORAGE_KEY = 'daily-energy'

interface DailyEnergyData {
  level: EnergyLevel
  date: string
  timestamp: number
}

export function useDailyEnergy() {
  const [energyLevel, setEnergyLevelState] = useState<EnergyLevel | null>(null)
  const [hasSelectedToday, setHasSelectedToday] = useState(false)

  // Ladda sparad energinivå vid mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data: DailyEnergyData = JSON.parse(saved)
        const today = new Date().toISOString().split('T')[0]
        
        if (data.date === today) {
          setEnergyLevelState(data.level)
          setHasSelectedToday(true)
        } else {
          // Datum har ändrats, rensa gammal data
          localStorage.removeItem(STORAGE_KEY)
          setHasSelectedToday(false)
        }
      }
    } catch (error) {
      console.error('Fel vid laddning av energidata:', error)
    }
  }, [])

  // Spara energinivå
  const setEnergyLevel = useCallback((level: EnergyLevel | null) => {
    if (level === null) {
      localStorage.removeItem(STORAGE_KEY)
      setEnergyLevelState(null)
      setHasSelectedToday(false)
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const data: DailyEnergyData = {
      level,
      date: today,
      timestamp: Date.now()
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setEnergyLevelState(level)
      setHasSelectedToday(true)
    } catch (error) {
      console.error('Fel vid sparande av energidata:', error)
    }
  }, [])

  // Rensa energinivå
  const clearEnergyLevel = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setEnergyLevelState(null)
    setHasSelectedToday(false)
  }, [])

  return {
    energyLevel,
    setEnergyLevel,
    hasSelectedToday,
    clearEnergyLevel
  }
}

export default useDailyEnergy
