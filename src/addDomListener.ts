/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/** In use 'mousemove' | 'mousedown' | 'keyup' | 'touchstart' | 'scroll' */
export type DomTrackableEvent = keyof DocumentEventMap | keyof WindowEventMap
export type DomCallback = (this: HTMLElement, ev: DomTrackableEvent) => any

let listener: (
  docOrWindow: Document | Window,
  event: Event | string,
  callback: DomCallback,
) => any | undefined

/**
 * @deprecated This resolution only remains in case we have a problem in the future, otherwise get rid of it.
 */
export function addDomListener(
  docOrWindow: Document | Window,
  event: DomTrackableEvent,
  callback: DomCallback,
) {
  // lazy resolve the listener based on legacy (I'm not sure we need this any more given our browser targets)
  if (!listener) {
    if (docOrWindow.addEventListener !== undefined) {
      listener = (el, ev, fn) => {
        return el.addEventListener(ev as any, fn as any, false) // this is what we use in modern, best we delete this entire attach method to use directly.
      }
    } else if (typeof (docOrWindow as any).attachEvent === 'function') {
      listener = (el, ev, fn) => {
        return (el as any).attachEvent(`on${ev}`, fn, false)
      }
    } else {
      listener = (el, ev, fn) => {
        return ((el as any)[`on${ev}`] = fn)
      }
    }
  }
  return listener(docOrWindow, event, callback)
}
