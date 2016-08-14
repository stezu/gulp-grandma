var sinon = require('sinon');
var expect = require('chai').expect;
var _ = require('lodash');

var helpers = require('./_helpers.js');
var util = require('../lib/util.js');

var gulpGrandma = require('../');

describe('[gulp-grandma]', function() {
  var nonObjectTypes = [{
    type: 'boolean',
    value: false
  }, {
    type: 'string',
    value: 'unicorn'
  }, {
    type: 'number',
    value: Math.random()
  }, {
    type: 'array',
    value: ['random', 'value']
  }, {
    type: 'null',
    value: null
  }, {
    type: 'function',
    value: _.noop
  }, {
    type: 'Error',
    value: new Error('test error')
  }];

  function runSharedTests(method, spy) {

    describe('throws an error if options is a(n)', function() {

      nonObjectTypes.forEach(function(testCase) {

        it('"' + testCase.type + '"', function() {
          expect(function() {
            method(testCase.value);
          }).to.throw(Error, '`options` must be an object');
        });
      });
    });

    it('returns a stream', function() {
      var result = method();

      // Smoke check to validate this is a stream
      expect(result.on).to.be.a('function');
      expect(result.pipe).to.be.a('function');
      expect(result.end).to.be.a('function');
    });

    it('does nothing if the file has no contents', function() {
      var spiedMethod = _.get(spy[0], spy[1]);
      var file = helpers.getFile(null);
      var result = method();

      result.write(file);

      expect(spiedMethod.called).to.equal(false);
    });

    it('calls the method we are spying on once with the correct arguments', function() {
      var spiedMethod = _.get(spy[0], spy[1]);
      var file = helpers.getFile();
      var options = {
        banana: 'unicorn',
        snowflakes: 'glitter'
      };
      var result = method(options);

      result.write(file);

      expect(spiedMethod.calledOnce).to.equal(true);
      expect(spiedMethod.firstCall.args).to.have.length(3);
      expect(spiedMethod.firstCall.args[0]).to.equal(file);
      expect(spiedMethod.firstCall.args[1]).to.equal(options);
      expect(spiedMethod.firstCall.args[2]).to.be.a('function');
    });
  }

  it('exposes the correct public api', function() {

    expect(gulpGrandma).to.be.a('function')
      .and.to.have.all.keys('runSeries', 'report');

    expect(gulpGrandma.runSeries).to.be.a('function');
    expect(gulpGrandma.report).to.be.a('function');
  });

  describe('#main', function() {

    beforeEach(function() {
      sinon.stub(util, 'runOnFile');
    });

    afterEach(function() {
      util.runOnFile.restore();
    });

    runSharedTests(gulpGrandma, [util, 'runOnFile']);

    it('will emit an error on the stream if "util.runOnFile" returns an error', function(done) {
      var file = helpers.getFile();
      var result = gulpGrandma();
      var error = new Error('test error: ' + Math.random());

      result.on('error', function(err) {
        expect(err).to.equal(error);

        done();
      });

      result.end(file);

      expect(util.runOnFile.calledOnce).to.equal(true);
      expect(util.runOnFile.firstCall.args).to.have.length(3);
      expect(util.runOnFile.firstCall.args[0]).to.equal(file);
      expect(util.runOnFile.firstCall.args[1]).to.equal(undefined);
      expect(util.runOnFile.firstCall.args[2]).to.be.a('function');

      util.runOnFile.firstCall.args[2](error);
    });

    it('will continue to the next file if "util.runOnFile" succeeds', function(done) {
      var file = helpers.getFile();
      var file2 = helpers.getFile();
      var result = gulpGrandma();

      result.write(file);
      result.write(file2);

      expect(util.runOnFile.calledTwice).to.equal(true);
      expect(util.runOnFile.firstCall.args).to.have.length(3);
      expect(util.runOnFile.firstCall.args[0]).to.equal(file);
      expect(util.runOnFile.firstCall.args[1]).to.equal(undefined);
      expect(util.runOnFile.firstCall.args[2]).to.be.a('function');

      util.runOnFile.firstCall.args[2]();

      done();
    });
  });

  describe('#runSeries', function() {

    beforeEach(function() {
      sinon.stub(util, 'runOnFile');
    });

    afterEach(function() {
      util.runOnFile.restore();
    });

    runSharedTests(gulpGrandma.runSeries, [util, 'runOnFile']);

    it('will emit an error on the stream if "util.runOnFile" returns an error', function(done) {
      var file = helpers.getFile();
      var result = gulpGrandma.runSeries();
      var error = new Error('test error: ' + Math.random());

      result.on('error', function(err) {
        expect(err).to.equal(error);

        done();
      });

      result.end(file);

      expect(util.runOnFile.calledOnce).to.equal(true);
      expect(util.runOnFile.firstCall.args).to.have.length(3);
      expect(util.runOnFile.firstCall.args[0]).to.equal(file);
      expect(util.runOnFile.firstCall.args[1]).to.equal(undefined);
      expect(util.runOnFile.firstCall.args[2]).to.be.a('function');

      util.runOnFile.firstCall.args[2](error);
    });

    it('will continue to the next file if "util.runOnFile" succeeds', function(done) {
      var file = helpers.getFile();
      var file2 = helpers.getFile();
      var result = gulpGrandma.runSeries();

      result.write(file);
      result.write(file2);

      expect(util.runOnFile.calledOnce).to.equal(true);
      expect(util.runOnFile.firstCall.args).to.have.length(3);
      expect(util.runOnFile.firstCall.args[0]).to.equal(file);
      expect(util.runOnFile.firstCall.args[1]).to.equal(undefined);
      expect(util.runOnFile.firstCall.args[2]).to.be.a('function');

      util.runOnFile.firstCall.args[2]();

      expect(util.runOnFile.calledTwice).to.equal(true);
      done();
    });
  });

  describe('#report', function() {

    beforeEach(function() {
      sinon.stub(util, 'reportOnFile');
    });

    afterEach(function() {
      util.reportOnFile.restore();
    });

    runSharedTests(gulpGrandma.report, [util, 'reportOnFile']);
  });
});
