import { useEffect, useState, useCallback } from 'react'

interface MobileOptimizationState {
  isMobile: boolean
  isTablet: boolean
  isLandscape: boolean
  simplifiedView: boolean
  touchZone: 'left' | 'right' | 'center'
}

// Helper to detect mobile via user agent
const isMobileUserAgent = (): boolean => {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function useMobileOptimization(): MobileOptimizationState {
  const [state, setState] = useState<MobileOptimizationState>({
    isMobile: false,
    isTablet: false,
    isLandscape: false,
    simplifiedView: false,
    touchZone: 'center'
  })

  useEffect(() => {
    const checkDevice = () => {
      if (typeof window === 'undefined') return
      
      const width = window.innerWidth
      const height = window.innerHeight
      const mobileUA = isMobileUserAgent()
      
      // STRICT: Om skärmen är mindre än 768px ELLER om det är en mobil user agent, visa mobilvy
      const isMobile = width < 768 || mobileUA
      const isTablet = width >= 768 && width < 1024 && !mobileUA
      
      console.log('[MobileOptimizer] width:', width, 'mobileUA:', mobileUA, 'isMobile:', isMobile)
      
      setState({
        isMobile,
        isTablet,
        isLandscape: width > height,
        simplifiedView: width < 360 || (width < 768 && height < 600),
        touchZone: 'center'
      })
    }

    // Kör direkt vid mount
    checkDevice()
    
    // Lyssna på ändringar
    window.addEventListener('resize', checkDevice)
    window.addEventListener('orientationchange', checkDevice)

    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])

  // Spåra touch-zone för en-handsanvändning
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    const screenWidth = window.innerWidth
    const x = touch.clientX
    
    setState(prev => ({
      ...prev,
      touchZone: x < screenWidth / 3 ? 'left' : x > (screenWidth * 2) / 3 ? 'right' : 'center'
    }))
  }, [])

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    return () => window.removeEventListener('touchstart', handleTouchStart)
  }, [handleTouchStart])

  return state
}

// Alias för bakåtkompatibilitet
export const useMobileOptimizer = useMobileOptimization

// Komponent som lägger till mobile-specifika CSS-klasser
export function MobileOptimizer() {
  const { isMobile, isLandscape, simplifiedView } = useMobileOptimization()

  useEffect(() => {
    const root = document.documentElement
    
    if (isMobile) {
      root.classList.add('mobile-device')
    } else {
      root.classList.remove('mobile-device')
    }

    if (isLandscape) {
      root.classList.add('landscape-mode')
    } else {
      root.classList.remove('landscape-mode')
    }

    if (simplifiedView) {
      root.classList.add('simplified-view')
    } else {
      root.classList.remove('simplified-view')
    }
  }, [isMobile, isLandscape, simplifiedView])

  // Lägg till viewport-meta om den saknas
  useEffect(() => {
    let viewport = document.querySelector('meta[name="viewport"]')
    if (!viewport) {
      viewport = document.createElement('meta')
      viewport.setAttribute('name', 'viewport')
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0')
      document.head.appendChild(viewport)
    }
  }, [])

  return null
}

export default MobileOptimizer
