/**
 * Font Provider Component
 * 
 * Handles font loading optimization:
 * - font-display: swap to prevent FOIT
 * - Preloading critical fonts
 * - Font face observer for loading states
 */

import { useEffect, useState } from 'react'

interface FontProviderProps {
  children: React.ReactNode
}

// System font stack for fallback
const SYSTEM_FONTS = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
].join(', ')

// Font loading states
const FONT_STATES = {
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
} as const

export function FontProvider({ children }: FontProviderProps) {
  const [fontLoaded, setFontLoaded] = useState(false)

  useEffect(() => {
    // Check if fonts are already loaded
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        setFontLoaded(true)
        document.documentElement.classList.add('fonts-loaded')
      })
    } else {
      // Fallback for older browsers
      setFontLoaded(true)
    }

    // Add font-display: swap to all font faces
    const style = document.createElement('style')
    style.textContent = `
      /* Ensure fonts don't block rendering */
      @font-face {
        font-display: swap !important;
      }
      
      /* Apply system fonts initially */
      html {
        font-family: ${SYSTEM_FONTS};
      }
      
      /* Apply custom fonts when loaded */
      html.fonts-loaded {
        font-family: var(--font-sans, ${SYSTEM_FONTS});
      }
      
      /* Prevent FOIT (Flash of Invisible Text) */
      .font-loading {
        opacity: 0.9;
      }
      
      .font-loaded {
        opacity: 1;
        transition: opacity 0.2s ease-out;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className={fontLoaded ? 'font-loaded' : 'font-loading'}>
      {children}
    </div>
  )
}

/**
 * Preload critical fonts
 * Add this to your HTML head
 */
export const fontPreloadLinks = [
  // Example: Preloading critical font weights
  // { rel: 'preload', href: '/fonts/inter-regular.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
  // { rel: 'preload', href: '/fonts/inter-semibold.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
]

/**
 * Font loading utility
 */
export async function loadFont(
  fontFamily: string,
  fontUrl: string,
  options: { weight?: string; style?: string } = {}
): Promise<void> {
  const { weight = '400', style = 'normal' } = options

  return new Promise((resolve, reject) => {
    const font = new FontFace(fontFamily, `url(${fontUrl})`, {
      weight,
      style,
    })

    font
      .load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont)
        resolve()
      })
      .catch(reject)
  })
}

/**
 * Hook to detect if fonts are loaded
 */
export function useFontsLoaded(): boolean {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setLoaded(true))
    } else {
      setLoaded(true)
    }
  }, [])

  return loaded
}

export default FontProvider
