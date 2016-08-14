var File = require('vinyl');

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
  FILENAME: FILENAME,
  FILEPATH: FILEPATH,
  getFile: getFile
};
