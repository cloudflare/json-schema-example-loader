'use strict';

const errors = require('./errors');


var _ = require('lodash');
/**
 * @class ExampleDataExtractor
 * @constructor
 */
var ExampleDataExtractor = function() {};

/**
 * Recursively build an object from a given schema component that is an example
 * representation of the object defined by the schema.
 *
 * @param {Object} component - valid subschema of the root/parent
 * @param {Object} root - parent schema used as the base
 * @returns {Object}
 */
ExampleDataExtractor.prototype.extract = function(component, root) {
  var reduced = {};

  if (!component) {
    throw new ReferenceError('No schema received to generate example data');
  }
  // If the schema defines an ID, change scope so all local references as resolved
  // relative to the schema with the closest ID
  if (component.id) {
    root = component;
  }

  if (component.allOf) {
    // Recursively extend/overwrite the reduced value.
    _.reduce(component.allOf, function(accumulator, subschema) {
      return _.extend(accumulator, this.extract(subschema, root));
    }, reduced, this);
  } else if (component.oneOf) {
    // Select the first item to build an example object from
    reduced = this.extract(component.oneOf[0], root);
  } else if (component.anyOf) {
    // Select the first item to build an example object from
    reduced = this.extract(component.anyOf[0], root);
  } else if (component.cfRecurse !== undefined) {
    // Special case where the component is referencing the context schema.
    if (component.cfRecurse !== '') {
      throw new ReferenceError(errors.RECURSE_TARGET);
    }
    reduced = this.extract(root, root);
  } else if (component.properties) {
    reduced = this.mapPropertiesToExamples(component.properties, root);
  } else if (component.type && component.type === "array" ) {
    var minItems = component.minItems || 1;
    var maxItems = component.maxItems || 1;
    reduced = [];
    _.range(_.random(minItems, maxItems)).forEach(function(i) {
      reduced.push( this.extract(component.items, root) );
    }.bind(this));
  }
  // Optionally merge in extra properties
  // @TODO: Determine if this is the right thing to do
  if (_.has(component, 'extraProperties') && _.get(component, 'generator.includeExtraProperties')) {
    _.extend(reduced, this.mapPropertiesToExamples(component.extraProperties, root));
  }

  return reduced;
};

/**
 * Maps a `properties` definition to an object containing example values
 *
 * `{attribute1: {type: 'string', example: 'example value'}}` ->
 * `{attribute1: 'example value'}`
 *
 * @param {Object} props - Properties definition object
 * @param {Object} schema - Root schema containing the properties
 * @returns {*}
 */
ExampleDataExtractor.prototype.mapPropertiesToExamples = function(props, schema) {
  return _.transform(props, function(properties, propConfig, propName) {
    // Allow opt-ing out of generating example data
    if (propConfig.cfPrivate) {
      return properties;
    }

    var example = this.getExampleDataFromItem(propConfig);

    if (propConfig.cfRecurse !== undefined) {
      if (propConfig.cfRecurse !== '') {
        throw new ReferenceError(errors.RECURSE_TARGET);
      }
      example = this.extract(schema, schema);
    } else if (propConfig.type === 'array' && propConfig.items && !example) {
      if (propConfig.items.example) {
        example = [propConfig.items.example];
      } else {
        example = [this.extract(propConfig.items, schema)];
      }
    } else if (propConfig.id && !example) {
      example = this.extract(propConfig, propConfig);
    } else if (propConfig.properties) {
      example = this.mapPropertiesToExamples(propConfig.properties, schema);
    } else if (propConfig.oneOf || propConfig.anyOf) {
      example = this.extract(propConfig, schema);
    } else if (propConfig.allOf) {
      example = _.reduce(propConfig.allOf, function(accumulator, item) {
        return _.extend(accumulator, this.extract(item, schema));
      }, example || {}, this);
    }
    properties[propName] = example;
  }, {}, this);
};

/**
 * @param {Object} reference
 * @returns {String}
 */
ExampleDataExtractor.prototype.getExampleDataFromItem = function(reference) {
  if (!_.isPlainObject(reference)) {
    return 'unknown';
  }
  return _.has(reference, 'example') ? reference.example : reference.default;
};

/**
 * @module lib/example-data-extractor
 * @type {ExampleDataExtractor}
 */
module.exports = new ExampleDataExtractor();
