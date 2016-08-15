var path = require('path');

var PluginError = require('gulp-util').PluginError;
var _ = require('lodash');
var through = require('through2');
var grandma = require('grandma');

function grandmaError(options) {

  return new PluginError(_.extend({
    plugin: 'gulp-grandma'
  }, options));
}

function validateOptions(options) {

  if (!_.isUndefined(options) && !_.isPlainObject(options)) {
    throw grandmaError({
      error: new Error('`options` must be an object')
    });
  }
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

function reportOnFile(file, options, done) {

  grandma.report(_.extend({
    type: 'json',
    input: file.grandmaRunOutput ? file.grandmaRunOutput : file.pipe(through())
  }, options), done);
}

function reportErrors(file, done) {

  return function callback(err, json) {

    if (err) {
      done(grandmaError({
        error: err
      }));

      return;
    }

    // The reporter can be called with different options so
    // json might not be present. If it is, we can parse it
    // and report to stdout. If not, this will never error.
    if (json) {

      if (!_.isUndefined(json.breakdown.failures)) {
        // NOTTODO: don't use pluginerror here
        done(grandmaError({
          message: 'Grandma performance tests failed'
        }));

        return;
      }
    }

    done(null, file);
  };
}

module.exports = {
  grandmaError: grandmaError,
  validateOptions: validateOptions,
  runOnFile: runOnFile,
  reportOnFile: reportOnFile,
  reportErrors: reportErrors
};
