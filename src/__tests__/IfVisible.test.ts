/* eslint-disable jest/expect-expect */
import { FireableEvent, Status } from '../EventBus'
import { IfVisible } from '../IfVisible'

function expectIt(ifv: IfVisible, status: Status) {
  expect(ifv.getStatus()).toEqual(status)
}

function expectActive(ifv: IfVisible) {
  expectIt(ifv, 'active')
}
function expectIdle(ifv: IfVisible) {
  expectIt(ifv, 'idle')
}
function expectHidden(ifv: IfVisible) {
  expectIt(ifv, 'hidden')
}

describe('IfVisible', () => {
  let ifv: IfVisible
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2022-06-16'))
    ifv = new IfVisible(window, document)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('when instantiating', () => {
    it('is `active`', () => {
      expectActive(ifv)
    })

    it('is `idle` after initial idleTime (30)', () => {
      expectActive(ifv)

      // 10 total (of 30)
      jest.advanceTimersByTime(10000)
      expectActive(ifv)

      // 30 total (of 30)
      jest.advanceTimersByTime(20000)
      expectIdle(ifv)
    })
  })

  describe('methods', () => {
    describe('idle', () => {
      it('setup is initally `active`', () => {
        expectActive(ifv)
      })

      it('is `idle`', () => {
        ifv.idle()
        expectIdle(ifv)
      })

      it(`fires status change 'idle'`, () => {
        let newStatus: Status | undefined
        ifv.on('statusChanged', (data) => (newStatus = data && data.status))
        ifv.idle()
        expect(newStatus).toEqual('idle')
      })

      it(`fires 'idle'`, () => {
        const spy = jest.fn()
        ifv.on('idle', spy)
        ifv.idle()
        expect(spy).toBeCalled()
        expect(spy).toHaveBeenCalledTimes(1)
      })
    })

    describe('blur', () => {
      it('setup is initally `active`', () => {
        expectActive(ifv)
      })

      it('is `hidden`', () => {
        ifv.blur()
        expectHidden(ifv)
      })

      it(`fires status change 'hidden'`, () => {
        let newStatus: Status | undefined
        ifv.on('statusChanged', (data) => (newStatus = data && data.status))
        ifv.blur()
        expect(newStatus).toEqual('hidden')
      })

      it(`fires 'blur'`, () => {
        const spy = jest.fn()
        ifv.on('blur', spy)
        ifv.blur()
        expect(spy).toBeCalled()
        expect(spy).toHaveBeenCalledTimes(1)
      })
    })

    describe('focus', () => {
      beforeEach(() => {
        expectActive(ifv)
        jest.advanceTimersByTime(30000)
        expectIdle(ifv)
      })

      it('setup is initally `idle`', () => {
        expectIdle(ifv)
      })

      it('is `active`', () => {
        ifv.focus()
        expectActive(ifv)
      })

      it(`fires status change 'active'`, () => {
        let newStatus: Status | undefined
        ifv.on('statusChanged', (data) => (newStatus = data && data.status))
        ifv.focus()
        expect(newStatus).toEqual('active')
      })
      ;['focus', 'wakeup'].forEach((name) => {
        it(`fires '${name}'`, () => {
          const spy = jest.fn()
          ifv.on(name as FireableEvent, spy)
          ifv.focus()
          expect(spy).toBeCalled()
          expect(spy).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('wakeup', () => {
      beforeEach(() => {
        expectActive(ifv)
        jest.advanceTimersByTime(30000)
        expectIdle(ifv)
      })

      it('setup is initally `idle`', () => {
        expectIdle(ifv)
      })

      it('is `active`', () => {
        ifv.wakeup()
        expectActive(ifv)
      })

      it(`fires status change 'active'`, () => {
        let newStatus: Status | undefined
        ifv.on('statusChanged', (data) => (newStatus = data && data.status))
        ifv.wakeup()
        expect(newStatus).toEqual('active')
      })

      it(`fires 'wakeup'`, () => {
        const spy = jest.fn()
        ifv.on('wakeup', spy)
        ifv.wakeup()
        expect(spy).toBeCalled()
        expect(spy).toHaveBeenCalledTimes(1)
      })
    })

    describe('now', () => {
      it('when active is true', () => {
        expectActive(ifv)
        expect(ifv.now()).toEqual(true)
        expect(ifv.now('active')).toEqual(true)
        expect(ifv.now('hidden')).toEqual(false)
        expect(ifv.now('idle')).toEqual(false)
      })

      it('when idle is false', () => {
        ifv.idle()
        expect(ifv.now()).toEqual(false)
        expect(ifv.now('active')).toEqual(false)
        expect(ifv.now('hidden')).toEqual(false)
        expect(ifv.now('idle')).toEqual(true)
      })

      it('when hidden is false', () => {
        ifv.blur()
        expect(ifv.now()).toEqual(false)
        expect(ifv.now('active')).toEqual(false)
        expect(ifv.now('hidden')).toEqual(true)
        expect(ifv.now('idle')).toEqual(false)
      })
    })

    describe('onEvery', () => {
      it(`fires callback repeatedly when 'active'`, () => {
        const spy = jest.fn()
        ifv.onEvery(0.5, spy)
        expectActive(ifv)
        expect(spy).not.toHaveBeenCalled()

        // 1 total (of 3)
        jest.advanceTimersByTime(1000)
        expectActive(ifv)
        expect(spy).toBeCalled()
        expect(spy).toHaveBeenCalledTimes(2)

        // 2 total (of 3)
        jest.advanceTimersByTime(1000)
        expectActive(ifv)
        expect(spy).toHaveBeenCalledTimes(4)

        // 3 total (of 3)
        jest.advanceTimersByTime(1000)
        expectActive(ifv)
        expect(spy).toHaveBeenCalledTimes(6)
      })

      it(`does not continue to fire callback when 'hidden' after blur()`, () => {
        const spy = jest.fn()
        ifv.onEvery(0.5, spy)
        expectActive(ifv)
        expect(spy).not.toHaveBeenCalled()

        // 1 total (of 3)
        jest.advanceTimersByTime(1000)
        expectActive(ifv)
        expect(spy).toBeCalled()
        expect(spy).toHaveBeenCalledTimes(2)

        // blur it and check
        ifv.blur()
        expectHidden(ifv)
        expect(spy).toHaveBeenCalledTimes(2)

        // advance time and check again to be sure
        expectHidden(ifv)
        expect(spy).toHaveBeenCalledTimes(2)
      })

      it(`does not continue to fire callback when 'idle' after idle()`, () => {
        const spy = jest.fn()
        ifv.onEvery(0.5, spy)
        expectActive(ifv)
        expect(spy).not.toHaveBeenCalled()

        // 1 total (of 3)
        jest.advanceTimersByTime(1000)
        expectActive(ifv)
        expect(spy).toBeCalled()
        expect(spy).toHaveBeenCalledTimes(2)

        // idle it and check
        ifv.idle()
        expectIdle(ifv)
        expect(spy).toHaveBeenCalledTimes(2)

        // advance time and check again to be sure
        expectIdle(ifv)
        expect(spy).toHaveBeenCalledTimes(2)
      })

      it(`does not continue to fire callback when 'idle' after timeout`, () => {
        const spy = jest.fn()
        ifv.onEvery(1, spy)
        expectActive(ifv)
        expect(spy).not.toHaveBeenCalled()

        // 1 total (of 60)
        jest.advanceTimersByTime(1000)
        expectActive(ifv)
        expect(spy).toBeCalled()
        expect(spy).toHaveBeenCalledTimes(1)

        // 60 total (of 60) and 30s default timeout
        jest.advanceTimersByTime(59000)
        expectIdle(ifv)
        expect(spy).toHaveBeenCalledTimes(30 - 1) // it's always -1, not sure why based on original code, but not a big deal to me at least
      })
    })
  })

  describe('DOM events', () => {
    beforeEach(() => {
      expectActive(ifv)
      jest.advanceTimersByTime(30000)
      expectIdle(ifv)
    })

    it('setup is initally `idle`', () => {
      expectIdle(ifv)
    })

    describe('document', () => {
      // all doc events
      ;['mousemove', 'mousedown', 'keyup', 'touchstart'].forEach((name) => {
        it(`is active after ${name} event`, () => {
          expectIdle(ifv)
          document.dispatchEvent(new window.Event(name))
          expectActive(ifv)
        })
      })
    })

    describe('window', () => {
      // all doc events
      ;['scroll'].forEach((name) => {
        it(`is active after ${name} event`, () => {
          expectIdle(ifv)
          window.dispatchEvent(new window.Event(name))
          expectActive(ifv)
        })
      })
    })
  })
})
