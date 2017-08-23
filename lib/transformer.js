'use strict';

var _ = require('lodash');
var path = require('path');
var curl = require('./curl');
var JSONformatter = require('./json');
var exampleExtractor = require('./example-data-extractor');
var ObjectDefinition = require('./object-definition');
var errors = require('./errors');
var pointer = require('./pointer');

/**
 * Extend a schema with composed data for rendering in a template
 *
 * @param {Object} schema
 * @param {Object} options
 * @return {Object}
 */
var transformSchema = function(schema, options) {
  options = options || {};
  return _.omit(
    _.extend(schema, {
      // HTML-ready identifier
      html_id: _sanitizeHTMLID(schema.title),
      // Links are the available HTTP endpoints to interact with the object(s)
      links: transformLinks(schema, schema.links || [], options),
      // Object definition. Provides name, type, description, example, etc. for the schema.
      object_definition: generateObjectDefinition(schema)
    }), [
      'properties',
      'definitions',
      'allOf',
      'anyOf',
      'oneOf',
      'required',
      '$schema'
    ]
  );
};

/**
 * Prepare a string to serve as an HTML id attribute
 *
 * @param {String} str
 * @return {String}
 */
var _sanitizeHTMLID = function(str) {
  return (str || '').toString().toLowerCase().replace(/[#\'\(\) ]+/gi, '-');
};

/**
 * @param {Object} schema
 * @param {Array} links
 * @param {Object} options
 * @return {Array}
 */
var transformLinks = function(schema, links, options) {
  return _.map(links, function(link) {
    return transformLink(schema, link, options);
  });
};

/**
 * Add additional metadata to the link object for API documentation
 *
 * @param {Object} schema
 * @param {Array} link
 * @param {Object} options
 */
var transformLink = function(schema, link, options) {
  try {
    return _.omit(
      _.extend(link, {
        html_id: _sanitizeHTMLID(schema.title + '-' + link.title),
        uri: buildHref(link.href, schema),
        curl: buildCurl(link, schema, options),
        parameters: link.schema ? formatLinkParameters(link.schema, schema) : undefined,
        response: link.targetSchema ? formatData(generateExample(link.targetSchema, schema)) : undefined
      }),
      ['schema', 'targetSchema']
    );
  } catch (e) {
    errors.throwError('Error building link for ' + schema.id, e);
  }
};

/**
 * Note: Only supports resolving references relative to the given schema
 *
 * @param {String} href
 * @param {Object} schema
 * @param {Boolean} [withExampleData=false]
 * @return {String}
 */
var buildHref = function(href, schema, withExampleData) {
  if (!href) return undefined;
  // This will pull out all {/schema/pointers}
  var pattern = /((?:{(?:#?(\/[\w\/]+))})+)+/g;
  var matches = href.match(pattern);

  try {
    return _.reduce(matches, function (str, match) {
      // Remove the brackets so we can find the definition
      var stripped = match.replace(/[{}]/g, '');
      // Resolve the reference within the schema
      var definition = pointer.get(schema, stripped.substring(1));
      if (!definition) {
        errors.throwError(e, 'Could not resolve href: ' + href);
      }
      // Replace the match with either example data or the last component of the pointer
      var replacement = withExampleData ? exampleExtractor.getExampleDataFromItem(definition) : ':' + path.basename(stripped);
      // /my/{#/pointer} -> /my/example_value OR /my/:pointer
      return str.replace(match, replacement);
    }, href);
  } catch (e) {
    errors.throwError(e, 'Could not build href: ' + href);
  }
};

/**
 * Generates a cURL string containing example data for
 * a link of a given schema.
 *
 * @param {Object} link
 * @param {Object} schema
 * @param {Object} options
 * @returns {String}
 */
var buildCurl = function (link, schema, options) {
  if (!link.href) return undefined;
  var headers = {};

  var baseUrl = _.get(options, 'curl.baseUrl') || '';
  var uri = baseUrl + buildHref(link.href, schema, true);

  if (_.get(options, 'curl.requestHeaders')) {
    headers = exampleExtractor.extract(_.get(options, 'curl.requestHeaders'), schema);
  }
  if (link.cfRequestHeaders) {
    headers = exampleExtractor.extract(link.cfRequestHeaders, schema);
  }

  var data = link.schemaExampleData;

  if (link.schema) {
    data = generateExample(link.schema, schema);
  }
  // @TODO: Make this better
  curl.formatter = JSONformatter;
  return curl.generate(uri, link.method, headers, data, link.encType);
};

/**
 * @param {*} data
 * @return {String}
 */
var formatData = function(data) {
  return JSONformatter.format(data);
}

/**
 * Recursively build an object from a given schema component that is an example
 * representation of the object defined by the schema.
 *
 * @param {Object} component - valid subschema of the root/parent
 * @param {Object} root - parent schema used as the base
 * @param {Object} [options] - options for generating example representations of a schema
 * @returns {Object}
 */
var generateExample = function(component, root) {
  return exampleExtractor.extract(component, root);
};

/**
 * Loop over each properties in the inputs, assigning to either
 * a required or optional list.
 *
 * @param {Object} schema - Link inputs
 * @returns {ObjectDefinition}
 */
var formatLinkParameters = function(schema, root) {
  var baseSchema = root;
  if (schema.cfRecurse === undefined) {
    baseSchema = schema;
  } else if (schema.cfRecurse !== '') {
    throw new ReferenceError(errors.RECURSE_TARGET);
  }
  return generateObjectDefinition(baseSchema);
};

/**
 *
 * @param schema
 * @returns {ObjectDefinition}
 */
var generateObjectDefinition = function(schema) {
  return new ObjectDefinition(schema, {
    formatter: JSONformatter
  });
};

/**
 * @module lib/transformer
 * @type {Function}
 */
module.exports = {
  transformSchema: transformSchema,
  _sanitizeHTMLID: _sanitizeHTMLID,
  transformLinks: transformLinks,
  transformLink: transformLink,
  buildHref: buildHref,
  buildCurl: buildCurl,
  formatData: formatData,
  generateExample: generateExample,
  formatLinkParameters: formatLinkParameters,
  generateObjectDefinition: generateObjectDefinition
}
