/**
 * Central Design System för Deltagarportalen
 * "Calm & Capable" Palett - UPPDATERAD
 *
 * Ändringar:
 * - Primärfärg: Teal (lugnande & professionell)
 * - Sekundär: Sky (öppen & möjligheter)
 * - Slate → Warm Stone (mer inbjudande)
 * - Justerade semantiska färger för bättre kontrast
 */

import { cn } from '@/lib/utils'

// ============================================
// FÄRGSYSTEM - NYA "Calm & Capable" Färger
// ============================================
export const colors = {
  // NY: Primärfärg - Teal
  primary: {
    50: 'bg-teal-50',
    100: 'bg-teal-100',
    200: 'bg-teal-200',
    300: 'bg-teal-300',
    500: 'bg-teal-500',
    600: 'bg-teal-600',   // Huvudfärg
    700: 'bg-teal-700',   // Hover
    text: 'text-teal-600',
    textLight: 'text-teal-700',
    border: 'border-teal-200',
    ring: 'ring-teal-500',
  },
  
  // NY: Neutrala färger - Warm Stone (istället för Slate)
  neutral: {
    50: 'bg-stone-50',      // Huvudbakgrund
    100: 'bg-stone-100',    // Sekundär bakgrund
    200: 'bg-stone-200',    // Kanter
    300: 'bg-stone-300',
    400: 'text-stone-600',  // Platshållare
    500: 'text-stone-500',  // Sekundär text
    600: 'text-stone-600',  // Brödtext
    700: 'text-stone-700',  // Rubriker
    800: 'text-stone-800',  // Stark text
    900: 'text-stone-900',
    border: 'border-stone-200',
    borderLight: 'border-stone-100',
  },
  
  // BAKÅTKOMPATIBEL: Slate (mappad till stone)
  slate: {
    50: 'bg-stone-50',
    100: 'bg-stone-100',
    200: 'bg-stone-200',
    300: 'bg-stone-300',
    400: 'text-stone-600',
    500: 'text-stone-500',
    600: 'text-stone-600',
    700: 'text-stone-700',
    800: 'text-stone-800',
    900: 'text-stone-900',
    border: 'border-stone-200',
    borderLight: 'border-stone-100',
  },
  
  // UPPDATERAD: Status-färger med bättre kontrast
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',    // Mörkare för WCAG AA
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    icon: 'text-amber-600',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    icon: 'text-red-600',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    icon: 'text-blue-600',
  },
}

// ============================================
// SHADOWS
// ============================================
export const shadows = {
  sm: 'shadow-sm',
  DEFAULT: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  inner: 'shadow-inner',
  // Specifika användningsområden
  card: 'shadow-sm',
  cardHover: 'shadow-md',
  elevated: 'shadow-lg',
  modal: 'shadow-xl',
  button: 'shadow-sm',
  buttonHover: 'shadow',
}

// ============================================
// BORDER RADIUS
// ============================================
export const radius = {
  sm: 'rounded-md',      // 6px
  DEFAULT: 'rounded-lg', // 8px
  lg: 'rounded-xl',      // 12px
  xl: 'rounded-2xl',     // 16px
  '2xl': 'rounded-3xl',  // 24px
  full: 'rounded-full',
  // Specifika användningsområden
  button: 'rounded-lg',
  input: 'rounded-lg',
  card: 'rounded-xl',
  cardLarge: 'rounded-2xl',
  modal: 'rounded-2xl',
  badge: 'rounded-full',
  avatar: 'rounded-full',
}

// ============================================
// SPACING
// ============================================
export const spacing = {
  // Page sections
  section: 'space-y-6',
  sectionLarge: 'space-y-8',
  // Cards
  card: 'p-6',
  cardSmall: 'p-4',
  cardLarge: 'p-8',
  // Form elements
  input: 'px-4 py-3',
  inputTouch: 'px-4 py-3.5',
  // Buttons
  button: 'px-5 py-2.5',
  buttonSmall: 'px-3 py-1.5',
  buttonLarge: 'px-6 py-3',
  buttonTouch: 'px-4 py-3 min-h-[48px] min-w-[48px]',
  buttonTouchLarge: 'px-6 py-4 min-h-[56px] min-w-[56px]',
}

// ============================================
// ANIMATIONER
// ============================================
export const animations = {
  // Page transitions
  pageEnter: 'animate-in fade-in duration-300',
  slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
  slideRight: 'animate-in slide-in-from-right-4 duration-300',
  // Micro-interactions
  press: 'active:scale-[0.98] transition-transform duration-150',
  lift: 'hover:-translate-y-0.5 transition-transform duration-200',
  liftLarge: 'hover:-translate-y-1 transition-transform duration-200',
  // Focus states - UPPDATERAD med teal
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500',
  focusVisible: 'focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
  // Loading
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
}

// ============================================
// TYPOGRAFI
// ============================================
export const typography = {
  // Headers
  h1: 'text-2xl sm:text-3xl font-bold text-stone-800',
  h2: 'text-xl sm:text-2xl font-bold text-stone-800',
  h3: 'text-lg font-semibold text-stone-800',
  h4: 'text-base font-semibold text-stone-800',
  // Body - UPPDATERAD med stone
  body: 'text-base text-stone-600',
  bodySmall: 'text-sm text-stone-600',
  bodyLarge: 'text-lg text-stone-600',
  // Labels
  label: 'text-sm font-medium text-stone-700 mb-1.5',
  labelSmall: 'text-xs font-medium text-stone-600',
  // Special
  caption: 'text-xs text-stone-500',
  button: 'text-sm font-medium',
  overline: 'text-xs font-semibold uppercase tracking-wider text-stone-500',
}

// ============================================
// KOMPONENT-KLASSER (Helper functions)
// ============================================

// Button varianter - UPPDATERADE med nya färger och förbättrad tillgänglighet
export const buttonVariants = {
  primary: cn(
    'bg-teal-600 text-white hover:bg-teal-700',
    shadows.button,
    'hover:shadow',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2'
  ),
  secondary: cn(
    'bg-white border border-stone-200 text-stone-700',
    'hover:bg-stone-50 hover:border-stone-300',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2'
  ),
  outline: cn(
    'bg-transparent border-2 border-teal-600 text-teal-600',
    'hover:bg-teal-50',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2'
  ),
  ghost: cn(
    'bg-transparent text-stone-600',
    'hover:bg-stone-100 hover:text-stone-900',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2'
  ),
  danger: cn(
    'bg-red-50 text-red-600 border border-red-200',
    'hover:bg-red-100 hover:border-red-300',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2'
  ),
  icon: cn(
    'w-10 h-10 rounded-lg',
    'inline-flex items-center justify-center',
    'text-stone-600 hover:bg-stone-100',
    animations.press,
    'transition-colors duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2'
  ),
}

// Card varianter - UPPDATERADE med stone
export const cardVariants = {
  default: cn(
    'bg-white',
    radius.card,
    shadows.card,
    colors.neutral.border,
    'border',
    spacing.card
  ),
  hover: cn(
    'bg-white',
    radius.card,
    shadows.card,
    colors.neutral.border,
    'border',
    spacing.card,
    'hover:shadow-md',
    animations.lift,
    'transition-all duration-200'
  ),
  elevated: cn(
    'bg-white',
    radius.cardLarge,
    shadows.elevated,
    colors.neutral.border,
    'border',
    spacing.card
  ),
  flat: cn(
    'bg-white',
    radius.card,
    colors.neutral.border,
    'border',
    spacing.card
  ),
}

// Input styling - UPPDATERAD med stone och teal
export const inputBase = cn(
  'w-full',
  spacing.input,
  colors.neutral.border,
  'border',
  radius.input,
  'text-stone-800 placeholder:text-stone-600',
  'transition-all duration-200',
  animations.focusRing,
  'disabled:opacity-50 disabled:cursor-not-allowed'
)

// Label styling
export const labelBase = cn(
  'block',
  typography.label
)

// Badge styling - UPPDATERAD
export const badgeVariants = {
  default: 'bg-stone-100 text-stone-700 px-2 py-0.5 text-xs font-medium rounded-full',
  primary: 'bg-teal-100 text-teal-700 px-2 py-0.5 text-xs font-medium rounded-full',
  success: 'bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium rounded-full',
  warning: 'bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium rounded-full',
  error: 'bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium rounded-full',
}

// ============================================
// TOUCH/MOBIL SPECIFIKT
// ============================================
export const touch = {
  // Minimum touch target size (44px WCAG)
  minTarget: 'min-h-[44px] min-w-[44px]',
  largeTarget: 'min-h-[56px] min-w-[56px]',
  // Touch padding
  button: 'px-4 py-3 min-h-[48px]',
  buttonLarge: 'px-6 py-4 min-h-[56px]',
  input: 'px-4 py-3.5 min-h-[48px]',
  listItem: 'py-3 px-4',
}

// ============================================
// RESPONSIVE UTILITIES - BREAKPOINTS
// ============================================
// sm: 640px (small phones landscape / large phones)
// md: 768px (tablets portrait)
// lg: 1024px (tablets landscape / small laptops)
// xl: 1280px (laptops / desktops)
// 2xl: 1536px (large desktops)

export const responsive = {
  // Responsive padding
  padding: {
    page: 'px-4 sm:px-5 md:px-6 lg:px-8',
    section: 'py-4 sm:py-5 md:py-6 lg:py-8',
    card: 'p-4 sm:p-5 md:p-6',
    cardCompact: 'p-3 sm:p-4',
  },

  // Responsive gaps
  gap: {
    xs: 'gap-1 sm:gap-1.5 md:gap-2',
    sm: 'gap-2 sm:gap-3 md:gap-4',
    md: 'gap-3 sm:gap-4 md:gap-5 lg:gap-6',
    lg: 'gap-4 sm:gap-5 md:gap-6 lg:gap-8',
    section: 'gap-4 sm:gap-6 md:gap-8',
  },

  // Responsive grids
  grid: {
    // 1 col mobile → 2 col tablet → 3 col desktop
    cols123: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    // 1 col mobile → 2 col tablet → 4 col desktop
    cols124: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    // 2 col mobile → 3 col tablet → 4 col desktop
    cols234: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    // 1 col mobile → 2 col desktop
    cols12: 'grid grid-cols-1 md:grid-cols-2',
    // 2 col mobile → 4 col desktop
    cols24: 'grid grid-cols-2 lg:grid-cols-4',
    // Stats grid - 2 mobile, 4 desktop
    stats: 'grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4',
    // Cards grid
    cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6',
  },

  // Responsive max-widths
  maxWidth: {
    content: 'max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl',
    narrow: 'max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl',
    modal: 'max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl',
    modalLarge: 'max-w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-4xl',
  },

  // Responsive typography
  text: {
    // Headings
    h1: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold',
    h2: 'text-lg sm:text-xl md:text-2xl font-bold',
    h3: 'text-base sm:text-lg md:text-xl font-semibold',
    h4: 'text-sm sm:text-base md:text-lg font-semibold',
    // Body
    body: 'text-sm sm:text-base',
    bodyLarge: 'text-base sm:text-lg md:text-xl',
    bodySmall: 'text-xs sm:text-sm',
    // Labels & captions
    label: 'text-xs sm:text-sm font-medium',
    caption: 'text-[10px] sm:text-xs',
  },

  // Responsive icon sizes
  icon: {
    xs: 'w-3 h-3 sm:w-4 sm:h-4',
    sm: 'w-4 h-4 sm:w-5 sm:h-5',
    md: 'w-5 h-5 sm:w-6 sm:h-6',
    lg: 'w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8',
    xl: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
    // Widget icons
    widget: 'w-10 h-10 sm:w-12 sm:h-12',
    stat: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
  },

  // Responsive buttons
  button: {
    // Auto touch-optimized on mobile
    primary: 'px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-2.5 min-h-[44px] sm:min-h-0 text-sm sm:text-base',
    small: 'px-2.5 py-1.5 sm:px-3 sm:py-2 min-h-[40px] sm:min-h-0 text-xs sm:text-sm',
    large: 'px-4 py-3 sm:px-5 sm:py-3 md:px-6 md:py-3.5 min-h-[48px] text-sm sm:text-base',
    icon: 'w-10 h-10 sm:w-9 sm:h-9 md:w-10 md:h-10 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0',
  },

  // Responsive spacing for sections
  section: {
    py: 'py-4 sm:py-6 md:py-8 lg:py-10',
    mb: 'mb-4 sm:mb-6 md:mb-8',
    space: 'space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8',
  },

  // Show/hide utilities
  show: {
    mobileOnly: 'block sm:hidden',
    tabletUp: 'hidden sm:block',
    tabletOnly: 'hidden sm:block lg:hidden',
    desktopUp: 'hidden lg:block',
    desktopOnly: 'hidden lg:block xl:hidden',
    // Flex variants
    mobileOnlyFlex: 'flex sm:hidden',
    tabletUpFlex: 'hidden sm:flex',
    desktopUpFlex: 'hidden lg:flex',
  },

  // Responsive heights
  height: {
    hero: 'min-h-[200px] sm:min-h-[250px] md:min-h-[300px]',
    card: 'min-h-[120px] sm:min-h-[140px] md:min-h-[160px]',
    input: 'h-10 sm:h-11 md:h-12',
    inputTouch: 'h-12 sm:h-11',
  },

  // Responsive borders and radius
  radius: {
    card: 'rounded-lg sm:rounded-xl md:rounded-2xl',
    button: 'rounded-md sm:rounded-lg',
    modal: 'rounded-t-2xl sm:rounded-2xl',
  },
}

// ============================================
// UTILITIES
// ============================================
export const container = {
  maxWidth: 'max-w-7xl mx-auto',
  maxWidthNarrow: 'max-w-3xl mx-auto',
  padding: 'px-4 sm:px-6',
  paddingLarge: 'px-4 sm:px-6 lg:px-8',
}

export const flex = {
  center: 'flex items-center justify-center',
  between: 'flex items-center justify-between',
  start: 'flex items-start',
  col: 'flex flex-col',
  colCenter: 'flex flex-col items-center',
  wrap: 'flex flex-wrap',
  gap2: 'flex items-center gap-2',
  gap3: 'flex items-center gap-3',
  gap4: 'flex items-center gap-4',
}

// ============================================
// STATUS/STATES
// ============================================
export const states = {
  loading: 'opacity-70 pointer-events-none',
  disabled: 'opacity-50 cursor-not-allowed',
  hidden: 'hidden',
  visible: 'visible',
  invisible: 'invisible',
}

// ============================================
// NY: Gradients för "Calm & Capable"
// ============================================
export const gradients = {
  primary: 'bg-gradient-to-r from-teal-600 to-teal-700',
  hero: 'bg-gradient-to-br from-teal-50 to-stone-50',
  success: 'bg-gradient-to-r from-emerald-500 to-teal-600',
  card: 'bg-gradient-to-b from-white to-stone-50',
}

// ============================================
// NY: Focus states specifika
// ============================================
export const focusStates = {
  primary: 'focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500',
  neutral: 'focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400',
}

export default {
  colors,
  shadows,
  radius,
  spacing,
  animations,
  typography,
  buttonVariants,
  cardVariants,
  inputBase,
  labelBase,
  badgeVariants,
  touch,
  responsive,
  container,
  flex,
  states,
  gradients,
  focusStates,
}
