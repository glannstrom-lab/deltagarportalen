# Bildoptimering i Deltagarportalen

Denna dokumentation beskriver hur bildoptimering är implementerad i projektet.

## Översikt

Vi använder flera tekniker för att optimera bilder:

1. **Moderna bildformat** - WebP/AVIF med fallback
2. **Lazy loading** - Bilder laddas först när de behövs
3. **Responsiva bilder** - Automatisk srcset generering
4. **Blur placeholders** - Smooth loading experience
5. **Kompression** - Gzip/Brotli för alla assets

## Image-komponenten

Använd den optimerade `Image`-komponenten från `@/components/ui`:

```tsx
import { Image, Picture, Avatar } from '@/components/ui'

// Grundläggande användning
<Image src="photo.jpg" alt="Beskrivning" />

// Med dimensioner och lazy loading
<Image 
  src="photo.jpg" 
  alt="Beskrivning"
  width={800}
  height={600}
  loading="lazy"
/>

// Med blur placeholder
<Image 
  src="photo.jpg" 
  alt="Beskrivning"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// Responsiv bild
<Image 
  src="photo.jpg" 
  alt="Beskrivning"
  width={1200}
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// Avatar med fallback
<Avatar 
  src="user.jpg" 
  alt="Användare"
  fallback="John Doe"
  size="md"
/>

// Picture med flera källor (Art Direction)
<Picture
  src="fallback.jpg"
  alt="Beskrivning"
  sources={[
    { srcSet: 'image.avif', type: 'image/avif' },
    { srcSet: 'image.webp', type: 'image/webp' },
    { srcSet: 'mobile.jpg', media: '(max-width: 480px)' },
  ]}
/>
```

## Byggoptimering

Vite-konfigurationen inkluderar:

### Chunk Splitting

Vendor-bibliotek separeras i egna chunks för bättre caching:

- `vendor-react` - React & ReactDOM
- `vendor-router` - React Router
- `vendor-query` - TanStack Query
- `vendor-supabase` - Supabase
- `vendor-charts` - Recharts
- `vendor-forms` - React Hook Form, Zod
- `vendor-ui` - Framer Motion, Lucide
- `vendor-date` - date-fns

### Kompression

Alla assets komprimeras med både Gzip och Brotli:

```bash
# Bygg med kompression
npm run build

# Generera bundle-analys
npm run analyze
```

### Minifiering

Terser används för att:
- Ta bort console.logs
- Ta bort debugger statements
- Komprimera kod

## CDN-integration

För produktion, överväg att använda en bild-CDN som:

- **Cloudinary** - `https://res.cloudinary.com/[cloud]/image/upload/...`
- **Imgix** - `https://[domain].imgix.net/...`
- **Cloudflare Images** - Inbyggd optimering

Exempel med Cloudinary:

```tsx
const getCloudinaryUrl = (publicId: string, options: { w?: number; q?: number } = {}) => {
  const { w = 800, q = 80 } = options
  return `https://res.cloudinary.com/your-cloud/image/upload/w_${w},q_${q},f_auto/${publicId}`
}

<Image src={getCloudinaryUrl('my-image', { w: 800 })} alt="..." />
```

## Bildformat

| Format | Stöd | Användning |
|--------|------|------------|
| AVIF | Chrome, Firefox, Safari | Bäst kompression |
| WebP | Alla moderna browsers | Bra kompression, brett stöd |
| JPEG | Alla | Fallback för äldre browsers |
| PNG | Alla | När transparens behövs |

## Prestandamätning

Använd Lighthouse för att verifiera bildoptimering:

```bash
# Kör Lighthouse CI
npx lighthouse http://localhost:3000 --preset=desktop
```

### Viktiga mätvärden

- **LCP (Largest Contentful Paint)** - < 2.5s
- **Total Blocking Time** - < 200ms
- **Cumulative Layout Shift** - < 0.1

## Best Practices

1. **Använd allt `alt`-texter** - Tillgänglighet & SEO
2. **Definiera width/height** - Förhindra layout shift
3. **Använd lazy loading** - För bilder under fold
4. **Prioritera viktiga bilder** - Använd `priority` för LCP-bilder
5. **Generera blurDataURL** - För smooth loading experience

## Bildgenerering

För att generera olika bildformat:

```bash
# Konvertera till WebP
npx @squoosh/cli --webp '{"quality":75}' input.jpg -d output/

# Konvertera till AVIF  
npx @squoosh/cli --avif '{"quality":75}' input.jpg -d output/
```

## Felhantering

Image-komponenten hanterar automatiskt:

- Format fallback (AVIF → WebP → JPEG)
- Loading states
- Error states
- Responsive breakpoints

Om en bild inte kan laddas visas ett felmeddelande och eventuellt en fallback-bild.
