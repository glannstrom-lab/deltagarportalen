# CV Profilbild - Dokumentation

Denna dokumentation beskriver funktionen för att ladda upp profilbilder i CV-generatorn.

## Översikt

Deltagare kan nu ladda upp en professionell profilbild till sitt CV. Bilden visas i förhandsvisningen och inkluderas i PDF-exporten.

## Funktioner

### 1. Bilduppladdning (`ImageUpload` komponent)

**Fil:** `client/src/components/ImageUpload.tsx`

#### Huvudkomponent: `ImageUpload`
- Drag & drop-stöd
- Förhandsvisning före uppladdning
- Filvalidering (typ och storlek)
- Progress-indikator
- Felhantering

#### Kompakt variant: `CompactImageUpload`
- Används i CV-byggaren
- Cirkulär avatar-visning
- Enkel uppladdningskontroll

#### Props:
```typescript
interface ImageUploadProps {
  value?: string | null        // Nuvarande bild-URL
  onChange: (url: string | null) => void
  onUpload?: (file: File) => Promise<string | null>
  maxSizeMB?: number           // Standard: 5MB
  acceptedTypes?: string[]     // Standard: ['image/jpeg', 'image/png', 'image/webp']
}
```

### 2. Uppladdningshantering (`useImageUpload` hook)

**Fil:** `client/src/hooks/useImageUpload.ts`

#### Funktioner:
- **Automatisk komprimering**: Bilder komprimeras till max 800x800px
- **Formatkonvertering**: Alla bilder konverteras till JPEG för konsistens
- **Unika filnamn**: Tidsstämpel + random för att undvika kollisioner
- **Progress-tracking**: Realtidsfeedback under uppladdning

#### API:
```typescript
const { 
  upload,              // Generisk uppladdning
  uploadCVProfileImage, // Specifik för CV-profilbilder
  deleteImage,         // Ta bort bild från storage
  isUploading,         // Boolean
  progress             // 0-100
} = useImageUpload()
```

### 3. Integrering i CV-byggaren

**Fil:** `client/src/pages/CVBuilder.tsx`

Profilbildsuppladdning finns i steg 2 "Om dig":
- Placerad överst i formuläret
- Visar nuvarande bild (om någon)
- Knappar för att ändra/ta bort
- Validering av filstorlek och format

### 4. Förhandsvisning i CV

**Fil:** `client/src/components/cv/CVPreview.tsx`

- Bilden visas i sidhuvudet
- Cirkulär ram med skugga
- Responsiv storlek (96x96px / 128x128px)
- Anpassas efter vald mall (border-färg)

### 5. Databas-schema

**Migration:** `supabase/migrations/20260307_cv_profile_image.sql`

```sql
ALTER TABLE cvs ADD COLUMN profile_image TEXT;
CREATE INDEX idx_cvs_profile_image ON cvs(profile_image) 
WHERE profile_image IS NOT NULL;
```

## Supabase Storage Setup

### Skapa bucket:

1. Gå till Supabase Dashboard → Storage
2. Klicka "New Bucket"
3. Namn: `cv-images`
4. Check "Public bucket"
5. Klicka "Create bucket"

### Folder-struktur:
```
cv-images/
└── profiles/
    └── {user_id}/
        ├── {timestamp}-{random}.jpg
        └── ...
```

### Rekommenderade policies:

1. **Allow public read**: `anon` kan läsa alla filer
2. **Allow authenticated upload**: `authenticated` kan ladda upp
3. **Allow own file delete**: Användare kan bara ta bort sina egna filer

## Användningsflöde

```
1. Användare väljer bild (drag & drop eller filväljare)
   ↓
2. Klient validerar fil (typ, storlek)
   ↓
3. Bild komprimeras (max 800x800, JPEG, 85% kvalitet)
   ↓
4. Unikt filnamn genereras
   ↓
5. Uppladdning till Supabase Storage
   ↓
6. Public URL sparas i CV-data
   ↓
7. Förhandsvisning uppdateras
```

## Begränsningar

| Begränsning | Värde |
|-------------|-------|
| Max filstorlek | 5 MB |
| Tillåtna format | JPEG, PNG, WebP |
| Max dimensioner efter komprimering | 800x800px |
| Output-format | JPEG |
| Output-kvalitet | 85% |

## UI/UX överväganden

1. **Obligatorisk?** Nej, profilbild är valfritt
2. **Rekommendation**: Professionellt foto med neutral bakgrund
3. **Visuell feedback**: Progress-indikator under uppladdning
4. **Felhantering**: Tydliga felmeddelanden vid ogiltig fil
5. **Responsiv**: Fungerar på mobil och desktop

## Exempelkod

### Använda ImageUpload-komponenten:

```tsx
import { ImageUpload } from '@/components/ImageUpload'
import { useImageUpload } from '@/hooks/useImageUpload'

function ProfileForm() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const { uploadCVProfileImage } = useImageUpload()
  const { user } = useAuthStore()

  const handleUpload = async (file: File) => {
    if (!user?.id) return null
    const result = await uploadCVProfileImage(file, user.id)
    return result.url
  }

  return (
    <ImageUpload
      value={imageUrl}
      onChange={setImageUrl}
      onUpload={handleUpload}
      maxSizeMB={5}
    />
  )
}
```

### Visa profilbild i CV:

```tsx
function CVHeader({ data }: { data: CVData }) {
  return (
    <div className="cv-header">
      {data.profileImage && (
        <img 
          src={data.profileImage}
          alt="Profilbild"
          className="w-32 h-32 rounded-full object-cover"
        />
      )}
      <h1>{data.firstName} {data.lastName}</h1>
    </div>
  )
}
```

## Felsökning

### Vanliga problem:

1. **"Uppladdning misslyckades"**
   - Kontrollera att Supabase bucket finns och är public
   - Verifiera att användaren är inloggad
   - Kontrollera filstorlek (max 5MB)

2. **Bilden visas inte**
   - Kontrollera att URL är korrekt
   - Verifiera att bilden finns i storage
   - Kontrollera RLS policies

3. **Komprimering misslyckas**
   - Endast bildfiler stöds
   - Kontrollera att filen inte är korrupt

## Framtida förbättringar

- [ ] Bildbeskärning (cropping) före uppladdning
- [ ] Förinställda ramar/stilar för profilbilden
- [ ] Automatisk bakgrundsrensning (AI)
- [ ] Stöd för flera bilder (galleri)
- [ ] Gravatar-integration som fallback

---

*Senast uppdaterad: 2026-03-07*
