var through = require('through2');

var util = require('./util.js');

/**
 * Stream test files to the grandma stress testing framework. Will
 * run all files in parallel so results may be inconsistent. If you
 * need tests to run in series, use the `runSeries` method.
 *
 * @param   {Object} [options] - Options that will be passed to the
 *                               grandma `run` API.
 * @returns {Stream}           - Gulp file stream
 */
function gulpGrandma(options) {
  util.validateOptions(options);

  return through.obj(function(file, enc, next) {
    var self = this;

    if (file.isNull()) {
      next(null, file);

      return;
    }

    util.runOnFile(file, options, function(err) {

      if (err) {
        self.emit('error', err);
      }
    });

    next(null, file);
  });
}

/**
 * Stream test files to the grandma stress testing framework. Will
 * run all files in series so the tests will take longer. If you
 * don't need tests to run in series, don't use this method.
 *
 * @param   {Object} [options] - Options that will be passed to the
 *                               grandma `run` API.
 * @returns {Stream}           - Gulp file stream
 */
gulpGrandma.runSeries = function(options) {
  util.validateOptions(options);

  return through.obj(function(file, enc, next) {

    if (file.isNull()) {
      next(null, file);

      return;
    }

    util.runOnFile(file, options, function(err) {

      if (err) {
        next(err);

        return;
      }

      next(null, file);
    });
  });
};

/**
 * Get a report on the already completed tests in the stream. Can
 * also be used on files output by grandma in a different task.
 *
 * @param   {Object} [options] - Options that will be passed to the
 *                               grandma `report` API.
 * @returns {Stream}           - Gulp file stream
 */
gulpGrandma.report = function(options) {
  util.validateOptions(options);

  return through.obj(function(file, enc, next) {

    if (file.isNull()) {
      next(null, file);

      return;
    }

    util.reportOnFile(file, options, util.reportErrors(file, next));
  });
};

module.exports = gulpGrandma;
