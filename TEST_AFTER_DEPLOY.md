# ✅ Testguide - Efter Deploy

> **Syfte:** Verifiera att allt fungerar efter Supabase-deploy

---

## 🧪 Steg 1: Testa i Webbläsaren

### 1.1 Öppna applikationen
Gå till din URL:
- Produktion: `https://dinsida.se`
- Utveckling: `http://localhost:5173`

### 1.2 Testa autentisering

#### ✅ Registrering
1. Klicka "Skapa ett konto"
2. Fyll i:
   - Förnamn: `Test`
   - Efternamn: `Användare`
   - Email: `test+datum@example.com` (t.ex. `test+20260301@example.com`)
   - Lösenord: `TestPassword123!`
3. Klicka "Skapa konto"
4. **Förväntat resultat:** Du kommer till Dashboard

#### ✅ Login
1. Logga ut (om inloggad)
2. Gå till `/login`
3. Fyll i email och lösenord
4. **Förväntat resultat:** Du kommer till Dashboard

#### ✅ Logout
1. Klicka på logga ut
2. **Förväntat resultat:** Du hamnar på login-sidan

---

## 🧪 Steg 2: Testa Dashboard

### 2.1 Verifiera widgets
- [ ] CV-widget visas
- [ ] Jobbsökningswidget visas
- [ ] Intresseguide-widget visas
- [ ] Alla widgets laddar utan fel

### 2.2 Testa widget-filter
1. Klicka på "Dölj alla"
2. **Förväntat resultat:** Alla widgets försvinner
3. Klicka på "Visa alla"
4. **Förväntat resultat:** Alla widgets syns igen

---

## 🧪 Steg 3: Testa CV Builder

### 3.1 Skapa CV
1. Gå till CV-sidan
2. Fyll i:
   - Förnamn: `Test`
   - Efternamn: `Användare`
   - Titel: `Utvecklare`
   - Sammanfattning: `Jag är en testanvändare`
3. Lägg till arbetslivserfarenhet:
   - Titel: `Testare`
   - Företag: `Testföretag`
4. Klicka "Spara"
5. **Förväntat resultat:** "CV sparat!" meddelande

### 3.2 Testa PDF-export (VIKTIGT!)
1. Gå till Dashboard
2. Ändra CV-widget till "Large" (stor)
3. Klicka "Ladda ner PDF"
4. **Förväntat resultat:** PDF laddas ner, innehåller all information

---

## 🧪 Steg 4: Testa Jobbsökning

### 4.1 Sök jobb
1. Gå till Jobbsökning
2. Skriv "utvecklare" i sökfältet
3. Klicka "Sök"
4. **Förväntat resultat:** Jobb från Arbetsförmedlingen visas

### 4.2 Spara jobb
1. Klicka på ett jobb
2. Klicka "Spara jobb"
3. **Förväntat resultat:** Jobbet sparas, syns i "Sparade jobb"

---

## 🧪 Steg 5: Testa Konsulent-flöde (VIKTIGT!)

### 5.1 Skapa konsulent-konto
1. Registrera ny användare med role = CONSULTANT
   - Eller uppdatera befintlig användare i databasen:
   ```sql
   UPDATE profiles SET role = 'CONSULTANT' WHERE email = 'din@email.com';
   ```

### 5.2 Logga in som konsulent
1. Logga in med konsulent-kontot
2. Gå till `/consultant`
3. **Förväntat resultat:** Konsulent-dashboard visas

### 5.3 Bjud in deltagare (KRITISKT TEST!)
1. Klicka "Bjud in deltagare"
2. Fyll i:
   - Email: `testdeltagare+datum@example.com`
   - Förnamn: `Test`
   - Efternamn: `Deltagare`
   - Meddelande: `Välkommen till portalen!`
3. Klicka "Skicka inbjudan"
4. **Förväntat resultat:** 
   - "Inbjudan skickad!" visas
   - Email skickas till mottagaren (kolla spam!)

### 5.4 Verifiera email
1. Kolla email-inkorgen för `testdeltagare@example.com`
2. **Förväntat resultat:** Email från Deltagarportalen med inbjudningslänk
3. Klicka på länken
4. **Förväntat resultat:** Registreringssida öppnas

### 5.5 Deltagare registrerar sig
1. Fyll i lösenord
2. Klicka "Skapa konto"
3. **Förväntat resultat:** Deltagare är kopplad till konsulenten

---

## 🧪 Steg 6: Testa Edge Functions (Avancerat)

### 6.1 Testa AI Cover Letter
```bash
# Hämta access token först (logga in i appen och kolla dev tools)
curl -X POST https://odcvrdkvzyrbdzvdrhkz.supabase.co/functions/v1/ai-cover-letter \
  -H "Authorization: Bearer <ditt-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "cvData": {
      "firstName": "Test",
      "lastName": "Användare",
      "workExperience": [{"title": "Utvecklare", "company": "Företag"}]
    },
    "jobDescription": "Vi söker en utvecklare...",
    "companyName": "Testföretag",
    "jobTitle": "Utvecklare"
  }'
```

**Förväntat resultat:** JSON med genererat brev

---

## 🐛 Vanliga problem

### Problem: "Error: Invalid token"
**Lösning:** Token har gått ut. Logga in igen för att få ny token.

### Problem: "RLS policy violation"
**Lösning:** RLS policy saknas eller är felkonfigurerad. Kolla i Dashboard > Database > Policies.

### Problem: "Function execution failed"
**Lösning:** Miljövariabler saknas. Kolla i Dashboard > Settings > Edge Functions.

### Problem: Email skickas inte
**Lösning:** 
1. Verifiera att `send-invite-email` function finns
2. Kolla att `SITE_URL` är satt
3. Kolla logs i Dashboard > Edge Functions > Logs

---

## ✅ Checklista - Allt fungerar?

- [ ] Registrering fungerar
- [ ] Login fungerar
- [ ] Logout fungerar
- [ ] Dashboard laddar
- [ ] CV kan sparas
- [ ] PDF kan laddas ner
- [ ] Jobb kan sökas
- [ ] Jobb kan sparas
- [ ] Konsulent kan bjuda in
- [ ] Email skickas
- [ ] Deltagare kan registrera sig via inbjudan

**Om alla är ikryssade - GRATTIS! Allt fungerar!** 🎉

---

## 📞 Hjälp

Om något inte fungerar:
1. Kolla browser console (F12 > Console)
2. Kolla Supabase logs (Dashboard > Logs)
3. Fråga teamet!
