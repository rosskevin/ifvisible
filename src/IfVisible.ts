import { EventBus, FireableEvent, FireableEventCallback, Status } from './EventBus'
import { isHidden, resolveVisibilityChangeEvent } from './hidden'

export interface IIdleInfo {
  isIdle: boolean
  idleFor: number
  timeLeft: number
  timeLeftPer: number
}

type TimerCallback = () => void
class Timer {
  private id: NodeJS.Timeout | string | number | undefined // NodeJS.Timer
  private ifvInstance: IfVisible
  private seconds: number
  private callback: TimerCallback

  constructor(ifvInstance: IfVisible, seconds: number, callback: TimerCallback) {
    this.ifvInstance = ifvInstance
    this.seconds = seconds
    this.callback = callback
    this.start()

    this.ifvInstance.on('statusChanged', (data) => {
      data?.status === 'active' ? this.start() : this.pause()
    })
  }

  public stop() {
    clearInterval(this.id)
  }

  public resume() {
    this.start()
  }

  public pause() {
    this.stop()
  }

  private start() {
    if (this.id !== undefined) clearInterval(this.id)
    this.id = setInterval(this.callback, this.seconds * 1000)
  }
}

export class IfVisible {
  private status: Status = 'active'
  private timers: NodeJS.Timeout[] = []
  private idleTime = 30000
  private idleStartedTime?: number
  private win: Window
  private doc: Document
  private eventBus: EventBus

  constructor(win: Window, doc: Document) {
    this.win = win
    this.doc = doc
    this.eventBus = new EventBus()

    const trackChange = () => {
      if (isHidden(this.doc)) {
        this.blur()
      } else {
        this.focus()
      }
    }
    trackChange() // get initial status
    this.doc.addEventListener(
      resolveVisibilityChangeEvent(doc) as 'visibilitychange', // cast it to look like a modern browser event, don't leak type casting everywhere
      trackChange,
    )

    this.startIdleTimer()
    this.trackIdleStatus()
  }

  public trackIdleStatus() {
    this.doc.addEventListener('mousemove', () => this.startIdleTimer())
    this.doc.addEventListener('mousedown', () => this.startIdleTimer())
    this.doc.addEventListener('keyup', () => this.startIdleTimer())
    this.doc.addEventListener('touchstart', () => this.startIdleTimer())
    this.win.addEventListener('scroll', () => this.startIdleTimer())
    // When page is focused without any event, it should not be idle.
    this.focus(() => this.startIdleTimer())
  }

  public on(event: FireableEvent, callback: FireableEventCallback): IfVisible {
    this.eventBus.attach(event, callback)
    return this
  }

  public off(event: FireableEvent, callback?: FireableEventCallback): IfVisible {
    this.eventBus.remove(event, callback)
    return this
  }

  public setIdleDuration(seconds: number): IfVisible {
    this.idleTime = seconds * 1000
    this.startIdleTimer()
    return this
  }

  public getIdleDuration(): number {
    return this.idleTime
  }

  public getIdleInfo(): IIdleInfo {
    const now = +new Date()
    let res: IIdleInfo
    const idleFor = this.idleStartedTime ? now - this.idleStartedTime : 0
    if (this.status === 'idle') {
      res = {
        isIdle: true,
        idleFor,
        timeLeft: 0,
        timeLeftPer: 100,
      }
    } else {
      const timeLeft = this.idleStartedTime
        ? this.idleStartedTime + this.idleTime - now
        : this.idleTime
      res = {
        isIdle: false,
        idleFor,
        timeLeft,
        timeLeftPer: parseFloat((100 - (timeLeft * 100) / this.idleTime).toFixed(2)),
      }
    }
    return res
  }

  public idle(callback?: FireableEventCallback): IfVisible {
    // used like a setter
    if (callback) {
      this.on('idle', callback)
    } else {
      this.status = 'idle'
      this.eventBus.fire('idle')
      this.eventBus.fire('statusChanged', { status: this.status })
    }
    return this
  }

  public blur(callback?: FireableEventCallback): IfVisible {
    // used like a setter
    if (callback) {
      this.on('blur', callback)
    } else {
      this.status = 'hidden'
      this.eventBus.fire('blur')
      this.eventBus.fire('statusChanged', { status: this.status })
    }
    return this
  }

  public focus(callback?: FireableEventCallback): IfVisible {
    // used like a setter
    if (callback) {
      this.on('focus', callback)
    } else if (this.status !== 'active') {
      this.status = 'active'
      this.eventBus.fire('focus')
      this.eventBus.fire('wakeup')
      this.eventBus.fire('statusChanged', { status: this.status })
    }
    return this
  }

  public wakeup(callback?: FireableEventCallback): IfVisible {
    // used like a setter
    if (callback) {
      this.on('wakeup', callback)
    } else if (this.status !== 'active') {
      this.status = 'active'
      this.eventBus.fire('wakeup')
      this.eventBus.fire('statusChanged', { status: this.status })
    }
    return this
  }

  public onEvery(seconds: number, callback: TimerCallback): Timer {
    return new Timer(this, seconds, callback)
  }

  public now(check?: Status): boolean {
    if (check !== undefined) {
      return this.status === check
    }
    return this.status === 'active'
  }

  public getStatus() {
    return this.status
  }

  private startIdleTimer(event?: Event) {
    // Prevents Phantom events.
    if (event instanceof MouseEvent && event.movementX === 0 && event.movementY === 0) {
      return
    }

    this.timers.map(clearTimeout)
    this.timers.length = 0 // clear the array

    if (this.status === 'idle') {
      this.wakeup()
    }

    this.idleStartedTime = +new Date()

    this.timers.push(
      setTimeout(() => {
        if (this.status === 'active' || this.status === 'hidden') {
          this.idle()
        }
      }, this.idleTime),
    )
  }
}
