'use strict';
/* globals: describe, it */

var expect = require('chai').expect;
var transformer = require('../lib/transformer');
var schema1 = require('./fixtures/schema1.json');
var schema2 = require('./fixtures/schema2.json');
var ObjectDefinition = require('../lib/object-definition');
var _ = require('lodash');

/** @name describe @function */
/** @name it @function */
/** @name before @function */
/** @name after @function */
/** @name beforeEach @function */
/** @name afterEach @function */

describe('Schema Transformer', function() {
  // @TODO Figure out a better way isolate these tests
  before(function() {
    this.schema1 = _.cloneDeep(schema1);
    this.schema2 = _.cloneDeep(schema2);
  });

  describe('#transformLinks', function() {
    it('should return an array', function() {
      expect(transformer.transformLinks(this.schema1, this.schema1.links)).to.be.an('array');
    });
  });

  describe('#transformLink', function() {
    beforeEach(function() {
      this.link = transformer.transformLink(this.schema1, this.schema1.links[0]);
    });

    it('should contain an html ID', function() {
      expect(this.link).to.have.property('html_id').that.is.a('string');
    });

    it('should have a URI', function() {
      expect(this.link).to.have.property('uri').that.is.a('string');
    });

    it('should have a curl', function() {
      expect(this.link).to.have.property('curl').that.is.a('string');
    });

    it('should have a formatted response', function() {
      expect(this.link).to.have.property('response').that.is.a('string');
    });

    it('should have input parameters', function() {
      expect(this.link).to.have.property('parameters').that.is.an('object');
      expect(this.link).to.have.property('parameters').that.is.an.instanceOf(ObjectDefinition);
    });
  });

  describe('#buildHref', function() {
    it('should replace references with placeholders', function() {
      expect(transformer.buildHref(this.schema1.links[1].href, this.schema1)).to.equal('/fixtures/foos/:identifier');
    });

    it('should replace references with example data', function() {
      expect(transformer.buildHref(this.schema1.links[1].href, this.schema1, true)).to.equal('/fixtures/foos/123');
    });

    it('should throw an error if it cannot resolve a reference', function() {
      expect(_.bind(function() {
        transformer.buildHref('/foo/bar/{#/not/a/place}', this.schema1)
      }, this)).to.throw(Error);
    });
  });

  describe('#buildCurl', function() {
    it('should return a string', function() {
      expect(transformer.buildCurl(this.schema1.links[1], this.schema1)).to.be.a('string');
    });

    it('should have a curl in it', function() {
      expect(transformer.buildCurl(this.schema1.links[1], this.schema1)).to.contain('curl');
    });
  });

  describe('#formatData', function() {
    it('should return a string', function() {
      expect(transformer.formatData(123), 'number').to.be.a('string');
      expect(transformer.formatData('abc'), 'string').to.be.a('string');
      expect(transformer.formatData({
        a: 1,
        b: [0,2]
      }), 'object').to.be.a('string');
      expect(transformer.formatData([1,2,3,4]), 'array').to.be.a('string');
      expect(transformer.formatData(false), 'boolean').to.be.a('string');
    });
  });

  describe('#generateExample', function() {
    beforeEach(function() {
      this.example = transformer.generateExample(this.schema1.links[0].schema, this.schema1);
    });

    it('should return an object', function() {
      expect(this.example).to.be.an('object');
    });

    it('should fill attribute definitions with example values', function() {
      expect(this.example).to.have.property('foo').that.equals('bar');
    });

    it('should build an example for the whole object', function() {
      this.example = transformer.generateExample(this.schema1, this.schema1);
      expect(this.example).to.be.an('object');
      expect(this.example.id).to.equal(123);
      expect(this.example.foo).to.equal('bar');
      expect(this.example.baz).to.equal('boo');
      expect(this.example.boo).to.eql({
        attribute_one: 'One'
      });
      expect(this.example.composite).to.eql({
        attribute_one: 'One',
        attribute_two: 2
      });
      expect(this.example.nested_object).to.not.be.empty;
    });

    it('should handle cfRecurse references', function() {
      var data = transformer.generateExample(this.schema1.links[0].targetSchema, this.schema1);
      expect(data).to.be.an('object');
      expect(data).to.deep.equal({
        id: 123,
        ID: 'something',
        foo: 'bar',
        baz: 'boo',
        array_prop: ['bar'],
        boo: {
          attribute_one: 'One'
        },
        nested_object: {
          baz: 'boo',
          foo: 'bar'
        },
        composite: {
          attribute_one: 'One',
          attribute_two: 2
        },
        option: {
          attribute_two: 2
        },
        plus_one: 'bar'
      });
    });

    it('should handle cfRecurse references as an array', function() {
      var data = transformer.generateExample(this.schema1.links[3].targetSchema, this.schema1);
      expect(data).to.be.an('array');
      expect(data.length).to.be.gte(2);
      expect(data.length).to.be.lte(5);
      expect(data[0]).to.deep.equal({
        id: 123,
        ID: 'something',
        foo: 'bar',
        baz: 'boo',
        array_prop: ['bar'],
        boo: {
          attribute_one: 'One'
        },
        nested_object: {
          baz: 'boo',
          foo: 'bar'
        },
        composite: {
          attribute_one: 'One',
          attribute_two: 2
        },
        option: {
          attribute_two: 2
        },
        plus_one: 'bar'
      });
    });
  });
});
