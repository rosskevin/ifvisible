import { Data, EventBus } from '../EventBus'

let eventBus: EventBus

describe('Events', () => {
  beforeEach(() => {
    eventBus = new EventBus()
  })

  it('should register and fire event', () => {
    expect.assertions(1)
    eventBus.attach('statusChanged', () => {
      expect(true).toBe(true)
    })
    eventBus.fire('statusChanged')
  })

  it('should register and fire multiple events with same name', () => {
    expect.assertions(2)
    eventBus.attach('statusChanged', () => {
      expect(1).toBe(1)
    })
    eventBus.attach('statusChanged', () => {
      expect(2).toBe(2)
    })
    eventBus.fire('statusChanged')
  })

  it('should pass arguments to event handler', () => {
    expect.assertions(1)
    eventBus.attach('statusChanged', (data) => {
      expect(data?.status).toEqual('active')
    })
    eventBus.fire('statusChanged', { status: 'active' })
  })

  it('should remove events', () => {
    expect.assertions(1)
    eventBus.attach('statusChanged', (data) => {
      expect(data?.status).toEqual('active')
    })
    eventBus.fire('statusChanged', { status: 'active' })
    eventBus.remove('statusChanged')
    eventBus.fire('statusChanged', { status: 'hidden' })
    // should not fire the event again, only one assertion
  })

  it('should remove events just the given event', () => {
    expect.assertions(3)
    const handler = (data: Data) => {
      expect(data?.status).toEqual('active')
    }
    eventBus.attach('statusChanged', handler)
    eventBus.attach('statusChanged', (data) => {
      expect(data?.status).toEqual('active')
    })
    eventBus.fire('statusChanged', { status: 'active' })
    eventBus.remove('statusChanged', handler) // removes the first one but leaves the second
    eventBus.fire('statusChanged', { status: 'active' })
    // in total 3 assertions were fired instead of 4
  })
})
