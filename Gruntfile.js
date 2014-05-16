/*
Copyright 2013 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/
var path = require('path'),
    EOL  = require('os').EOL;

module.exports = function (grunt) {
    grunt.initConfig({
        transpile: {
            cjs: {
                type: 'cjs',
                compatFix: true,
                files: [{
                    expand: true,
                    cwd: 'lib/',
                    src: ['*.js'],
                    dest: 'build/'
                }]
            },
            amd: {
                type: 'amd',
                compatFix: true,
                files: [{
                    expand: true,
                    cwd: 'lib/',
                    src: ['*.js'],
                    dest: 'tmp/parts/'
                }]
            }
        },
        es6_module_wrap_default: {
            cjs: {
                options: {
                    type: 'cjs'
                },
                files: [{
                    expand: true,
                    cwd: 'build/',
                    src: ['*.js'],
                    dest: 'dist/'
                }]
            }
        },
        amdwrap: {
            amd: {
                expand: true,
                cwd: 'node_modules/asap/',
                src: ['*.js'],
                dest: 'tmp/parts/'
            }
        },
        wrap: {
            bundle: {
                options: {
                    separator: EOL,
                    wrapper: function (filepath, options) {
                        filepath = path.basename(filepath, '.js');
                        if (filepath === 'queue') {
                            filepath = './queue';
                        }
                        return ['define("' + filepath +
                            '", function (require, exports, module) {', '});'];
                    }
                },
                expand: true,
                cwd: 'node_modules/asap/',
                src: ['*.js'],
                dest: 'tmp/parts/'
            },
            amd: {
                options: {
                    separator: EOL,
                    wrapper: [
                        'define(function () {',
                        'return require("promise");' + EOL + '});' + EOL
                    ]
                },
                src: ['tmp/bundle.js'],
                dest: 'promise.amd.js'
            },
            polyfill: {
                options: {
                    separator: EOL,
                    wrapper: [
                        ';(function (global) {',
                        [
                            'var PromisePolyfill = require("promise"), __p;',
                            'if (!global.Promise ||',
                            '!global.Promise.resolve ||',
                            '!global.Promise.reject ||',
                            '!global.Promise.all ||',
                            '!global.Promise.race ||',
                            '(__p = global.Promise.resolve()) ' +
                                '!== global.Promise.resolve(__p)) {',
                            'global.Promise = PromisePolyfill;',
                            '}',
                            'global.PromisePolyfill = PromisePolyfill;',
                            '}(this));'
                        ].join(EOL)
                    ]
                },
                src: ['tmp/bundle.js'],
                dest: 'promise.js'
            }
        },
        concat: {
            bundle: {
                options: {
                    separator: EOL,
                },
                files: [{
                    src: ['tasks/assets/fake-amd.js', 'tmp/parts/*.js'],
                    dest: 'tmp/bundle.js'
                }]
            }
        },
        uglify: {
            options: {
                mangle: true,
                squeeze: true,
                semicolon: false,
                lift_vars: false,
                mangle_toplevel: true,
                no_mangle_functions: true,
                max_line_length: 6000
            },
            all: {
                files: {
                    'promise.amd-min.js': ['promise.amd.js'],
                    'promise-min.js': ['promise.js']
                }
            }
        },
        license: {
            options: {
                banner: [
                    '/*',
                    'Copyright 2013 Yahoo! Inc. All rights reserved.',
                    'Licensed under the BSD License.',
                    'http://yuilibrary.com/license/',
                    '*/',
                    ''
                ].join(EOL)
            },
            amd: {
                src: ['promise.amd.js']
            },
            polyfill: {
                src: ['promise.js']
            },
            release: {
                src: ['*-min.js']
            }
        },
        jshint: {
            options: {
                jshintrc: 'node_modules/yui-lint/jshint.json'
            },
            all: ['lib/*.js']
        },
        clean: [
            'build/',
            'dist/',
            'tmp/',
            'promise*'
        ]
    });

    grunt.loadNpmTasks('grunt-es6-module-transpiler');
    grunt.loadNpmTasks('grunt-es6-module-wrap-default');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-wrap');

    grunt.loadTasks('tasks/');

    grunt.registerTask('cjs', [
        'transpile:cjs',
        'es6_module_wrap_default'
    ]);
    grunt.registerTask('amd', [
        'transpile:amd',
        'wrap:bundle',
        'concat:bundle',
        'wrap:amd',
        'license:amd'
    ]);
    grunt.registerTask('polyfill', [
        'transpile:amd',
        'wrap:bundle',
        'wrap:bundle',
        'concat:bundle',
        'wrap:polyfill',
        'license:polyfill'
    ]);
    grunt.registerTask('build', ['clean', 'cjs', 'amd', 'polyfill']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('release', [
        'clean',
        'amd',
        'polyfill',
        'uglify',
        'license:release'
    ]);
    grunt.registerTask('default', ['build']);
};
