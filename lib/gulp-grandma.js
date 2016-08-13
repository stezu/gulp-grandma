var path = require('path');

var PluginError = require('gulp-util').PluginError;
var through = require('through2');
var _ = require('lodash');
var grandma = require('grandma');

function grandmaError(options) {

  return new PluginError(_.extend({
    plugin: 'gulp-grandma',
    type: 'invalid-input',
    required: false
  }, options));
}

function runOnFile(file, options, done) {
  file.grandmaRunOutput = through();

  grandma.run(_.extend({
    test: {
      path: file.path,
      name: path.basename(file.path, '.js')
    },
    output: file.grandmaRunOutput
  }, options), done);
}

/**
 * Stream test files to the grandma stress testing framework. Will
 * run all files at the same time so results may be inconsistent.
 * If you need tests to run in series, use the `runSeries` method.
 *
 * @param   {Object} [options] - Options that will be passed to the
 *                               grandma `run` API.
 * @returns {Stream}           - Gulp file stream
 */
function gulpGrandma(options) {

  if (!_.isUndefined(options) && !_.isPlainObject(options)) {
    throw grandmaError({
      message: '`options` must be an object',
      parameter: 'options',
      expectedType: 'object'
    });
  }

  return through.obj(function(file, enc, next) {
    var self = this;

    if (file.isNull()) {
      next(null, file);

      return;
    }

    runOnFile(file, options, function(err) {

      if (err) {
        self.emit('error', err);
      }
    });

    next(null, file);
  });
}

/**
 * Run all tests in series.
 *
 * @param   {Object} [options] - Options that will be passed to the
 *                               grandma `run` API.
 * @returns {Stream}           - Gulp file stream
 */
gulpGrandma.runSeries = function(options) {

  if (!_.isUndefined(options) && !_.isPlainObject(options)) {
    throw grandmaError({
      message: '`options` must be an object',
      method: 'series',
      parameter: 'options',
      expectedType: 'object'
    });
  }

  return through.obj(function(file, enc, next) {

    if (file.isNull()) {
      next(null, file);

      return;
    }

    runOnFile(file, options, function(err) {

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
 * theoretically be used on a glob of report files as well but
 * that is not currently supported or documented.
 *
 * @param   {Object} [options] - Options that will be passed to the
 *                               grandma `report` API.
 * @returns {Stream}           - Gulp file stream
 */
gulpGrandma.report = function(options) {

  if (!_.isUndefined(options) && !_.isPlainObject(options)) {
    throw grandmaError({
      message: '`options` must be an object',
      method: 'report',
      parameter: 'options',
      expectedType: 'object'
    });
  }

  return through.obj(function(file, enc, next) {

    if (!file.grandmaRunOutput) {
      next(null, file);

      return;
    }

    grandma.report(_.extend({
      type: 'json',
      input: file.grandmaRunOutput
    }, options), function(err, json) {

      if (err) {
        throw grandmaError({ message: err });
      }

      // The reporter can be called with different options so
      // json might not be present. If it is, we can parse it
      // and report to stdout. If not, this will never error.
      if (json) {

        if (!_.isUndefined(json.breakdown.failures)) {
          throw grandmaError({
            method: 'report',
            message: 'Grandma performance tests failed',
            details: json.breakdown.failures
          });
        }
      }

      next(null, file);
    });
  });
};

module.exports = gulpGrandma;
