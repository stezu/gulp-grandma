var expect = require('chai').expect;
// var _ = require('lodash');
// var grandma = require('grandma');

var gulpGrandma = require('../');

describe('[gulp-grandma]', function() {

  it('exposes the correct public api', function() {

    expect(gulpGrandma).to.be.a('function')
      .and.to.have.all.keys('runSeries', 'report');

    expect(gulpGrandma.runSeries).to.be.a('function');
    expect(gulpGrandma.report).to.be.a('function');
  });
});
