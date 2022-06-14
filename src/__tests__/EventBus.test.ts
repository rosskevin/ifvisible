import { EventBus } from '../EventBus'

let eventBus: EventBus

describe('Events', () => {
  beforeEach(() => {
    eventBus = new EventBus()
  })

  it('should register and fire event', () => {
    expect.assertions(1)
    eventBus.attach('test', () => {
      expect(true).toBe(true)
    })
    eventBus.fire('test')
  })

  it('should register and fire multiple events with same name', () => {
    expect.assertions(2)
    eventBus.attach('test', () => {
      expect(1).toBe(1)
    })
    eventBus.attach('test', () => {
      expect(2).toBe(2)
    })
    eventBus.fire('test')
  })

  it('should pass arguments to event handler', () => {
    expect.assertions(1)
    eventBus.attach('test', (...args) => {
      expect(args).toEqual([1, 2, 3, 4])
    })
    eventBus.fire('test', [1, 2, 3, 4])
  })

  it('should remove events', () => {
    expect.assertions(1)
    eventBus.attach('test', (...args) => {
      expect(args).toEqual([1, 2, 3, 4])
    })
    eventBus.fire('test', [1, 2, 3, 4])
    eventBus.remove('test')
    eventBus.fire('test', [1, 2, 3, 4])
    // should not fire the event again, only one assertion
  })

  it('should remove events just the given event', () => {
    expect.assertions(3)
    const handler = (...args) => {
      expect(args).toEqual([1, 2, 3, 4])
    }
    eventBus.attach('test', handler)
    eventBus.attach('test', (...args) => {
      expect(args).toEqual([1, 2, 3, 4])
    })
    eventBus.fire('test', [1, 2, 3, 4])
    eventBus.remove('test', handler) // removes the first one but leaves the second
    eventBus.fire('test', [1, 2, 3, 4])
    // in total 3 assertions were fired instead of 4
  })
})
