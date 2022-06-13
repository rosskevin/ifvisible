(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.ifvisible = global.ifvisible || {}, global.ifvisible.js = {})));
})(this, (function (exports) { 'use strict';

  var Events;
  (function (Events) {
      const store = {};
      let setListener;
      function attach(event, callback) {
          if (!store[event]) {
              store[event] = [];
          }
          store[event].push(callback);
      }
      Events.attach = attach;
      function fire(event, args = []) {
          if (store[event]) {
              store[event].forEach(callback => {
                  callback(...args);
              });
          }
      }
      Events.fire = fire;
      function remove(event, callback) {
          if (!callback) {
              delete store[event];
          }
          if (store[event]) {
              store[event] = store[event].filter(savedCallback => {
                  return callback !== savedCallback;
              });
          }
      }
      Events.remove = remove;
      function dom(element, event, callback) {
          if (!setListener) {
              if (element.addEventListener) {
                  setListener = (el, ev, fn) => {
                      return el.addEventListener(ev, fn, false);
                  };
              }
              else if (typeof element.attachEvent === 'function') {
                  setListener = (el, ev, fn) => {
                      return el.attachEvent(`on${ev}`, fn, false);
                  };
              }
              else {
                  setListener = (el, ev, fn) => {
                      // eslint-disable-next-line no-return-assign, no-param-reassign
                      return el[`on${ev}`] = fn;
                  };
              }
          }
          return setListener(element, event, callback);
      }
      Events.dom = dom;
  })(Events || (Events = {}));
  // export default Events;

  const STATUS_ACTIVE = 'active';
  const STATUS_IDLE = 'idle';
  const STATUS_HIDDEN = 'hidden';
  let DOC_HIDDEN;
  let VISIBILITY_CHANGE_EVENT;
  // eslint-disable-next-line func-names
  const IE = (function () {
      let undef;
      let v = 3;
      const div = document.createElement('div');
      const all = div.getElementsByTagName('i');
      // eslint-disable-next-line no-cond-assign
      while (
      // eslint-disable-next-line no-plusplus, no-sequences
      div.innerHTML = `<!--[if gt IE ${++v}]><i></i><![endif]-->`,
          all[0])
          ;
      return v > 4 ? v : undef;
  }());
  class Timer {
      ifvisible;
      seconds;
      callback;
      token;
      stopped = false;
      constructor(ifvisible, seconds, callback) {
          this.ifvisible = ifvisible;
          this.seconds = seconds;
          this.callback = callback;
          this.start();
          this.ifvisible.on('statusChanged', (data) => {
              if (this.stopped === false) {
                  if (data.status === STATUS_ACTIVE) {
                      this.start();
                  }
                  else {
                      this.pause();
                  }
              }
          });
      }
      start() {
          this.stopped = false;
          clearInterval(this.token);
          this.token = setInterval(this.callback, this.seconds * 1000);
      }
      stop() {
          this.stopped = true;
          clearInterval(this.token);
      }
      resume() {
          this.start();
      }
      pause() {
          this.stop();
      }
  }
  class IfVisible {
      root;
      doc;
      status = STATUS_ACTIVE;
      timers = [];
      idleTime = 30000;
      idleStartedTime;
      isLegacyModeOn = false;
      constructor(root, doc) {
          this.root = root;
          this.doc = doc;
          // Find correct browser events
          if (this.doc.hidden !== undefined) {
              DOC_HIDDEN = 'hidden';
              VISIBILITY_CHANGE_EVENT = 'visibilitychange';
          }
          else if (this.doc.mozHidden !== undefined) {
              DOC_HIDDEN = 'mozHidden';
              VISIBILITY_CHANGE_EVENT = 'mozvisibilitychange';
          }
          else if (this.doc.msHidden !== undefined) {
              DOC_HIDDEN = 'msHidden';
              VISIBILITY_CHANGE_EVENT = 'msvisibilitychange';
          }
          else if (this.doc.webkitHidden !== undefined) {
              DOC_HIDDEN = 'webkitHidden';
              VISIBILITY_CHANGE_EVENT = 'webkitvisibilitychange';
          }
          if (DOC_HIDDEN === undefined) {
              this.legacyMode();
          }
          else {
              const trackChange = () => {
                  if (this.doc[DOC_HIDDEN]) {
                      this.blur();
                  }
                  else {
                      this.focus();
                  }
              };
              trackChange(); // get initial status
              Events.dom(this.doc, VISIBILITY_CHANGE_EVENT, trackChange);
          }
          this.startIdleTimer();
          this.trackIdleStatus();
      }
      legacyMode() {
          // it's already on
          if (this.isLegacyModeOn) {
              return;
          }
          let BLUR_EVENT = 'blur';
          const FOCUS_EVENT = 'focus';
          if (IE < 9) {
              BLUR_EVENT = 'focusout';
          }
          Events.dom(this.root, BLUR_EVENT, () => {
              return this.blur();
          });
          Events.dom(this.root, FOCUS_EVENT, () => {
              return this.focus();
          });
          this.isLegacyModeOn = true;
      }
      startIdleTimer(event) {
          // Prevents Phantom events.
          // @see https://github.com/serkanyersen/ifvisible.js/pull/37
          if (event instanceof MouseEvent && event.movementX === 0 && event.movementY === 0) {
              return;
          }
          this.timers.map(clearTimeout);
          this.timers.length = 0; // clear the array
          if (this.status === STATUS_IDLE) {
              this.wakeup();
          }
          this.idleStartedTime = +(new Date());
          this.timers.push(setTimeout(() => {
              if (this.status === STATUS_ACTIVE || this.status === STATUS_HIDDEN) {
                  return this.idle();
              }
          }, this.idleTime));
      }
      trackIdleStatus() {
          Events.dom(this.doc, 'mousemove', this.startIdleTimer.bind(this));
          Events.dom(this.doc, 'mousedown', this.startIdleTimer.bind(this));
          Events.dom(this.doc, 'keyup', this.startIdleTimer.bind(this));
          Events.dom(this.doc, 'touchstart', this.startIdleTimer.bind(this));
          Events.dom(this.root, 'scroll', this.startIdleTimer.bind(this));
          // When page is focus without any event, it should not be idle.
          this.focus(this.startIdleTimer.bind(this));
      }
      on(event, callback) {
          Events.attach(event, callback);
          return this;
      }
      off(event, callback) {
          Events.remove(event, callback);
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
          const now = +(new Date());
          let res;
          if (this.status === STATUS_IDLE) {
              res = {
                  isIdle: true,
                  idleFor: now - this.idleStartedTime,
                  timeLeft: 0,
                  timeLeftPer: 100,
              };
          }
          else {
              const timeLeft = (this.idleStartedTime + this.idleTime) - now;
              res = {
                  isIdle: false,
                  idleFor: now - this.idleStartedTime,
                  timeLeft,
                  timeLeftPer: parseFloat((100 - (timeLeft * 100 / this.idleTime)).toFixed(2)),
              };
          }
          return res;
      }
      idle(callback) {
          if (callback) {
              this.on('idle', callback);
          }
          else {
              this.status = STATUS_IDLE;
              Events.fire('idle');
              Events.fire('statusChanged', [{ status: this.status }]);
          }
          return this;
      }
      blur(callback) {
          if (callback) {
              this.on('blur', callback);
          }
          else {
              this.status = STATUS_HIDDEN;
              Events.fire('blur');
              Events.fire('statusChanged', [{ status: this.status }]);
          }
          return this;
      }
      focus(callback) {
          if (callback) {
              this.on('focus', callback);
          }
          else if (this.status !== STATUS_ACTIVE) {
              this.status = STATUS_ACTIVE;
              Events.fire('focus');
              Events.fire('wakeup');
              Events.fire('statusChanged', [{ status: this.status }]);
          }
          return this;
      }
      wakeup(callback) {
          if (callback) {
              this.on('wakeup', callback);
          }
          else if (this.status !== STATUS_ACTIVE) {
              this.status = STATUS_ACTIVE;
              Events.fire('wakeup');
              Events.fire('statusChanged', [{ status: this.status }]);
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
          return this.status === STATUS_ACTIVE;
      }
  }

  // decide between self vs global depending on the environment
  const root = (typeof self === 'object' && self.self === self && self)
      || (typeof global === 'object' && global.global === global && global);
  //  || this;
  const ifvisible = new IfVisible(root, document);

  exports.ifvisible = ifvisible;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.js.map
