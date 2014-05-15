/*jslint node:true*/
'use strict';

var Filter = require('broccoli-filter'),
    path   = require('path'),
    util   = require('util'),
    EOL    = require('os').EOL;

module.exports = AMDWrap;

function AMDWrap(inputTree, options) {
    if (!(this instanceof AMDWrap)) {
        return new AMDWrap(inputTree, options);
    }
    Filter.call(this, inputTree, options);

    this.inputTree = inputTree;
    this.options   = options;
}
util.inherits(AMDWrap, Filter);

AMDWrap.prototype.extensions = ['js'];
AMDWrap.prototype.targetExtension = 'js';

AMDWrap.prototype.processString = function (content, relPath) {
    var modName = path.basename(relPath, '.js');
    if (this.options.map.hasOwnProperty(modName)) {
        modName = this.options.map[modName];
    }
    return 'define("' + modName +
        '", function (require, exports, module) {' + EOL +
        content + EOL + '});' + EOL;
};
