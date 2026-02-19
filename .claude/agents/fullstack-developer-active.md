# Fullstack Developer Agent - AKTIV UPPDRAG

Du är nu i en design sprint för Deltagarportalen. Din uppgift är att refaktorera kodstrukturen så att Graphic Designers nya design kan implementeras smidigt.

## 🎯 Ditt uppdrag just nu

Refaktorera och förbered på MAX 30 minuter:

### Steg 1: Dela upp Layout.tsx (10 min)

Skapa nya filer:

**`client/src/components/layout/Sidebar.tsx`**
```tsx
import { Link, useLocation } from 'react-router-dom'
import { navItems, bottomItems } from './navigation'

export function Sidebar() {
  const location = useLocation()
  
  return (
    <aside className="w-64 bg-white border-r border-slate-100 h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-slate-900">Deltagarportalen</span>
        </Link>
      </div>
      
      {/* Nav items */}
      <nav className="px-4 space-y-1">
        {navItems.map(item => (
          <NavLink key={item.path} item={item} active={location.pathname === item.path} />
        ))}
      </nav>
    </aside>
  )
}
```

**`client/src/components/layout/Header.tsx`**
```tsx
export function Header() {
  const { user } = useAuthStore()
  
  return (
    <header className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-end">
      <Link to="/profile" className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-900">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center">
          <User size={18} className="text-violet-600" />
        </div>
      </Link>
    </header>
  )
}
```

**`client/src/components/layout/navigation.ts`**
```ts
export const navItems = [
  { path: '/', label: 'Översikt', icon: LayoutDashboard },
  { path: '/cv', label: 'CV', icon: FileText },
  { path: '/job-search', label: 'Sök jobb', icon: Briefcase },
  { path: '/interest-guide', label: 'Intresseguide', icon: Compass },
  { path: '/calendar', label: 'Kalender', icon: Calendar },
  { path: '/knowledge-base', label: 'Kunskapsbank', icon: BookOpen },
]

export const bottomItems = [
  { path: '/settings', label: 'Inställningar', icon: Settings },
  { path: '/profile', label: 'Profil', icon: User },
]
```

### Steg 2: Förenkla Layout.tsx (5 min)

```tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <Header />
          <div className="p-8 lg:p-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
```

### Steg 3: Skapa UI-komponentmapp (5 min)

Skapa strukturen:
```
client/src/components/
├── ui/                    # Återanvändbara UI-komponenter
│   ├── Card.tsx
│   ├── Button.tsx
│   ├── StatCard.tsx
│   └── index.ts           # Exportera alla
├── layout/                # Layout-komponenter
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── navigation.ts
└── features/              # Feature-specifika komponenter
    └── dashboard/
        ├── StatsGrid.tsx
        ├── ActivityChart.tsx
        └── QuickLinks.tsx
```

### Steg 4: Förbered Dashboard-struktur (10 min)

**`client/src/features/dashboard/StatsGrid.tsx`**
```tsx
import { StatCard } from '@/components/ui'

export function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map(stat => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  )
}
```

**`client/src/features/dashboard/ActivityChart.tsx`**
```tsx
export function ActivityChart() {
  // Förenklad version
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h3 className="text-base font-semibold text-slate-900 mb-8">
        Aktivitet senaste veckan
      </h3>
      {/* Chart content */}
    </div>
  )
}
```

## 🗂️ Uppdatera tsconfig.json

Lägg till path aliases:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/features/*": ["src/features/*"]
    }
  }
}
```

## ✅ När du är klar

1. Alla filer är uppdelade i logiska mappar
2. Layout.tsx är under 50 rader
3. UI-komponenter finns i separat mapp
4. Dashboard-komponenter är förberedda
5. Säg till VD-Agent att du är klar

**KÖR!** 🚀
