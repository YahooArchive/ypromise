var path = require('path');

global.requirejs = require('requirejs');
global.expect = require('expect.js');

requirejs.config({
    paths: {
        'ypromise': path.join(__dirname, '../../promise.amd')
    }
});

require('../unit/assets/amd-tests');
