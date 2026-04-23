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
  let lastInvokeTime = 0

  const { leading = false, trailing = true } = options

  const invokeFunc = (time: number) => {
    const args = lastArgs!
    const thisArg = lastThis

    lastArgs = lastThis = null
    lastInvokeTime = time
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

  const leadingEdge = (time: number) => {
    lastInvokeTime = time
    if (leading) {
      return invokeFunc(time)
    }
    return result
  }

  const trailingEdge = (time: number) => {
    timeout = null
    if (trailing && lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = lastThis = null
    return result
  }

  const shouldInvoke = (time: number) => {
    const timeSinceLastCall = lastCallTime === undefined ? 0 : time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      timeSinceLastInvoke >= wait
    )
  }

  const timerExpired = () => {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    const timeSinceLastCall = lastCallTime ? time - lastCallTime : 0
    const timeWaiting = wait - timeSinceLastCall
    startTimer(timerExpired, timeWaiting)
  }

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastThis = this
    lastCallTime = time

    if (isInvoking) {
      if (!timeout) {
        return leadingEdge(lastCallTime)
      }
    }

    if (!timeout) {
      startTimer(timerExpired, wait)
    }

    return result
  } as T & { cancel: () => void; flush: () => void }

  debounced.cancel = () => {
    cancelTimer()
    lastInvokeTime = 0
    timeout = lastArgs = lastCallTime = lastThis = null
  }

  debounced.flush = () => {
    if (!timeout) return result
    return trailingEdge(Date.now())
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
