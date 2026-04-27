# 🧪 AI-funktioner - Snabbtestguide

## Snabbtest av alla AI-endpoints

### 1. Health Check
```bash
curl https://dindomän.vercel.app/api/health
```

Förväntat svar:
```json
{
  "status": "OK",
  "service": "Deltagarportalen AI API",
  "endpoints": [...]
}
```

### 2. Testa Personligt Brev
```bash
curl -X POST https://dindomän.vercel.app/api/ai/personligt-brev \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test AB",
    "jobTitle": "Utvecklare",
    "jobbAnnons": "Vi söker en erfaren utvecklare med kunskap i React och TypeScript.",
    "cvData": {
      "firstName": "Anna",
      "lastName": "Svensson",
      "workExperience": [{"title": "Utvecklare", "company": "Företag X"}],
      "skills": [{"name": "React"}, {"name": "TypeScript"}]
    }
  }'
```

### 3. Testa Chatbot
```bash
curl -X POST https://dindomän.vercel.app/api/ai/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "meddelande": "Hur skriver jag ett bra CV?"
  }'
```

### 4. Testa CV-optimering
```bash
curl -X POST https://dindomän.vercel.app/api/ai/cv-optimering \
  -H "Content-Type: application/json" \
  -d '{
    "cvText": "Jag har jobbat som utvecklare i 5 år.",
    "yrke": "Systemutvecklare"
  }'
```

### 5. Kontrollera Modeller
```bash
curl https://dindomän.vercel.app/api/models
```

## Testa lokalt

```bash
# Starta dev server
cd client
npm run dev

# Testa i ny terminal
curl http://localhost:3000/api/health
```

## Felsökning

| Fel | Lösning |
|-----|---------|
| 401 Unauthorized | Kontrollera auth-token |
| 429 Too Many Requests | Vänta 15 minuter |
| 500 Server Error | Kolla Vercel-loggar |
| Tomt svar | Verifiera JSON i request body |
