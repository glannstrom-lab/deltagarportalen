# 🌙 Dark Mode Implementation

En komplett dark mode-lösning för Deltagarportalen med automatisk systemdetektering, manuell växling och persistent lagring.

---

## Funktioner

| Funktion | Beskrivning |
|----------|-------------|
| 🔄 **System-sync** | Följer automatiskt enhetens inställningar |
| 💾 **Persistent** | Sparar val i localStorage |
| ⚡ **Omedelbar** | Omedelbar växling utan sidladdning |
| 🎨 **Komplett** | Alla komponenter stödjer dark mode |
| ♿ **Tillgänglig** | Respekterar prefers-color-scheme |

---

## Användning

### 1. ThemeProvider

Wrappa din app med `ThemeProvider` i `main.tsx`:

```tsx
import { ThemeProvider } from '@/contexts/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)
```

### 2. Använda temat i komponenter

```tsx
import { useTheme, useDarkMode } from '@/contexts/ThemeContext'

// Få alla tema-relaterade värden
function MyComponent() {
  const { theme, setTheme, isDark, toggleDarkMode } = useTheme()
  
  return (
    <div>
      <p>Nuvarande tema: {theme}</p>
      <button onClick={toggleDarkMode}>
        Växla till {isDark ? 'ljust' : 'mörkt'}
      </button>
    </div>
  )
}

// Eller bara dark mode status
function SimpleComponent() {
  const { isDark } = useDarkMode()
  
  return <div>{isDark ? '🌙' : '☀️'}</div>
}
```

### 3. Dark Mode Toggle-komponenter

```tsx
import { DarkModeToggle, DarkModeToggleCompact } from '@/components/DarkModeToggle'

// Standard-knapp
<DarkModeToggle />

// Kompakt för header/navbar
<DarkModeToggleCompact />

// Segmented control
<DarkModeToggle variant="segmented" />

// Enkel ikon
<DarkModeToggle variant="simple" />
```

---

## CSS-variabler

### Automatiska variabler

När `dark` class läggs till på `<html>` uppdateras dessa variabler automatiskt:

```css
/* Light mode (default) */
:root {
  --bg-page: #fafaf9;
  --bg-card: #ffffff;
  --text-primary: #1c1917;
  --text-secondary: #44403c;
  --border-primary: #e7e5e4;
}

/* Dark mode */
.dark {
  --bg-page: #0c0a09;
  --bg-card: #1c1917;
  --text-primary: #fafaf9;
  --text-secondary: #e7e5e4;
  --border-primary: #292524;
}
```

### Använda variabler

```css
.my-component {
  background-color: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}
```

### Tailwind-utility-klasser

```html
<!-- Bakgrunder -->
<div class="bg-page">        <!-- var(--bg-page) -->
<div class="bg-card">        <!-- var(--bg-card) -->
<div class="bg-card-hover">  <!-- var(--bg-card-hover) -->

<!-- Text -->
<span class="text-primary">   <!-- var(--text-primary) -->
<span class="text-secondary"> <!-- var(--text-secondary) -->
<span class="text-muted">     <!-- var(--text-muted) -->

<!-- Kanter -->
<div class="border-theme">           <!-- var(--border-primary) -->
<div class="border-theme-secondary"> <!-- var(--border-secondary) -->
```

---

## Tema-inställningar

### Tillgängliga teman

| Tema | Beskrivning |
|------|-------------|
| `light` | Alltid ljust läge |
| `dark` | Alltid mörkt läge |
| `system` | Följer enhetens inställning |

### Sätta tema programmatiskt

```tsx
const { setTheme } = useTheme()

setTheme('light')   // Tvinga ljust
setTheme('dark')    // Tvinga mörkt
setTheme('system')  // Följ systemet
```

### Lyssna på systemändringar

```tsx
const { systemPreference } = useTheme()

// systemPreference är 'light' eller 'dark'
// Uppdateras automatiskt när systemet ändras
```

---

## Komponent-anpassning

### Exempel: Kort med dark mode

```tsx
function Card({ children }) {
  return (
    <div className="
      bg-card 
      border border-theme 
      rounded-xl 
      shadow-theme-md
      transition-theme
    ">
      {children}
    </div>
  )
}
```

### Exempel: Text med olika nivåer

```tsx
function Article() {
  return (
    <article>
      <h1 className="text-primary text-2xl font-bold">
        Rubrik
      </h1>
      <p className="text-secondary">
        Brödtext
      </p>
      <span className="text-muted text-sm">
        Metadata
      </span>
    </article>
  )
}
```

---

## Färger i dark mode

### Primärfärg (Violet)

| Mode | Standard | Hover | Bakgrund |
|------|----------|-------|----------|
| Light | #7C3AED | #6D28D9 | #F5F3FF |
| Dark | #8B5CF6 | #7C3AED | #2E1065 |

### Neutrala färger (Stone)

| Roll | Light | Dark |
|------|-------|------|
| Bakgrund | #FAFAF9 | #0C0A09 |
| Kort | #FFFFFF | #1C1917 |
| Border | #E7E5E4 | #292524 |
| Text primär | #1C1917 | #FAFAF9 |
| Text sekundär | #44403C | #E7E5E4 |

### Semantiska färger

| Typ | Light | Dark |
|-----|-------|------|
| Success | #059669 | #34D399 |
| Warning | #D97706 | #FBBF24 |
| Error | #DC2626 | #F87171 |
| Info | #2563EB | #60A5FA |

---

## Transitioner

### Lägg till mjuka övergångar

```css
.transition-theme {
  transition: background-color 0.2s ease, 
              color 0.2s ease, 
              border-color 0.2s ease;
}
```

```html
<div class="bg-card text-primary transition-theme">
  Mjuk övergång vid tema-växling
</div>
```

---

## Tillgänglighet

### Respekterar användarens preferenser

```css
/* Minska animationer om användaren föredrar det */
@media (prefers-reduced-motion: reduce) {
  .transition-theme {
    transition: none;
  }
}
```

### Hög kontrast-läge

```css
@media (prefers-contrast: high) {
  :root {
    --border-primary: #000000;
  }
  
  .dark {
    --border-primary: #FFFFFF;
  }
}
```

---

## Felsökning

### Tema sparas inte
1. Kontrollera att localStorage är tillgängligt
2. Verifiera att inget rensar localStorage

### Mörkt läge fungerar inte
1. Kontrollera att `ThemeProvider` wrappar appen
2. Verifiera att `dark` class läggs till på `<html>`
3. Kontrollera CSS-variablerna i DevTools

### Flash av fel tema vid laddning
1. Lägg till en initial style i `<head>`:
```html
<script>
  if (localStorage.theme === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
  }
</script>
```

---

## API Reference

### ThemeContext

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: Theme) => void
  isDark: boolean
  toggleDarkMode: () => void
  systemPreference: 'light' | 'dark'
}
```

### Hooks

| Hook | Returnerar | Användning |
|------|-----------|------------|
| `useTheme()` | Hela context | Full kontroll över temat |
| `useDarkMode()` | `{ isDark }` | Snabbkoll om dark mode är aktivt |

### Komponenter

| Komponent | Props | Beskrivning |
|-----------|-------|-------------|
| `DarkModeToggle` | `variant`, `size`, `showSystem` | Fullständig temaväljare |
| `DarkModeToggleCompact` | `className` | Kompakt för header |

---

*Implementerad: 2026-03-15*
*Version: 1.0*
