/*
Copyright 2013 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/

/*jslint expr: true */
/*global define */

(function (global, factory) {
    var built = factory();
    if (typeof module === 'object' && module) {
        module.exports = built;
    }
    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(function () { return built; });
    }
    global.PromisePolyfill = built;
    global.Promise || (global.Promise = built);
}(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this, function () {

var modules = {};

function define(name, factory) {
    var module = {
        exports: {}
    };
    factory(function (mod) {
        return modules[mod];
    }, module.exports, module);
    modules[name] = module.exports;
}

define("./queue", function (require, exports, module) {
"use strict";

module.exports = Queue;
function Queue(capacity) {
    this.capacity = this.snap(capacity);
    this.length = 0;
    this.front = 0;
    this.initialize();
}

Queue.prototype.push = function (value) {
    var length = this.length;
    if (this.capacity <= length) {
        this.grow(this.snap(this.capacity * this.growFactor));
    }
    var index = (this.front + length) & (this.capacity - 1);
    this[index] = value;
    this.length = length + 1;
};

Queue.prototype.shift = function () {
    var front = this.front;
    var result = this[front];

    this[front] = void 0;
    this.front = (front + 1) & (this.capacity - 1);
    this.length--;
    return result;
};

Queue.prototype.grow = function (capacity) {
    var oldFront = this.front;
    var oldCapacity = this.capacity;
    var oldQueue = new Array(oldCapacity);
    var length = this.length;

    copy(this, 0, oldQueue, 0, oldCapacity);
    this.capacity = capacity;
    this.initialize();
    this.front = 0;
    if (oldFront + length <= oldCapacity) {
        // Can perform direct linear copy
        copy(oldQueue, oldFront, this, 0, length);
    } else {
        // Cannot perform copy directly, perform as much as possible at the
        // end, and then copy the rest to the beginning of the buffer
        var lengthBeforeWrapping =
            length - ((oldFront + length) & (oldCapacity - 1));
        copy(
            oldQueue,
            oldFront,
            this,
            0,
            lengthBeforeWrapping
        );
        copy(
            oldQueue,
            0,
            this,
            lengthBeforeWrapping,
            length - lengthBeforeWrapping
        );
    }
};

Queue.prototype.initialize = function () {
    var length = this.capacity;
    for (var i = 0; i < length; ++i) {
        this[i] = void 0;
    }
};

Queue.prototype.snap = function (capacity) {
    if (typeof capacity !== "number") {
        return this.minCapacity;
    }
    return pow2AtLeast(
        Math.min(this.maxCapacity, Math.max(this.minCapacity, capacity))
    );
};

Queue.prototype.maxCapacity = (1 << 30) | 0;
Queue.prototype.minCapacity = 16;
Queue.prototype.growFactor = 8;

function copy(source, sourceIndex, target, targetIndex, length) {
    for (var index = 0; index < length; ++index) {
        target[index + targetIndex] = source[index + sourceIndex];
    }
}

function pow2AtLeast(n) {
    n = n >>> 0;
    n = n - 1;
    n = n | (n >> 1);
    n = n | (n >> 2);
    n = n | (n >> 4);
    n = n | (n >> 8);
    n = n | (n >> 16);
    return n + 1;
}


});

define("./asap", function (require, exports, module) {
"use strict";

// Use the fastest possible means to execute a task in a future turn
// of the event loop.

// Queue is a circular buffer with good locality of reference and doesn't
// allocate new memory unless there are more than `InitialCapacity` parallel
// tasks in which case it will resize itself generously to x8 more capacity.
// The use case of asap should require no or few amount of resizes during
// runtime.
// Calling a task frees a slot immediately so if the calling
// has a side effect of queuing itself again, it can be sustained
// without additional memory
// Queue specifically uses
// http://en.wikipedia.org/wiki/Circular_buffer#Use_a_Fill_Count
// Because:
// 1. We need fast .length operation, since queue
//   could have changed after every iteration
// 2. Modulus can be negated by using power-of-two
//   capacities and replacing it with bitwise AND
// 3. It will not be used in a multi-threaded situation.

var Queue = require("./queue");

//1024 = InitialCapacity
var queue = new Queue(1024);
var flushing = false;
var requestFlush = void 0;
var hasSetImmediate = typeof setImmediate === "function";
var domain;

// Avoid shims from browserify.
// The existence of `global` in browsers is guaranteed by browserify.
var process = global.process;

// Note that some fake-Node environments,
// like the Mocha test runner, introduce a `process` global.
var isNodeJS = !!process && ({}).toString.call(process) === "[object process]";

function flush() {
    /* jshint loopfunc: true */

    while (queue.length > 0) {
        var task = queue.shift();

        try {
            task.call();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them to interrupt flushing!

                // Ensure continuation if an uncaught exception is suppressed
                // listening process.on("uncaughtException") or domain("error").
                requestFlush();

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function () {
                    throw e;
                }, 0);
            }
        }
    }

    flushing = false;
}

if (isNodeJS) {
    // Node.js
    requestFlush = function () {
        // Ensure flushing is not bound to any domain.
        var currentDomain = process.domain;
        if (currentDomain) {
            domain = domain || (1,require)("domain");
            domain.active = process.domain = null;
        }

        // Avoid tick recursion - use setImmediate if it exists.
        if (flushing && hasSetImmediate) {
            setImmediate(flush);
        } else {
            process.nextTick(flush);
        }

        if (currentDomain) {
            domain.active = process.domain = currentDomain;
        }
    };

} else if (hasSetImmediate) {
    // In IE10, or https://github.com/NobleJS/setImmediate
    requestFlush = function () {
        setImmediate(flush);
    };

} else if (typeof MessageChannel !== "undefined") {
    // modern browsers
    // http://www.nonblocking.io/2011/06/windownexttick.html
    var channel = new MessageChannel();
    // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
    // working message ports the first time a page loads.
    channel.port1.onmessage = function () {
        requestFlush = requestPortFlush;
        channel.port1.onmessage = flush;
        flush();
    };
    var requestPortFlush = function () {
        // Opera requires us to provide a message payload, regardless of
        // whether we use it.
        channel.port2.postMessage(0);
    };
    requestFlush = function () {
        setTimeout(flush, 0);
        requestPortFlush();
    };

} else {
    // old browsers
    requestFlush = function () {
        setTimeout(flush, 0);
    };
}

function asap(task) {
    if (isNodeJS && process.domain) {
        task = process.domain.bind(task);
    }

    queue.push(task);

    if (!flushing) {
        requestFlush();
        flushing = true;
    }
};

module.exports = asap;


});

/*global modules*/
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

function assign(obj, props) {
    for (var prop in props) {
        /* istanbul ignore else */
        if (props.hasOwnProperty(prop)) {
            obj[prop] = props[prop];
        }
    }
}

/**
A promise represents a value that may not yet be available. Promises allow
you to chain asynchronous operations, write synchronous looking code and
handle errors throughout the process.

This constructor takes a function as a parameter where you can insert the logic
that fulfills or rejects this promise. The fulfillment value and the rejection
reason can be any JavaScript value. It's encouraged that rejection reasons be
error objects

<pre><code>
var fulfilled = new Promise(function (resolve) {
    resolve('I am a fulfilled promise');
});

var rejected = new Promise(function (resolve, reject) {
    reject(new Error('I am a rejected promise'));
});
</code></pre>

@class Promise
@constructor
@param {Function} fn A function where to insert the logic that resolves this
        promise. Receives `resolve` and `reject` functions as parameters.
        This function is called synchronously.
**/
function Promise(fn) {
    if (!(this instanceof Promise)) {
        Promise._log('Promises should always be created with new Promise(). This will throw an error in the future', 'error');
        return new Promise(fn);
    }

    var resolver = new Promise.Resolver(this);

    /**
    A reference to the resolver object that handles this promise

    @property _resolver
    @type Object
    @private
    */
    this._resolver = resolver;

    try {
        fn(function (value) {
            resolver.resolve(value);
        }, function (reason) {
            resolver.reject(reason);
        });
    } catch (e) {
        resolver.reject(e);
    }
}

assign(Promise.prototype, {
    /**
    Schedule execution of a callback to either or both of "fulfill" and
    "reject" resolutions for this promise. The callbacks are wrapped in a new
    promise and that promise is returned.  This allows operation chaining ala
    `functionA().then(functionB).then(functionC)` where `functionA` returns
    a promise, and `functionB` and `functionC` _may_ return promises.

    Asynchronicity of the callbacks is guaranteed.

    @method then
    @param {Function} [callback] function to execute if the promise
                resolves successfully
    @param {Function} [errback] function to execute if the promise
                resolves unsuccessfully
    @return {Promise} A promise wrapping the resolution of either "resolve" or
                "reject" callback
    **/
    then: function (callback, errback) {
        // using this.constructor allows for customized promises to be
        // returned instead of plain ones
        var resolve, reject,
            promise = new this.constructor(function (res, rej) {
                resolve = res;
                reject = rej;
            });

        this._resolver._addCallbacks(
            typeof callback === 'function' ?
                Promise._makeCallback(promise, resolve, reject, callback) : resolve,
            typeof errback === 'function' ?
                Promise._makeCallback(promise, resolve, reject, errback) : reject
        );

        return promise;
    },

    /*
    A shorthand for `promise.then(undefined, callback)`.

    Returns a new promise and the error callback gets the same treatment as in
    `then`: errors get caught and turned into rejections, and the return value
    of the callback becomes the fulfilled value of the returned promise.

    @method catch
    @param [Function] errback Callback to be called in case this promise is
                        rejected
    @return {Promise} A new promise modified by the behavior of the error
                        callback
    */
    'catch': function (errback) {
        return this.then(undefined, errback);
    }
});

/**
Wraps the callback in another function to catch exceptions and turn them
into rejections.

@method _makeCallback
@param {Promise} promise Promise that will be affected by this callback
@param {Function} fn Callback to wrap
@return {Function}
@static
@private
**/
Promise._makeCallback = function (promise, resolve, reject, fn) {
    // callbacks and errbacks only get one argument
    return function (valueOrReason) {
        var result;

        // Promises model exception handling through callbacks
        // making both synchronous and asynchronous errors behave
        // the same way
        try {
            // Use the argument coming in to the callback/errback from the
            // resolution of the parent promise.
            // The function must be called as a normal function, with no
            // special value for |this|, as per Promises A+
            result = fn(valueOrReason);
        } catch (e) {
            // calling return only to stop here
            reject(e);
            return;
        }

        if (result === promise) {
            reject(new TypeError('Cannot resolve a promise with itself'));
            return;
        }

        resolve(result);
    };
};

/**
Logs a message. This method is designed to be overwritten with  YUI's `log`
function.

@method _log
@param {String} msg Message to log
@param {String} type Log level. One of 'error', 'warn', 'info'.
@static
@private
**/
Promise._log = function (msg, type) { /* istanbul ignore else */ if (typeof console !== 'undefined') { console[type](msg); } };

/*
Ensures that a certain value is a promise. If it is not a promise, it wraps it
in one.

This method can be copied or inherited in subclasses. In that case it will
check that the value passed to it is an instance of the correct class.
This means that `PromiseSubclass.resolve()` will always return instances of
`PromiseSubclass`.

@method resolve
@param {Any} Any object that may or may not be a promise
@return {Promise}
@static
*/
Promise.resolve = function (value) {
    if (value && value.constructor === this) {
        return value;
    }
    /*jshint newcap: false */
    return new this(function (resolve) {
    /*jshint newcap: true */
        resolve(value);
    });
};

/*
A shorthand for creating a rejected promise.

@method reject
@param {Any} reason Reason for the rejection of this promise. Usually an Error
    Object
@return {Promise} A rejected promise
@static
*/
Promise.reject = function (reason) {
    /*jshint newcap: false */
    var promise = new this(function () {});
   /*jshint newcap: true */

   // Do not go through resolver.reject() because an immediately rejected promise
   // always has no callbacks which would trigger an unnecessary warnihg
   promise._resolver._result = reason;
   promise._resolver._status = 'rejected';

   return promise;
};

/*
Returns a promise that is resolved or rejected when all values are resolved or
any is rejected. This is useful for waiting for the resolution of multiple
promises, such as reading multiple files in Node.js or making multiple XHR
requests in the browser.

@method all
@param {Any[]} values An array of any kind of values, promises or not. If a value is not
@return [Promise] A promise for an array of all the fulfillment values
@static
*/
Promise.all = function (values) {
    var Promise = this;
    return new Promise(function (resolve, reject) {
        if (!isArray(values)) {
            reject(new TypeError('Promise.all expects an array of values or promises'));
            return;
        }

        var remaining = values.length,
            i         = 0,
            length    = values.length,
            results   = [];

        function oneDone(index) {
            return function (value) {
                results[index] = value;

                remaining--;

                if (!remaining) {
                    resolve(results);
                }
            };
        }

        if (length < 1) {
            return resolve(results);
        }

        for (; i < length; i++) {
            Promise.resolve(values[i]).then(oneDone(i), reject);
        }
    });
};

/*
Returns a promise that is resolved or rejected when any of values is either
resolved or rejected. Can be used for providing early feedback in the UI
while other operations are still pending.

@method race
@param {Any[]} values An array of values or promises
@return {Promise}
@static
*/
Promise.race = function (values) {
    var Promise = this;
    return new Promise(function (resolve, reject) {
        if (!isArray(values)) {
            reject(new TypeError('Promise.race expects an array of values or promises'));
            return;
        }
        
        // just go through the list and resolve and reject at the first change
        // This abuses the fact that calling resolve/reject multiple times
        // doesn't change the state of the returned promise
        for (var i = 0, count = values.length; i < count; i++) {
            Promise.resolve(values[i]).then(resolve, reject);
        }
    });
};

/**
Forces a function to be run asynchronously, but as fast as possible. In Node.js
this is achieved using `setImmediate` or `process.nextTick`. In YUI this is
replaced with `Y.soon`.

@method async
@param {Function} callback The function to call asynchronously
@static
**/
/* istanbul ignore next */
Promise.async = modules['./asap'];

/**
Represents an asynchronous operation. Provides a
standard API for subscribing to the moment that the operation completes either
successfully (`fulfill()`) or unsuccessfully (`reject()`).

@class Promise.Resolver
@constructor
@param {Promise} promise The promise instance this resolver will be handling
**/
function Resolver(promise) {
    /**
    List of success callbacks

    @property _callbacks
    @type Array
    @private
    **/
    this._callbacks = [];

    /**
    List of failure callbacks

    @property _errbacks
    @type Array
    @private
    **/
    this._errbacks = [];

    /**
    The promise for this Resolver.

    @property promise
    @type Promise
    @deprecated
    **/
    this.promise = promise;

    /**
    The status of the operation. This property may take only one of the following
    values: 'pending', 'fulfilled' or 'rejected'.

    @property _status
    @type String
    @default 'pending'
    @private
    **/
    this._status = 'pending';

    /**
    This value that this promise represents.

    @property _result
    @type Any
    @private
    **/
    this._result = null;
}

assign(Resolver.prototype, {
    /**
    Resolves the promise, signaling successful completion of the
    represented operation. All "onFulfilled" subscriptions are executed and passed
    the value provided to this method. After calling `fulfill()`, `reject()` and
    `notify()` are disabled.

    @method fulfill
    @param {Any} value Value to pass along to the "onFulfilled" subscribers
    **/
    fulfill: function (value) {
        var status = this._status;

        if (status === 'pending' || status === 'accepted') {
            this._result = value;
            this._status = 'fulfilled';
        }

        if (this._status === 'fulfilled') {
            this._notify(this._callbacks, this._result);

            // Reset the callback list so that future calls to fulfill()
            // won't call the same callbacks again. Promises keep a list
            // of callbacks, they're not the same as events. In practice,
            // calls to fulfill() after the first one should not be made by
            // the user but by then()
            this._callbacks = [];

            // Once a promise gets fulfilled it can't be rejected, so
            // there is no point in keeping the list. Remove it to help
            // garbage collection
            this._errbacks = null;
        }
    },

    /**
    Resolves the promise, signaling *un*successful completion of the
    represented operation. All "onRejected" subscriptions are executed with
    the value provided to this method. After calling `reject()`, `resolve()`
    and `notify()` are disabled.

    @method reject
    @param {Any} value Value to pass along to the "reject" subscribers
    **/
    reject: function (reason) {
        var status = this._status;

        if (status === 'pending' || status === 'accepted') {
            this._result = reason;
            this._status = 'rejected';
            if (!this._errbacks.length) {Promise._log('Promise rejected but no error handlers were registered to it', 'info');}
        }

        if (this._status === 'rejected') {
            this._notify(this._errbacks, this._result);

            // See fulfill()
            this._callbacks = null;
            this._errbacks = [];
        }
    },

    /*
    Given a certain value A passed as a parameter, this method resolves the
    promise to the value A.

    If A is a promise, `resolve` will cause the resolver to adopt the state of A
    and once A is resolved, it will resolve the resolver's promise as well.
    This behavior "flattens" A by calling `then` recursively and essentially
    disallows promises-for-promises.

    This is the default algorithm used when using the function passed as the
    first argument to the promise initialization function. This means that
    the following code returns a promise for the value 'hello world':

        var promise1 = new Promise(function (resolve) {
            resolve('hello world');
        });
        var promise2 = new Promise(function (resolve) {
            resolve(promise1);
        });
        promise2.then(function (value) {
            assert(value === 'hello world'); // true
        });

    @method resolve
    @param [Any] value A regular JS value or a promise
    */
    resolve: function (value) {
        if (this._status === 'pending') {
            this._status = 'accepted';
            this._value = value;

            if ((this._callbacks && this._callbacks.length) ||
                (this._errbacks && this._errbacks.length)) {
                this._unwrap(this._value);
            }
        }
    },

    /**
    If `value` is a promise or a thenable, it will be unwrapped by
    recursively calling its `then` method. If not, the resolver will be
    fulfilled with `value`.

    This method is called when the promise's `then` method is called and
    not in `resolve` to allow for lazy promises to be accepted and not
    resolved immediately.

    @method _unwrap
    @param {Any} value A promise, thenable or regular value
    @private
    **/
    _unwrap: function (value) {
        var self = this, unwrapped = false, then;

        if (!value || (typeof value !== 'object' &&
            typeof value !== 'function')) {
            self.fulfill(value);
            return;
        }

        try {
            then = value.then;

            if (typeof then === 'function') {
                then.call(value, function (value) {
                    if (!unwrapped) {
                        unwrapped = true;
                        self._unwrap(value);
                    }
                }, function (reason) {
                    if (!unwrapped) {
                        unwrapped = true;
                        self.reject(reason);
                    }
                });
            } else {
                self.fulfill(value);
            }
        } catch (e) {
            if (!unwrapped) {
                self.reject(e);
            }
        }
    },

    /**
    Schedule execution of a callback to either or both of "resolve" and
    "reject" resolutions of this resolver. If the resolver is not pending,
    the correct callback gets called automatically.

    @method _addCallbacks
    @param {Function} [callback] function to execute if the Resolver
                resolves successfully
    @param {Function} [errback] function to execute if the Resolver
                resolves unsuccessfully
    **/
    _addCallbacks: function (callback, errback) {
        var callbackList = this._callbacks,
            errbackList  = this._errbacks;

        // Because the callback and errback are represented by a Resolver, it
        // must be fulfilled or rejected to propagate through the then() chain.
        // The same logic applies to resolve() and reject() for fulfillment.
        if (callbackList) {
            callbackList.push(callback);
        }
        if (errbackList) {
            errbackList.push(errback);
        }

        switch (this._status) {
            case 'accepted':
                this._unwrap(this._value);
                break;
            case 'fulfilled':
                this.fulfill(this._result);
                break;
            case 'rejected':
                this.reject(this._result);
                break;
        }
    },

    /**
    Executes an array of callbacks from a specified context, passing a set of
    arguments.

    @method _notify
    @param {Function[]} subs The array of subscriber callbacks
    @param {Any} result Value to pass the callbacks
    @protected
    **/
    _notify: function (subs, result) {
        // Since callback lists are reset synchronously, the subs list never
        // changes after _notify() receives it. Avoid calling Y.soon() for
        // an empty list
        if (subs.length) {
            // Calling all callbacks after Promise.async to guarantee
            // asynchronicity. Because setTimeout can cause unnecessary
            // delays that *can* become noticeable in some situations
            // (especially in Node.js)
            Promise.async(function () {
                var i, len;

                for (i = 0, len = subs.length; i < len; ++i) {
                    subs[i](result);
                }
            });
        }
    }

});

Promise.Resolver = Resolver;

return Promise;

}));
