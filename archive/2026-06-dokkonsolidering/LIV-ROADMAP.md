# Liv-roadmap — Gör portalen mer levande

**Syfte:** Lyfta portalen från "kompetent men platt" till "levande och medveten om
användaren" — utan att bryta mot DESIGN.md (lugn-vän-ton, ingen gradient,
en-färg-per-sida, motion §11). Detta är umbrella-dokumentet. Track A:s
bildpipeline och promptstandard lever kvar i [`GRAFIK-PLAN.md`](./GRAFIK-PLAN.md).

**Status:** Levande dokument. Skapad 2026-06-04. Uppdateras per fas.

---

## 1. Princip — fyra spår, samma ton

"Levande" får aldrig betyda "stökig". För NPF-/utmattningsmålgruppen är lugn en
funktionskrav, inte en stilpreferens. Allt nedan ska kännas som en vän som rör
sig stilla i rummet — inte en app som vill ha uppmärksamhet.

| Spår | Vad | Hård gräns |
|------|-----|-----------|
| **A — Illustration** | Bredare bildtäckning på text/tabell-tunga sidor | Dekorativt, `aria-hidden`, en hub-färg per sida (GRAFIK-PLAN §1) |
| **B — Motion** | Regisserad, syftesdriven rörelse | DESIGN.md §11: 3 tids-tokens, max 600 ms, inget autoplay, `prefers-reduced-motion` = 0.01 ms |
| **C — Personalisering** | Sidan känns medveten om vem som tittar | Lugn-vän-ton, förnamn när det finns, aldrig pratig (DESIGN.md §2) |
| **D — Glädje** | Positiv förstärkning i slutför-ögonblick | Firande EN gång, dismissbar, reduced-motion-safe, inga prestationssiffror i hjälteposition |

---

## 2. Nuläge (vad som redan ger liv)

| Element | Status |
|---------|--------|
| Illustrationer: hero (5), tomtillstånd (5), framgång (3), onboarding (1), editorial-banners (12 kat.) | ✅ GRAFIK-PLAN Fas 1–3 |
| `EmptyState` med `illustration`-prop på 7 sidor | ✅ |
| `framer-motion` i 34 filer | ⚠️ Brett men oregisserat — ingen gemensam standard |
| `AnimatedSection` (layout) | ✅ Finns att bygga vidare på |
| `JourneyCelebration`, `BadgeSystem` (gamification) | ✅ Finns att bygga vidare på |
| Tid-på-dygnet-hälsning / dynamisk hero-subtitel | ❌ Saknas |

---

## 3. Faser

Ordnade efter effekt/insats. Fas 1–2 är quick wins på befintlig infra; Fas 3–5
kräver nytt arbete. Batch-arbetssättet från GRAFIK-PLAN §4 gäller: **jag skriver
prompter, du genererar bilder, jag kör pipeline + kopplar in + verifierar i en
deploy per fas.**

---

### Fas 1 — Stäng illustrationsgapen (Track A, quick win) ✅ KLAR (2026-06-04)

**Mål:** Inga ikon-baserade page-level tomtillstånd kvar i deltagarvyer.
Återanvände befintliga bas-spots — inga nya bilder krävdes.

- `Education.tsx` (ikon `GraduationCap`) → `illustration="karriar"` ✅
- `CoverLetterApplications.tsx` (ikon `Send`) → `illustration="jobb"` ✅
- `CoverLetterMyLetters.tsx` (ikon `FileText`) → `illustration="jobb"` ✅
- `MatchesTab.tsx` lokal `EmptyState` (`no-data`-grenen) → `empty-jobb`-illustration ✅
- Kunskapsbank `job-search`: lämnad utan banner — ingen sky-spot finns och
  persika `empty-jobb` skulle bryta en-färg-per-sida.

**DoD:** ✅ 0 ikon-only page-level tomtillstånd i deltagarvyer. `tsc --noEmit` + build grönt.

---

### Fas 2 — Regisserad motion (Track B) ✅ KLAR (2026-06-04)

**Upptäckt vid start:** tre av fyra mönster fanns redan som CSS-utilities i
`index.css` — `.page-transition`/`pageEnter` (route enter, redan på i
`PageLayout`), `.card-lift`/`.card-interactive` (hover-liv), `.skeleton-shimmer`.
Den globala `prefers-reduced-motion`-regeln (index.css rad ~321) kollapsar redan
all CSS-animation/-transition till 0.01 ms. **Det enda verkliga gapet var en
stagger-primitiv för listor/grids.**

Gjort:
1. **`<MotionList>`** (`components/ui/MotionList.tsx`) — wrappar varje barn i
   `.stagger-item` (fadeInUp 0.3 s, delay `index*40ms`, capad vid 8). CSS-baserad
   → auto-compliant med reduced-motion (ingen framer-motion). ✅
2. **`.stagger-item`** CSS-utility i `index.css` + delay-nollning under
   reduced-motion. ✅
3. Applicerad på **KnowledgeBank Ämnen-grid** (`TopicsTab`) och **Sparade
   jobb-grid** (`JobSearch`). ✅
4. Test `MotionList.test.tsx` (stagger-index, cap, ingen framer-motion). ✅

**Audit (klar):** ingen av autoplay-loop-klasserna (`animate-float`,
`pulse-soft`, `glow`, `bounce-subtle`, `shimmer`) används i någon `.tsx` — de är
död CSS. DESIGN.md §10 bryts alltså inte i faktiskt UI. ✅ (Städa bort de döda
keyframesen vid tillfälle, kosmetiskt.)

**Vägval Översikt:** dashboarden animerar redan via framer-motion. Att lägga
`MotionList` ovanpå skulle dubbel-animera → medvetet utelämnad. Stagger tillförs
bara på ytor som saknade rörelse.

Valfri vidare utrullning (samma en-rads-swap där ett grid saknar rörelse):
Applications-listan, `MyCompaniesTab`, Education-listan.

**DoD:** ✅ Stagger-primitiv byggd, reduced-motion-säker, testtäckt och
applicerad på 2 tidigare orörliga listytor; autoplay-audit ren; reduced-motion-
test grönt.

---

### Fas 3 — Editorial spots i text-tunga verktygssidor (Track A)

**Mål:** Bryt textmassor/tabeller i verktygssidor med ett lugnt sektionsankare
överst — samma mönster som Kunskapsbankens kategori-banners. Verktygssidans
neutrala header rörs INTE (DESIGN.md §3); ankaret ligger i innehållet, i sidans
hub-färg.

Kräver **nya bilder** (prompter i §4). Per hub-färg:

| Sida/tab | Hub-färg | Filnamn |
|----------|----------|---------|
| SkillsGap (kompetensgap) | rosa `#B85363` | `spot-kompetens.png` |
| PersonalBrand | rosa `#B85363` | `spot-varumarke.png` |
| Salary (lön) | persika `#A85D24` | `spot-lon.png` |
| International (utomlands) | persika `#A85D24` | `spot-internationellt.png` |
| Diary (dagbok) | lavendel `#7058A8` | `spot-dagbok.png` |
| Profile (profil) | lavendel `#7058A8` | `spot-profil.png` |

**DoD:** varje sida ovan har ett sektionsankare i rätt hub-färg, `aria-hidden`.

---

### Fas 4 — Personalisering & dynamik (Track C)

**Mål:** Sidan känns medveten om användaren utan att bli pratig.

- **Tid-på-dygnet-hälsning** på Översikt-hero: "God morgon, Anna" / "God kväll,
  Anna" (förnamn när det finns, annars neutral lugn hälsning).
- **Dynamisk hero-subtitel** på hub-landningar: en lugn mening kopplad till nästa
  steg eller senaste aktivitet ("Du var nästan klar med ditt CV").
- **Ny vs återvändande** användare: olika copy i hero + dashboard (bygg på
  befintlig onboarding-state, ingen ny modal).
- **Säsong/subtila toner** (valfritt, flaggat): mycket diskret — t.ex. en
  illustrationsvariant. Risk mot lugn ton — bara om det känns rätt.

**DoD:** Översikt + hub-landningar visar förnamn och en kontextuell mening;
ingen text känns generisk eller administrativ.

---

### Fas 5 — Glädje i nyckelögonblick (Track D)

**Mål:** Bekräfta framsteg lugnt i fler slutför-flöden. Bygg på
`JourneyCelebration` + befintliga `success-*`-spots.

- CV klart → `success-cv` (success-vy finns redan, fa7e33a) ✅ ev. förfina
- Ansökan skickad → `success-ansokan`
- Övning/kurs klar → `success-klart`
- Milstolpe nådd (career PlanTab) → lugnt firande + badge
- Konfetti EN gång, dismissbar, reduced-motion-safe (ingen partikel-loop).

**DoD:** minst 4 slutför-flöden har ett lugnt firande som återanvänder
success-spots; inget firande triggar automatiskt på sidladdning.

---

### Fas 6 — Polish (valfritt)

- Ikonografi-konsistens (en familj), diskreta sektionsheader-accenter.
- Mikrocopy-svep mot DESIGN.md §2 på de sidor som missades.

---

## 4. Promptlista — nya bilder för Fas 3

Samma standard som GRAFIK-PLAN §3: solid magenta `#FF00FF` som bakgrund
(chroma-key), flat vänlig vektorstil, inga gradienter/skuggor/3D, hub-färgen som
huvudfärg, inkluderande figurer. Kvadrat 1024×1024. Spara i
`design-source/illustrations-raw/`.

**`spot-kompetens.png`** (rosa `#B85363`)
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: några pusselbitar som passar ihop bredvid en liten stege, symboliserar kompetenser som byggs upp. Motivets huvudfärg är korall-rosa #B85363, med vitt och neutralt för små detaljer.
```

**`spot-varumarke.png`** (rosa `#B85363`)
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: en liten rosett/medalj tillsammans med en stjärna, symboliserar personligt varumärke. Motivets huvudfärg är korall-rosa #B85363, med vitt och neutralt för små detaljer.
```

**`spot-lon.png`** (persika `#A85D24`)
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: två händer som skakar hand med ett litet mynt bredvid, symboliserar löneförhandling. Motivets huvudfärg är persika-orange #A85D24, med vitt och neutralt för små detaljer.
```

**`spot-internationellt.png`** (persika `#A85D24`)
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: en enkel jordglob med en liten flygplansbåge runt, symboliserar att jobba utomlands. Motivets huvudfärg är persika-orange #A85D24, med vitt och neutralt för små detaljer.
```

**`spot-dagbok.png`** (lavendel `#7058A8`)
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: en öppen dagbok med en penna och ett litet hjärta, symboliserar reflektion. Motivets huvudfärg är lavendel-lila #7058A8, med vitt och neutralt för små detaljer.
```

**`spot-profil.png`** (lavendel `#7058A8`)
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: ett enkelt profilkort med en personsiluett och en liten bock, symboliserar en ifylld profil. Motivets huvudfärg är lavendel-lila #7058A8, med vitt och neutralt för små detaljer.
```

---

## 5. Att börja med nu

**Fas 1 + 2 är klara.** Nästa steg är **Fas 3 (editorial spots i verktygssidor)** —
generera de **6 spotsen i §4** så kör jag pipeline + inkoppling. Fas 4
(personalisering) och Fas 5 (glädje) kräver inga bilder och kan tas när som helst.
