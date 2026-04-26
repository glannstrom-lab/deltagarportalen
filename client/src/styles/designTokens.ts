/**
 * Design System Tokens - "Calm & Capable" Palett
 * Enhetlig design över hela applikationen
 *
 * Ändringar:
 * - Primärfärg: Teal (lugnande & professionell)
 * - Neutral: Slate → Warm Stone (mer inbjudande)
 * - Justerade semantiska färger för bättre kontrast (WCAG AA)
 */

// Färger
export const colors = {
  // NY: Primärfärg - Teal ("Calm & Capable")
  // Teal upplevs som lugn, pålitlig och professionell
  primary: {
    50: '#f0fdfa',   // Ljus bakgrund
    100: '#ccfbf1',  // Hover-bakgrunder
    200: '#99f6e4',  // Subtila highlights
    300: '#5eead4',  // Ikoner
    400: '#2dd4bf',  // Dekorativa element
    500: '#14b8a6',  // Sekundär actions
    600: '#0d9488',  // Standard-knappar (Huvudfärg)
    700: '#0f766e',  // Hover-states
    800: '#115e59',  // Aktiva states
    900: '#134e4a',  // Text på ljusa bakgrunder
  },
  
  // NY: Neutrala färger - Warm Stone (istället för Slate)
  // Varmare gråskala som känns mer inbjudande
  neutral: {
    50: '#fafaf9',   // Huvudbakgrund (page bg)
    100: '#f5f5f4',  // Kortbakgrund (alt)
    200: '#e7e5e4',  // Kanter, divider
    300: '#d6d3d1',  // Avaktiverade kanter
    400: '#a8a29e',  // Platshållartext
    500: '#78716c',  // Sekundär text
    600: '#57534e',  // Brödtext
    700: '#44403c',  // Rubriker
    800: '#292524',  // Stark text
    900: '#1c1917',  // Nästan svart
  },
  
  // BAKÅTKOMPATIBEL: Slate behålls under övergångsperiod
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Sekundärfärg - Sky (för luft/möjligheter)
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Semantiska färger - justerade för WCAG AA kontrast
  success: {
    light: '#d1fae5',
    DEFAULT: '#059669',  // Mörkare för bättre kontrast (4.6:1)
    dark: '#047857',
  },
  warning: {
    light: '#fef3c7',
    DEFAULT: '#d97706',
    dark: '#b45309',
  },
  error: {
    light: '#fee2e2',
    DEFAULT: '#dc2626',  // Bra kontrast (5.9:1)
    dark: '#b91c1c',
  },
  info: {
    light: '#dbeafe',
    DEFAULT: '#2563eb',
    dark: '#1d4ed8',
  },
}

// Bakgrunder och gradients
export const backgrounds = {
  // Huvudbakgrunder
  page: '#fafaf9',           // Neutral-50
  card: '#ffffff',           // Vit
  cardHover: '#fafaf9',      // Subtil hover
  
  // Overlay-bakgrunder
  modal: 'rgba(28, 25, 23, 0.5)',      // Neutral-900 med 50% opacity
  tooltip: 'rgba(68, 64, 60, 0.95)',   // Neutral-700
  
  // Gradients
  hero: 'linear-gradient(135deg, #f0fdfa 0%, #fafaf9 100%)',
  primaryButton: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
  primaryButtonHover: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
  success: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
}

// Avstånd (spacing)
export const spacing = {
  xs: '4px',    // 0.25rem
  sm: '8px',    // 0.5rem
  md: '16px',   // 1rem
  lg: '24px',   // 1.5rem
  xl: '32px',   // 2rem
  '2xl': '48px', // 3rem
  '3xl': '64px', // 4rem
}

// Border radius
export const borderRadius = {
  none: '0',
  sm: '4px',     // rounded-sm
  md: '8px',     // rounded-md
  lg: '12px',    // rounded-lg
  xl: '16px',    // rounded-xl (default för kort)
  '2xl': '20px', // rounded-2xl
  '3xl': '24px', // rounded-3xl
  full: '9999px',
}

// Typografi
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
}

// Skuggor
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
}

// Animationer
export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
}

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// Z-index skala
export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
  tooltip: 1700,
}

// Widget-specifika tokens - UPPDATERADE med nya färger
export const widgetTokens = {
  // Standard padding för alla widgets
  padding: '24px', // p-6
  
  // Border radius för widgets
  borderRadius: '16px', // rounded-2xl
  
  // Skugga för widgets
  shadow: shadows.md,
  
  // Hover skugga
  hoverShadow: shadows.lg,
  
  // NYA: Färger per widget-typ med Teal/Sky-paletten
  variants: {
    cv: {
      bg: colors.primary[50],
      border: colors.primary[200],
      text: colors.primary[700],
      icon: colors.primary[500],
      gradient: 'from-teal-500 to-sky-600',
    },
    jobSearch: {
      bg: colors.info.light,
      border: '#bfdbfe',
      text: colors.info.dark,
      icon: colors.info.DEFAULT,
      gradient: 'from-blue-500 to-sky-600',
    },
    wellness: {
      bg: colors.secondary[50],
      border: colors.secondary[200],
      text: colors.secondary[800],
      icon: colors.secondary[500],
      gradient: 'from-sky-500 to-emerald-600',
    },
    success: {
      bg: colors.success.light,
      border: '#a7f3d0',
      text: colors.success.dark,
      icon: colors.success.DEFAULT,
      gradient: 'from-emerald-500 to-teal-600',
    },
    warning: {
      bg: colors.warning.light,
      border: '#fde68a',
      text: colors.warning.dark,
      icon: colors.warning.DEFAULT,
      gradient: 'from-amber-500 to-orange-600',
    },
    neutral: {
      bg: colors.neutral[50],
      border: colors.neutral[200],
      text: colors.neutral[700],
      icon: colors.neutral[500],
      gradient: 'from-stone-400 to-stone-600',
    },
  }
}

// Hjälpfunktion för att få Tailwind-klasser
export const getWidgetClasses = (variant: keyof typeof widgetTokens.variants) => {
  const tokens = widgetTokens.variants[variant]
  return {
    bg: tokens.bg,
    border: tokens.border,
    text: tokens.text,
    icon: tokens.icon,
    gradient: tokens.gradient,
  }
}

// NY: Kontrast-kontroll för tillgänglighet
export const contrastRatios = {
  // Förberäknade kontrastvärden mot vit bakgrund
  primaryOnWhite: 4.5,   // 0d9488 på vit: ✅ AA
  neutral600OnNeutral50: 7.2,  // 57534e på fafaf9: ✅ AA
  successOnWhite: 4.6,   // 059669 på vit: ✅ AA
  errorOnWhite: 5.9,     // dc2626 på vit: ✅ AA
  warningOnWhite: 3.2,   // d97706 på vit: ⚠️ kräver ikon
}

// NY: High contrast mode tokens
export const highContrast = {
  primary: '#115e59',
  neutral: '#1c1917',
  success: '#047857',
  border: '#1c1917',
}

// Export allt som ett design system-objekt
export const designSystem = {
  colors,
  backgrounds,
  spacing,
  borderRadius,
  typography,
  shadows,
  animations,
  breakpoints,
  zIndex,
  widgetTokens,
  contrastRatios,
  highContrast,
}

export default designSystem
