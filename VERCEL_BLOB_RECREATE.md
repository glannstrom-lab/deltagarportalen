# Återskapa Vercel Blob som Public

## 🗑️ Steg 1: Ta bort den privata Blob

1. Gå till [vercel.com/dashboard/storage](https://vercel.com/dashboard/storage)
2. Hitta din Blob (t.ex. "jobin-blob")
3. Klicka på **"Manage"** eller de tre prickarna (⋮)
4. Leta efter **"Delete"** eller **"Remove"**
5. Bekräfta borttagning

⚠️ **OBS:** Bilder som redan laddats upp försvinner, men eftersom inget fungerade än så är detta OK.

---

## ✨ Steg 2: Skapa ny Public Blob

1. Klicka **"Create Store"** (orange knapp)
2. Välj **"Blob"**
3. Fyll i:
   ```
   Store Name: jobin-blob (eller vad du vill)
   
   Connect to Project: [Välj ditt Jobin-projekt]
   
   ⚠️ VIKTIGT: 
   Access: Public ✅ (välj INTE Private!)
   ```
4. Klicka **"Create"**

---

## 🔑 Steg 3: Kopiera nya token

Efter att du skapat Blob:

1. Du ser en ruta med token
2. **Kopiera hela token** (börjar med `vercel_blob_rw_...`)
3. **Spara den temporärt** (i anteckningar/Notepad)

**Ser ut så här:**
```
vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ⚙️ Steg 4: Uppdatera miljövariabel

1. Gå till [Vercel Dashboard](https://vercel.com/dashboard) → ditt Jobin-projekt
2. Klicka **"Settings"** (överst)
3. Klicka **"Environment Variables"** (vänstermenyn)
4. Hitta `BLOB_READ_WRITE_TOKEN`
5. Klicka på pennan (✏️) för att **redigera**
6. Klistra in den **nya token** du kopierade
7. Klicka **"Save"**

---

## 🚀 Steg 5: Redeploya

**Alternativ A - Via Dashboard:**
1. Gå till fliken **"Deployments"**
2. Klicka på senaste deployen
3. Klicka de tre prickarna (⋮) → **"Redeploy"**

**Alternativ B - Via Git:**
```bash
git commit --allow-empty -m "chore: Update Blob token"
git push origin main
```

---

## ✅ Steg 6: Testa

1. Vänta 1-2 minuter på att deploy blir klar
2. Gå till https://www.jobin.se
3. Logga in → CV-byggaren
4. Prova ladda upp en bild

**Om det fungerar ska du se:**
- Bilden laddas upp utan fel
- Bilden syns direkt
- URL:en innehåller `.public.blob.vercel-storage.com`

---

## 🆘 Om det fortfarande inte fungerar

1. Kolla att token verkligen uppdaterades:
   - Settings → Environment Variables
   - Kolla att värdet är det NYA (inte gamla)

2. Kolla Vercel Logs:
   - Dashboard → Functions → /api/upload-image
   - Se om det finns felmeddelanden

3. Testa att skapa en tom commit för att tvinga rebuild:
   ```bash
   git commit --allow-empty -m "trigger: Force rebuild with new Blob"
   git push origin main
   ```
