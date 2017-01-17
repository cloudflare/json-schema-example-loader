var _ = require('lodash');
var loaderUtils = require('loader-utils');
var transformer = require('./transformer');

module.exports = function(contentString, contentJs) {
  this.cacheable && this.cacheable();
  var options = loaderUtils.parseQuery(this.query);
  var transformeredSchema = transformer.transformSchema(contentJs, options);
  var json = JSON.stringify(transformeredSchema, null, 2);
  this.value = [transformeredSchema];
  return 'module.exports = ' + json + ';';
}
