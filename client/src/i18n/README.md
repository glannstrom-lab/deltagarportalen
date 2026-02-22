# 🌐 i18n - Internationalisering för Deltagarportalen

Denna mapp innehåller språkresurser för Deltagarportalen med fokus på **icke-skuldbeläggande, stödjande språk**.

## 📁 Struktur

```
i18n/
├── sv.ts           # Svenska texter (huvudsaklig fil)
└── README.md       # Denna fil
```

## 🎯 Filosofi: Icke-skuldbeläggande språk

Alla texter är skrivna enligt riktlinjerna från Advisory Board:

### Transformeringar

| Skuldbeläggande | Stödjande |
|-----------------|-----------|
| "Du måste..." | "Du kan välja att..." |
| "Det är obligatoriskt" | "Detta hjälper dig att..." |
| "Du har inte slutfört..." | "Du är på väg med..." |
| "Felaktig inmatning" | "Kan du dubbelkolla detta?" |
| "Krävs" | "Rekommenderas för bästa resultat" |
| "Inkomplett" | "Påbörjad" |
| "Du är inte klar" | "Du har kommit igång!" |

## 📖 Användning

### Importera texter

```typescript
import { sv } from '../i18n/sv';

// Använd felmeddelanden
const errorText = sv.errorMessages.invalidPassword;

// Använd dynamiska meddelanden
const emptyFieldText = sv.errorMessages.emptyField('din e-post');
```

### Använda SupportiveLanguage-komponenten

```tsx
import { SupportiveLanguage, EnergyMessage, ProgressMessage } from '../components/SupportiveLanguage';

// Grundläggande användning
<SupportiveLanguage
  type="greeting"
  userName="Anna"
/>

// Energibaserat meddelande
<EnergyMessage
  energyLevel="low"
  onTakeBreak={() => setShowBreakModal(true)}
/>

// Framstegsmeddelande
<ProgressMessage
  progressPercent={65}
/>

// Vid stress
<SupportiveLanguage
  type="encouragement"
  emotionalState="stressed"
  onTakeBreak={handleBreak}
/>
```

### Använda hooks

```tsx
import { useSupportiveMessage, useSupportiveTransform } from '../components/SupportiveLanguage';

// Få ett anpassat meddelande
const message = useSupportiveMessage('energy', { energyLevel: 'low' });

// Transformera skuldbeläggande text
const supportiveText = useSupportiveTransform('Du måste fylla i detta');
// Resultat: "Du kan välja att fylla i detta"
```

## 📚 Tillgängliga meddelandetyper

### `sv.errorMessages`
Omskrivna felmeddelanden som är förstående istället för anklagande.

### `sv.energyMessages`
Anpassade meddelanden baserat på användarens energinivå:
- `high` - Mycket energi
- `medium` - Normal energi  
- `low` - Låg energi
- `veryLow` - Mycket låg energi
- `exhausted` - Utmattad

### `sv.emotionalSupport`
Stödmeddelanden för olika emotionella tillstånd:
- `stressed` - Stressad
- `anxious` - Oroande
- `frustrated` - Frustrerad
- `tired` - Trött
- `proud` - Stolt
- `confident` - Självförsäkrad

### `sv.progressMessages`
Uppmuntrande meddelanden baserat på framsteg:
- Procentbaserade (0%, 20%, 50%, 80%, 100%)
- Statusbaserade
- Nästa steg

### `sv.normalizingMessages`
Texter som normaliserar svårigheter:
- Arbetslöshet
- Jobbsökande
- CV-skrivande
- Personlig utveckling

### `sv.encouragementPhrases`
Uppmuntrande fraser för olika situationer:
- När man börjar något nytt
- När man fortsätter
- Efter avslag
- Efter framgång
- När det känns tungt

### `sv.stressSupport`
Stöd vid stress och svårigheter:
- Påminnelser om att ta det lugnt
- Krisstöd (om allvarlig stress)
- Reframing av motgångar

## 🎨 Styling

Komponenten inkluderar CSS som kan importeras:

```typescript
import { supportiveLanguageStyles } from '../components/SupportiveLanguage';

// Lägg till i din CSS-injektion eller globala stilar
```

### CSS-klasser

- `.supportive-language` - Bas-klass
- `.supportive-language--info` - Informativ variant (blå)
- `.supportive-language--success` - Framgångsvariant (grön)
- `.supportive-language--warning` - Varningsvariant (orange)
- `.supportive-language--calm` - Lugn variant (lila)
- `.supportive-language--celebration` - Firande variant (rosa)
- `.supportive-language--small` | `--medium` | `--large` - Storlekar

## ♿ Tillgänglighet

- Alla meddelanden har `role="status"` och `aria-live="polite"` för skärmläsare
- Stöd för `prefers-reduced-motion`
- Stöd för mörkt läge via `prefers-color-scheme: dark`

## 🔄 Utöka med fler språk

För att lägga till fler språk:

1. Skapa en ny fil (t.ex. `en.ts` för engelska)
2. Exportera samma struktur som `sv.ts`
3. Använd en språkväljare i appen

```typescript
// exempel: language.ts
import { sv } from './sv';
import { en } from './en';

const translations = { sv, en };

export const getTranslations = (lang: 'sv' | 'en') => translations[lang];
```

---

*Senast uppdaterad: 2026-02-22*
