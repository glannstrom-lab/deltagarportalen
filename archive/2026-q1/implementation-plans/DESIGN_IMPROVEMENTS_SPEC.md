# 🎨 Designförbättringar - Detaljerad Specifikation

## Översikt: Förslag 1, 2, och 6

| # | Förbättring | Ansvarig | Komplexitet | Est. Tid |
|---|-------------|----------|-------------|----------|
| 1 | Harmoniserad färgpalett "Calm & Capable" | Graphic Designer | Medium | 2-3 dagar |
| 2 | Generösare whitespace | Graphic Designer | Låg | 1-2 dagar |
| 6 | Mobil steg-för-steg-wizard | UX Designer | Hög | 5-7 dagar |

---

# 🎨 FÖRSLAG 1: Harmoniserad Färgpalett "Calm & Capable"

## Sammanfattning
Ersätt den nuvarande blandningen av violet/indigo med en konsekvent, lugnande färgpalett som känns mänsklig och inspirerande snarare än företagsmässig.

## Nuvarande problem
```css
/* Befintligt - blandat och inkonsekvent */
--primärgfärg: #7C3AED (violet)
--indigo-används-också: #4F46E5
--slate-kall-grå: #64748B
```

## Ny färgpalett

### Primärfärger
```typescript
// client/src/styles/designTokens.ts

export const colors = {
  primary: {
    50: '#f5f3ff',   // Ljus bakgrund
    100: '#ede9fe',  // Hover-bakgrunder
    200: '#ddd6fe',  // Subtila highlights
    300: '#c4b5fd',  // Ikoner
    400: '#a78bfa',  // Dekorativa element
    500: '#8b5cf6',  // Primärfärg (lila)
    600: '#7c3aed',  // Standard-knappar
    700: '#6d28d9',  // Hover-states
    800: '#5b21b6',  // Aktiva states
    900: '#4c1d95',  // Text på ljusa bakgrunder
  },
  
  // NY: Warm Gray (stone) istället för Slate
  neutral: {
    50: '#fafaf9',   // Bakgrund
    100: '#f5f5f4',  // Kortbakgrund
    200: '#e7e5e4',  // Kanter
    300: '#d6d3d1',  // Avaktiverade kanter
    400: '#a8a29e',  // Platshållartext
    500: '#78716c',  // Sekundär text
    600: '#57534e',  // Brödtext
    700: '#44403c',  // Rubriker
    800: '#292524',  // Stark text
    900: '#1c1917',  // Nästan svart
  },
  
  // Semantiska färger - justerade för bättre kontrast
  success: {
    light: '#d1fae5',
    DEFAULT: '#059669',  // Mörkare för WCAG AA
    dark: '#047857',
  },
  warning: {
    light: '#fef3c7',
    DEFAULT: '#d97706',
    dark: '#b45309',
  },
  error: {
    light: '#fee2e2',
    DEFAULT: '#dc2626',
    dark: '#b91c1c',
  },
  info: {
    light: '#dbeafe',
    DEFAULT: '#2563eb',
    dark: '#1d4ed8',
  },
}
```

### Bakgrunder och överlay
```typescript
export const backgrounds = {
  // Huvudbakgrunder
  page: '#fafaf9',           // Warm gray 50
  card: '#ffffff',           // Vit
  cardHover: '#fafaf9',      // Subtil hover
  
  // Overlay-bakgrunder
  modal: 'rgba(28, 25, 23, 0.5)',  // Neutral-900 med 50% opacity
  tooltip: 'rgba(68, 64, 60, 0.95)', // Neutral-700
  
  // Gradients
  hero: 'linear-gradient(135deg, #f5f3ff 0%, #fafaf9 100%)',
  primaryButton: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
  success: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
}
```

## Implementation

### Steg 1: Uppdatera tailwind.config.js
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primärfärger
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        
        // Neutrala färger (stone istället för slate)
        neutral: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },
    },
  },
}
```

### Steg 2: Uppdatera global CSS
```css
/* client/src/index.css */

:root {
  /* Primärfärger */
  --color-primary-50: #f5f3ff;
  --color-primary-100: #ede9fe;
  --color-primary-500: #8b5cf6;
  --color-primary-600: #7c3aed;
  --color-primary-700: #6d28d9;
  
  /* Neutrala färger (warm stone) */
  --color-neutral-50: #fafaf9;
  --color-neutral-100: #f5f5f4;
  --color-neutral-200: #e7e5e4;
  --color-neutral-400: #a8a29e;
  --color-neutral-500: #78716c;
  --color-neutral-600: #57534e;
  --color-neutral-700: #44403c;
  --color-neutral-800: #292524;
  --color-neutral-900: #1c1917;
  
  /* Semantiska färger */
  --color-success: #059669;
  --color-success-light: #d1fae5;
  --color-warning: #d97706;
  --color-warning-light: #fef3c7;
  --color-error: #dc2626;
  --color-error-light: #fee2e2;
  --color-info: #2563eb;
  --color-info-light: #dbeafe;
  
  /* Bakgrunder */
  --bg-page: var(--color-neutral-50);
  --bg-card: #ffffff;
  --bg-hover: var(--color-neutral-100);
}

/* High contrast mode för tillgänglighet */
@media (prefers-contrast: high) {
  :root {
    --color-primary-600: #5b21b6;
    --color-neutral-600: #1c1917;
    --color-success: #047857;
  }
}
```

### Steg 3: Uppdatera Button-komponenten
```typescript
// client/src/components/ui/Button.tsx

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primärknapp - mer mjuk gradient
        primary: 
          'bg-primary-600 text-white shadow-sm ' +
          'hover:bg-primary-700 hover:shadow ' +
          'active:bg-primary-800',
        
        // Sekundärknapp - warm gray border
        secondary: 
          'bg-white text-neutral-700 border-2 border-neutral-200 ' +
          'hover:bg-neutral-50 hover:border-neutral-300 ' +
          'active:bg-neutral-100',
        
        // Tertiär - ghost style
        tertiary: 
          'bg-transparent text-neutral-600 ' +
          'hover:bg-neutral-100 ' +
          'active:bg-neutral-200',
        
        // Success - emerald
        success: 
          'bg-success text-white ' +
          'hover:bg-success-dark',
        
        // Danger - red
        danger: 
          'bg-error text-white ' +
          'hover:bg-error-dark',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-base',
        lg: 'h-12 px-6 text-base',
        touch: 'h-14 px-6 text-lg',  // För mobil
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)
```

## Kontrast-kontroll (WCAG 2.1 AA)

| Kombination | Kontrast | Status |
|-------------|----------|--------|
| Primary-600 (#7c3aed) på Vit | 5.8:1 | ✅ Pass |
| Neutral-600 (#57534e) på Neutral-50 | 7.2:1 | ✅ Pass |
| Success (#059669) på Vit | 4.6:1 | ✅ Pass |
| Warning (#d97706) på Vit | 3.2:1 | ⚠️ Använd med ikon |
| Error (#dc2626) på Vit | 5.9:1 | ✅ Pass |

## Testning

```typescript
// Test för färgkontrast
// client/src/styles/colors.test.ts

import { colors } from './designTokens'

describe('Color Contrast', () => {
  it('should have sufficient contrast for primary text', () => {
    const contrast = calculateContrast(colors.primary[600], '#ffffff')
    expect(contrast).toBeGreaterThanOrEqual(4.5)
  })
  
  it('should have high contrast for body text', () => {
    const contrast = calculateContrast(colors.neutral[600], colors.neutral[50])
    expect(contrast).toBeGreaterThanOrEqual(4.5)
  })
})
```

---

# 📐 FÖRSLAG 2: Generösare Whitespace

## Sammanfattning
Öka padding, margins och gaps med ~33% för att skapa mer "andrum" och mindre visuell stress för användare med ångest och kronisk smärta.

## Nuvarande problem
```tsx
// För tätt - skapar stress
<div className="p-4 space-y-4">  {/* För komprimerat */}
  <Card className="p-6">        {/* Behöver mer luft */}
    <div className="gap-2">     {/* Element för nära */}
```

## Nytt spacing-system

### Spacing-tokens
```typescript
// client/src/styles/designTokens.ts

export const spacing = {
  // Base unit: 4px
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',   // NY
  6: '24px',
  8: '32px',
  10: '40px',  // NY
  12: '48px',
  16: '64px',
  20: '80px',  // NY
  24: '96px',
}

// Komponent-specifikt spacing
export const componentSpacing = {
  // Cards
  card: {
    padding: 'p-8',           // Var: p-6 (+33%)
    paddingSmall: 'p-6',      // Var: p-4
    gap: 'gap-6',             // Innehållsgap
  },
  
  // Sektioner
  section: {
    padding: 'py-12 px-8',    // Var: py-8 px-6
    gap: 'gap-10',            // Var: gap-6
  },
  
  // Formulär
  form: {
    fieldGap: 'gap-6',        // Var: gap-4
    labelGap: 'mb-3',         // Var: mb-2
    sectionGap: 'gap-10',     // Var: gap-6
  },
  
  // Dashboard
  dashboard: {
    widgetGap: 'gap-8',       // Var: gap-6
    gridGap: 'gap-8',         // Var: gap-4
    padding: 'p-8',           // Var: p-6
  },
}

// "Breathing room" - extra utrymme för visuell vila
export const breathingRoom = {
  small: 'my-4',
  medium: 'my-8',
  large: 'my-12',
  section: 'my-16',
}
```

## Implementation

### Steg 1: Uppdatera Card-komponenten
```tsx
// client/src/components/ui/Card.tsx

const cardVariants = cva(
  'rounded-2xl bg-white border transition-all duration-200',
  {
    variants: {
      size: {
        // Olika storlekar för olika kontexter
        sm: 'p-6',      // Små kort, t.ex. dashboard-widgets
        md: 'p-8',      // Standard-kort (tidigare p-6)
        lg: 'p-10',     // Feature-kort, t.ex. CV-sektioner
        xl: 'p-12',     // Hero-kort, viktiga CTA
      },
      variant: {
        default: 'border-neutral-200 shadow-sm',
        elevated: 'border-neutral-200 shadow-lg',
        flat: 'border-neutral-200',
        ghost: 'border-transparent bg-neutral-50',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
)
```

### Steg 2: Uppdatera DashboardWidget
```tsx
// client/src/components/dashboard/DashboardWidget.tsx

export function DashboardWidget({ 
  title, 
  children, 
  className 
}: DashboardWidgetProps) {
  return (
    <Card 
      size="md"  // p-8 istället för p-6
      className={cn(
        'flex flex-col gap-6',  // Mer luft mellan header och content
        className
      )}
    >
      {/* Header med generösare padding */}
      <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
        <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        {children}
      </div>
    </Card>
  )
}
```

### Steg 3: Uppdatera formulär-layout
```tsx
// Exempel: CV-formulär med mer luft

export function CVSection({ title, children }: CVSectionProps) {
  return (
    <section className="space-y-10">  {/* Var: space-y-6 */}
      {/* Sektionsheader */}
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-neutral-800">
          {title}
        </h2>
        <p className="text-neutral-500 text-lg">
          Fyll i dina uppgifter nedan
        </p>
      </div>
      
      {/* Formulärfält med generösare gap */}
      <div className="space-y-6">  {/* Var: space-y-4 */}
        {children}
      </div>
    </section>
  )
}

// Input-fält med mer label-spacing
export function FormField({ label, children, hint }: FormFieldProps) {
  return (
    <div className="space-y-3">  {/* Var: space-y-2 */}
      <label className="block text-sm font-medium text-neutral-700">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-sm text-neutral-500 mt-2">  {/* Extra margin-top */}
          {hint}
        </p>
      )}
    </div>
  )
}
```

### Steg 4: Sektions-separatorer
```tsx
// NY komponent: SectionDivider

export function SectionDivider({ 
  spacing = 'large',
  showLine = true 
}: SectionDividerProps) {
  const spacingClasses = {
    small: 'my-8',
    medium: 'my-12',
    large: 'my-16',
  }
  
  return (
    <div className={cn(spacingClasses[spacing])}>
      {showLine && (
        <div className="border-t border-neutral-200" />
      )}
    </div>
  )
}

// Användning mellan sektioner
<CVSection>...</CVSection>
<SectionDivider spacing="large" />
<CVSection>...</CVSection>
```

## Före/Efter jämförelse

| Komponent | Före | Efter | Förändring |
|-----------|------|-------|------------|
| Standard Card | `p-6` | `p-8` | +33% |
| Dashboard gap | `gap-4` | `gap-8` | +100% |
| Form field gap | `gap-4` | `gap-6` | +50% |
| Section padding | `py-8` | `py-12` | +50% |
| Label margin | `mb-2` | `mb-3` | +50% |

## Visuell guide

```
FÖRE (Tätt):
┌─────────────────────┐
│┌───────────────────┐│
││Rubrik        ⋮⋮⋮  ││
│├───────────────────┤│
││Innehåll här...    ││
││Mer innehåll       ││
│└───────────────────┘│
│┌───────────────────┐│
││Nästa kort         ││
│└───────────────────┘│
└─────────────────────┘

EFTER (Luftigt):
┌───────────────────────────┐
│                           │
│  ┌─────────────────────┐  │
│  │                     │  │
│  │  Rubrik        ⋮⋮⋮  │  │
│  │                     │  │
│  ├─────────────────────┤  │
│  │                     │  │
│  │  Innehåll här...    │  │
│  │                     │  │
│  │  Mer innehåll       │  │
│  │                     │  │
│  └─────────────────────┘  │
│                           │
│  ┌─────────────────────┐  │
│  │                     │  │
│  │  Nästa kort         │  │
│  │                     │  │
│  └─────────────────────┘  │
│                           │
└───────────────────────────┘
```

---

# 📱 FÖRSLAG 6: Mobil Steg-för-Steg-Wizard

## Sammanfattning
Skapa en fullskärms, steg-för-steg-wizard-upplevelse för mobila formulär (särskilt CV-byggaren) som förenklar inmatning och minskar överväldigande känslor.

## Problem med nuvarande mobil-upplevelse
- För mycket scrollande på små skärmar
- Små klickytor som är svåra att träffa
- Otydligt vilken sektion man är i
- Svårt att spara och återuppta
- Ingen tydlig progress-indikation

## Design-specifikation

### Steg 1: Wizard-komponent
```tsx
// client/src/components/ui/MobileStepWizard.tsx

interface Step {
  id: string
  title: string
  description: string
  component: React.ReactNode
  isOptional: boolean
  estimatedTime: string  // t.ex. "3 min"
}

interface MobileStepWizardProps {
  steps: Step[]
  onComplete: () => void
  onSaveProgress: (currentStep: number, data: any) => void
  title: string
  subtitle?: string
}

export function MobileStepWizard({
  steps,
  onComplete,
  onSaveProgress,
  title,
  subtitle,
}: MobileStepWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  
  const progress = ((currentStep + 1) / steps.length) * 100
  const currentStepData = steps[currentStep]
  
  // Auto-save vid steg-ändring
  useEffect(() => {
    const timer = setTimeout(() => {
      onSaveProgress(currentStep, {})
    }, 1000)
    return () => clearTimeout(timer)
  }, [currentStep])
  
  // Exit-intent hantering
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection('next')
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete()
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection('prev')
      setCurrentStep(prev => prev - 1)
    }
  }
  
  // Swipe-hantering
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
  })
  
  return (
    <div className="fixed inset-0 bg-neutral-50 flex flex-col">
      {/* Header - Sticky */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          {/* Tillbaka-knapp */}
          {currentStep > 0 ? (
            <button
              onClick={handlePrevious}
              className="p-2 -ml-2 rounded-full hover:bg-neutral-100"
              aria-label="Föregående steg"
            >
              <ChevronLeft className="w-6 h-6 text-neutral-600" />
            </button>
          ) : (
            <div className="w-10" />  // Spacer för alignment
          )}
          
          {/* Titel */}
          <div className="text-center">
            <h1 className="text-lg font-semibold text-neutral-800">{title}</h1>
            {subtitle && (
              <p className="text-sm text-neutral-500">{subtitle}</p>
            )}
          </div>
          
          {/* Stäng-knapp med varning */}
          <button
            onClick={() => setShowExitConfirm(true)}
            className="p-2 -mr-2 rounded-full hover:bg-neutral-100"
            aria-label="Stäng"
          >
            <X className="w-6 h-6 text-neutral-600" />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">
              Steg {currentStep + 1} av {steps.length}
            </span>
            <span className="text-neutral-500">
              {currentStepData.estimatedTime}
            </span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </header>
      
      {/* Content - Scrollbar */}
      <main 
        className="flex-1 overflow-y-auto px-6 py-8"
        {...swipeHandlers}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, x: direction === 'next' ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 'next' ? -50 : 50 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Steg-titel */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-neutral-800">
                {currentStepData.title}
              </h2>
              <p className="text-neutral-600 text-lg">
                {currentStepData.description}
              </p>
            </div>
            
            {/* Steg-innehåll */}
            <div className="py-4">
              {currentStepData.component}
            </div>
            
            {/* Optional-badge */}
            {currentStepData.isOptional && (
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Info className="w-4 h-4" />
                <span>Detta steg är valfritt</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Footer - Sticky */}
      <footer className="bg-white border-t border-neutral-200 px-6 py-4 sticky bottom-0 z-10">
        <div className="space-y-3">
          {/* Huvudknapp */}
          <Button
            size="touch"  // h-14 för lättare touch
            className="w-full text-lg"
            onClick={handleNext}
          >
            {currentStep === steps.length - 1 ? 'Slutför' : 'Nästa steg'}
            {currentStep < steps.length - 1 && (
              <ChevronRight className="w-5 h-5 ml-2" />
            )}
          </Button>
          
          {/* Sekundärknappar */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => onSaveProgress(currentStep, {})}
              className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              Spara & fortsätt senare
            </button>
          </div>
          
          {/* Lugnande meddelande */}
          <p className="text-center text-sm text-neutral-400 flex items-center justify-center gap-1">
            <PauseCircle className="w-4 h-4" />
            Det är okej att ta en paus när som helst
          </p>
        </div>
      </footer>
      
      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <ExitConfirmModal
          onConfirm={() => {
            onSaveProgress(currentStep, {})
            // Navigera bort
          }}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  )
}
```

### Steg 2: CV Wizard-konfiguration
```tsx
// client/src/components/cv/CVWizard.tsx

const cvSteps: Step[] = [
  {
    id: 'personal',
    title: 'Dina kontaktuppgifter',
    description: 'Låt oss börja med grundinformation om dig.',
    component: <PersonalInfoForm />,
    isOptional: false,
    estimatedTime: '2 min',
  },
  {
    id: 'experience',
    title: 'Arbetslivserfarenhet',
    description: 'Berätta om dina tidigare jobb och erfarenheter. Det är okej om du har gap - vi hjälper dig förklara dem.',
    component: <ExperienceForm />,
    isOptional: false,
    estimatedTime: '5 min',
  },
  {
    id: 'education',
    title: 'Utbildning',
    description: 'Vad har du studerat? Även kortare kurser räknas!',
    component: <EducationForm />,
    isOptional: false,
    estimatedTime: '3 min',
  },
  {
    id: 'skills',
    title: 'Dina kompetenser',
    description: 'Vad är du bra på? Både hårda och mjuka färdigheter.',
    component: <SkillsForm />,
    isOptional: true,
    estimatedTime: '3 min',
  },
  {
    id: 'summary',
    title: 'Sammanfattning',
    description: 'En kort text om dig som person - vad vill du att arbetsgivaren ska veta?',
    component: <SummaryForm />,
    isOptional: true,
    estimatedTime: '2 min',
  },
]

export function CVWizard() {
  const handleComplete = () => {
    // Visa framgångsmeddelande
    // Navigera till CV-preview
  }
  
  const handleSaveProgress = async (step: number, data: any) => {
    await saveCVProgress({ step, data, timestamp: Date.now() })
    toast.success('Dina ändringar har sparats')
  }
  
  return (
    <MobileStepWizard
      steps={cvSteps}
      title="Bygg ditt CV"
      subtitle="Steg för steg"
      onComplete={handleComplete}
      onSaveProgress={handleSaveProgress}
    />
  )
}
```

### Steg 3: Step-indikator med punkter
```tsx
// Alternativ progress-indikator: Dots

export function StepDots({ 
  total, 
  current, 
  onChange 
}: StepDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange?.(i)}
          disabled={!onChange}
          className={cn(
            'rounded-full transition-all duration-200',
            i === current 
              ? 'w-8 h-2 bg-primary-600'  // Aktiv: längre
              : i < current
                ? 'w-2 h-2 bg-primary-400'  // Slutförd
                : 'w-2 h-2 bg-neutral-300'  // Kommande
          )}
          aria-label={`Steg ${i + 1}`}
          aria-current={i === current ? 'step' : undefined}
        />
      ))}
    </div>
  )
}
```

### Steg 4: Exit-intent modal
```tsx
// client/src/components/ui/ExitConfirmModal.tsx

export function ExitConfirmModal({ onConfirm, onCancel }: ExitConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 max-w-sm w-full space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
            <Save className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-800">
            Spara innan du går?
          </h3>
          <p className="text-neutral-600">
            Din progress sparas automatiskt, men du kan också pausa nu och fortsätta senare.
          </p>
        </div>
        
        <div className="space-y-3">
          <Button onClick={onConfirm} className="w-full">
            Spara & pausa
          </Button>
          <Button variant="secondary" onClick={onCancel} className="w-full">
            Fortsätt arbeta
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
```

## Mobilspecifika interaktioner

### Swipe-gestures
```typescript
// Använd react-swipeable eller liknande
// Svep vänster: Nästa steg
// Svep höger: Föregående steg
// Svep ner: Stäng/spara (valfritt)
```

### Touch-targets
- Alla knappar: Minst 56px höga
- Steg-dots: 44px touch-area (visuellt 8px, men större hit-area)
- Input-fält: Fullbredd med 48px höjd

### Keyboard-navigation
```tsx
// Hantera Enter för att gå till nästa fält
// Tab-navigering inom steget
// Shift+Tab bakåt
// Esc för att öppna exit-confirm
```

## Tillgänglighet

### ARIA-attribut
```tsx
<main
  role="main"
  aria-label={`Steg ${currentStep + 1}: ${currentStepData.title}`}
>
  <progress
    value={currentStep + 1}
    max={steps.length}
    aria-label="Framsteg"
  />
</main>
```

### Screen reader-meddelanden
```tsx
// Använd aria-live för att meddela steg-ändringar
<div aria-live="polite" className="sr-only">
  {`Steg ${currentStep + 1} av ${steps.length}: ${currentStepData.title}`}
</div>
```

### Reduced motion
```tsx
const prefersReducedMotion = usePrefersReducedMotion()

<motion.div
  {...(!prefersReducedMotion && {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
  })}
>
```

## Integration med befintlig kod

```tsx
// I CVPage.tsx - växla mellan desktop och mobil

export function CVPage() {
  const isMobile = useIsMobile()  // Din befintliga hook
  
  if (isMobile) {
    return <CVWizard />  // Ny wizard-komponent
  }
  
  return <CVBuilderDesktop />  // Befintlig desktop-vy
}
```

---

# 📋 Sammanfattning Implementation

## Fas 1: Färgpalett (2-3 dagar)
- [ ] Uppdatera tailwind.config.js
- [ ] Uppdatera designTokens.ts
- [ ] Uppdatera global CSS
- [ ] Uppdatera Button-komponent
- [ ] Uppdatera Card-komponent
- [ ] Testa kontrast
- [ ] Sök-och-ersätt gammala färger i hela appen

## Fas 2: Whitespace (1-2 dagar)
- [ ] Uppdatera Card med nya storlekar
- [ ] Uppdatera Dashboard-widgets
- [ ] Uppdatera formulär-layout
- [ ] Uppdatera sektioner
- [ ] Testa på olika skärmstorlekar

## Fas 3: Mobil Wizard (5-7 dagar)
- [ ] Skapa MobileStepWizard-komponent
- [ ] Implementera swipe-gestures
- [ ] Skapa CVWizard-konfiguration
- [ ] Implementera auto-save
- [ ] Skapa ExitConfirmModal
- [ ] Lägg till ARIA-attribut
- [ ] Testa på riktiga mobiler
- [ ] Användartest med målgruppen

---

*Specifikation skapad av UX Designer & Graphic Designer*
