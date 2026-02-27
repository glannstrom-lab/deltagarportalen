# Felsökning: 401 vid inloggning

## Problem
Inloggning misslyckas med 401 (Unauthorized) trots att API-nyckeln fungerar.

## Vanliga orsaker

### 1. Fel e-post eller lösenord
- Kontrollera att Caps Lock inte är på
- Testa att återställa lösenord

### 2. E-post inte bekräftad
Supabase kan kräva e-postbekräftelse. Gå till:
https://app.supabase.com/project/odcvrdkvzyrbdzvdrhkz/auth/users

Kolla om användaren har `email_confirmed_at` satt.

### 3. Användaren finns inte
Verifiera att användaren finns i Supabase:
1. Gå till Supabase Dashboard → Authentication → Users
2. Sök efter e-postadressen

## Snabbfix: Stäng av e-postbekräftelse

Om du vill slippa e-postbekräftelse under utveckling:

1. Gå till: https://app.supabase.com/project/odcvrdkvzyrbdzvdrhkz/auth/providers
2. Under "Email" → Stäng av "Confirm email"
3. Spara

## Test-konton

Skapa ett test-konto direkt i Supabase:

1. Gå till: https://app.supabase.com/project/odcvrdkvzyrbdzvdrhkz/auth/users
2. Klicka "Add user"
3. Fyll i:
   - Email: test@example.com
   - Password: Test123456!
4. Klicka "Create user"

## Testa inloggning

Använd dessa uppgifter för att testa:
- Email: test@example.com
- Password: Test123456!

## Debugga vidare

Öppna DevTools (F12) → Console och kolla:

```javascript
// Testa Supabase-anslutning
const supabaseUrl = 'https://odcvrdkvzyrbdzvdrhkz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // anon key

const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: {
    'apikey': supabaseKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test123456!'
  })
});

console.log('Status:', response.status);
const data = await response.json();
console.log('Response:', data);
```

## Kontrollera auth-inställningar i Supabase

Gå till: https://app.supabase.com/project/odcvrdkvzyrbdzvdrhkz/auth/providers

Kolla att:
- ✅ "Email" är aktiverat
- Site URL är satt till: `https://glannstrom-lab.github.io/deltagarportalen/`
- Redirect URLs innehåller GitHub Pages-URL:en
