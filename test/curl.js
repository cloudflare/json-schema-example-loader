'use strict';
/* globals: describe, it */

var expect = require('chai').expect;
var curl = require('../lib/curl');

/** @name describe @function */
/** @name it @function */
/** @name before @function */
/** @name after @function */
/** @name beforeEach @function */
/** @name afterEach @function */

describe('cURL Helper', function() {
  describe('#generate', function() {
    it('should return a string ending in the url', function() {
      var url = 'https://api.example.com/url';
      var curlString = curl.generate(url);
      expect(curlString).to.be.a('string');
      expect(curlString.endsWith(url + '"')).to.be.true;
    });

    it('should include the HTTP method', function() {
      expect(curl.generate('https://api.example.com/url', 'POST')).to.contain('POST');
    });

    it('should add headers', function() {
      var str = curl.generate('https://api.example.com/url', 'POST', {
        'My-Header': 'some value'
      });
      expect(str).to.contain('My-Header: some value');
    });

    it('should include request body data for undefined encType', function() {
      var str = curl.generate('https://api.example.com/url', 'POST', null, {
        my_key: 'my value'
      });

      expect(str).to.contain('--data \'{"my_key":"my value"}\'');
    });

    it('should add data as a query string for GET', function() {
      var str = curl.generate('https://api.example.com/url', 'GET', null, {
        key1: 'value1',
        key2: 'value2'
      });

      expect(str).to.contain('"https://api.example.com/url?key1=value1&key2=value2"');
    });

    it('should add form for encType mutlipart', function() {
      var str = curl.generate('https://api.example.com/url', 'POST', null, {
        file: '@value'
      }, 'multipart/form-data');

      expect(str).to.contain('--form "file=@value"');
    });
  });

  describe('#buildFlag', function() {
    it('should allow wrapping the value in nothing', function() {
      expect(curl.buildFlag('X', 'GET', 0, '')).to.equal('-X GET');
    });

    it('should wrap the value in double quotes by default', function() {
      expect(curl.buildFlag('H', 'value', 0)).to.equal('-H "value"');
    });

    it('should wrap the value in the specified type', function() {
      expect(curl.buildFlag('H', 'value', 0, '\'')).to.equal('-H \'value\'');
    });

    it('should prepend extra 5 spaces', function() {
      expect(curl.buildFlag('H', 'value', 5)).to.equal('     -H "value"');
    });
  });

  describe('#buildQueryString', function() {
    it('should build an HTTP query string from an object', function() {
      expect(curl.buildQueryString({
        key1: 'value1',
        key2: 'value2'
      })).to.equal('?key1=value1&key2=value2');
    });

    it('should include a question mark by default', function() {
      expect(curl.buildQueryString({
        key1: 'value1',
        key2: 'value2'
      })).to.contain('?');
    });

    it('should allow building without a question mark', function() {
      expect(curl.buildQueryString({
        key1: 'value1',
        key2: 'value2'
      }, true)).to.not.contain('?');
    });
  });
});
