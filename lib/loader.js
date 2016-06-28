var _ = require('lodash');
var loaderUtils = require('loader-utils');
var transformer = require('./transformer');

module.exports = function(source) {

  //var query = loaderUtils.parseQuery(this.query);
  //var config = loaderUtils.getLoaderConfig(this, "jsonSchemaExampleLoader");

  this.cacheable && this.cacheable();

  var transformeredSchema = transformer(this.inputValue[0]);
  var json = JSON.stringify(transformeredSchema, null, 2);
  this.value = [transformeredSchema];
  return 'module.exports = ' + json + ';';
}
