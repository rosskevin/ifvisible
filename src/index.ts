/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { IfVisible } from './IfVisible'

// set library singleton and export for direct use
export const ifvisible = new IfVisible(window, document)

// set window singleton (e.g. window.ifvisible) to the same instance
;(window as any).ifvisible = ifvisible

export * from './EventBus'
export * from './IfVisible'
