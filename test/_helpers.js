var _ = require('lodash');
var File = require('vinyl');

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

var FILENAME = 'file';
var FILEPATH = '/test/file.js';

function getFile(contents, path) {

  return new File({
    cwd: '/',
    base: '/test/',
    path: path ? path : FILEPATH,
    contents: contents === undefined ? new Buffer('testing ' + Math.random()) : contents
  });
}

module.exports = {
  nonObjectTypes: nonObjectTypes,
  FILENAME: FILENAME,
  FILEPATH: FILEPATH,
  getFile: getFile
};
