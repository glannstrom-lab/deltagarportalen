# 🚀 Supabase Migreringsplan

> **Uppdrag:** Migrera hela backend från PHP + dubbla system till enhetlig Supabase-arkitektur
> **Deadline:** 4 veckor
> **Prioritet:** Kritisk (säkerhetsrisker i nuvarande PHP-backend)

---

## 📊 Nuvarande Läge

### ✅ Supabase Redan På Plats
- [x] Databasschema (PostgreSQL)
- [x] RLS-policies (säkerhet på radnivå)
- [x] Edge Functions (AI + Arbetsförmedlingen)
- [x] Storage buckets (CV-filer, profilbilder)
- [x] Auth-triggers (auto-skapande av profiler)

### ❌ PHP-Backend som Ska Bort
- [ ] `php-backend/api/index.php` - Alla API-endpoints
- [ ] `php-backend/lib/Auth.php` - JWT-hantering (osäker!)
- [ ] `php-backend/lib/Database.php` - SQLite-wrapper
- [ ] Dubbel auth-logik (Supabase + PHP + Zustand)

---

## 🗓️ Veckovis Plan

### Vecka 1: Auth & API-Standardisering
**Mål:** Enhetlig autentisering, inga säkerhetsluckor

#### Dag 1-2: Auth-refaktorering
```typescript
// NU: Tre lager av auth (Supabase + PHP + Zustand)
// SKA: Endast Supabase Auth med Zustand för state

TASKS:
□ Uppdatera authStore.ts - använd endast Supabase
□ Ta bort alla PHP-auth-referenser
□ Implementera proper session-hantering
□ Lägg till auth-refresh logic
```

#### Dag 3-4: API-service refaktorering
```typescript
// NU: apiRequest-adapter som mappar gamla endpoints
// SKA: Direkta Supabase-anrop

TASKS:
□ Uppdatera supabaseApi.ts med alla funktioner
□ Ta bort apiRequest-adapter
□ Standardisera felhantering
□ Lägg till retry-logik
```

#### Dag 5: Säkerhetsgranskning
```
TASKS:
□ Verifiera alla RLS-policies fungerar
□ Testa att konsulenter ser sina deltagare
□ Testa att användare inte ser andras data
□ Granska CORS-inställningar
```

---

### Vecka 2: Feature-komplettering
**Mål:** Alla features från PHP finns i Supabase

#### Dag 1-2: CV-funktionalitet
```sql
-- Kontrollera att alla CV-features finns:
□ Versionhantering (cv_versions tabell) ✅
□ Delning av CV (cv_shares tabell) ✅
□ ATS-analys (cv_analyses tabell) ✅
```

#### Dag 3-4: Jobb & Ansökningar
```typescript
TASKS:
□ Migrera saved_jobs till Supabase ✅
□ Lägg till applications-status tracking
□ Integrera Arbetsförmedlingen (Edge Functions) ✅
□ Testa jobb-sparning och uppdatering
```

#### Dag 5: Intresseguide & Brev
```typescript
TASKS:
□ Verifiera interest_results sparas korrekt ✅
□ Testa cover_letters CRUD ✅
□ AI-generering av brev (Edge Function) ✅
```

---

### Vecka 3: Frontend-uppdateringar
**Mål:** Frontend använder endast Supabase

#### Dag 1-2: Komponent-uppdateringar
```typescript
// PAGES att uppdatera:
□ Login.tsx - Ta bort demo-login med PHP
□ Register.tsx - Använd Supabase auth direkt
□ CVBuilder.tsx - Uppdatera API-anrop
□ JobSearch.tsx - Uppdatera till Edge Functions
```

#### Dag 3-4: Städning
```
TASKS:
□ Ta bort mockApi.ts
□ Ta bort alla console.log
□ Uppdatera imports
□ Fixa TypeScript "any"-typer
```

#### Dag 5: Prestanda-optimering
```typescript
TASKS:
□ Implementera React Query caching
□ Lägg till optimistic updates
□ Implementera lazy loading
□ Optimistic UI för bättre upplevelse
```

---

### Vecka 4: Avveckling & Testning
**Mål:** PHP-backend borta, allt testat

#### Dag 1-2: Ta bort PHP-backend
```
TASKS:
□ Flytta php-backend/ till archive/
□ Uppdatera dokumentation
□ Ta bort PHP-referenser från package.json
□ Uppdatera deployment-scripts
```

#### Dag 3-4: Testing
```
TASKS:
□ Manuell test av alla flöden
□ Edge case-testning
□ Konsulent-flöde testning
□ Mobil-testning
```

#### Dag 5: Deployment
```
TASKS:
□ Deploy Edge Functions
□ Uppdatera miljövariabler
□ Production-test
□ Rollback-plan
```

---

## 🔧 Konkreta Implementationer

### 1. Auth Store - Refaktorering

```typescript
// client/src/stores/authStore.ts (NY)
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
}

// Ingen PHP, ingen lokal JWT, endast Supabase!
```

### 2. API-service - Standardisering

```typescript
// client/src/services/api.ts (NY)
// Endast exportera Supabase-funktioner
export {
  authApi,
  cvApi,
  interestApi,
  coverLetterApi,
  articleApi,
  jobsApi,
  userApi,
  activityApi,
  savedJobsApi
} from './supabaseApi'

// INGEN apiRequest-adapter!
// INGEN mockApi!
```

### 3. Edge Functions - Förstärkning

```typescript
// supabase/functions/invite-participant/index.ts (NY)
// Ersätter InviteParticipantDialog TODO

// supabase/functions/cv-pdf-export/index.ts (NY)
// Ersätter CVWidget TODO för PDF-download
```

---

## ⚠️ Risker & Mitigering

| Risk | Sannolikhet | Impact | Mitigering |
|------|-------------|--------|------------|
| Dataförlust vid migrering | Låg | Kritisk | Backup före migrering, test i staging |
| Auth-flöde slutar fungera | Medel | Kritisk | Parallella system under övergång |
| Edge Functions timeout | Låg | Medel | Optimera queries, lägg till caching |
| RLS-policy felkonfigurerad | Låg | Kritisk | Extensiv testning av behörigheter |

---

## ✅ Checklista - Innan Deploy

- [ ] Alla PHP-endpoints har ersatts
- [ ] Inga hardkodade secrets
- [ ] Alla RLS-policies testade
- [ ] Auth fungerar i alla scenarier
- [ ] Konsulent-flöde testat
- [ ] Mobil-app testad
- [ ] Rollback-plan dokumenterad
- [ ] Teamet utbildad i ny arkitektur

---

## 📈 Framgångsmått

| Mått | Nu | Mål |
|------|-----|-----|
| Antal backend-system | 3 (Supabase+PHP+AI) | 1 (Supabase) |
| Säkerhetsvarningar | 3 kritiska | 0 |
| Deploy-komplexitet | Hög (multi-repo) | Låg (single platform) |
| API response time | ~300ms | <200ms |
| Kodduplicering | Hög | Låg |

---

*Migrering påbörjad: 2026-03-01*
*Beräknat färdigt: 2026-03-29*
