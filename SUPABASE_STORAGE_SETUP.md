# Supabase Storage Setup för CV-bilder

Denna guide hjälper dig att konfigurera Supabase Storage för bilduppladdning till CV.

## 🔍 Problemet

Bilduppladdningen fungerar inte för att Storage-bucketen "cv-images" saknas eller är felaktigt konfigurerad.

## ✅ Steg-för-steg lösning

### Steg 1: Skapa bucket i Supabase Dashboard

1. Gå till [Supabase Dashboard](https://app.supabase.com)
2. Välj ditt projekt
3. Klicka på **"Storage"** i vänstermenyn
4. Klicka på **"New bucket"**
5. Fyll i:
   - **Name**: `cv-images`
   - **Public bucket**: ✅ Bocka i (viktigt!)
   - **File size limit**: Lämna tomt (eller sätt till 5MB)
   - **Allowed MIME types**: Lämna tomt (eller ange: `image/jpeg, image/png, image/webp`)
6. Klicka **"Save"

### Steg 2: Konfigurera RLS Policies

I bucket-listan, klicka på **"cv-images"** → **"Policies"** → **"New Policy"**

Skapa dessa 4 policies:

#### Policy 1: Allow public read
```
Name: Allow public read
Allowed operation: SELECT
Target roles: anon, authenticated
Policy definition: true
```

#### Policy 2: Allow authenticated uploads
```
Name: Allow authenticated uploads
Allowed operation: INSERT
Target roles: authenticated
Policy definition: true
```

#### Policy 3: Allow users to update own files
```
Name: Allow own updates
Allowed operation: UPDATE
Target roles: authenticated
Policy definition: (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 4: Allow users to delete own files
```
Name: Allow own deletes
Allowed operation: DELETE
Target roles: authenticated
Policy definition: (storage.foldername(name))[1] = auth.uid()::text
```

### Steg 3: Verifiera att kolumnen finns (ska redan finnas)

I SQL Editor, kör:
```sql
-- Kolla om profile_image kolumnen finns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'cvs' AND column_name = 'profile_image';
```

Om inget resultat, kör:
```sql
ALTER TABLE cvs ADD COLUMN profile_image TEXT;
```

### Steg 4: Testa bilduppladdning

1. Gå till CV-byggaren
2. Försök ladda upp en bild
3. Om det fortfarande inte fungerar, kolla browser console för felmeddelanden

## 🔧 Felsökning

### "Bucket not found"
- Bucketen är inte skapad → Gå tillbaka till Steg 1

### "new row violates row-level security policy"
- RLS policies saknas eller är felaktiga → Gå tillbaka till Steg 2
- Se till att "Public bucket" är aktiverat

### Bilden laddas upp men syns inte
- Kolla att `profile_image` kolumnen finns i cvs-tabellen
- Kolla att URL:en som sparas är korrekt
- Testa att öppna URL:en direkt i webbläsaren

### "The resource was not found"
- Filen kanske inte blev uppladdad korrekt
- Kolla i Supabase Dashboard → Storage → cv-images om filen finns där

## 📋 Snabbkoll (SQL)

Kör detta i SQL Editor för att verifiera att allt är på plats:

```sql
-- 1. Kolla att tabellen har profile_image kolumnen
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cvs';

-- 2. Lista alla storage buckets
SELECT id, name, public 
FROM storage.buckets;

-- 3. Lista RLS policies för storage
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'storage';
```

## ✅ Klart!

När allt är konfigurerat ska bilduppladdningen fungera direkt. Testa genom att:
1. Gå till CV-byggaren
2. Ladda upp en bild
3. Se att bilden visas efter uppladdning
4. Spara CV:t och ladda om sidan för att verifiera att bilden sparats
