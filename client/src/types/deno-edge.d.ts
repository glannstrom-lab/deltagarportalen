/**
 * Minimal ambient-deklaration av `Deno` för klientens TypeScript-program.
 *
 * Varför den finns (DR1, 2026-08-17): `src/test/edge-cors.test.ts` importerar
 * `supabase/functions/_shared/cors.ts` för att kunna testa edge-funktionernas
 * CORS-lager. Det är projektets första test som rör `supabase/functions/`
 * överhuvudtaget, och det behövdes eftersom ett fel där gjorde
 * `send-inactivity-warning` oåtkomlig i drift utan att något kunde larma.
 *
 * Importen drar in Deno-filen i klientens program, och `Deno` finns inte i
 * webbläsarens typmiljö — därav TS2304 på fem rader. Alternativen var:
 *
 *   1. Låta bli att testa edge-koden. Det var läget före den här dagen, och
 *      det är hur DR1 kunde ligga oupptäckt.
 *   2. Ladda hela `@types/deno`. Överdrivet — filen använder ett (1) API.
 *   3. Den här: deklarera exakt den yta som faktiskt används.
 *
 * **Avsiktligt smal.** Bara `Deno.env.get` finns här. Skriver någon
 * `Deno.readFile` i klientkod failar typkontrollen, vilket är rätt: klienten
 * kör i en webbläsare och har ingen Deno-runtime. Behöver ett framtida
 * edge-test fler API:er ska de läggas till här medvetet, en i taget.
 */

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}
