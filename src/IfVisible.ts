/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { EventBus } from './EventBus'
import { getIEVersion } from './util'

export type Status = 'active' | 'idle' | 'hidden'
export type DocHidden = 'hidden' | 'mozHidden' | 'msHidden' | 'webkitHidden'
export type VisiblityChange =
  | 'visibilitychange'
  | 'mozvisibilitychange'
  | 'msvisibilitychange'
  | 'webkitvisibilitychange'

const ieVersion = getIEVersion()

export interface IIdleInfo {
  isIdle: boolean
  idleFor: number
  timeLeft: number
  timeLeftPer: number
}

class Timer {
  private id: NodeJS.Timeout | string | number | undefined // NodeJS.Timer
  private stopped: boolean
  private ifvInstance: IfVisible
  private seconds: number
  private callback: Function

  constructor(ifvInstance: IfVisible, seconds: number, callback: Function) {
    this.ifvInstance = ifvInstance
    this.seconds = seconds
    this.stopped = false
    this.start()

    this.ifvInstance.on('statusChanged', (data) => {
      if (this.stopped === false) {
        if (data.status === 'active') {
          this.start()
        } else {
          this.pause()
        }
      }
    })
  }

  public stop() {
    this.stopped = true
    clearInterval(this.id)
  }

  public resume() {
    this.start()
  }

  public pause() {
    this.stop()
  }

  private start() {
    this.stopped = false
    clearInterval(this.id)
    this.id = setInterval(this.callback, this.seconds * 1000)
  }
}

export class IfVisible {
  private status: Status = 'active'
  private timers: NodeJS.Timeout[] = []
  private idleTime = 30000
  private idleStartedTime: number
  private isLegacyModeOn = false
  private root: any
  private doc: Document
  private eventBus: EventBus
  private docHidden: DocHidden
  private visibilityChangeEvent: VisiblityChange

  constructor(root: any /*Window*/, doc: Document) {
    this.root = root
    this.doc = doc
    this.eventBus = new EventBus()

    // Find correct browser events
    if (this.doc.hidden !== undefined) {
      this.docHidden = 'hidden'
      this.visibilityChangeEvent = 'visibilitychange'
    } else if ((this.doc as any).mozHidden !== undefined) {
      this.docHidden = 'mozHidden'
      this.visibilityChangeEvent = 'mozvisibilitychange'
    } else if ((this.doc as any).msHidden !== undefined) {
      this.docHidden = 'msHidden'
      this.visibilityChangeEvent = 'msvisibilitychange'
    } else if ((this.doc as any).webkitHidden !== undefined) {
      this.docHidden = 'webkitHidden'
      this.visibilityChangeEvent = 'webkitvisibilitychange'
    }

    if (this.docHidden === undefined) {
      this.legacyMode()
    } else {
      const trackChange = () => {
        if (this.doc[this.docHidden]) {
          this.blur()
        } else {
          this.focus()
        }
      }
      trackChange() // get initial status
      this.eventBus.dom(this.doc, this.visibilityChangeEvent, trackChange)
    }
    this.startIdleTimer()
    this.trackIdleStatus()
  }

  public legacyMode() {
    // it's already on
    if (this.isLegacyModeOn) {
      return
    }

    let BLUR_EVENT = 'blur'
    const FOCUS_EVENT = 'focus'

    if (ieVersion < 9) {
      BLUR_EVENT = 'focusout'
    }

    this.eventBus.dom(this.root, BLUR_EVENT, () => {
      return this.blur()
    })

    this.eventBus.dom(this.root, FOCUS_EVENT, () => {
      return this.focus()
    })

    this.isLegacyModeOn = true
  }

  public startIdleTimer(event?: Event) {
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
          return this.idle()
        }
      }, this.idleTime),
    )
  }

  public trackIdleStatus() {
    this.eventBus.dom(this.doc, 'mousemove', this.startIdleTimer.bind(this))
    this.eventBus.dom(this.doc, 'mousedown', this.startIdleTimer.bind(this))
    this.eventBus.dom(this.doc, 'keyup', this.startIdleTimer.bind(this))
    this.eventBus.dom(this.doc, 'touchstart', this.startIdleTimer.bind(this))
    this.eventBus.dom(this.root, 'scroll', this.startIdleTimer.bind(this))
    // When page is focus without any event, it should not be idle.
    this.focus(this.startIdleTimer.bind(this))
  }

  public on(event: string, callback: (data: any) => any): IfVisible {
    this.eventBus.attach(event, callback)
    return this
  }

  public off(event: string, callback?: any): IfVisible {
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
    if (this.status === 'idle') {
      res = {
        isIdle: true,
        idleFor: now - this.idleStartedTime,
        timeLeft: 0,
        timeLeftPer: 100,
      }
    } else {
      const timeLeft = this.idleStartedTime + this.idleTime - now
      res = {
        isIdle: false,
        idleFor: now - this.idleStartedTime,
        timeLeft,
        timeLeftPer: parseFloat((100 - (timeLeft * 100) / this.idleTime).toFixed(2)),
      }
    }
    return res
  }

  public idle(callback?: (data: any) => any): IfVisible {
    if (callback) {
      this.on('idle', callback)
    } else {
      this.status = 'idle'
      this.eventBus.fire('idle')
      this.eventBus.fire('statusChanged', [{ status: this.status }])
    }
    return this
  }

  public blur(callback?: (data: any) => any): IfVisible {
    if (callback) {
      this.on('blur', callback)
    } else {
      this.status = 'hidden'
      this.eventBus.fire('blur')
      this.eventBus.fire('statusChanged', [{ status: this.status }])
    }
    return this
  }

  public focus(callback?: (data: any) => any): IfVisible {
    if (callback) {
      this.on('focus', callback)
    } else if (this.status !== 'active') {
      this.status = 'active'
      this.eventBus.fire('focus')
      this.eventBus.fire('wakeup')
      this.eventBus.fire('statusChanged', [{ status: this.status }])
    }
    return this
  }

  public wakeup(callback?: (data: any) => any): IfVisible {
    if (callback) {
      this.on('wakeup', callback)
    } else if (this.status !== 'active') {
      this.status = 'active'
      this.eventBus.fire('wakeup')
      this.eventBus.fire('statusChanged', [{ status: this.status }])
    }
    return this
  }

  public onEvery(seconds: number, callback: Function): Timer {
    return new Timer(this, seconds, callback)
  }

  public now(check?: string): boolean {
    if (check !== undefined) {
      return this.status === check
    }
    return this.status === 'active'
  }
}
