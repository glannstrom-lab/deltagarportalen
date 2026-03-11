# Supabase Setup Checklista för CV Profilbild

## 1. Storage Bucket

Gå till: Supabase Dashboard → Storage → New Bucket

**Inställningar:**
- **Name:** `cv-images`
- **Public bucket:** ✅ Bocka i (viktigt!)
- **File size limit:** 5MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

## 2. Row Level Security (RLS) Policies

Gå till: Storage → Policies → `cv-images` bucket

### Lägg till dessa policies:

**Policy 1: Allow public read**
```sql
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'cv-images');
```

**Policy 2: Allow authenticated uploads**
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cv-images');
```

**Policy 3: Allow users to delete own files**
```sql
CREATE POLICY "Allow own file deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'cv-images');
```

## 3. CORS-inställningar (om problem med uppladdning)

Gå till: Settings → API → CORS

**Tillåtna origins:**
- `https://www.jobin.se`
- `http://localhost:3000` (för utveckling)

## 4. Verifiera att allt fungerar

Testa i browser console på www.jobin.se:

```javascript
// Kolla om Supabase är ansluten
console.log(supabase);

// Försök lista buckets
const { data, error } = await supabase.storage.listBuckets();
console.log(data);
```

## Vanliga fel:

### "Bucket not found"
- Bucketen `cv-images` finns inte → Skapa den

### "row-level security policy violation"
- RLS policies saknas → Lägg till policies ovan

### "CORS error"
- CORS inte konfigurerat → Lägg till domänen i CORS-inställningar

### "Anonymous sign-ins are disabled"
- Bucketen är inte public → Ändra till Public bucket

## 5. Testa manuellt

1. Gå till www.jobin.se
2. Logga in
3. Gå till CV-byggaren → Steg 2
4. Öppna browser console (F12)
5. Välj en bildfil
6. Kolla console för felmeddelanden

## 6. Debugging

Om det fortfarande inte fungerar, kolla:

1. **Network tab** i dev tools - ser du uppladdningsförfrågan?
2. **Response** - vad säger servern?
3. **Storage tab** i Supabase - syns filen där?

## Snabbfix om inget fungerar

Om du vill skippa Supabase Storage tillfälligt och bara visa bilden lokalt:

Ändra i `CVBuilder.tsx`:
```tsx
<CompactImageUpload
  value={data.profileImage}
  onChange={(url) => setData({ ...data, profileImage: url })}
  // Ta bort onUpload prop helt för att bara använda lokal preview
/>
```

Då sparas bilden bara i minnet och visas i CV:t, men försvinner vid refresh.
