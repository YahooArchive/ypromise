global.Promise = require('../../promise.js');
global.expect = require('expect.js');
var adapter = require('./adapter.js');
var promisesAplusTests = require('promises-aplus-tests');

require('../unit/assets/promise-tests.js');

describe("Promises/A+ Tests", function () {
    require("promises-aplus-tests").mocha(adapter);
});
