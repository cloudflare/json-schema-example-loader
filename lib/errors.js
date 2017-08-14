'use strict';

var throwError = function(e, msg) {
  var err = new Error(msg + ': ' + e.message);
  err.stack = e.stack;
  throw err;
};

module.exports = {
  throwError: throwError,
  INVALID_RECURSE_TARGET:
    '"cfRecurse" currently only supports "" (the empty string) as a target'
};
