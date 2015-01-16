'use strict';

var util = require('util');
var t = require('../locales/i18n-bo.js')('DataTypeError');

/**
 * @classdesc Represents a data type error.
 * @description Creates a data type error object.
 *
 * @memberof bo.dataTypes
 * @constructor
 * @param {string} [message] - Human-readable description of the error.
 * @param {...*} [messageParams] - Optional interpolation parameters of the message.
 *
 * @extends {Error}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error Error} for further information.
 */
function DataTypeError() {
  DataTypeError.super_.call(this);

  /**
   * The name of the error type.
   * @type {string}
   * @default
   */
  this.name = 'DataTypeError';

  /**
   * Human-readable description of the error.
   * @type {string}
   */
  this.message = t.apply(this, arguments);
}
util.inherits(DataTypeError, Error);

module.exports = DataTypeError;
