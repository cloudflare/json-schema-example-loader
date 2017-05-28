'use strict';

var _ = require('lodash');

module.exports = {

  formatter: require('./json'),

  config: {
    HEADER_SEPARATOR: ': ',
    NEW_LINE: ' \\\n'
  },

  /**
   * Build a cURL string
   *
   * @param {String} uri
   * @param {String} [method=GET]
   * @param {Object} [headers]
   * @param {Object|Array} [data]
   * @param {String} [encType=undefined]
   * @returns {String}
   */
  generate: function(uri, method, headers, data, encType) {
    var config = this.config;
    var flags = [];
    var str;

    method = method || 'GET';

    if (data && method.toLowerCase() === 'get') {
      uri += this.buildQueryString(data);
    }

    str = ['curl', this.buildFlag('X', method.toUpperCase(), 0, ''), '"' + uri + '"'].join(' ');

    if (headers) {
      _.each(headers, function(val, header) {
        flags.push(this.buildFlag('H', header + config.HEADER_SEPARATOR + val, 5));
      }, this);
    }

    if (data && method.toLowerCase() !== 'get') {
      if (encType === 'multipart/form-data') {
        flags.push(this.buildFlag('-form', this.formatForm(data), 5, '"'));
      } else {
        flags.push(this.buildFlag('-data', this.formatData(data), 5, '\''));
      }
    }

    if (flags.length) {
      return str + config.NEW_LINE + flags.join(config.NEW_LINE);
    }
    return str;
  },

  /**
   * @param {mixed} data
   * @returns {String}
   */
  formatData: function(data) {
    return this.formatter.format(data, null, 0);
  },

  /**
   * @param {mixed} data
   * @returns {String}
   */
  formatForm: function(data) {
    return Object.keys(data).map(function(key) { return key + '=' + data[key] }).join(';');
  },

  /**
   * @param {String} type
   * @param {String} value
   * @param {Number} indents
   * @param {String} [quoteType=\"]
   * @returns {String}
   */
  buildFlag: function(type, value, indents, quoteType) {
    quoteType = !_.isUndefined(quoteType) ? quoteType : '"';
    return [_.repeat(' ', indents) + '-', type, ' ', quoteType, value, quoteType].join('');
  },

  /**
   *
   * @param data
   * @param {Boolean} [noQueryString=true]
   * @returns {String}
   */
  buildQueryString: function(data, noQueryString) {
    var firstJoin = noQueryString ? '&' : '?';
    return _.reduce(data, function (str, val, key) {
      var conn = (str === firstJoin) ? '' : '&';
      return str + conn + key + '=' + val;
    }, firstJoin);
  }
};
