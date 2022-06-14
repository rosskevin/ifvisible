import { IfVisible } from './IfVisible'

declare let global: any
// decide between self vs global depending on the environment
const root =
  (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global)

// set library singleton
export const ifvisible = new IfVisible(root, document)

// set window singleton (e.g. window.ifvisible)
if (root) {
  ;(root as any).ifvisible = ifvisible
}
