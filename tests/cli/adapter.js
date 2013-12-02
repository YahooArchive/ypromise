
var Promise = require('../../promise');

exports.fulfilled = function (value) {
    return Promise.resolve(value);
};
exports.rejected = function (reason) {
    return Promise.reject(reason);
};
exports.pending = function () {
    var deferred = Promise.deferred();

    return {
        fulfill: deferred.resolve,
        reject:  deferred.reject,
        promise: deferred.promise
    };
};
