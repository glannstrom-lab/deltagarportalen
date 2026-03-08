# Vercel Blob Setup för CV-bilder

Denna guide hjälper dig att konfigurera Vercel Blob för bilduppladdning till CV.

## 🎯 Fördelar med Vercel Blob

- ✅ **Ingen konfiguration** - fungerar direkt utan RLS policies
- ✅ **Snabbare** - bilder servas via Vercel Edge Network
- ✅ **Enklare** - inga buckets att skapa eller hantera
- ✅ **Gratis** - upp till 250 MB lagring på Hobby-plan

---

## Steg 1: Installera Vercel Blob (om du kör lokalt)

Om du kör projektet lokalt, installera paketet:

```bash
cd client
npm install @vercel/blob
```

**Om du bara deployar till Vercel:** Detta görs automatiskt vid build.

---

## Steg 2: Skapa Blob Token i Vercel

1. Gå till [vercel.com/dashboard](https://vercel.com/dashboard)
2. Klicka på ditt Jobin-projekt
3. Klicka på **"Settings"** (överst)
4. Klicka på **"Environment Variables"** (i vänstermenyn)
5. Klicka **"Add New"**

Fyll i:
```
Name: BLOB_READ_WRITE_TOKEN
Value: (se nedan hur du får detta)
```

### Så här skapar du token:

1. Gå till [vercel.com/dashboard/storage](https://vercel.com/dashboard/storage)
2. Klicka **"Create Database"** eller **"Create Store"**
3. Välj **"Blob"**
4. Välj ditt projekt från dropdown
5. Klicka **"Create"**
6. Kopiera token som visas (eller gå till projektet → Settings → Environment Variables för att se den)

---

## Steg 3: Redeploya projektet

Efter att du lagt till miljövariabeln:

1. Gå tillbaka till Vercel Dashboard
2. Klicka på **"Deployments"**
3. Hitta senaste deployen
4. Klicka på de tre prickarna (...) → **"Redeploy"**

**Alternativ:** Pusha en tom ändring till GitHub:
```bash
git commit --allow-empty -m "trigger: Redeploy with Blob token"
git push origin main
```

---

## Steg 4: Testa bilduppladdning

1. Gå till https://www.jobin.se
2. Logga in
3. Gå till CV-byggaren
4. Prova ladda upp en profilbild
5. Bilden ska visas direkt efter uppladdning

---

## 🔧 Felsökning

### "BLOB_READ_WRITE_TOKEN not found"

Miljövariabeln är inte satt. Gå tillbaka till Steg 2.

### "Failed to upload image"

Kolla Vercel Function Logs:
1. Vercel Dashboard → ditt projekt
2. Klicka på **"Functions"**
3. Välj `/api/upload-image`
4. Kolla senaste logs för felmeddelanden

### Bilden laddas upp men syns inte

Öppna browser console (F12) och kolla:
- Network tab → hitta upload-anropet
- Kolla att URL:en som returneras är giltig
- Testa öppna URL:en direkt i ny flik

---

## 📊 Priser

| Plan | Lagring | Bandbredd | Kostnad |
|------|---------|-----------|---------|
| Hobby (gratis) | 250 MB | 100 GB / mån | Gratis |
| Pro | 1 GB | 1 TB / mån | $20/mån |
| Enterprise | Custom | Custom | Custom |

För de flesta CV-projekt räcker Hobby-planen gott och väl.

---

## 🎉 Klart!

Nu ska bilduppladdningen fungera utan problem!
