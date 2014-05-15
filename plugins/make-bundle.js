/*jslint node:true*/
'use strict';

var Writer     = require('broccoli-writer'),
    path       = require('path'),
    fs         = require('fs'),
    util       = require('util'),
    EOL        = require('os').EOL,
    walkSync   = require('walk-sync'),
    Handlebars = require('handlebars');

module.exports = Bundler;

function Bundler(inputTree, options) {
    options = options || {};

    if (!(this instanceof Bundler)) {
        return new Bundler(inputTree, options);
    }
    Writer.call(inputTree, options);

    this.inputTree = inputTree;
    this.options   = options;
}
util.inherits(Bundler, Writer);

Bundler.prototype.write = function (readTree, destDir) {
    var options  = this.options,
        files    = options.files,
        destFile = path.join(destDir, options.dest),
        template = Handlebars.compile(fs.readFileSync(options.template, 'utf8'));

    return readTree(this.inputTree).then(function (srcDir) {
        var contents = files.map(function (file) {
            return fs.readFileSync(path.join(srcDir, file), 'utf8');
        }).join(EOL);

        fs.writeFileSync(destFile, template({
            contents: contents
        }));
    });
};
