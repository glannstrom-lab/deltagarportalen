# Claude Code Guidelines för Deltagarportalen

## Felsökning - Lärdomar

### 2026-04-09: White Screen på Landing Page

**Problem:** Startsidan (jobin.se) visade bara vit skärm för utloggade användare.

**Rotorsak:** I `client/src/pages/Landing.tsx` låg `console.log()` FÖRE `import`-satserna:

```typescript
// FEL - Ogiltig ES-modulsyntax
console.log('[DEBUG] 9. Landing.tsx module loaded')

import { Link } from 'react-router-dom'  // Imports måste komma först!
```

**Varför det missades:** Istället för att läsa koden direkt lades mer debug-kod till, olika teorier testades, och omvägar gjordes. Felet hade upptäckts på sekunder om koden lästs ordentligt från början.

**Lösning:** Flytta all kod efter imports. Ta bort oanvända imports.

**Lärdom:**
> **LÄS ALLTID KODEN FÖRST.** Vid felsökning, börja med att noggrant läsa de relevanta filerna innan du lägger till debug-kod eller testar teorier. Grundläggande syntaxfel upptäcks snabbt genom att faktiskt titta på koden.

---

## Felsökningsprotokoll

När något inte fungerar, följ denna ordning:

1. **Läs koden** - Öppna och läs de relevanta filerna noggrant
2. **Kontrollera syntax** - Imports, exports, parenteser, semikolon
3. **Kör TypeScript-kompilering** - `npm run build` visar typfel
4. **Kolla webbläsarkonsolen** - Faktiska runtime-fel
5. **Lägg till debug-kod** - Endast om ovanstående inte hittar problemet

---

### 2026-04-09: Sidor laddade Dashboard istället

**Problem:** Flera sidor (Journey, Spontanansökan, PersonalBrand, etc.) visade Dashboard istället för rätt innehåll.

**Rotorsak:** Sidorna var importerade i `App.tsx` men saknade routes. Catch-all routen (`path="*"`) fångade upp dem och visade Dashboard.

**Vad som saknades:**
```typescript
// Dessa imports fanns...
const Journey = lazy(() => import('./pages/Journey'))
const Spontaneous = lazy(() => import('./pages/Spontaneous'))

// ...men routes saknades i <Routes>:
<Route path="journey" element={...} />
<Route path="spontanansökan" element={...} />
```

**Kontroll att göra vid nya sidor:**
1. Jämför `navigation.ts` paths med `App.tsx` routes
2. Sök efter alla `to="/..."` länkar och verifiera att routes finns
3. Kör: `grep -oh 'path: .*/.*' navigation.ts | sort` och jämför med routes

---

## Projektstruktur

- `client/` - React frontend (Vite, TypeScript, Tailwind)
- `server/` - Express backend
- `supabase/` - Databasmigrationer

## Teknikstack

- React 18 med TypeScript
- Vite som bundler
- Supabase för auth och databas
- Tailwind CSS för styling
- i18next för översättningar
- Zustand för state management
