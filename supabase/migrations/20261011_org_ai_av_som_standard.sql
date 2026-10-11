-- KSL25 / beslut Mikael 2026-10-11: nya organisationer (kommun, leverantör) startar
-- med AI avstängt. Kunden slår på det själv (chefen under Inställningar → Din
-- organisation, eller superadmin). Skäl: AI-anropen går via OpenRouter i USA, och
-- det är det som oftast stoppar en kommuns dataskyddsombud (sakerhet-saljberedskap.md).
-- Befintliga organisationer rörs inte — bara standardvärdet för nya rader ändras.
ALTER TABLE public.organizations ALTER COLUMN ai_enabled SET DEFAULT false;
