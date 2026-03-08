# Felsökning: BLOB_READ_WRITE_TOKEN

## 🔍 Vanliga problem och lösningar

### Problem 1: Token tillagd i fel projekt

**Kontrollera:**
1. Gå till [vercel.com/dashboard](https://vercel.com/dashboard)
2. Klicka på ditt **Jobin-projekt** (det som deployar www.jobin.se)
3. Gå till **Settings** → **Environment Variables**
4. Se till att `BLOB_READ_WRITE_TOKEN` finns där

**Om den saknas:**
- Du kanske lade den i Blob-store-projektet istället för Jobin-projektet
- Lägg till den i Jobin-projektet

---

### Problem 2: Token har fel namn

**Kontrollera stavningen:**
```
❌ Fel:   blob_read_write_token
❌ Fel:   BLOB-READ-WRITE-TOKEN
❌ Fel:   VERCEL_BLOB_TOKEN
✅ Rätt:  BLOB_READ_WRITE_TOKEN
```

---

### Problem 3: Token inte deployad

Miljövariabler kräver **ny deploy** för att aktiveras.

**Lösning:**
1. Vercel Dashboard → ditt projekt
2. Fliken **"Deployments"**
3. Klicka på senaste deployen
4. Klicka **"Redeploy"** (inte "Rebuild")
5. Vänta på att bygget blir klart

---

### Problem 4: Hitta rätt token

Så här hittar du token:

**Alternativ A - Via Storage-sidan:**
1. [vercel.com/dashboard/storage](https://vercel.com/dashboard/storage)
2. Klicka på din Blob-store
3. Klicka **"Manage"**
4. Gå till **Settings**
5. Klicka **"Reveal"** bredvid token

**Alternativ B - Via Project Settings:**
1. Vercel Dashboard → ditt projekt
2. **Settings** → **Environment Variables**
3. Hitta `BLOB_READ_WRITE_TOKEN`
4. Klicka på ögat för att se värdet

**Token ser ut så här:**
```
vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ✅ Steg-för-steg fix

### 1. Verifiera att token finns

Gå till:
https://vercel.com/[ditt-användarnamn]/[ditt-projekt]/settings/environment-variables

Du ska se:
```
BLOB_READ_WRITE_TOKEN = vercel_blob_rw_xxxxx...
```

### 2. Om token saknas - lägg till

Klicka **"Add New"**:
```
Name:  BLOB_READ_WRITE_TOKEN
Value: vercel_blob_rw_xxxxx... (din token)
Environment: Production ✓, Preview ✓, Development ✓
```

### 3. Redeploya

```bash
# Alternativ A: Via GitHub
git commit --allow-empty -m "trigger: Redeploy with Blob token"
git push origin main

# Alternativ B: Via Vercel Dashboard
# Deployments → [senaste] → Redeploy
```

### 4. Verifiera

Gå till https://www.jobin.se och testa bilduppladdning.

---

## 🆘 Fortfarande problem?

Kontrollera dessa saker:

1. **Är token aktiv?**
   - Vercel Dashboard → Storage → din Blob
   - Kolla att den inte är "Paused"

2. **Är det rätt projekt?**
   - Kolla att du deployar från rätt GitHub-repo
   - Kolla att domänen är www.jobin.se

3. **Testa lokalt:**
   - Lägg till token i `client/.env.local`:
     ```
     BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx...
     ```
   - Kör `npm run dev`
   - Testa bilduppladdning lokalt

---

## 📞 Support

Om inget fungerar:
1. Kolla Vercel Function Logs:
   - Vercel Dashboard → Functions → /api/upload-image
   - Se felmeddelanden där

2. Eller skapa en ny Blob-store:
   - Vercel Dashboard → Storage → Create Store → Blob
   - Kopiera nya token
   - Uppdatera miljövariabel
   - Redeploya
