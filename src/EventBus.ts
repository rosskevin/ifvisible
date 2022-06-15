export type FireableEvent = 'idle' | 'statusChanged' | 'blur' | 'focus' | 'wakeup'
export type Status = 'active' | 'idle' | 'hidden'
export interface Data {
  status: Status
}
export type FireableEventCallback = (data?: Data) => void

export class EventBus {
  private store: { [event: string]: FireableEventCallback[] }

  constructor() {
    this.store = {}
  }

  public attach(event: FireableEvent, callback: FireableEventCallback) {
    if (!this.store[event]) {
      this.store[event] = []
    }
    this.store[event].push(callback)
  }

  public fire(event: FireableEvent, data?: Data) {
    if (this.store[event]) {
      this.store[event].forEach((callback) => {
        callback(data)
      })
    }
  }

  public remove(event: FireableEvent, callback?: FireableEventCallback) {
    if (!callback) {
      delete this.store[event]
    }
    if (this.store[event]) {
      this.store[event] = this.store[event].filter((savedCallback) => {
        return callback !== savedCallback
      })
    }
  }
}
