yui-promise
===========

[![Build Status](https://travis-ci.org/juandopazo/yui-promise.png)](https://travis-ci.org/juandopazo/yui-promise)

Promises allow you to interact with a value that may or may not be available yet.

Getting Started
---------------

YUI promises can be loaded as:

 * A script that acts as a polyfill for native promises and adds a global
   `Promise` constructor if the native version is not available
 * A Node.js module available in `npm`
 * An AMD module
 * As part of the YUI library. See its [User Guide](http://yuilibrary.com/yui/docs/promise/)
 * Using Bower as `yui-promise`

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
