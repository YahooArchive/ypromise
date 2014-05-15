var EOL = require('os').EOL;

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
                    dest: 'tmp/'
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
                src: ['queue.js', 'asap.js'],
                dest: 'tmp/'
            }
        },
        bundle: {
            amd: {
                options: {
                    template: 'tasks/assets/amd.mustache'
                },
                files: [{
                    src: [
                        'tmp/queue.js',
                        'tmp/asap.js',
                        'tmp/promise.js'
                    ],
                    dest: 'promise.amd.js'
                }]
            },
            polyfill: {
                options: {
                    template: 'tasks/assets/polyfill.mustache'
                },
                files: [{
                    src: [
                        'tmp/queue.js',
                        'tmp/asap.js',
                        'tmp/promise.js'
                    ],
                    dest: 'promise.js'
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

    grunt.loadTasks('tasks/');

    grunt.registerTask('cjs', [
        'transpile:cjs',
        'es6_module_wrap_default'
    ]);
    grunt.registerTask('amd', [
        'transpile:amd',
        'amdwrap',
        'bundle:amd',
        'license:amd'
    ]);
    grunt.registerTask('polyfill', [
        'transpile:amd',
        'amdwrap',
        'bundle:polyfill',
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
