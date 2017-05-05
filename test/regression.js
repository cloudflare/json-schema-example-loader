'use strict';
/* globals: describe, it */

var expect = require('chai').expect;
var transformer = require('../lib/transformer');
var regression = require('./fixtures/regression.json');
var ObjectDefinition = require('../lib/object-definition');
var _ = require('lodash');

/** @name describe @function */
/** @name it @function */
/** @name before @function */
/** @name after @function */
/** @name beforeEach @function */
/** @name afterEach @function */

describe('Schema Transformer Regression', function() {
  // @TODO Figure out a better way isolate these tests
  before(function() {
    this.regression = _.cloneDeep(regression);
  });

  describe('#transformLinkRegression', function() {
    beforeEach(function() {
      this.link = transformer.transformLink(this.regression, this.regression.links[0]);
    });

    it('should not copy a link "required" into parameters', function() {
      expect(this.link.parameters).to.not.have.property('required');
    });

    it('should have the required property from inside schema', function() {
      expect(this.link.parameters.required_props).to.have.members(['boo']);
      expect(this.link.parameters.required_props).to.not.have.members(['foo', 'baz']);
    });

    it('should have optional properties based on the inner required', function() {
      expect(this.link.parameters.optional_props).to.have.members(['foo', 'baz']);
      expect(this.link.parameters.optional_props).to.not.have.members(['boo']);
    });

    it('should still see all parameters', function() {
      expect(this.link.parameters.all_props).to.have.keys(['foo', 'baz', 'boo']);
    });
  });
});
