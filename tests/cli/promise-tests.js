/*
Copyright 2013 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/
var path = require('path');
global.Promise = require(path.join(__dirname, '../../build/dist/promise'));
global.expect = require('expect.js');

require('../unit/assets/promise-tests.js');

describe("Promises/A+ Tests", function () {
    var adapter = require('./adapter.js');
    require("promises-aplus-tests").mocha(adapter);
});
