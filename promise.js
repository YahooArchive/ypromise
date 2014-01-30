/*
Copyright 2013 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/
(function (global, factory) {
    var built = factory();
    if (typeof module === 'object' && module) {
        module.exports = built;
    }
    if (typeof define === 'function' && define.amd) {
        define(factory);
    }
    global.Promise = built;
}(this, function () {

    var STATUS    = '{private:status}',
        RESULT    = '{private:result}',
        VALUE     = '{private:witness}',
        CALLBACKS = '{private:callbacks}',
        ERRBACKS  = '{private:errbacks}',
        isArray   = Array.isArray || function isArray(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        },
        assign    = Object.assign || function assign(target, source) {
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    target[prop] = source[prop];
                }
            }
            return target;
        };

    function noop() {}

    /**
    Resolves the promise, signaling successful completion of the
    represented operation. All "onFulfilled" subscriptions are executed and passed
    the value provided to this method. After calling `fulfill()`, `reject()` and
    `notify()` are disabled.

    @param {Promise} promise The promise to fulfill
    @param {Any} value Value to pass along to the "onFulfilled" subscribers
    **/
    function fulfill(promise, value) {
        var status = promise[STATUS];

        if (status === 'pending' || status === 'accepted') {
            promise[RESULT]  = value;
            promise[STATUS] = 'fulfilled';
        }

        if (promise[STATUS] === 'fulfilled') {
            notify(promise[CALLBACKS], promise[RESULT]);

            // Reset the callback list so that future calls to fulfill()
            // won't call the same callbacks again. Promises keep a list
            // of callbacks, they're not the same as events. In practice,
            // calls to fulfill() after the first one should not be made by
            // the user but by then()
            promise[CALLBACKS] = [];

            // Once a promise gets fulfilled it can't be rejected, so
            // there is no point in keeping the list. Remove it to help
            // garbage collection
            promise[ERRBACKS]  = null;
        }
    }

    /**
    Resolves the promise, signaling *un*successful completion of the
    represented operation. All "onRejected" subscriptions are executed with
    the value provided to this method. After calling `reject()`, `resolve()`
    and `notify()` are disabled.

    @param {Promise} promise The promise to reject
    @param {Any} value Value to pass along to the "reject" subscribers
    **/
    function reject(promise, reason) {
        var status = promise[STATUS];

        if (status === 'pending' || status === 'accepted') {
            promise[RESULT] = reason;
            promise[STATUS] = 'rejected';
            if (!promise[ERRBACKS].length) {Promise._log('Promise rejected but no error handlers were registered to it', 'warn');}
        }

        if (promise[STATUS] === 'rejected') {
            notify(promise[ERRBACKS], promise[RESULT]);

            // See fulfill()
            promise[CALLBACKS] = null;
            promise[ERRBACKS]  = [];
        }
    }

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

    @param {Promise} promise The promise to resolve
    @param {Any} value A regular JS value or a promise
    */
    function resolve(promise, value) {
        if (promise[STATUS] === 'pending') {
            promise[STATUS] = 'accepted';
            promise[VALUE]  = value;

            if ((promise[CALLBACKS] && promise[CALLBACKS].length) ||
                (promise[ERRBACKS] && promise[ERRBACKS].length)) {
                unwrap(promise, value);
            }
        }
    }

    /**
    If `value` is a promise or a thenable, it will be unwrapped by
    recursively calling its `then` method. If not, the resolver will be
    fulfilled with `value`.

    This method is called when the promise's `then` method is called and
    not in `resolve` to allow for lazy promises to be accepted and not
    resolved immediately.

    @param {Promise} promise Promise to unwrap the value to
    @param {Any} value A promise, thenable or regular value
    **/
    function unwrap(promise, value) {
        var unwrapped = false, then;

        if (!value || (typeof value !== 'object' &&
            typeof value !== 'function')) {
            fulfill(promise, value);
            return;
        }

        try {
            then = value.then;

            if (typeof then === 'function') {
                then.call(value, function (value) {
                    if (!unwrapped) {
                        unwrapped = true;
                        unwrap(promise, value);
                    }
                }, function (reason) {
                    if (!unwrapped) {
                        unwrapped = true;
                        reject(promise, reason);
                    }
                });
            } else {
                fulfill(promise, value);
            }
        } catch (e) {
            if (!unwrapped) {
                reject(promise, e);
            }
        }
    }

    /**
    Schedule execution of a callback to either or both of "resolve" and
    "reject" resolutions of this resolver. If the resolver is not pending,
    the correct callback gets called automatically.

    @param {Function} [callback] function to execute if the Resolver
                resolves successfully
    @param {Function} [errback] function to execute if the Resolver
                resolves unsuccessfully
    **/
    function addCallbacks(promise, callback, errback) {
        var callbackList = promise[CALLBACKS],
            errbackList  = promise[ERRBACKS];

        // Because the callback and errback are represented by a Resolver, it
        // must be fulfilled or rejected to propagate through the then() chain.
        // The same logic applies to resolve() and reject() for fulfillment.
        if (callbackList) {
            callbackList.push(callback);
        }
        if (errbackList) {
            errbackList.push(errback);
        }

        switch (promise[STATUS]) {
            case 'accepted':
                unwrap(promise, promise[VALUE]);
                break;
            case 'fulfilled':
                fulfill(promise, promise[RESULT]);
                break;
            case 'rejected':
                reject(promise, promise[RESULT]);
                break;
        }
    }

    /**
    Executes an array of callbacks from a specified context, passing a set of
    arguments.

    @param {Function[]} subs The array of subscriber callbacks
    @param {Any} result Value to pass the callbacks
    **/
    function notify(subs, result) {
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

    /**
    Wraps the callback in another function to catch exceptions and turn them
    into rejections.
    @param {Object} deferred Object with '{promise,resolve,reject}' properties
    @param {Function} callback Callback to wrap
    @return {Function}
    **/
    function wrapCallback(deferred, callback) {
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
                result = callback(valueOrReason);
            } catch (e) {
                // calling return only to stop here
                deferred.reject(e);
                return;
            }

            if (result === deferred.promise) {
                deferred.reject(new TypeError('Cannot resolve a promise with itself'));
                return;
            }

            deferred.resolve(result);
        };
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
            throw new TypeError('Promises should always be created with new Promise()');
        }

        var promise = this;

        promise[STATUS]    = 'pending';
        promise[RESULT]    = null;
        promise[VALUE]     = null;
        promise[CALLBACKS] = [];
        promise[ERRBACKS]  = [];

        try {
            fn(function (value) {
                resolve(promise, value);
            }, function (reason) {
                reject(promise, reason);
            });
        } catch (e) {
            reject(promise, e);
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
            // using this._defer() allows for subclassed promises to be
            // returned instead of plain ones
            var deferred = this.constructor._defer();

            addCallbacks(this,
                typeof callback === 'function' ?
                    wrapCallback(deferred, callback) : deferred.resolve,
                typeof errback === 'function' ?
                    wrapCallback(deferred, errback) : deferred.reject
            );

            return deferred.promise;
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

    Promise._defer = function () {
        noop.prototype = this.prototype;
        var promise = new noop();
        promise[STATUS]    = 'pending';
        promise[RESULT]    = null;
        promise[VALUE]     = null;
        promise[CALLBACKS] = [];
        promise[ERRBACKS]  = [];
        return {
            resolve: function (value) {
                resolve(promise, value);
            },
            reject: function (reason) {
                reject(promise, reason);
            },
            promise: promise
        };
    };

    /**
    Logs a message. This method is designed to be overwritten with  YUI's `log`
    function.

    @method _log
    @param {String} msg Message to log
    @param {String} [type='info'] Log level. One of 'error', 'warn', 'debug', 'info'.
    @static
    @private
    **/
    Promise._log = typeof console === 'undefined' ? function () {} : function (msg, type) {console[type || 'info'](msg);};

    /*
    Ensures that a certain value is a promise. If it is not a promise, it wraps it
    in one.

    This method can be copied or inherited in subclasses. In that case it will
    check that the value passed to it is an instance of the correct class.
    This means that `PromiseSubclass.cast()` will always return instances of
    `PromiseSublcass`.

    @method cast
    @param {Any} Any object that may or may not be a promise
    @return {Promise}
    @static
    */
    Promise.cast = function (value) {
        if (value && value.constructor === this) {
            return value;
        }

        var deferred = this._defer();
        deferred.resolve(value);
        return deferred.promise;
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
        var promise = this._defer().promise;

       // Do not go through resolver.reject() because an immediately rejected promise
       // always has no callbacks which would trigger an unnecessary warnihg
       promise[RESULT] = reason;
       promise[STATUS] = 'rejected';

       return promise;
    };

    /*
    A shorthand for creating a resolved promise.

    @method resolve
    @param {Any} value The value or promise that resolves the returned promise
    @return {Promise} A resolved promise
    @static
    */
    Promise.resolve = function (value) {
        var deferred = this._defer();
        deferred.resolve(value);
        return deferred.promise;
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
        var deferred = this._defer(),
            remaining, length,
            i = 0,
            results = [];

        if (!isArray(values)) {
            deferred.reject(new TypeError('Promise.all expects an array of values or promises'));
            return deferred.promise;
        }

        remaining = length = values.length;

        function oneDone(index) {
            return function (value) {
                results[index] = value;

                remaining--;

                if (!remaining) {
                    deferred.resolve(results);
                }
            };
        }

        if (length < 1) {
            deferred.resolve(results);
            return deferred.promise;
        }

        for (; i < length; i++) {
            this.cast(values[i]).then(oneDone(i), deferred.reject);
        }

        return deferred.promise;
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
        var deferred = this._defer(),
            i = 0, count;

        if (!isArray(values)) {
            deferred.reject(new TypeError('Promise.race expects an array of values or promises'));
            return deferred.promise;
        }
        
        // just go through the list and resolve and reject at the first change
        // This abuses the fact that calling resolve/reject multiple times
        // doesn't change the state of the returned promise
        for (count = values.length; i < count; i++) {
            this.cast(values[i]).then(deferred.resolve, deferred.reject);
        }

        return deferred.promise;
    };

    /**
    Forces a function to be run asynchronously, but as fast as possible. In Node.js
    this is achieved using `setImmediate` or `process.nextTick`. In YUI this is
    replaced with `Y.soon`.

    @method async
    @param {Function} callback The function to call asynchronously
    @static
    **/
    Promise.async = typeof setImmediate !== 'undefined' ?
                        function (fn) {setImmediate(fn);} :
                    typeof process !== 'undefined' && process.nextTick ?
                        process.nextTick :
                    function (fn) {setTimeout(fn, 0);};

    return Promise;

}));

