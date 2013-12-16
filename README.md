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

To use YUI promises in Node.js, add the `yui-promise` module to the dependency
list in your project's `package.json` file:

```
{
    "dependencies": {
        "yui-promise": "0.0.4"
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

### Bower

To use YUI promises in a Bower project, add the `yui-promise` module to the
dependency list in your project's `bower.json` file:

```
{
    "dependencies": {
        "yui-promise": "git://github.com/juandopazo/yui-promise.git"
    }
}
```

Install it using `bower`:

```
$ bower install yui-promise
```

#### Usage

Once installed, you can use the promises module as an AMD module, a YUI module
or a global polyfill of the standard [Promise API](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Promise).

```js
// Using Require.js
require(['./bower-components/yui-promise'], function (Promise) {
    function asyncFunction() {
        return new Promise(function (resolve, reject) {
            resolve('Hello world');
        });
    }
});
```

### YUI

The promises module is provided by YUI in each release of the library.

```js
YUI().use('promise', function (Y) {
    function asyncFunction() {
        return new Y.Promise(function (resolve, reject) {
            resolve('Hello world');
        });
    }
});
```
