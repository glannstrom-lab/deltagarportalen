/**
 * Cloud Storage Service — tunn barrel (KA3, 2026-09-12).
 *
 * Implementationen ligger i services/cloud/<domän>.ts; den här filen finns
 * kvar så de ~31 importörerna av '@/services/cloudStorage' inte behöver
 * röras i samma ändring. När importerna flyttat till '@/services/cloud'
 * tas filen bort. Samma exportnamn och typer som före uppdelningen —
 * vaktat av API-ytetestet i cloudStorage.test.ts.
 *
 * OBS: Alla funktioner hanterar RLS-fel (42501) genom att falla tillbaka på localStorage
 */

export * from './cloud'
