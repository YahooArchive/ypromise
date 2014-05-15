/*jslint node:true*/
'use strict';

var Writer     = require('broccoli-writer'),
    path       = require('path'),
    fs         = require('fs'),
    util       = require('util'),
    EOL        = require('os').EOL,
    mkdirp     = require('mkdirp').sync,
    walkSync   = require('walk-sync');

module.exports = WrapDefault;

function WrapDefault(inputTree, options) {
    if (!(this instanceof WrapDefault)) {
        return new WrapDefault(inputTree, options);
    }
    Writer.call(inputTree, options);

    this.inputTree = inputTree;
    this.options   = options || {};
}
util.inherits(WrapDefault, Writer);

WrapDefault.prototype.write = function (readTree, destDir) {
    var options = this.options,
        srcPath = path.normalize(options.srcDir),
        destPath = path.normalize(options.destDir);

    if (srcPath.charAt(srcPath.length - 1)) {
        srcPath = srcPath.substr(0, srcPath.length - 1);
    }

    return readTree(this.inputTree).then(function (srcDir) {
        return walkSync(srcDir)
            .filter(function (relPath) {
                return path.dirname(relPath) === srcPath &&
                    path.extname(relPath) === '.js';
            })
            .map(function (relPath) {
                var filename = path.basename(relPath),
                    contents = 'var __exports = require(\'../' +
                        relPath.substr(0, relPath.length - 3) + '\');' + EOL +
                        'module.exports = __exports[\'default\'];' + EOL;

                mkdirp(path.join(destDir, destPath));
                fs.writeFileSync(path.join(destDir, destPath, filename), contents);
                return contents;
            });
    });
};
