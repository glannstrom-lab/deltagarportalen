/**
 * Debounce utility
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
/**
 * `Args`/`R` i stället för `T extends (...args: unknown[]) => unknown`:
 * den gamla signaturen krävde att ANROPARENS funktion tog `unknown[]` —
 * kontravarians gör att en funktion med en konkret parametertyp (t.ex.
 * `(prefs: Partial<ProfilePreferences>) => Promise<void>`) inte är
 * tilldelningsbar dit (TS2345, hittad i `profileStore.ts` 2026-09-22). Den
 * här formen (samma mönster som `@types/lodash.debounce`) låter TS sluta
 * sig till de riktiga parameter- och returtyperna i stället.
 */
export function debounce<Args extends unknown[], R>(
  func: (...args: Args) => R,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): ((...args: Args) => R | undefined) & { cancel: () => void; flush: () => void } {
  let timeout: NodeJS.Timeout | null = null
  let lastArgs: Args | null = null
  let lastThis: unknown = null
  let result: R | undefined
  let lastCallTime: number | undefined
  // `lastInvokeTime` fanns här och skrevs på tre ställen, men lästes bara av
  // maxWait-klausulen i shouldInvoke — den som visade sig vara fel och togs
  // bort 2026-08-05. Utan läsare är den bara skräp som ser ut att betyda något.

  const { leading = false, trailing = true } = options

  // Tog tidigare emot `time` enbart för att sätta `lastInvokeTime`. Den
  // variabeln har ingen läsare längre (se kommentaren ovan), så parametern
  // är borta i stället för att stå kvar oanvänd.
  const invokeFunc = () => {
    const args = lastArgs!
    const thisArg = lastThis

    lastArgs = lastThis = null
    result = func.apply(thisArg, args)
    return result
  }

  const startTimer = (pendingFunc: () => void, wait: number) => {
    timeout = setTimeout(pendingFunc, wait)
  }

  const cancelTimer = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  const leadingEdge = () => {
    // Timern MÅSTE startas här, annars finns ingen trailing edge att landa på.
    // Raden saknades och gjorde att det FÖRSTA anropet efter en tyst period
    // försvann tyst: `debounced()` satte lastArgs, men utan timer kallades
    // trailingEdge aldrig. Enda konsumenten är profileStore._debouncedSave-
    // Preferences (800 ms) — en deltagare som bockade i EN inställning och
    // lämnade sidan fick den aldrig sparad. (Hittad 2026-08-05 under D13.)
    startTimer(timerExpired, wait)
    if (leading) {
      return invokeFunc()
    }
    return result
  }

  const trailingEdge = () => {
    timeout = null
    if (trailing && lastArgs) {
      return invokeFunc()
    }
    lastArgs = lastThis = null
    return result
  }

  const shouldInvoke = (time: number) => {
    const timeSinceLastCall = lastCallTime === undefined ? 0 : time - lastCallTime

    // `timeSinceLastInvoke >= wait` fanns här tidigare. Det är lodash
    // maxWait-gren, och den här implementationen har ingen maxWait-option —
    // klausulen kördes alltså med `wait` och ankrade fönstret till FÖRSTA
    // anropet i skuren i stället för det sista. Följden var throttle-beteende
    // i en funktion som heter debounce: `debounced('a')` vid t=0 och
    // `debounced('b')` vid t=50 anropade func redan vid t=100, trots att bara
    // 50 ms gått sedan 'b'. (Hittad 2026-08-05 ihop med den saknade timern.)
    return lastCallTime === undefined || timeSinceLastCall >= wait || timeSinceLastCall < 0
  }

  const timerExpired = () => {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge()
    }
    const timeSinceLastCall = lastCallTime ? time - lastCallTime : 0
    const timeWaiting = wait - timeSinceLastCall
    startTimer(timerExpired, timeWaiting)
  }

  const debounced = function (this: unknown, ...args: Args) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- behövs för korrekt this-binding i debounced funktion
    lastThis = this
    lastCallTime = time

    if (isInvoking) {
      if (!timeout) {
        return leadingEdge()
      }
    }

    if (!timeout) {
      startTimer(timerExpired, wait)
    }

    return result
  } as ((...args: Args) => R | undefined) & { cancel: () => void; flush: () => void }

  debounced.cancel = () => {
    cancelTimer()
    // `lastCallTime` är `number | undefined`, inte `| null` — en kedjad
    // `= null`-tilldelning över alla fyra fällde TS2322 här.
    timeout = null
    lastArgs = null
    lastThis = null
    lastCallTime = undefined
  }

  debounced.flush = () => {
    if (!timeout) return result
    return trailingEdge()
  }

  return debounced
}

// `throttle` och `useDebouncedValue` borttagna 2026-09-22: noll anropare i
// src (bara sina egna tester). `throttle` hade dessutom en bugg — den
// schemalagda körningen nollade aldrig `timeout`, så ett anrop inom fönstret
// EFTER en fördröjd körning schemalades aldrig och tappades tyst. Behövs en
// throttle igen: skriv den med ett test för just det fallet.
