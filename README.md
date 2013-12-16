YUI Promises
============

[![Build Status](https://travis-ci.org/juandopazo/yui-promise.png)](https://travis-ci.org/juandopazo/yui-promise)

**Notice**: this module is under development.

Promises allow you to interact with a value that may or may not be available yet.

Getting Started
---------------

YUI promises can be loaded as:

 * A script that acts as a polyfill for native promises and adds a global
   `Promise` constructor if the native version is not available
 * A Node.js module available in `npm`
 * An AMD module
 * As part of the YUI library. See its [User Guide](http://yuilibrary.com/yui/docs/promise/)

### Node.js

#### Installation

To use YUI promises in Node.js, add the `yui-promise` module to your dependencies
in the `package.json` file of your project:

```
{
	"dependencies": {
		"yui-promise": "0.0.3"
	}
}
```

Install it using `npm`:

```
$ npm install
```

#### Usage

The `yui-promise` module exports the Promise constructor:

```js
var Promise = require('yui-promise');

function asyncFunction() {
	return new Promise(function (resolve, reject) {
		resolve('Hello world');
	});
}
```

Promise API reference
---------------------

### Constructor

```js
new Promise(function (resolve, reject) {});
```

#### resolve(value)
If `value` is a promise or a thenable, the new promise will adopt its value once
it settles.

#### reject(reason)
Your promise is rejected with `reason`. For consistency and debugging it is
encouraged that `reason` is an instance of `Error`.

### Instance methods

#### promise.then(onFulfilled, onRejected)
`onFulfilled` is called when/if "promise" resolves. `onRejected` is called
when/if "promise" rejects. Both are optional, if either/both are omitted the
next `onFulfilled`/`onRejected` in the chain is called. Both callbacks have a
single parameter, the fulfillment value or rejection reason. `then` returns a
new promise equivalent to the value you return from `onFulfilled`/`onRejected`
after being passed through `Promise.resolve`. If an error is thrown in the
callback, the returned promise rejects with that error.

#### promise.catch(onRejected)
Sugar for `promise.then(undefined, onRejected)`.

### Static methods

#### Promise.cast(value)
Always returns a promise. If `value` is a promise and its constructor is `Promise`
`cast` will return it without modifying it. Otherwise, `cast` will return a new
promise that resolves to `value`.

#### Promise.resolve(value)
Returns a promise resolved with `value`. Sugar for `new Promise(function (resolve) { resolve(value); })`.

#### Promise.reject(reason)
Returns a promise rejected with `reason`. Sugar for `new Promise(function (resolve, reject) { reject(value); })`.

#### Promise.all(list)
Returns a promise that fulfills when every item in the array fulfills, and
rejects if (and when) any item rejects. Each array item is passed to
`Promise.cast`, so the array can be a mixture of promise-like objects and other
objects. The fulfillment value is an array (in order) of fulfillment values. The
rejection value is the first rejection value.

#### Promise.race(list)
Returns a Promise that fulfills when any item fulfills, and rejects if any item
rejects. Esentially, the first promise to be settled wins the race.
