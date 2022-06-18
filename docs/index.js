(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ifvisible = {}));
})(this, (function (exports) { 'use strict';

  class EventBus {
      store;
      constructor() {
          this.store = {};
      }
      attach(event, callback) {
          if (!this.store[event]) {
              this.store[event] = [];
          }
          this.store[event].push(callback);
      }
      fire(event, data) {
          if (this.store[event]) {
              this.store[event].forEach((callback) => {
                  callback(data);
              });
          }
      }
      remove(event, callback) {
          if (!callback) {
              delete this.store[event];
          }
          if (this.store[event]) {
              this.store[event] = this.store[event].filter((savedCallback) => {
                  return callback !== savedCallback;
              });
          }
      }
  }

  let documentHiddenProperty;
  let visibilityChangeEvent;
  function resolveHiddenDetectionMethod(doc) {
      // lazily do this one time only
      if (visibilityChangeEvent !== undefined) {
          return;
      }
      // Find correct browser events
      if (doc.hidden !== undefined) {
          documentHiddenProperty = 'hidden';
          visibilityChangeEvent = 'visibilitychange';
      }
      else if (doc.mozHidden !== undefined) {
          documentHiddenProperty = 'mozHidden';
          visibilityChangeEvent = 'mozvisibilitychange';
      }
      else if (doc.msHidden !== undefined) {
          documentHiddenProperty = 'msHidden';
          visibilityChangeEvent = 'msvisibilitychange';
      }
      else if (doc.webkitHidden !== undefined) {
          documentHiddenProperty = 'webkitHidden';
          visibilityChangeEvent = 'webkitvisibilitychange';
      }
      if (documentHiddenProperty === undefined) {
          throw new Error('Unable to determine browser event.  This may be an incompatible browser.  See https://github.com/rosskevin/ifvisible#browsers');
      }
  }
  function isHidden(doc) {
      resolveHiddenDetectionMethod(doc);
      return doc[documentHiddenProperty];
  }
  function resolveVisibilityChangeEvent(doc) {
      resolveHiddenDetectionMethod(doc);
      return visibilityChangeEvent;
  }

  class Timer {
      id; // NodeJS.Timer
      ifvInstance;
      seconds;
      callback;
      constructor(ifvInstance, seconds, callback) {
          this.ifvInstance = ifvInstance;
          this.seconds = seconds;
          this.callback = callback;
          this.start();
          this.ifvInstance.on('statusChanged', (data) => {
              data?.status === 'active' ? this.start() : this.pause();
          });
      }
      stop() {
          clearInterval(this.id);
      }
      resume() {
          this.start();
      }
      pause() {
          this.stop();
      }
      start() {
          if (this.id !== undefined)
              clearInterval(this.id);
          this.id = setInterval(this.callback, this.seconds * 1000);
      }
  }
  class IfVisible {
      status = 'active';
      timers = [];
      idleTime = 30000;
      idleStartedTime;
      win;
      doc;
      eventBus;
      constructor(win, doc) {
          this.win = win;
          this.doc = doc;
          this.eventBus = new EventBus();
          const trackChange = () => {
              if (isHidden(this.doc)) {
                  this.blur();
              }
              else {
                  this.focus();
              }
          };
          trackChange(); // get initial status
          this.doc.addEventListener(resolveVisibilityChangeEvent(doc), // cast it to look like a modern browser event, don't leak type casting everywhere
          trackChange);
          this.startIdleTimer();
          this.trackIdleStatus();
      }
      trackIdleStatus() {
          this.doc.addEventListener('mousemove', () => this.startIdleTimer());
          this.doc.addEventListener('mousedown', () => this.startIdleTimer());
          this.doc.addEventListener('keyup', () => this.startIdleTimer());
          this.doc.addEventListener('touchstart', () => this.startIdleTimer());
          this.win.addEventListener('scroll', () => this.startIdleTimer());
          // When page is focused without any event, it should not be idle.
          this.focus(() => this.startIdleTimer());
      }
      on(event, callback) {
          this.eventBus.attach(event, callback);
          return this;
      }
      off(event, callback) {
          this.eventBus.remove(event, callback);
          return this;
      }
      setIdleDuration(seconds) {
          this.idleTime = seconds * 1000;
          this.startIdleTimer();
          return this;
      }
      getIdleDuration() {
          return this.idleTime;
      }
      getIdleInfo() {
          const now = +new Date();
          let res;
          const idleFor = this.idleStartedTime ? now - this.idleStartedTime : 0;
          if (this.status === 'idle') {
              res = {
                  isIdle: true,
                  idleFor,
                  timeLeft: 0,
                  timeLeftPer: 100,
              };
          }
          else {
              const timeLeft = this.idleStartedTime
                  ? this.idleStartedTime + this.idleTime - now
                  : this.idleTime;
              res = {
                  isIdle: false,
                  idleFor,
                  timeLeft,
                  timeLeftPer: parseFloat((100 - (timeLeft * 100) / this.idleTime).toFixed(2)),
              };
          }
          return res;
      }
      idle(callback) {
          // used like a setter
          if (callback) {
              this.on('idle', callback);
          }
          else {
              this.status = 'idle';
              this.eventBus.fire('idle');
              this.eventBus.fire('statusChanged', { status: this.status });
          }
          return this;
      }
      blur(callback) {
          // used like a setter
          if (callback) {
              this.on('blur', callback);
          }
          else {
              this.status = 'hidden';
              this.eventBus.fire('blur');
              this.eventBus.fire('statusChanged', { status: this.status });
          }
          return this;
      }
      focus(callback) {
          // used like a setter
          if (callback) {
              this.on('focus', callback);
          }
          else if (this.status !== 'active') {
              this.status = 'active';
              this.eventBus.fire('focus');
              this.eventBus.fire('wakeup');
              this.eventBus.fire('statusChanged', { status: this.status });
          }
          return this;
      }
      wakeup(callback) {
          // used like a setter
          if (callback) {
              this.on('wakeup', callback);
          }
          else if (this.status !== 'active') {
              this.status = 'active';
              this.eventBus.fire('wakeup');
              this.eventBus.fire('statusChanged', { status: this.status });
          }
          return this;
      }
      onEvery(seconds, callback) {
          return new Timer(this, seconds, callback);
      }
      now(check) {
          if (check !== undefined) {
              return this.status === check;
          }
          return this.status === 'active';
      }
      getStatus() {
          return this.status;
      }
      startIdleTimer(event) {
          // Prevents Phantom events.
          if (event instanceof MouseEvent && event.movementX === 0 && event.movementY === 0) {
              return;
          }
          this.timers.map(clearTimeout);
          this.timers.length = 0; // clear the array
          if (this.status === 'idle') {
              this.wakeup();
          }
          this.idleStartedTime = +new Date();
          this.timers.push(setTimeout(() => {
              if (this.status === 'active' || this.status === 'hidden') {
                  this.idle();
              }
          }, this.idleTime));
      }
  }

  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  // set library singleton and export for direct use
  const ifvisible = new IfVisible(window, document);
  window.ifvisible = ifvisible;

  exports.EventBus = EventBus;
  exports.IfVisible = IfVisible;
  exports.ifvisible = ifvisible;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.js.map
