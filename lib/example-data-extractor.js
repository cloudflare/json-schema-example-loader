'use strict';

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

  if (component.example) {
    // Don't build an example if we are given one directly.  This allows
    // overriding for complex schemas that can't easily be handled by
    // the example roll-up process.
    return component.example;
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
  } else if (component.rel === 'self') {
    // Special case where the component is referencing the context schema.
    // Used in the Hyper-Schema spec
    reduced = this.extract(root, root);
  } else if (component.properties) {
    // TODO: We do not roll up patternProperties and additionalProperties
    //       because generating property names is hard.  Schema authors
    //       should include a full object-level example for subschemas
    //       using those properties.
    reduced = this.mapPropertiesToExamples(component.properties, root);
  } else if (component.items) {
    if (_.isArray(component.items)) {
      reduced = this.mapItemsToExamples(component, root);
    } else {
      // Don't show more than 2 examples unless minItems > 2.
      // TODO: This won't work if uniqueItems is true.  Schema authors should
      //       provide a full array example in such cases.
      reduced = [];
      var minItems = component.minItems || 1;
      _.range(0, _.max([minItems, 2])).forEach(function(i) {
        reduced.push(this.extract(component.items, root));
      }.bind(this));
    }
  }
  // Optionally merge in extra properties
  if (_.has(component, 'extraProperties') && _.get(component, 'generator.includeExtraProperties')) {
    _.extend(reduced, this.mapPropertiesToExamples(component.extraProperties, root));
  }

  return reduced;
};

/**
 * Extracts a tuple-style items example, with or without additionalItems
 *
 * @param {Object} component - Schema containing items
 * @param {Object} root - Root schema containing array_schema
 * @returns {*}
 */
ExampleDataExtractor.prototype.mapItemsToExamples = function(component,
                                                             root) {
  var minItems = component.minItems || 1;
  var maxItems = component.maxItems || component.items.length + 1;
  var reduced = _.map(component.items, item => this.extract(item, root));

  // Only show additionalItems if they can be used.
  // There are situations in which it might not be an error to have
  // an unusable schema (because maxItems < items.length), so don't
  // raise an error.  This can occur in complex re-use cases involving
  // negated schemas.
  // Also, ignore boolean additionalItems for examples.
  var numAddlItems = _.max([
    _.max([minItems - component.items.length, 0]),
    _.max([maxItems - component.items.length, 0])
  ]);
  if (numAddlItems > 0 && _.isPlainObject(component.additionalItems)) {
    var addlExample = this.extract(component.additionalItems, root);
    _.range(0, numAddlItems).forEach(function(i) {
      reduced.push(addlExample);
    }.bind(this));
  }
  return reduced;
}

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
    if (_.startsWith(propName, '__') || propConfig.private) {
      return properties;
    }

    var example = this.getExampleDataFromItem(propConfig);

    if (propConfig.rel === 'self') {
      example = this.extract(schema, schema);
    } else if (propConfig.items && !example) {
      if (_.isArray(propConfig.items)) {
        example = this.mapItemsToExamples(propConfig, schema);
      } else {
        if (propConfig.items.example) {
          example = [propConfig.items.example];
        } else {
          example = [this.extract(propConfig.items, schema)];
        }
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
