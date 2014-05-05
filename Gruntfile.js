var EOL = require('os').EOL;

module.exports = function (grunt) {
    grunt.initConfig({
        toAMD: {
            queue: {
                src: ['node_modules/asap/queue.js'],
                dest: 'tmp/queue.js'
            },
            asap: {
                src: ['node_modules/asap/asap.js'],
                dest: 'tmp/asap.js'
            }
        },
        concat: {
            options: {
                separator: EOL
            },
            bundle: {
                src: [
                    'src/umd.js',
                    'tmp/queue.js',
                    'tmp/asap.js',
                    'src/promise.js',
                    'src/umd-outro.js'
                ],
                dest: 'promise.js'
            }
        },
        clean: ['tmp/']
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerMultiTask('toAMD', 'Wrap a Node module in AMD format', function () {
        var name = this.target;
        this.files.forEach(function(file) {
            var contents = file.src.filter(function(filepath) {
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            }).map(function(filepath) {
                return grunt.file.read(filepath);
            }).join(EOL);

            contents = 'define("./' + name +
                '", function (require, exports, module) {' + EOL + contents +
                EOL + '});' + EOL;

            grunt.file.write(file.dest, contents);
            grunt.log.writeln('File "' + file.dest + '" created.');
        });
    });

    grunt.registerTask('build', ['toAMD', 'concat', 'clean']);
    grunt.registerTask('default', ['build']);
};
