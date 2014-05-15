var path = require('path');
global.requirejs = require('requirejs');
global.expect = require('expect.js');

console.log(path.join(__dirname, '../../build/promise.amd'));
requirejs.config({
    paths: {
        'ypromise': path.join(__dirname, '../../build/promise.amd')
    }
});

require('../unit/assets/amd-tests');
