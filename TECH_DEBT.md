# Teknisk Skuld – Deltagarportalen
**Senast uppdaterad:** 2026-03-04

---

## 🔴 Kritisk (P0)

### 1. RLS-policyer saknas för flera tabeller
**Beskrivning:** Row Level Security är inte konfigurerat för:
- `article_reading_progress`
- `article_checklists`
- `user_activities`

**Konsekvens:** Användare får 403/42501-fel, data sparas inte.

**Lösning:**
```sql
-- För article_reading_progress
ALTER TABLE article_reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own reading progress"
ON article_reading_progress
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

---

### 2. Inkonsekvent datastruktur för tags
**Beskrivning:** Tags sparas ibland som `string[]` (mock-data), ibland som `string` (DB).

**Konsekvens:** Runtime-fel: "tags.split is not a function"

**Lösning:**
```sql
-- Migrera alla tags till array
UPDATE articles 
SET tags = string_to_array(tags, ',') 
WHERE tags IS NOT NULL AND tags NOT LIKE '[%';
```

**Frontend:** Uppdatera interface till `tags: string[]`

---

### 3. Ingen global error boundary
**Beskrivning:** React-krascher tar ner hela appen.

**Konsekvens:** Vit skärm för användaren.

**Lösning:** Implementera ErrorBoundary med fallback UI.

---

## 🟡 Hög (P1)

### 4. Saknar caching-strategi
**Beskrivning:** All data laddas från server varje gång.

**Konsekvens:** Långsamma laddningstider, onödig bandbredd.

**Lösning:**
- Implementera React Query
- Cache artiklar i localStorage
- Stale-while-revalidate mönster

---

### 5. Ingen offline-first strategi
**Beskrivning:** Appen fungerar ej utan internet.

**Konsekvens:** Användare tappar data vid avbrott.

**Lösning:**
- Service Worker med Workbox
- IndexedDB för offline-lagring
- Sync när uppkoppling återställs

---

### 6. Bundle size kan optimeras
**Beskrivning:** All kod laddas i en bundle.

**Konsekvens:** Lång initial laddning.

**Lösning:**
- Code splitting per route
- Lazy loading av komponenter
- Tree shaking av oanvänd kod

---

## 🟢 Medium (P2)

### 7. Inkonsekvent felhantering
**Beskrivning:** Vissa fel loggas, vissa kastas, vissa ignoreras.

**Lösning:** Standardisera felhantering med hjälpare:
```typescript
// Förslag: utils/errorHandling.ts
export function handleApiError(error: unknown): AppError {
  // Standardiserad felhantering
}
```

---

### 8. Testtäckning är låg
**Beskrivning:** Få enhetstester, inga E2E-tester.

**Lösning:**
- Jest för enhetstester
- Playwright för E2E
- Minst 70% täckning

---

### 9. Saknar CI/CD-pipeline
**Beskrivning:** Manuell deployment.

**Lösning:** GitHub Actions för:
- Automatiska tester
- Bygg och deploy
- Databasmigreringar

---

## 🔵 Låg (P3)

### 10. Legacy-kod i PHP/backend
**Beskrivning:** Gamla API-anrop finns kvar.

**Lösning:** Rensa bort allt som inte används.

---

### 11. Inkonsekvent styling
**Beskrivning:** Blandar Tailwind, custom CSS, inline styles.

**Lösning:**
- Standardisera på Tailwind
- Design system med komponenter
- CSS-variabler för teman

---

## 📊 Sammanfattning

| Kategori | Antal | Estimerad tid |
|----------|-------|---------------|
| Kritisk (P0) | 3 | 1 vecka |
| Hög (P1) | 3 | 2 veckor |
| Medium (P2) | 3 | 2 veckor |
| Låg (P3) | 2 | 1 vecka |

**Total:** ~6 veckor för att eliminera all teknisk skuld.

**Rekommendation:** Fokusera på P0 och P1 först (3 veckor), sedan löpande P2/P3.
