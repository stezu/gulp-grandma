var sinon = require('sinon');
var expect = require('chai').expect;

var PluginError = require('gulp-util').PluginError;
var through = require('through2');
var grandma = require('grandma');
var _ = require('lodash');

var helpers = require('./_helpers.js');
var util = require('../lib/util.js');

describe('[gulp-grandma-util]', function() {

  it('has tests for all methods', function() {
    var keys = [
      'grandmaError',
      'runOnFile',
      'reportOnFile',
      'reportErrors'
    ];

    expect(util).to.have.all.keys(keys);

    keys.forEach(function(key) {
      expect(util[key]).to.be.a('function');
    });
  });

  describe('#grandmaError', function() {

    it('contructs a PluginError', function() {
      var error = util.grandmaError({
        message: 'test error'
      });

      expect(error).to.be.an.instanceOf(Error);
      expect(error).to.be.an.instanceOf(PluginError);
      expect(error).to.not.be.an.instanceOf(RangeError);
    });

    it('sets the plugin property by default', function() {
      var input = {
        message: 'test error'
      };
      var error = util.grandmaError(input);

      expect(error).to.have.property('plugin')
        .and.to.equal('gulp-grandma');
      expect(error).to.have.property('message')
        .and.to.equal(input.message);
    });
  });

  describe('#runOnFile', function() {

    beforeEach(function() {
      sinon.stub(grandma, 'run');
    });

    afterEach(function() {
      grandma.run.restore();
    });

    it('calls "grandma.run" with the passed in file', function(done) {
      var file = helpers.getFile();
      var options = {
        duration: '1h',
        rate: 100
      };

      util.runOnFile(file, options, done);

      // Ensure grandma.run was called properly
      expect(grandma.run.calledOnce).to.equal(true);
      expect(grandma.run.firstCall.args).to.have.length(2);
      expect(grandma.run.firstCall.args[0]).to.deep.equal(_.extend({
        test: {
          path: helpers.FILEPATH,
          name: helpers.FILENAME
        },
        output: file.grandmaRunOutput
      }, options));
      expect(grandma.run.firstCall.args[1]).to.be.a('function');

      process.nextTick(grandma.run.firstCall.args[1]);
    });
  });

  describe('#reportOnFile', function() {

    beforeEach(function() {
      sinon.stub(grandma, 'report');
    });

    afterEach(function() {
      grandma.report.restore();
    });

    function testReportOnFile(file, result, done) {
      var options = {
        banana: 'unicorn'
      };

      util.reportOnFile(file, options, done);

      // Ensure grandma.report was called properly
      expect(grandma.report.calledOnce).to.equal(true);
      expect(grandma.report.firstCall.args).to.have.length(2);
      expect(grandma.report.firstCall.args[0]).to.have.all.keys('type', 'input', 'banana');
      expect(grandma.report.firstCall.args[0].type).to.equal('json');
      expect(grandma.report.firstCall.args[0].banana).to.equal('unicorn');

      // Smoke check to validate this is a stream
      expect(grandma.report.firstCall.args[0].input.on).to.be.a('function');
      expect(grandma.report.firstCall.args[0].input.pipe).to.be.a('function');
      expect(grandma.report.firstCall.args[0].input.end).to.be.a('function');
      expect(grandma.report.firstCall.args[1]).to.be.a('function');

      (function readStream() {
        var data = [];

        grandma.report.firstCall.args[0].input
          .on('data', function(chunk) {
            data.push(chunk);
          })
          .on('end', function() {
            expect(Buffer.concat(data).toString()).to.equal(result.toString());
            process.nextTick(grandma.report.firstCall.args[1]);
          });
      }());
    }

    it('calls "grandma.report" with the passed in file buffer', function(done) {
      var result = new Buffer('testfile ' + Math.random().toString(36));
      var file = helpers.getFile(result);

      testReportOnFile(file, result, done);
    });

    it('calls "grandma.report" with the passed in file stream', function(done) {
      var result = 'testing ' + Math.random().toString(36);
      var stream = through();
      var file = helpers.getFile(stream);

      testReportOnFile(file, result, done);

      stream.end(result);
    });

    it('optionally reads "file.grandmaRunOutput" if it exists', function(done) {
      var result = 'testing ' + Math.random().toString(36);
      var result2 = 'testing ' + Math.random().toString(36);
      var stream = through();
      var stream2 = through();
      var file = helpers.getFile(stream);

      file.grandmaRunOutput = stream2;
      testReportOnFile(file, result2, done);

      stream.end(result);
      stream2.end(result2);
    });
  });

  describe('#reportErrors', function() {

    it('calls next with the file when the report is empty', function(done) {
      var inFile = helpers.getFile();

      var errorHandler = util.reportErrors(inFile, function(err, file) {
        expect(err).to.equal(null);
        expect(file).to.equal(file);

        done();
      });

      process.nextTick(errorHandler);
    });

    it('calls next with the file when the report does not contain errors', function(done) {
      var inFile = helpers.getFile();

      var errorHandler = util.reportErrors(inFile, function(err, file) {
        expect(err).to.equal(null);
        expect(file).to.equal(file);

        done();
      });

      process.nextTick(errorHandler, null, {
        breakdown: {
          successes: 150
        }
      });
    });

    it('calls next with an error if the report failed to generate', function(done) {
      var inFile = helpers.getFile();
      var error = new Error('test error: ' + Math.random());

      var errorHandler = util.reportErrors(inFile, function(err) {
        expect(arguments).to.have.length(1);

        expect(err.name).to.equal(error.name);
        expect(err.message).to.equal(error.message);
        expect(err.stack).to.equal(error.stack);
        expect(err.plugin).to.equal('gulp-grandma');
        expect(err).to.be.an.instanceOf(PluginError);

        done();
      });

      errorHandler(error);
    });

    it('calls next with an error if the report contains test errors', function(done) {
      var inFile = helpers.getFile();

      var errorHandler = util.reportErrors(inFile, function(err) {
        expect(arguments).to.have.length(1);

        expect(err.message).to.equal('Grandma performance tests failed');
        expect(err.plugin).to.equal('gulp-grandma');
        expect(err).to.be.an.instanceOf(PluginError);

        done();
      });

      errorHandler(null, {
        breakdown: {
          failures: 12
        }
      });
    });
  });
});
