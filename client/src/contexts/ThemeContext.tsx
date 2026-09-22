/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + context/konstant/helper-export */
/**
 * Theme Context
 * Hanterar dark mode och temainställningar globalt
 * Spara preferenser i localStorage och respektera systeminställningar
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
  toggleDarkMode: () => void
  systemPreference: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Hämta initialt tema från localStorage eller system.
//
// localStorage kan KASTA (Safari i privat läge med full kvot, blockerade
// webbplatsdata, vissa inbäddade vyer). Providern ligger ovanför allt annat,
// så ett kast här gav en vit sida för hela portalen (2026-09-22). Temat är en
// bekvämlighet — utan lagring faller vi tillbaka på 'system'.
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system'

  let saved: string | null = null
  try {
    saved = localStorage.getItem('theme')
  } catch {
    return 'system'
  }
  if (saved && ['light', 'dark', 'system'].includes(saved)) {
    return saved as Theme
  }
  return 'system'
}

// Kontrollera om systemet föredrar dark mode
function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(getSystemPreference)

  // Helt härlett av tema och systempreferens — ingen egen state behövs (låg
  // tidigare i en effekt som bara kopierade beräkningen, vilket gav en extra
  // rendering varje gång temat ändrades).
  const isDark = useMemo(
    () => (theme === 'system' ? systemPreference === 'dark' : theme === 'dark'),
    [theme, systemPreference]
  )

  // Applicera dark mode class på html-elementet
  useEffect(() => {
    const root = window.document.documentElement
    
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])

  // Lyssna på systemförändringar
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem('theme', newTheme)
    } catch {
      // Valet gäller sessionen ut även om det inte kan sparas.
    }
  }, [])

  const toggleDarkMode = useCallback(() => {
    if (theme === 'system') {
      // Om system, växla till motsatt av nuvarande
      setTheme(isDark ? 'light' : 'dark')
    } else {
      // Växla mellan light och dark
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }, [theme, isDark, setTheme])

  // C13 (2026-07-23): memoiserat så konsumenter inte re-rendrar när
  // providern råkar rendera om utan att temat ändrats
  const value: ThemeContextType = useMemo(() => ({
    theme,
    setTheme,
    isDark,
    toggleDarkMode,
    systemPreference,
  }), [theme, setTheme, isDark, toggleDarkMode, systemPreference])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook för att använda temat
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Hook för att bara få dark mode status (lättare att använda)
export function useDarkMode() {
  const { isDark } = useTheme()
  return { isDark }
}

export default ThemeContext
