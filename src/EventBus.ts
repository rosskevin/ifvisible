/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-types */

export type FireableEvent = 'idle' | 'statusChanged' | 'blur' | 'focus' | 'wakeup'
/** In use 'mousemove' | 'mousedown' | 'keyup' | 'touchstart' | 'scroll' */
export type DomTrackableEvent = keyof DocumentEventMap | keyof DocumentEventMap
export type DomCallback = (this: HTMLElement, ev: DomTrackableEvent) => any

export class EventBus {
  private store: { [event: string]: Function[] }
  private setListener?: (
    docOrWindow: Document | Window,
    event: DomTrackableEvent,
    callback: DomCallback,
  ) => any

  constructor() {
    this.store = {}
  }

  public attach(event: FireableEvent, callback: Function) {
    if (!this.store[event]) {
      this.store[event] = []
    }
    this.store[event].push(callback)
  }

  public fire(event: FireableEvent, args = []) {
    if (this.store[event]) {
      this.store[event].forEach((callback) => {
        callback(...args)
      })
    }
  }

  public remove(event: FireableEvent, callback?: Function) {
    if (!callback) {
      delete this.store[event]
    }
    if (this.store[event]) {
      this.store[event] = this.store[event].filter((savedCallback) => {
        return callback !== savedCallback
      })
    }
  }

  public dom(docOrWindow: Document | Window, event: DomTrackableEvent, callback: DomCallback) {
    if (!this.setListener) {
      if (docOrWindow.addEventListener !== undefined) {
        this.setListener = (el, ev, fn) => {
          return el.addEventListener(ev, fn, false)
        }
      } else if (typeof (docOrWindow as any).attachEvent === 'function') {
        this.setListener = (el, ev, fn) => {
          return (el as any).attachEvent(`on${ev}`, fn, false)
        }
      } else {
        this.setListener = (el, ev, fn) => {
          return ((el as any)[`on${ev}`] = fn)
        }
      }
    }
    return this.setListener(docOrWindow, event, callback)
  }
}
