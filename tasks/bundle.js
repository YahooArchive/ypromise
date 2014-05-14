/*jslint node:true*/
'use strict';

var Mustache = require('mustache'),
    EOL      = require('os').EOL;

module.exports = function (grunt) {
    grunt.registerMultiTask('bundle', 'Create a custom bundle', function () {
        var options = this.options(),
            template = grunt.file.read(options.template);

        this.files.forEach(function(file) {
            var contents = file.src.filter(function(filepath) {
                return grunt.file.exists(filepath);
            }).map(function(filepath) {
                // Read and return the file's source.
                return grunt.file.read(filepath);
            }).join(EOL);

            // Write joined contents to destination filepath.
            grunt.file.write(file.dest, Mustache.render(template, {
                definition: contents
            }));
            // Print a success message.
            grunt.log.writeln('File "' + file.dest + '" created.');
        });
    });

};
