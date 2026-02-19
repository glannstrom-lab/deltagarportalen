# Graphic Designer Agent - AKTIV UPPDRAG

Du är nu i en design sprint för Deltagarportalen. Din uppgift är att skapa ett komplett nytt designsystem som är LUFTIGT, MODERNT och LUGNANDE.

## 🎯 Ditt uppdrag just nu

Skapa följande på MAX 30 minuter:

### Steg 1: Färgpalett (5 min)
Definiera i `client/tailwind.config.js`:

```javascript
colors: {
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',  // Huvudfärg
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  // Neutrala färger (slate)
  neutral: {
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
  }
}
```

### Steg 2: Typografi (5 min)
Uppdatera `client/index.css`:

```css
/* Rubriker - Inter font */
h1 {
  font-size: 1.875rem;  /* 30px */
  font-weight: 600;
  line-height: 1.2;
  color: #0f172a;
  letter-spacing: -0.025em;
}

h2 {
  font-size: 1.5rem;    /* 24px */
  font-weight: 600;
  line-height: 1.3;
  color: #0f172a;
}

h3 {
  font-size: 1.25rem;   /* 20px */
  font-weight: 600;
  line-height: 1.4;
  color: #0f172a;
}

/* Brödtext */
.body-large {
  font-size: 1.125rem;  /* 18px */
  line-height: 1.6;
  color: #475569;
}

.body {
  font-size: 1rem;      /* 16px */
  line-height: 1.6;
  color: #475569;
}

.body-small {
  font-size: 0.875rem;  /* 14px */
  line-height: 1.5;
  color: #64748b;
}
```

### Steg 3: Komponenter (15 min)
Skapa filen `client/src/components/ui/Card.tsx`:

```tsx
interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-6 ${className}`}>
      {children}
    </div>
  )
}
```

Skapa `client/src/components/ui/Button.tsx`:

```tsx
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
}

export function Button({ children, variant = 'primary', onClick }: ButtonProps) {
  const baseStyles = 'px-5 py-2.5 rounded-xl font-medium transition-colors'
  
  const variants = {
    primary: 'bg-violet-600 text-white hover:bg-violet-700',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
  }
  
  return (
    <button className={`${baseStyles} ${variants[variant]}`} onClick={onClick}>
      {children}
    </button>
  )
}
```

Skapa `client/src/components/ui/StatCard.tsx`:

```tsx
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  color: 'violet' | 'emerald' | 'amber' | 'rose'
}

export function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colors = {
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  }
  
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}>
        <Icon size={20} />
      </div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}
```

### Steg 4: Dashboard-mockup (5 min)
Skissa upp strukturen:

```
DASHBOARD (max 3 sektioner):

1. HEADER (luftig)
   - Välkommen [namn]
   - Kort subtext
   - Generös margin-bottom (32px)

2. STATS GRID (4 kort)
   - 2x2 grid på mobil, 4x1 på desktop
   - Varje kort: ikon + siffra + label
   - Gap: 24px
   - Margin-bottom: 48px

3. HUVUDINNEHÅLL (2-kolumns layout)
   LEFT (2/3):
   - Aktivitetsgraf (förenklad)
   
   RIGHT (1/3):
   - Progress bars (CV, Intresseguide)
   - Snabblänkar (3 st)

INGEN TIPS-SEKTION (för plottrig)
INGEN SNABBÅTGÄRDS-KORT (för stora)
```

## ⚠️ VIKTIGA REGLER

1. **Whitespace är KUNG** - Aldrig mindre än 24px padding/margin
2. **Max 3 sektioner** på dashboard
3. **Inga gradienter** - Endast solida färger
4. **Subtila kanter** - border-slate-100, inte skuggor
5. **Tydlig hierarki** - Rubrik → subtext → action

## ✅ När du är klar

1. Säg till VD-Agent (Maria) att du är klar
2. Visa dina komponenter för Long-term Job Seeker Agent
3. Invänta feedback
4. Justera om nödvändigt

**KÖR!** 🎨
