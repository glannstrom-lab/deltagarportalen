# 📱 Mobilanpassningar för Deltagarportalen

Denna dokumentation beskriver de mobilanpassningar som har implementerats för att förbättra användarupplevelsen för mobilanvändare, särskilt de som använder portalen i sängläge.

---

## 🎯 Syfte

Mobilanpassningarna är designade för att:
- Förbättra tillgängligheten för användare med kronisk smärta/utmattning
- Göra portalen användbar i sängläge med en hand
- Säkerställa touch-vänliga gränssnitt
- Stödja röstinmatning för att minska tangentbordsanvändning
- Anpassa layout efter skärmstorlek och orientering

---

## 📁 Filer och Komponenter

### CSS

| Fil | Beskrivning |
|-----|-------------|
| `src/styles/mobile.css` | Omfattande CSS-utility-klasser för mobilanpassning |

### Komponenter

| Komponent | Fil | Beskrivning |
|-----------|-----|-------------|
| `MobileOptimizer` | `MobileOptimizer.tsx` | Huvudkomponent för mobil-detektion och layout-justering |
| `MobileNav` | `MobileNav.tsx` | Mobil navigation med bottom bar och hamburger-meny |
| `VoiceInput` | `VoiceInput.tsx` | Röstinmatning med speech-to-text |
| `Button` | `ui/Button.tsx` | Uppdaterad med touch-vänliga storlekar |

### Hooks

| Hook | Beskrivning |
|------|-------------|
| `useMobileOptimizer()` | Hook för att få mobil-information i komponenter |
| `useVoiceInput()` | Programmatisk röstinmatning |

---

## 🚀 Användning

### MobileOptimizer

Omslut din app eller enskilda sidor med `MobileOptimizer`:

```tsx
import { MobileOptimizer } from '@/components/MobileOptimizer'

function App() {
  return (
    <MobileOptimizer
      enableTouchTracking      // Spåra touch-mönster
      enableRotationDetection  // Detektera liggande/stående
      enableSimplifiedView     // Aktivera förenklad vy för små skärmar
      simplifiedViewBreakpoint={360}
    >
      <DinKomponent />
    </MobileOptimizer>
  )
}
```

### Använda mobil-information i komponenter

```tsx
import { useMobileOptimizer, Secondary } from '@/components/MobileOptimizer'

function MinKomponent() {
  const { isMobile, isSimplifiedView, orientation, isOneHanded } = useMobileOptimizer()
  
  return (
    <div>
      {isMobile && <span>Mobilvy aktiv</span>}
      
      {/* Dölj sekundär info på mobil */}
      <Secondary>
        <p>Detta döljs i förenklad vy</p>
      </Secondary>
    </div>
  )
}
```

### VoiceInput

```tsx
import { VoiceInput, VoiceInputButton, VoiceInputInline } from '@/components/VoiceInput'

// Fristående knapp
<VoiceInput
  onTranscript={(text) => console.log(text)}
  language="sv-SE"
  showPrivacyWarning={true}
/>

// Inline med input-fält
<VoiceInputInline
  inputValue={value}
  onInputChange={setValue}
  placeholder="Tala nu..."
/>

// Knapp bredvan input
<input value={value} onChange={...} />
<VoiceInputButton
  onTranscript={(text) => setValue(v => v + text)}
/>
```

### Touch-vänliga knappar

```tsx
import { Button, TouchButton } from '@/components/ui/Button'

// Standard touch-vänlig knapp
<Button size="touch">Klicka här</Button>

// Extra stor för viktiga åtgärder
<Button size="touch-lg">Spara</Button>

// TouchButton-komponent
<TouchButton touchSize="large">Stor knapp</TouchButton>
```

---

## 🎨 CSS-klasser

### Touch-targets

```css
.mobile-touch-large    /* 48x48px minimum */
.mobile-touch-xlarge   /* 56x56px minimum */
.mobile-btn-touch      /* 44x44px minimum med padding */
.mobile-btn-touch-sm   /* Mindre touch-knapp */
```

### Text-läslighet

```css
.mobile-text-large      /* Större text för mobil */
.mobile-text-xlarge     /* Ännu större text */
.mobile-text-readable   /* Optimerad radlängd */
.mobile-text-responsive /* Responsiv textstorlek */
.mobile-heading-1/2/3   /* Rubriker för mobil */
```

### Liggande läge (Landscape)

```css
.mobile-landscape-readable  /* Förbättrad läsbarhet */
.mobile-landscape-compact   /* Kompaktare layout */
.mobile-landscape-card      /* Horisontella kort */
.mobile-landscape-grid-2    /* Två kolumner */
```

### Röstinmatning

```css
.mobile-voice-input-btn     /* Röst-knapp */
.mobile-voice-overlay       /* Inspelnings-overlay */
.mobile-voice-dialog        /* Dialog för inspelning */
.mobile-voice-wave          /* Animerad våg */
.mobile-voice-privacy       /* Sekretessvarning */
```

### Navigation

```css
.mobile-bottom-nav          /* Bottennavigering */
.mobile-bottom-nav-item     /* Navigeringsobjekt */
.mobile-fab                 /* Floating Action Button */
.mobile-menu-overlay        /* Meny-overlay */
.mobile-menu-panel          /* Sidomeny */
.mobile-nav-compressed      /* Komprimerad nav */
```

---

## 📱 Breakpoints

| Breakpoint | Beskrivning |
|------------|-------------|
| `< 360px` | Very small - förenklad vy aktiveras |
| `< 640px` | Small mobile - 2-kolumns grid |
| `< 768px` | Mobile - touch-optimeringar aktiva |
| `768px - 1024px` | Tablet - större navigeringsikoner |
| `> 1024px` | Desktop - standard layout |

---

## 🔊 Röststöd

### Web Speech API

Röstinmatning använder Web Speech API som stöds i:
- Chrome/Edge (fullt stöd)
- Safari (begränsat stöd)
- Firefox (kräver flagga)

### Sekretess

- Användaren får en varning innan första inspelningen
- Ingen röstdata sparas permanent
- All bearbetning sker via webbläsarens inbyggda tjänster

---

## ♿ Tillgänglighet

- Alla touch-targets är minst 44x44px (WCAG 2.5.5)
- Förbättrad kontrast i high-contrast-läge
- Reduced motion respekteras
- Skärmläsarstöd med ARIA-labels
- Fokus-indikatorer för tangentbordsnavigering

---

## 🧪 Testning

### Chrome DevTools

1. Öppna DevTools (F12)
2. Klicka på "Toggle device toolbar" (Ctrl+Shift+M)
3. Välj en mobil enhet (t.ex. iPhone 12 Pro)
4. Testa både porträtt och landskapsläge

### Verktyg

```bash
# Lighthouse audit för mobil
npm run lighthouse:mobile

# Testa touch-interaktioner
# Använd Chrome DevTools > Sensors > Touch
```

---

## 📋 Checklista för nya komponenter

När du skapar nya komponenter:

- [ ] Använd `min-h-[44px]` för klickbara element
- [ ] Testa på mobil (320px och uppåt)
- [ ] Verifiera i liggande läge
- [ ] Kontrollera touch-target-storlekar
- [ ] Lägg till ARIA-labels där det behövs
- [ ] Testa med skärmläsare
- [ ] Kontrollera färgkontrast

---

## 🔧 Konfiguration

### Aktivera förenklad vy

```tsx
<MobileOptimizer
  enableSimplifiedView
  simplifiedViewBreakpoint={360}  // px
>
```

### Anpassa touch-tracking

```tsx
const { touchZone, isOneHanded } = useMobileOptimizer()

// touchZone.side: 'left' | 'right' | 'center'
// isOneHanded: boolean
```

### Röstinmatning språk

```tsx
<VoiceInput language="sv-SE" />  {/* Svenska */}
<VoiceInput language="en-US" />  {/* Engelska */}
```

---

## 🐛 Felsökning

### Röstinmatning fungerar inte

1. Kontrollera att webbläsaren stöder Web Speech API
2. Verifiera mikrofontillstånd i webbläsarinställningar
3. Testa med HTTPS (krävs för vissa funktioner)

### Touch-knappar fungerar inte på desktop

Det är förväntat beteende - touch-knappar är optimerade för mobil.
Använd standard `size="md"` för desktop.

### Layout ser konstig ut på tablet

Kontrollera att du har rätt breakpoints:
- Tablet: 768px - 1024px
- Justera grid med `lg:` och `md:` prefix

---

## 📚 Länkar

- [WCAG 2.1 - Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [CSS Safe Area](https://developer.mozilla.org/en-US/docs/Web/CSS/env())

---

*Senast uppdaterad: 2026-02-22*
