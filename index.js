'use strict';

var isparta = require('isparta');
var loaderUtils = require('loader-utils');
var cache = require('./lib/fs-cache');

module.exports = function(source) {
    var instrumenter = new isparta.Instrumenter({
        embedSource: true,
        noAutoWrap: true
    });
    var options = loaderUtils.parseQuery(this.query);
    var cacheDirectory = options.cacheDirectory;
    var callback;

    if (this.cacheable) {
        this.cacheable();
    }

    if (cacheDirectory) {
        callback = this.async();
        return cache({
            cacheDirectory: cacheDirectory,
            resourcePath: this.resourcePath,
            source: source,
            instrumenter: instrumenter,
        }, function(err, result) {
            if (err) { return callback(err); }
            return callback(null, result);
        });
    } else {
        return instrumenter.instrumentSync(source, this.resourcePath);
    }
};
