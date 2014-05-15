/*jslint node:true*/
'use strict';

var mergeTrees     = require('broccoli-merge-trees'),
    unwatchedTree  = require('broccoli-unwatched-tree'),
    amdWrap        = require('./plugins/amd-wrap'),
    wrapDefault    = require('./plugins/wrap-default'),
    makeBundle     = require('./plugins/make-bundle'),
    mapFiles       = require('./plugins/map-files'),
    stamp          = require('./plugins/stamp'),
    pickFiles      = require('broccoli-static-compiler'),
    compileModules = require('broccoli-es6-module-filter'),
    uglify         = require('broccoli-uglify-js'),
    EOL            = require('os').EOL;

var node_modules = unwatchedTree('node_modules/');

var asap = amdWrap(pickFiles(node_modules, {
    srcDir: 'asap/',
    files: ['*.js'],
    destDir: './'
}), {
    map: {
        'queue': './queue'
    }
});

var bundleSrc = mergeTrees([asap, compileModules('lib/', {
    moduleType: 'amd',
    anonymous: false,
    packageName: 'promise',
    main: 'promise',
    compatFix: true
})]);

var browserFiles = mergeTrees([makeBundle(bundleSrc, {
    template: './plugins/assets/amd.handlebars',
    files: [
//        'queue.js',
        'asap.js',
        'promise.js'
    ],
    dest: 'promise.amd.js'
}), makeBundle(bundleSrc, {
    template: './plugins/assets/polyfill.handlebars',
    files: [
//        'queue.js',
        'asap.js',
        'promise.js'
    ],
    dest: 'promise.js'
})]);

browserFiles = mergeTrees([browserFiles, uglify(mapFiles(browserFiles, {
    'promise.js': 'promise-min.js',
    'promise.amd.js': 'promise.amd-min.js'
}))]);

browserFiles = stamp(browserFiles, {
    banner: [
        '/*',
        'Copyright 2013 Yahoo! Inc. All rights reserved.',
        'Licensed under the BSD License.',
        'http://yuilibrary.com/license/',
        '*/',
    ].join(EOL)
});

var cjsFiles = compileModules(pickFiles('lib/', {
    srcDir: '.',
    destDir: 'cjs/'
}), {
    moduleType: 'cjs',
    compatFix: true
});

var wrapped = wrapDefault(cjsFiles, {
    srcDir: 'cjs/',
    destDir: 'dist/'
});

module.exports = mergeTrees([browserFiles, cjsFiles, wrapped]);
