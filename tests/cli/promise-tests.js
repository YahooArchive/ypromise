/*
Copyright 2013 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/
global.Promise = require('../../dist/promise');
global.expect = require('expect.js');

require('../unit/assets/promise-tests.js');

describe("Promises/A+ Tests", function () {
    var adapter = require('./adapter.js');
    require("promises-aplus-tests").mocha(adapter);
});
