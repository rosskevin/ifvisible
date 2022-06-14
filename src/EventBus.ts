/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-types */
export class EventBus {
  private store
  private setListener?: Function

  constructor() {
    this.store = {}
  }

  public attach(event: string, callback: Function) {
    if (!this.store[event]) {
      this.store[event] = []
    }
    this.store[event].push(callback)
  }

  public fire(event: string, args = []) {
    if (this.store[event]) {
      this.store[event].forEach((callback) => {
        callback(...args)
      })
    }
  }

  public remove(event: string, callback?: Function) {
    if (!callback) {
      delete this.store[event]
    }
    if (this.store[event]) {
      this.store[event] = this.store[event].filter((savedCallback) => {
        return callback !== savedCallback
      })
    }
  }

  public dom(element: HTMLElement, event: string, callback: Function) {
    if (!this.setListener) {
      if (element.addEventListener) {
        this.setListener = (el, ev, fn) => {
          return el.addEventListener(ev, fn, false)
        }
      } else if (typeof (element as any).attachEvent === 'function') {
        this.setListener = (el, ev, fn) => {
          return el.attachEvent(`on${ev}`, fn, false)
        }
      } else {
        this.setListener = (el, ev, fn) => {
          return (el[`on${ev}`] = fn)
        }
      }
    }
    return this.setListener(element, event, callback)
  }
}
