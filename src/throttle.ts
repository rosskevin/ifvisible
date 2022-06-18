export type Throttled<T extends (...args: any) => any> = (...args: Parameters<T>) => ReturnType<T>

/**
 * Creates a throttled {callback} will be called at most once per {limit} millisonds.
 *
 * @param callback - function
 * @param limit - milliseconds
 * @return - In limit mode, it will return last result of the {callback}, otherwise it will invoke the {callback}
 */
export function throttle<T extends (...args: any) => any>(
  callback: T,
  limit: number,
): Throttled<T> {
  let inThrottle: boolean
  let lastResult: ReturnType<T>

  return function (this: any, ...args): ReturnType<T> {
    if (!inThrottle) {
      inThrottle = true

      setTimeout(() => (inThrottle = false), limit)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      lastResult = callback.apply(this, args)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return lastResult as any
  }
}
