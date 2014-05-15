var path = require('path'),
    EOL  = require('os').EOL;

module.exports = function (grunt) {
    grunt.registerMultiTask('amdwrap', 'Wrap CommonJS in AMD', function () {
        this.files.forEach(function(file) {
            var contents = file.src.filter(function(filepath) {
                return grunt.file.exists(filepath);
            }).forEach(function(filepath) {
                var contents = 'define("' + path.basename(filepath, '.js') +
                    '", function (require, exports, module) {' + EOL +
                    grunt.file.read(filepath) + EOL +
                    '});' + EOL;
                
                grunt.file.write(file.dest, contents);
                grunt.log.writeln('File "' + file.dest + '" created.');
            });
        });
    });
};
