var EOL = require('os').EOL,
    Mustache = require('mustache');

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
        concat: {
            options: {
                separator: EOL
            },
            amd: {
                src: [
                    'assets/license.js',
                    'tmp/queue.js',
                    'tmp/asap.js',
                    'tmp/promise.js'
                ],
                dest: 'tmp/bundle.js'
            },
            release: {
                files: [{
                    src: [
                        'assets/license.js',
                        'tmp/promise.amd-min.js'
                    ],
                    dest: 'promise.amd-min.js'
                }, {
                    src: [
                        'assets/license.js',
                        'tmp/promise-min.js'
                    ],
                    dest: 'promise-min.js'
                }]
            }
        },
        template: {
            amd: {
                options: {
                    template: 'assets/amd.mustache',
                    definition: 'tmp/bundle.js',
                    dest: 'promise.amd.js'
                }
            },
            polyfill: {
                options: {
                    template: 'assets/polyfill.mustache',
                    definition: 'tmp/bundle.js',
                    dest: 'promise.js'
                }
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
                    'tmp/promise.amd-min.js': ['promise.amd.js'],
                    'tmp/promise-min.js': ['promise.js']
                }
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
    grunt.loadNpmTasks("grunt-amd-wrap");
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerMultiTask('template', 'Render a custom template', function () {
        var options = this.options(),
            template = grunt.file.read(options.template),
            output = Mustache.render(template, {
                definition: grunt.file.read(options.definition)
            });

        grunt.file.write(options.dest, output);
    });

    grunt.registerTask('cjs', [
        'transpile:cjs',
        'es6_module_wrap_default:cjs'
    ]);
    grunt.registerTask('amd', [
        'transpile:amd',
        'amdwrap:amd',
        'concat:amd',
        'template:amd'
    ]);
    grunt.registerTask('polyfill', [
        'transpile:amd',
        'amdwrap:amd',
        'concat:amd',
        'template:polyfill'
    ]);
    grunt.registerTask('build', ['clean', 'cjs', 'amd', 'polyfill']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('release', [
        'clean',
        'amd',
        'polyfill',
        'uglify',
        'concat:release'
    ]);
    grunt.registerTask('default', ['build']);
};
