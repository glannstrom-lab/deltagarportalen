# ⚡ Snabbstart: Få Jobin Landningssida Live

> För VD (Mikael) - snabb guide för att gå live på www.jobin.se

---

## 🎯 Vad vi ska göra

Få upp den nya landningssidan på www.jobin.se så att besökare ser den istället för nuvarande sida.

---

## 📋 Checklista (gör i ordning)

### ☐ Steg 1: Pusha koden till GitHub (5 min)

Öppna terminalen i projektmappen och kör:

```bash
git add .
git commit -m "feat: New landing page for Jobin"
git push origin main
```

### ☐ Steg 2: Skapa Vercel-konto (5 min)

1. Gå till [vercel.com](https://vercel.com)
2. Klicka "Sign Up" → "Continue with GitHub"
3. Logga in med ditt GitHub-konto

### ☐ Steg 3: Importera projektet (5 min)

1. I Vercel Dashboard, klicka "Add New Project"
2. Välj ditt repo "deltagarportalen"
3. Konfigurera:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Klicka "Deploy"

5. Vänta 1-2 minuter på att bygget ska bli klart

### ☐ Steg 4: Lägg till miljövariabler (5 min)

1. I Vercel, klicka på ditt projekt
2. Gå till "Settings" (överst) → "Environment Variables"
3. Lägg till dessa två:

   **Första variabeln:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://odcvrdkvzyrbdzvdrhkz.supabase.co`

   **Andra variabeln:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY3ZyZGt2enlyYmR6dmRyaGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjU1NzcsImV4cCI6MjA4NzQ0MTU3N30.StWwqG3cVo1ItJ5Z59eQzBGBH4ttIHypupcKzkAYXus`

4. Klicka "Save"
5. Gå till "Deployments" tabben
6. Klicka på de tre prickarna (...) på senaste deployen → "Redeploy"

### ☐ Steg 5: Koppla domänen www.jobin.se (15 min)

1. I Vercel, gå till "Settings" → "Domains"
2. Skriv in: `www.jobin.se`
3. Klicka "Add"
4. Vercel visar nu DNS-inställningar. Antingen:
   
   **Alternativ A (om du har tillgång till DNS):**
   - Logga in hos din domänleverantör (t.ex. Loopia, Namecheap)
   - Lägg till CNAME-post:
     - Typ: CNAME
     - Namn: www
     - Värde: `cname.vercel-dns.com`
   - Spara

   **Alternativ B (om någon annan hanterar DNS):**
   - Skicka detta till din IT-ansvarige/webbyrå:
     > "Hej, kan ni lägga till en CNAME-post för www.jobin.se som pekar på cname.vercel-dns.com? Tack!"

5. Vänta 1-2 timmar (DNS kan ta tid att uppdateras)

### ☐ Steg 6: Testa! (10 min)

1. Gå till https://www.jobin.se
2. Verifiera att landningssidan visas
3. Klicka på "Logga in" - ska gå till inloggningssidan
4. Testa att logga in med ett befintligt konto
5. Testa på mobilen också

---

## ✅ Klart!

När alla steg är klara är landningssidan live på www.jobin.se 🎉

---

## 🆘 Om något inte fungerar

**"Page not found"**
- DNS-inställningarna behöver mer tid (vänta 1-2 timmar till)

**Vit sida**
- Miljövariablerna är inte satta korrekt (gå tillbaka till steg 4)

**Login fungerar inte**
- Kontakta utvecklingsteamet

---

## 📞 Frågor?

Om du behöver hjälp, fråga utvecklingsteamet eller kolla detaljerade instruktioner i `DEPLOY_LANDING_PAGE.md`.
