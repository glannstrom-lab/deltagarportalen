/**
 * Debounce and throttle utilities
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T & { cancel: () => void; flush: () => void } {
  let timeout: NodeJS.Timeout | null = null
  let lastArgs: unknown[] | null = null
  let lastThis: unknown = null
  let result: unknown
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
    result = func.apply(thisArg, args as Parameters<T>)
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

  const debounced = function (this: unknown, ...args: Parameters<T>) {
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
  } as T & { cancel: () => void; flush: () => void }

  debounced.cancel = () => {
    cancelTimer()
    timeout = lastArgs = lastCallTime = lastThis = null
  }

  debounced.flush = () => {
    if (!timeout) return result
    return trailingEdge()
  }

  return debounced
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let lastCallTime: number | undefined
  let timeout: NodeJS.Timeout | null = null
  let lastArgs: unknown[] | null = null
  let lastThis: unknown = null

  const invoke = () => {
    const args = lastArgs!
    const thisArg = lastThis
    lastArgs = lastThis = null
    lastCallTime = Date.now()
    func.apply(thisArg, args as Parameters<T>)
  }

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now()
    const remaining = lastCallTime ? wait - (now - lastCallTime) : 0

    lastArgs = args
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- behövs för korrekt this-binding i throttled funktion
    lastThis = this

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      invoke()
    } else if (!timeout) {
      timeout = setTimeout(invoke, remaining)
    }
  } as T & { cancel: () => void }

  throttled.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    lastCallTime = undefined
    lastArgs = lastThis = null
  }

  return throttled
}

/**
 * React hook for debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Import useState and useEffect for the hook
import { useState, useEffect } from 'react'
