![CI](https://img.shields.io/github/workflow/status/rosskevin/ifvisible/ci?style=for-the-badge)
![Version](https://img.shields.io/github/package-json/v/rosskevin/ifvisible?style=for-the-badge)
![MIT](https://img.shields.io/github/license/rosskevin/ifvisible?style=for-the-badge)

## @rosskevin/ifvisible

Lightweight way to see if a browser page is visible or the user is interacting.

Check out the [Demo](https://rosskevin.github.io/ifvisible/) or read below for code examples.

![Demo](demo.jpg)

## Installation

From npm

```sh
npm install @rosskevin/ifvisible

# or

yarn install @rosskevin/ifvisible
```

## Examples

### Instantiation

This library provides a singleton exposed as `ifvisible` by default in addition to a UMD package, but for more advancecd users, they can import the class directly for a different attachment from the ES package.

```js
// import singleton global bound to the `window`
import { ifvisible } from '@rosskevin/ifvisible'
```

or for more advanced usage for use cases that a singleton may not be useful, you may instantiate it directly:

```js
// import the object and instantiate it yourself
import { IfVisible } from '@rosskevin/ifvisible'
window.ifvisible = new IfVisible(window, document)
```

### General

```js
// If page is visible right now
if (ifvisible.now()) {
  // Display pop-up
  openPopUp()
}

// You can also check the page status using `now` method
if (!ifvisible.now('hidden')) {
  // Display pop-up if page is not hidden
  openPopUp()
}

// Possible statuses are:
// idle: when user has no interaction
// hidden: page is not visible
// active: page is visible and user is active
```

### Options

```js
ifvisible
  .setIdleDuration(120) // default: 30 - Page will become idle after 120 seconds
  .setThrottleDuration(1000) // default: 500 - DOM event triggers will be throttled to avoid bogging down UI
```

### `onEvery`

Set intervals that run every X seconds if the page is visible.

```js
// If page is visible run this function on every half seconds
ifvisible.onEvery(0.5, () => {
  // ...
})
```

### `on`

```js
ifvisible.on('blur', () => {
  // ...
})

ifvisible.on('focus', () => {
  // ...
})

ifvisible.on('idle', () => {
  // ...
})

ifvisible.on('wakeup', () => {
  // ...
})
```

### `off`:

```js
ifvisible.off('idle', triggeredFunction) // will remove only triggeredFunction from being tiggered on idle
ifvisible.off('idle') // will remove all events triggered on idle

// works with other events: blur | wakeup | focus
```

### Manually trigger status events

```js
// will put page in a idle status
ifvisible.idle()

// will set a callback to listen - same as on('idle', () => void)
ifvisible.idle(() => {
  // ...
})

// works with other events: blur | wakeup | focus
```

### Advanced

```js
ifvisible.detach() // detach from DOM but keep user listeners stored within ifvisible
ifvisible.reattach() // reattach to DOM and start listening again
```

## Browsers

This library is intended to support _modern_ browsers. Legacy IE support (not Edge) was dropped to clean up code. Given Microsoft discontinued IE altogether, moving forward is in the best interest of maintenance. If you need legacy support, look towards the [original ifvisible.js](https://github.com/serkanyersen/ifvisible.js)

## Why fork?

The [original ifvisible.js](https://github.com/serkanyersen/ifvisible.js) library was:

- languishing with no updates
- old build system
- outdated dev depencies
- used typescript but was not strongly typed
- did not publish the typescript types (even though it was written in typescript)
- burdened with legacy code everywhere
- only a UMD module available.
- we wanted to improve the library

In contrast this version:

- targets modern browsers only
- is strongly typed
- publishes UMD and ES bundles (will publish ESM as that comes to pass as well)
- is fully updated and maintained

NOTE: this fork was `detached` for the sole purpose of making new pull requests point to this repo instead of the original unmaintained parent.

## License

MIT.

```

```
