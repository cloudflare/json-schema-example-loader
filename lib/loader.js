var _ = require('lodash');
var loaderUtils = require('loader-utils');
var transformer = require('./transformer');

module.exports = function(source) {
  this.cacheable && this.cacheable();
  var options = loaderUtils.parseQuery(this.query);
  var transformeredSchema = transformer(this.inputValue[0], options);
  var json = JSON.stringify(transformeredSchema, null, 2);
  this.value = [transformeredSchema];
  return 'module.exports = ' + json + ';';
}
