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
        mochaTest: {
            cjs: {
                options: {
                    reporter: 'dot'
                },
                src: ['tests/cli/promise-tests.js']
            }
        },
        concat: {
            options: {
                separator: EOL
            },
            amd: {
                src: [
                    'tmp/queue.js',
                    'tmp/asap.js',
                    'tmp/promise.js'
                ],
                dest: 'tmp/bundle.js'
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
                    dest: 'promise.polyfill.js'
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
            'promise.amd.js',
            'promise.polyfill.js'
        ]
    });

    grunt.loadNpmTasks('grunt-es6-module-transpiler');
    grunt.loadNpmTasks('grunt-es6-module-wrap-default');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks("grunt-amd-wrap");

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
    grunt.registerTask('test', ['mochaTest']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('default', ['build']);
};
