'use strict';

/**
 * Filesystem cache
 *
 * Given a file and a transform function, cache the result into files
 * or retrieve the previously cached files if the given file is already known.
 *
 * Most of code copy-pasted from babel-loader
 *
 */
var crypto = require('crypto');
var fs = require('fs');
var os = require('os');
var path = require('path');
var zlib = require('zlib');

/**
 * Read the contents from the compressed file.
 *
 * @async
 * @params {String} filename
 * @params {Function} callback
 */
var read = function(filename, callback) {
  return fs.readFile(filename, function(err, data) {
    if (err) { return callback(err); }

    return zlib.gunzip(data, function(err, content) {
      if (err) { return callback(err); }

      return callback(null, content);
    });
  });
};


/**
 * Write contents into a compressed file.
 *
 * @async
 * @params {String} filename
 * @params {String} result
 * @params {Function} callback
 */
var write = function(filename, result, callback) {
  return zlib.gzip(result, function(err, data) {
    if (err) { return callback(err); }

    return fs.writeFile(filename, data, callback);
  });
};


/**
 * Build the filename for the cached file
 *
 * @params {String} source  File source code
 *
 * @return {String}
 */
var filename = function(source) {
  var hash = crypto.createHash('SHA1');
  hash.end(source);

  return hash.read().toString('hex') + '.isparta.gzip';
};

/**
 * Retrieve file from cache, or create a new one for future reads
 *
 * @async
 * @param  {Object}   params
 * @param  {String}   params.directory    Directory to store cached files
 * @param  {String}   params.resourcePath Path to original file
 * @param  {String}   params.source   Original contents of the file to be cached
 * @param  {Function} params.transform  Function that will transform the
 *                                      original file and whose result will be
 *                                      cached
 *
 * @param  {Function<err, result>} callback
 *
 */
var cache = module.exports = function(params, callback) {
  var source = params.source;
  var resourcePath = params.resourcePath;
  var instrumenter = params.instrumenter;
  var directory = (typeof params.directory === 'string') ?
        params.directory :
        os.tmpdir();
  var file = path.join(directory, filename(source));

  return read(file, function(err, content) {
    var result = '';
    // No errors mean that the file was previously cached
    // we just need to return it
    if (!err) { return callback(null, content); }

    // Otherwise just transform the file
    // return it to the user asap and write it in cache
    try {
      result = instrumenter.instrumentSync(source, resourcePath);
    } catch (error) {
      return callback(error);
    }

    return write(file, result, function(err) {
      return callback(err, result);
    });
  });
};
