/**
 * Jobbevakningens portalnotis (2026-08-26).
 *
 * ## Varför den här filen finns
 *
 * Portalen hade tre notistabeller och ingen fungerande väg mellan dem:
 *
 * - `notifications` — läses av `NotificationBell` i toppnaven via
 *   `hooks/useNotifications.ts`. Den enda skrivaren i klientkoden,
 *   `createNotification()`, hade **noll anropare**. Prod: 0 rader. Klockan var
 *   alltså tom av konstruktion, inte för att inget hänt.
 * - `job_notifications` — skrivs av cron-körningen, läses av `AlertsTab`. Den
 *   här kedjan var hel.
 * - `user_notifications` — skrevs av en fallback i `sendEmail()`s catch-block,
 *   läses bara av `notificationsService.ts` och `NotificationsCenter.tsx`, som
 *   båda är onåbara från `main.tsx`. Insertet saknade dessutom `user_id`.
 *   Borttagen.
 *
 * Notisen byggs numera av `byggPortalnotis()`, som är ren just för att den ska
 * gå att pröva utan databas. Ett test som mockar `.insert()` bevisar bara att
 * mocken anropades — samma fälla som `journey_goals` (mockad klient) och
 * `useJobsokHubSummary.test.ts` (asserterade den trasiga formen).
 *
 * Testet kan falla: sätt tillbaka `#` i `action_url` och sökvägstestet faller;
 * byt entalsgrenen mot mallsträngen och pluraltestet faller.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jobAlerts = require('../../api/job-alerts.js') as {
  byggPortalnotis: (
    userId: string,
    alert: { id: string; name?: string },
    antalNyaJobb: number
  ) => {
    user_id: string
    type: string
    title: string
    message: string
    action_url: string
    data: { alert_id: string; new_jobs: number }
  }
  tolkaMejlbrytare: (rad: { email_notifications?: boolean | null } | null | undefined) => boolean
}

const { byggPortalnotis } = jobAlerts

describe('byggPortalnotis', () => {
  it('skriver till den tabellform klockan faktiskt läser', () => {
    const rad = byggPortalnotis('u-1', { id: 'a-1', name: 'Lagerarbete Göteborg' }, 3)

    // NOTIFICATION_COLUMNS i useNotifications.ts kräver alla fyra.
    expect(rad.user_id).toBe('u-1')
    expect(rad.type).toBe('job_match')
    expect(rad.title).toBeTruthy()
    expect(rad.message).toBeTruthy()
  })

  it('type är en av de typer NotificationType tillåter', () => {
    // Fel typ ger ingen databasfel — tabellen saknar check-constraint — men
    // notificationConfig slår upp ikon och färg på den, och en okänd typ
    // renderar tomt.
    const tillatna = [
      'message',
      'job_match',
      'discussion',
      'friend_request',
      'system',
      'info',
      'success',
      'warning',
    ]
    expect(tillatna).toContain(byggPortalnotis('u', { id: 'a' }, 1).type)
  })

  it('action_url är en router-sökväg utan #, annars leder klockan ingenstans', () => {
    // HashRouter + navigate(action_url). Ett '/#/...' blir '#/#/...'.
    const { action_url } = byggPortalnotis('u', { id: 'a' }, 1)
    expect(action_url).toBe('/job-search/alerts')
    expect(action_url).not.toContain('#')
  })

  it('räknar ett jobb i singular och flera i plural', () => {
    const ett = byggPortalnotis('u', { id: 'a', name: 'Vård' }, 1)
    expect(ett.title).toBe('Ett nytt jobb i din bevakning')
    expect(ett.message).toContain('ett nytt jobb')
    expect(ett.message).not.toContain('1 nya')

    const flera = byggPortalnotis('u', { id: 'a', name: 'Vård' }, 4)
    expect(flera.title).toBe('4 nya jobb i din bevakning')
    expect(flera.message).toContain('4 nya jobb')
  })

  it('namnger bevakningen så notisen går att koppla till rätt sökning', () => {
    const rad = byggPortalnotis('u', { id: 'a-9', name: 'Truckförare Skåne' }, 2)
    expect(rad.message).toContain('Truckförare Skåne')
    expect(rad.data).toEqual({ alert_id: 'a-9', new_jobs: 2 })
  })

  it('en bevakning utan namn ger en läsbar mening, inte "undefined"', () => {
    const rad = byggPortalnotis('u', { id: 'a' }, 2)
    expect(rad.message).not.toContain('undefined')
    expect(rad.message).toContain('din bevakning')
  })
})

describe('tolkaMejlbrytare — huvudbrytaren för e-post', () => {
  const { tolkaMejlbrytare } = jobAlerts

  it('ett uttryckligt false stoppar mejlet', () => {
    expect(tolkaMejlbrytare({ email_notifications: false })).toBe(false)
  })

  it('ett uttryckligt true skickar', () => {
    expect(tolkaMejlbrytare({ email_notifications: true })).toBe(true)
  })

  it('ingen rad = användaren har aldrig rört reglaget, och settingsStore står på true', () => {
    expect(tolkaMejlbrytare(null)).toBe(true)
    expect(tolkaMejlbrytare(undefined)).toBe(true)
  })

  it('null i kolumnen är inte ett nej', () => {
    // Kolumnen är nullable i prod. `null` betyder "inte satt", inte "avstängt".
    expect(tolkaMejlbrytare({ email_notifications: null })).toBe(true)
  })
})

describe('brytaren gäller båda utskicksvägarna', () => {
  // Källkodsvakt, inte beteendetest: de två avsändarna ligger i olika
  // funktioner (`checkUserAlerts` och `sendDailyDigest`) och det är precis
  // sådana grenar som glider isär — sanningsregeln på en av fem AI-agenter,
  // A23-grinden på tre av fyra Perplexity-anropare. Faller den här när någon
  // lägger till en tredje utskicksväg är det avsikten.
  const kalla = readFileSync(join(__dirname, '..', '..', 'api', 'job-alerts.js'), 'utf8')

  /** Klipper ut en funktionskropp ur källan, från deklarationen till nästa. */
  const kropp = (namn: string) => {
    const start = kalla.indexOf(`async function ${namn}(`)
    expect(start, `${namn} hittades inte i job-alerts.js`).toBeGreaterThan(-1)
    const nasta = kalla.indexOf('\nasync function ', start + 1)
    return kalla.slice(start, nasta === -1 ? undefined : nasta)
  }

  it.each(['checkUserAlerts', 'sendDailyDigest'])('%s frågar brytaren innan den mejlar', (namn) => {
    // Kommentarer räknas inte — bara ett riktigt anrop, med await.
    expect(kropp(namn)).toMatch(/await mejlArPaslaget\(/)
  })

  it('skriver inte längre till user_notifications, som ingen levande vy läser', () => {
    expect(kalla).not.toContain("from('user_notifications')")
  })

  it('skriver portalnotisen till notifications, som klockan läser', () => {
    expect(kalla).toContain("from('notifications')")
  })
})
