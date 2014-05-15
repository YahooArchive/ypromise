/*jslint node:true*/
'use strict';

var Filter = require('broccoli-filter'),
    util   = require('util'),
    EOL    = require('os').EOL;

module.exports = Stamp;

function Stamp(inputTree, options) {
    options = options || {};

    if (!(this instanceof Stamp)) {
        return new Stamp(inputTree, options);
    }
    Filter.call(this, inputTree, options);

    this.inputTree = inputTree;
    this.banner    = options.banner || '';
}
util.inherits(Stamp, Filter);

Stamp.prototype.extensions = ['js'];
Stamp.prototype.targetExtension = 'js';

Stamp.prototype.processString = function (content) {
    return this.banner + EOL + content;
};
