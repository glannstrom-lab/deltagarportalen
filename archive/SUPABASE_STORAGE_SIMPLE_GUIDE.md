# Supabase Storage - Enkel guide för CV-bilder

## 🎯 Vad vi ska göra

Vi ska skapa en "mapp" (bucket) i Supabase där bilder kan sparas, och sätta regler för vem som får göra vad.

---

## Steg 1: Skapa bucket (mappen)

1. Gå till https://app.supabase.com och logga in
2. Klicka på ditt projekt
3. I vänstermenyn, klicka på **"Storage"** (ser ut som en hårddisk-ikon)
4. Klicka på den **orange knappen "New bucket"**
5. Fyll i:
   ```
   Name: cv-images
   Public bucket: [✅] Bocka i rutan!
   ```
6. Klicka **"Save"**

---

## Steg 2: Skapa regler (Policies)

Nu ska vi skapa 4 regler som säger vem som får göra vad.

### Gå till Policies-sidan:
1. Du ser nu "cv-images" i listan
2. Klicka på **"cv-images"**
3. Klicka på fliken **"Policies"**
4. Klicka **"New Policy"**

---

## Steg 3: Skapa första regeln (SELECT - titta på bilder)

**Detta gör så att alla kan se bilderna.**

Klicka på **"Get started"** eller **"New Policy"**

Fyll i följande:

| Fält | Vad du ska skriva |
|------|-------------------|
| Policy name | `Allow public read` |
| Allowed operation | Välj `SELECT` från dropdown |
| Target roles | Skriv `anon, authenticated` |
| Policy definition | Skriv `true` |

Klicka **"Review"** → **"Save policy"**

**Förklaring:**
- **SELECT** = Få titta på bilder
- **anon, authenticated** = Alla (både inloggade och ej inloggade)
- **true** = Alltid tillåtet
- **Resultat:** Alla kan se bilderna (viktigt för CV-bilder)

---

## Steg 4: Skapa andra regeln (INSERT - ladda upp bilder)

Klicka **"New Policy"** igen

| Fält | Vad du ska skriva |
|------|-------------------|
| Policy name | `Allow authenticated uploads` |
| Allowed operation | Välj `INSERT` från dropdown |
| Target roles | Skriv `authenticated` |
| Policy definition | Skriv `true` |

Klicka **"Review"** → **"Save policy"**

**Förklaring:**
- **INSERT** = Ladda upp nya bilder
- **authenticated** = Bara inloggade användare
- **Resultat:** Man måste vara inloggad för att ladda upp

---

## Steg 5: Skapa tredje regeln (UPDATE - ändra bilder)

Klicka **"New Policy"**

| Fält | Vad du ska skriva |
|------|-------------------|
| Policy name | `Allow own updates` |
| Allowed operation | Välj `UPDATE` från dropdown |
| Target roles | Skriv `authenticated` |
| Policy definition | Kopiera exakt detta: <br>`(storage.foldername(name))[1] = auth.uid()::text` |

Klicka **"Review"** → **"Save policy"**

**Förklaring:**
- **UPDATE** = Byta ut/ändra en befintlig bild
- **auth.uid()** = Den inloggade användarens ID
- **storage.foldername(name)** = Mappen där filen ligger
- **[1]** = Första delen av sökvägen (användarens ID-mapp)
- **Resultat:** Du får bara ändra bilder i DIN egen mapp

**Exempel:**
- Din mapp: `profiles/abc123/din-bild.jpg` → Du får ändra ✅
- Annans mapp: `profiles/xyz789/annan-bild.jpg` → Du får INTE ändra ❌

---

## Steg 6: Skapa fjärde regeln (DELETE - ta bort bilder)

Klicka **"New Policy"**

| Fält | Vad du ska skriva |
|------|-------------------|
| Policy name | `Allow own deletes` |
| Allowed operation | Välj `DELETE` från dropdown |
| Target roles | Skriv `authenticated` |
| Policy definition | Kopiera exakt detta: <br>`(storage.foldername(name))[1] = auth.uid()::text` |

Klicka **"Review"** → **"Save policy"**

**Förklaring:**
- **DELETE** = Ta bort bilder
- Samma logik som UPDATE - bara dina egna bilder
- **Resultat:** Du får bara ta bort bilder i DIN egen mapp

---

## Sammanfattning - Vad du ska ha nu

Du ska ha 4 policies:

| Namn | Operation | Roller | Definition |
|------|-----------|--------|------------|
| Allow public read | SELECT | anon, authenticated | true |
| Allow authenticated uploads | INSERT | authenticated | true |
| Allow own updates | UPDATE | authenticated | (storage.foldername(name))[1] = auth.uid()::text |
| Allow own deletes | DELETE | authenticated | (storage.foldername(name))[1] = auth.uid()::text |

---

## Steg 7: Testa

1. Gå tillbaka till Jobin (www.jobin.se)
2. Logga in
3. Gå till CV-byggaren
4. Prova ladda upp en bild
5. Om det fungerar ska du se:
   - Bilden visas direkt (lokal preview)
   - Efter några sekunder syns den sparade bilden
   - Spara CV:t
   - Ladda om sidan - bilden ska fortfarande synas

---

## 🆘 Om det fortfarande inte fungerar

Öppna webbläsarens console (F12 → Console) och kolla efter röda felmeddelanden. Screenshot:a dem och visa mig!

Vanliga fel:
- "Bucket not found" → Bucketen är inte skapad (Steg 1)
- "new row violates row-level security" → Policies saknas (Steg 2-6)
- "storage object not found" → Filen sparades inte korrekt
