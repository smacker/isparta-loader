'use strict';

var isparta = require('isparta');
var loaderUtils = require('loader-utils');
var cache = require('./lib/fs-cache');

module.exports = function(source) {
    var config = this.options.isparta || {
        embedSource: true,
        noAutoWrap: true,
        babel: this.options.babel
    };

    var options = loaderUtils.parseQuery(this.query);
    var cacheDirectory = options.cacheDirectory;
    var callback;

    var instrumenter = new isparta.Instrumenter(config);

    if (this.cacheable) {
        this.cacheable();
    }

    if (cacheDirectory) {
        callback = this.async();
        return cache({
            directory: cacheDirectory,
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
