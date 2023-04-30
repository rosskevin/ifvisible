// src/EventBus.ts
var EventBus = class {
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
};

// src/hidden.ts
var documentHiddenProperty;
var visibilityChangeEvent;
function resolveHiddenDetectionMethod(doc) {
  if (visibilityChangeEvent !== void 0) {
    return;
  }
  if (doc.hidden !== void 0) {
    documentHiddenProperty = "hidden";
    visibilityChangeEvent = "visibilitychange";
  } else if (doc.mozHidden !== void 0) {
    documentHiddenProperty = "mozHidden";
    visibilityChangeEvent = "mozvisibilitychange";
  } else if (doc.msHidden !== void 0) {
    documentHiddenProperty = "msHidden";
    visibilityChangeEvent = "msvisibilitychange";
  } else if (doc.webkitHidden !== void 0) {
    documentHiddenProperty = "webkitHidden";
    visibilityChangeEvent = "webkitvisibilitychange";
  }
  if (documentHiddenProperty === void 0) {
    throw new Error(
      "Unable to determine browser event.  This may be an incompatible browser.  See https://github.com/rosskevin/ifvisible#browsers"
    );
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

// src/throttle.ts
function throttle(callback, limit) {
  let inThrottle;
  let lastResult;
  return function(...args) {
    if (!inThrottle) {
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
      lastResult = callback.apply(this, args);
    }
    return lastResult;
  };
}

// src/IfVisible.ts
var Timer = class {
  id;
  // NodeJS.Timer
  ifvInstance;
  seconds;
  callback;
  constructor(ifvInstance, seconds, callback) {
    this.ifvInstance = ifvInstance;
    this.seconds = seconds;
    this.callback = callback;
    this.start();
    this.ifvInstance.on("statusChanged", (data) => {
      data?.status === "active" ? this.start() : this.pause();
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
    if (this.id !== void 0)
      clearInterval(this.id);
    this.id = setInterval(this.callback, this.seconds * 1e3);
  }
};
var IfVisible = class {
  status = "active";
  timers = [];
  idleTime = 3e4;
  idleStartedTime;
  win;
  doc;
  eventBus;
  winListeners;
  docListeners;
  focusListener;
  throttleDuration = 500;
  constructor(win, doc) {
    this.win = win;
    this.doc = doc;
    this.eventBus = new EventBus();
    this.trackChange();
    this.reattach();
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
    this.idleTime = seconds * 1e3;
    this.reattach();
    return this;
  }
  getIdleDuration() {
    return this.idleTime;
  }
  getIdleInfo() {
    const now = +/* @__PURE__ */ new Date();
    let res;
    const idleFor = this.idleStartedTime ? now - this.idleStartedTime : 0;
    if (this.status === "idle") {
      res = {
        isIdle: true,
        idleFor,
        timeLeft: 0,
        timeLeftPer: 100
      };
    } else {
      const timeLeft = this.idleStartedTime ? this.idleStartedTime + this.idleTime - now : this.idleTime;
      res = {
        isIdle: false,
        idleFor,
        timeLeft,
        timeLeftPer: parseFloat((100 - timeLeft * 100 / this.idleTime).toFixed(2))
      };
    }
    return res;
  }
  setThrottleDuration(milliseconds) {
    this.throttleDuration = milliseconds;
    this.reattach;
    return this;
  }
  idle(callback) {
    if (callback) {
      this.on("idle", callback);
    } else {
      this.status = "idle";
      this.eventBus.fire("idle");
      this.eventBus.fire("statusChanged", { status: this.status });
    }
    return this;
  }
  blur(callback) {
    if (callback) {
      this.on("blur", callback);
    } else {
      this.status = "hidden";
      this.eventBus.fire("blur");
      this.eventBus.fire("statusChanged", { status: this.status });
    }
    return this;
  }
  focus(callback) {
    if (callback) {
      this.on("focus", callback);
    } else if (this.status !== "active") {
      this.status = "active";
      this.eventBus.fire("focus");
      this.eventBus.fire("wakeup");
      this.eventBus.fire("statusChanged", { status: this.status });
    }
    return this;
  }
  wakeup(callback) {
    if (callback) {
      this.on("wakeup", callback);
    } else if (this.status !== "active") {
      this.status = "active";
      this.eventBus.fire("wakeup");
      this.eventBus.fire("statusChanged", { status: this.status });
    }
    return this;
  }
  onEvery(seconds, callback) {
    return new Timer(this, seconds, callback);
  }
  now(check) {
    if (check !== void 0) {
      return this.status === check;
    }
    return this.status === "active";
  }
  getStatus() {
    return this.status;
  }
  /**
   * Removes all listeners from the DOM, but not user added listeners so it may be reattached later.
   */
  detach() {
    if (this.winListeners !== void 0 && this.docListeners !== void 0 && this.focusListener !== void 0) {
      for (const name of Object.getOwnPropertyNames(this.winListeners)) {
        this.win.removeEventListener(name, this.winListeners[name]);
      }
      for (const name of Object.getOwnPropertyNames(this.docListeners)) {
        this.doc.removeEventListener(name, this.docListeners[name]);
      }
      this.off("focus", this.focusListener);
    }
    this.winListeners = void 0;
    this.docListeners = void 0;
    this.focusListener = void 0;
  }
  /**
   * Allows for:
   *  - control of DOM detach/reattach
   *  - recognition of changes to option and reattachment with those taken into account.
   */
  reattach() {
    this.detach();
    this.winListeners = {};
    this.docListeners = {};
    this.focusListener = void 0;
    this.docListeners[resolveVisibilityChangeEvent(this.doc)] = throttle(
      () => this.trackChange(),
      this.throttleDuration
    );
    for (const name of ["mousemove", "mousedown", "keyup", "touchstart"]) {
      this.docListeners[name] = throttle(() => this.startIdleTimer(), this.throttleDuration);
    }
    this.winListeners["scroll"] = throttle(() => this.startIdleTimer(), this.throttleDuration);
    this.focusListener = throttle(() => this.startIdleTimer(), this.throttleDuration);
    for (const name of Object.getOwnPropertyNames(this.docListeners)) {
      this.doc.addEventListener(name, this.docListeners[name]);
    }
    for (const name of Object.getOwnPropertyNames(this.winListeners)) {
      this.win.addEventListener(name, this.winListeners[name]);
    }
    this.focus(this.focusListener);
    this.startIdleTimer();
  }
  trackChange() {
    if (isHidden(this.doc)) {
      this.blur();
    } else {
      this.focus();
    }
  }
  startIdleTimer(event) {
    if (event instanceof MouseEvent && event.movementX === 0 && event.movementY === 0) {
      return;
    }
    this.timers.map(clearTimeout);
    this.timers.length = 0;
    if (this.status === "idle") {
      this.wakeup();
    }
    this.idleStartedTime = +/* @__PURE__ */ new Date();
    this.timers.push(
      setTimeout(() => {
        if (this.status === "active" || this.status === "hidden") {
          this.idle();
        }
      }, this.idleTime)
    );
  }
};

// src/index.ts
var ifvisible = new IfVisible(window, document);
window.ifvisible = ifvisible;
export {
  EventBus,
  IfVisible,
  ifvisible
};
//# sourceMappingURL=index.js.map