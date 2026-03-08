# Vercel Blob: Public vs Private

## 🎯 För CV-bilder ska du välja **PUBLIC**

### Varför Public?

| Private | Public |
|---------|--------|
| Kräver inloggning för att se bilder | Bilder syns för alla |
| Komplexa signerade URL:er | Enkla URL:er som fungerar överallt |
| Passar för känsliga dokument | Perfekt för profilbilder |

**CV-bilder behöver vara publika för att:**
1. ✅ PDF-export ska kunna inkludera bilden
2. ✅ Bilden ska synas när du delar ditt CV
3. ✅ Recruiters ska kunna se din profilbild

---

## 🔧 Så här ändrar du från Private till Public

### Alternativ 1: Via Vercel Dashboard (enklast)

1. Gå till [vercel.com/dashboard/storage](https://vercel.com/dashboard/storage)
2. Klicka på din Blob-store (t.ex. "jobin-blob")
3. Klicka på **"Manage"** eller **"Settings"**
4. Hitta **"Access"** eller **"Public Access"**
5. Bocka i **"Allow public access"** eller **"Public"**
6. Spara

### Alternativ 2: Om du måste skapa en ny

1. Gå till [vercel.com/dashboard/storage](https://vercel.com/dashboard/storage)
2. Klicka **"Create Store"** → **"Blob"**
3. Välj ditt projekt
4. Viktigt: Välj **"Public"** istället för "Private"
5. Kopiera nya token
6. Uppdatera miljövariabel i projektet
7. Redeploya

---

## ✅ Så här vet du att det är rätt

**Rätt inställning:**
- Bilder kan ses utan inloggning
- URL:er ser ut så här: `https://xxxxxxxx.public.blob.vercel-storage.com/cv-images/bild.jpg`
- URL:en fungerar i ny flik utan token

**Fel inställning (Private):**
- Bilder kräver autentisering
- URL:er är temporära och långa med signaturer
- URL:en fungerar bara för inloggad användare

---

## 🧪 Testa att det fungerar

Efter att du ändrat till Public:

1. Ladda upp en bild i CV-byggaren
2. Högerklicka på bilden → "Kopiera bildadress"
3. Klistra in URL:en i ny flik
4. Bilden ska visas utan att du behöver logga in

**Om det fungerar = allt är rätt!** ✅
