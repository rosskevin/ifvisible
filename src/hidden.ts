/* eslint-disable @typescript-eslint/no-unsafe-member-access */
export type DocumentHidden = 'hidden' | 'mozHidden' | 'msHidden' | 'webkitHidden'
export type VisibilityChangeEvent =
  | 'visibilitychange'
  | 'mozHidden'
  | 'mozvisibilitychange'
  | 'msvisibilitychange'
  | 'webkitvisibilitychange'

let documentHiddenProperty: DocumentHidden
let visibilityChangeEvent: VisibilityChangeEvent

function resolveHiddenDetectionMethod(doc: Document) {
  // lazily do this one time only
  if (visibilityChangeEvent !== undefined) {
    return
  }

  // Find correct browser events
  if (doc.hidden !== undefined) {
    documentHiddenProperty = 'hidden'
    visibilityChangeEvent = 'visibilitychange'
  } else if ((doc as any).mozHidden !== undefined) {
    documentHiddenProperty = 'mozHidden'
    visibilityChangeEvent = 'mozvisibilitychange'
  } else if ((doc as any).msHidden !== undefined) {
    documentHiddenProperty = 'msHidden'
    visibilityChangeEvent = 'msvisibilitychange'
  } else if ((doc as any).webkitHidden !== undefined) {
    documentHiddenProperty = 'webkitHidden'
    visibilityChangeEvent = 'webkitvisibilitychange'
  }

  if (documentHiddenProperty === undefined) {
    throw new Error(
      'Unable to determine browser event.  This may be an incompatible browser.  See https://github.com/rosskevin/ifvisible#browsers',
    )
  }
}

export function isHidden(doc: Document) {
  resolveHiddenDetectionMethod(doc)
  return doc[documentHiddenProperty as DocumentHidden] as boolean
}

export function resolveVisibilityChangeEvent(doc: Document) {
  resolveHiddenDetectionMethod(doc)
  return visibilityChangeEvent
}
