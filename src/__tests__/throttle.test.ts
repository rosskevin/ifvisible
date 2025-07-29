/* eslint-disable @typescript-eslint/no-unsafe-return */
import { vi } from 'vitest'

import { throttle } from '../throttle.js'

describe('throttle()', () => {
  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(new Date('2022-06-16'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('imposes limit', () => {
    const spy = vi.fn()
    const throttled = throttle(() => spy(), 100)

    // (total: 0) throttle call invokes immediately
    expect(spy).not.toHaveBeenCalled()
    throttled()
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)

    // (total: 99) advance but do not reach the limit
    vi.advanceTimersByTime(99)
    throttled()
    expect(spy).toHaveBeenCalledTimes(1)

    // (total: 100) advance reaching the limit/reset
    vi.advanceTimersByTime(1)
    throttled()
    expect(spy).toHaveBeenCalledTimes(2)

    // (total: 199) advance but do not reach the limit (second time)
    vi.advanceTimersByTime(99)
    throttled()
    expect(spy).toHaveBeenCalledTimes(2)

    // (total: 200) advance reaching the limit/reset (second time)
    vi.advanceTimersByTime(1)
    throttled()
    expect(spy).toHaveBeenCalledTimes(3)
  })

  it('returns last value when callback only invoked once', () => {
    const spy = vi.fn()
    const throttled = throttle((value: number) => {
      spy()
      return value + 1
    }, 400)

    let i = 0

    // --
    // (total: 0) throttle call invokes immediately
    expect(spy).not.toHaveBeenCalled()
    i = throttled(i)
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)

    // (total: 99) advance but do not reach the limit
    vi.advanceTimersByTime(99)
    i = throttled(i)
    expect(spy).toHaveBeenCalledTimes(1)
    // --

    expect(i).toEqual(1)
  })

  it('returns last value when callback invoked multiple times', () => {
    const spy = vi.fn()
    const throttled = throttle((value: number) => {
      spy()
      return value + 1
    }, 100)

    let i = 0

    // --
    // (total: 0) throttle call invokes immediately
    expect(spy).not.toHaveBeenCalled()
    i = throttled(i)
    i = throttled(i)
    i = throttled(i)
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)

    // (total: 100) advance but do not reach the limit
    vi.advanceTimersByTime(100)
    i = throttled(i)
    i = throttled(i)
    i = throttled(i)
    expect(spy).toHaveBeenCalledTimes(2)
    // --

    expect(i).toEqual(2)
  })
})
