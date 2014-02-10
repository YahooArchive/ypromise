/*
Copyright 2013 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/
global.Promise = require('../../promise.js');
global.expect = require('expect.js');
var adapter = require('./adapter.js');
var promisesAplusTests = require('promises-aplus-tests');

require('../unit/assets/promise-tests.js');

describe("Promises/A+ Tests", function () {
    require("promises-aplus-tests").mocha(adapter);
});
