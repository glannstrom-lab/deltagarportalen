# 🤖 AI-arkitektur - Översikt

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DELTAGARPORTALEN - AI SYSTEM                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ CV Builder   │  │ Chatbot      │  │ Jobbsökning  │  │ Dashboard/       │ │
│  │ AIWriting    │  │ AICareer     │  │ SmartMatch   │  │ SmartReminders   │ │
│  │ Assistant    │  │ Chatbot      │  │              │  │                  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         │                 │                 │                   │           │
│         ▼                 ▼                 ▼                   ▼           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    AI Services Layer (client/src/services/ai/)          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐ │ │
│  │  │ aiAssistant │  │ embeddings  │  │ smartMatch  │  │ aiService     │ │ │
│  │  │ .ts         │  │ .ts         │  │ .ts         │  │ .ts           │ │ │
│  │  │             │  │             │  │             │  │               │ │ │
│  │  │ Regelbaserad│  │ TF-IDF      │  │ Keyword     │  │ API-wrapper   │ │ │
│  │  │ rekommen-   │  │ embeddings  │  │ matching    │  │ för Edge      │ │ │
│  │  │ dationer    │  │ (mock)      │  │             │  │ Functions     │ │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └───────┬───────┘ │ │
│  │         │                │                │                 │         │ │
│  └─────────┼────────────────┼────────────────┼─────────────────┼─────────┘ │
│            │                │                │                 │           │
└────────────┼────────────────┼────────────────┼─────────────────┼───────────┘
             │                │                │                 │
             ▼                ▼                ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS (Serverless)                       │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ ai-assistant    │  │ ai-cover-letter │  │ cv-analysis                 │  │
│  │                 │  │                 │  │                             │  │
│  │ /functions/ai/  │  │ /functions/ai/  │  │ /functions/cv-analysis      │  │
│  │                 │  │ cover-letter    │  │                             │  │
│  │ • Auth check    │  │                 │  │ • OpenAI GPT-4              │  │
│  │ • Rate limiting │  │ • Claude 3.5    │  │ • Fallback analysis         │  │
│  │ • Prompt inj.   │  │ • Timeout 25s   │  │ • ATS-scoring               │  │
│  │   protection    │  │ • CV context    │  │                             │  │
│  │ • Logging       │  │                 │  │                             │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘  │
│           │                    │                          │                 │
│           └────────────────────┼──────────────────────────┘                 │
│                                │                                            │
│                                ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  NEW: ai-cv-writing (Secure Implementation)                         │   │
│  │                                                                     │   │
│  │  ✓ API key protected (server-side only)                            │   │
│  │  ✓ Rate limiting (10 req/min per user)                             │   │
│  │  ✓ Prompt injection protection                                      │   │
│  │  ✓ Input sanitization                                               │   │
│  │  ✓ Secure prompt separators                                         │   │
│  │  ✓ Usage logging                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL AI SERVICES                                │
│                                                                              │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────────┐ │
│  │    OPENROUTER.AI        │    │         OPENAI                          │ │
│  │                         │    │                                         │ │
│  │  Primary LLM Provider   │    │  CV Analysis (GPT-4)                    │ │
│  │                         │    │                                         │ │
│  │  Models:                │    │  • CV-to-job matching                   │ │
│  │  • claude-3.5-sonnet   │◄───┤  • ATS optimization                     │ │
│  │  • gpt-4o              │    │  • Keyword extraction                   │ │
│  │  • llama-3.1           │    │                                         │ │
│  │                         │    │  (Fallback to local if no API key)      │ │
│  └─────────────────────────┘    └─────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA STORAGE                                        │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │  ai_usage_logs   │  │  cv_analyses     │  │  localStorage (browser)  │  │
│  │                  │  │                  │  │                          │  │
│  │  - user_id       │  │  - user_id       │  │  - saved-jobs            │  │
│  │  - function_name │  │  - match_score   │  │  - applications          │  │
│  │  - tokens_used   │  │  - keywords      │  │  - job_embeddings_cache  │  │
│  │  - model         │  │  - created_at    │  │  - reminder prefs        │  │
│  │  - created_at    │  │                  │  │                          │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI FEATURES - DETAIL                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 1. CV WRITING ASSISTANT                                                     │
├────────────────────────────────────────────────────────────────────────────┤
│ Input: CV text (summary, experience, skills)                               │
│ Features:                                                                   │
│   • Improve - Starkare formuleringar, action-verb                          │
│   • Quantify - Lägg till mätbara resultat                                  │
│   • Translate - Svenska → Engelska                                         │
│   • Weak words detection - "var ansvarig för" → "ledde"                    │
│ Model: Claude 3.5 Sonnet via OpenRouter                                    │
│ Security: Server-side API calls (NEW)                                      │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 2. COVER LETTER GENERATOR                                                   │
├────────────────────────────────────────────────────────────────────────────┤
│ Input: Job description + CV data + tone preference                         │
│ Output: Personligt brev (max 300 ord)                                      │
│ Features:                                                                   │
│   • Integrerar hela CV:t i kontexten                                       │
│   • Ton: formell / entusiastisk / vänlig                                   │
│   • 25s timeout för att hantera långa svar                                 │
│ Model: Claude 3.5 Sonnet                                                   │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 3. CAREER CHATBOT                                                           │
├────────────────────────────────────────────────────────────────────────────┤
│ Input: Användarfråga + historik (sista 5 meddelanden)                      │
│ Capabilities:                                                               │
│   • CV-feedback                                                            │
│   • Intervjuförberedelser                                                  │
│   • Jobbsökartips                                                          │
│   • Löneförhandling                                                        │
│   • Mentalt stöd                                                           │
│ Context: 5 meddelanden bakåt                                               │
│ Limitation: Ingen RAG (äger inte Kunskapsbanken)                           │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 4. SMART REMINDERS                                                          │
├────────────────────────────────────────────────────────────────────────────┤
│ Type: Regelbaserad (ej AI-anrop)                                           │
│ Datakällor:                                                                 │
│   • localStorage: saved-jobs, applications, goals                          │
│   • Användarbeteende: streak, activity pattern                             │
│ Triggers:                                                                   │
│   • Jobb sparade > 5 dagar                                                 │
│   • Kommande intervjuer                                                    │
│   • Låg aktivitet                                                          │
│   • Milstolpar (första ansökan, etc)                                       │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 5. JOB MATCHING (EMBEDDINGS)                                                │
├────────────────────────────────────────────────────────────────────────────┤
│ Current: TF-IDF-like vectorization (mock)                                  │
│ Vocabulary: 125 statiska termer                                            │
│ Algorithm: Cosine similarity on frequency vectors                          │
│ Limitations:                                                                │
│   • Statisk ordlista kan inte hantera nya yrken                            │
│   • Ingen semantisk förståelse ("Java" ≠ "Javascript")                     │
│   • Lokal caching i localStorage                                           │
│                                                                            │
│ FUTURE: OpenAI text-embedding-3-small (1536 dims)                         │
│        + pgvector i PostgreSQL för similarity search                       │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 6. CV ANALYSIS / ATS SCORE                                                  │
├────────────────────────────────────────────────────────────────────────────┤
│ Input: CV data + Job description                                           │
│ Output:                                                                    │
│   • Match percentage (0-100)                                               │
│   • Matching/missing skills                                                │
│   • ATS score (format & structure)                                         │
│   • Strengths & improvements                                               │
│                                                                            │
│ Primary: OpenAI GPT-4 (JSON output)                                        │
│ Fallback: Keyword matching + heuristics                                    │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ 7. SKILL GAP ANALYSIS                                                       │
├────────────────────────────────────────────────────────────────────────────┤
│ Input: User skills + Target job skills                                     │
│ Output:                                                                    │
│   • Match percentage                                                       │
│   • Gap analysis with learning time                                        │
│   • Predicted new job matches                                              │
│   • Resource recommendations                                               │
│                                                                            │
│ Algorithm: Rule-based keyword matching                                     │
│ Prediction: Simulated (random within ranges)                               │
└────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────┘

BEFORE (Current issues):
┌────────────────────────────────────────────────────────────────┐
│  ❌ API key in client code                                      │
│     AIWritingAssistant.tsx: OPENROUTER_API_KEY = 'sk-or-v1...' │
│                                                                │
│  ❌ No rate limiting on client                                  │
│     Users can spam AI buttons                                   │
│                                                                │
│  ❌ No prompt injection protection                              │
│     User input concatenated directly into prompts               │
│                                                                │
│  ❌ Limited error handling                                      │
└────────────────────────────────────────────────────────────────┘

AFTER (With new secure implementation):
┌────────────────────────────────────────────────────────────────┐
│  ✅ API key server-side only                                    │
│     Edge Function: process.env.OPENROUTER_API_KEY               │
│                                                                │
│  ✅ Rate limiting (10 req/min per user)                        │
│     Both client-side and server-side checks                     │
│                                                                │
│  ✅ Prompt injection protection                                 │
│     Input sanitization + secure prompt separators               │
│     [SYSTEM]...[USER_CONTENT]...[/USER_CONTENT]                │
│                                                                │
│  ✅ Comprehensive error handling                                │
│     Timeout, auth, rate limit, service errors                   │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           COST OPTIMIZATION                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Current estimated monthly cost:
┌──────────────────────────┬───────────────┬─────────────────────────────┐
│ Service                  │ Cost/månad    │ Notes                       │
├──────────────────────────┼───────────────┼─────────────────────────────┤
│ OpenRouter (Claude 3.5)  │ 500-1000 kr   │ Primary LLM for most features│
│ OpenAI GPT-4             │ 200-500 kr    │ CV analysis only            │
│ Supabase (free tier)     │ 0 kr          │ Edge Functions included     │
├──────────────────────────┼───────────────┼─────────────────────────────┤
│ TOTAL                    │ 700-1500 kr   │                             │
└──────────────────────────┴───────────────┴─────────────────────────────┘

Cost optimization opportunities:
1. Caching: 30-50% reduction for repeated queries
2. Model fallback: Use cheaper models (GPT-3.5) for simple tasks
3. Request batching: Combine multiple operations
4. Client-side preprocessing: Reduce token count

┌─────────────────────────────────────────────────────────────────────────────┐
│                           FUTURE ROADMAP                                      │
└─────────────────────────────────────────────────────────────────────────────┘

Q1 2026 (Immediate):
  ✅ Secure API implementation
  ✅ Rate limiting
  ✅ Prompt injection protection
  🔄 RAG for Knowledge Base integration
  
Q2 2026 (Short-term):
  🔄 Real embeddings (OpenAI text-embedding-3-small)
  🔄 pgvector for similarity search
  🔄 Feedback system (thumbs up/down)
  🔄 Redis caching layer
  
Q3 2026 (Medium-term):
  🔄 Fine-tuned Swedish job search model
  🔄 Multi-modal CV parsing (PDF/images)
  🔄 Predictive interview success model
  
Q4 2026 (Long-term):
  🔄 Autonomous job application agent
  🔄 AI-driven learning paths
  🔄 Integration with Arbetsförmedlingen's AI

* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
                           Generated by AI Engineer Agent
                                    March 2026
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
