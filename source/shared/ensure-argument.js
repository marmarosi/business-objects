'use strict';

var ArgumentError = require('./argument-error.js');
var t = require('../locales/i18n-bo.js')('ArgumentError');

//region Helper methods

function failed (argArray, skip, message, other) {
  var args = [null, message].concat(Array.prototype.slice.call(argArray, skip));
  if (other) args.push(other);
  var factory = ArgumentError.bind.apply(ArgumentError, args);
  throw new factory();
}

function typeNames (types) {
  var list = '<< no types >>';
  if (types.length) {
    list = types.map(function (type) {
      return type.name ? type.name : '-unknown-'
    }).join(' | ');
  }
  return list;
}

//endregion

var ensureArgument = {

  //region Generic

  isDefined: function (value, message) {
    if (value === undefined)
      failed(arguments, 2, message || 'defined');
    return value;
  },

  hasValue: function (value, message) {
    if (value === null || value === undefined)
      failed(arguments, 2, message || 'required');
    return value;
  },

  //endregion

  //region String

  isString: function (value, message) {
    if (typeof value !== 'string' && !(value instanceof String))
      failed(arguments, 2, message || 'string');
    return value;
  },

  isOptionalString: function (value, message) {
    if (value === undefined)
      value = null;
    if (value !== null && typeof value !== 'string' && !(value instanceof String))
      failed(arguments, 2, message || 'optString');
    return value;
  },

  isMandatoryString: function (value, message) {
    if (typeof value !== 'string' && !(value instanceof String) || value.trim().length === 0)
      failed(arguments, 2, message || 'manString');
    return value;
  },

  //endregion

  //region Number

  isOptionalNumber: function (value, message) {
    if (value === undefined)
      value = null;
    if (value !== null && typeof value !== 'number' && !(value instanceof Number))
      failed(arguments, 2, message || 'optNumber');
    return value;
  },

  isMandatoryNumber: function (value, message) {
    if (typeof value !== 'number' && !(value instanceof Number))
      failed(arguments, 2, message || 'manNumber');
    return value;
  },

  //endregion

  //region Integer

  isOptionalInteger: function (value, message) {
    if (value === undefined)
      value = null;
    if (value !== null && (typeof value !== 'number' && !(value instanceof Number) || value % 1 !== 0))
      failed(arguments, 2, message || 'optInteger');
    return value;
  },

  isMandatoryInteger: function (value, message) {
    if (typeof value !== 'number' && !(value instanceof Number) || value % 1 !== 0)
      failed(arguments, 2, message || 'manInteger');
    return value;
  },

  //endregion

  //region Boolean

  isOptionalBoolean: function (value, message) {
    if (value === undefined)
      value = null;
    if (value !== null && typeof value !== 'boolean' && !(value instanceof Boolean))
      failed(arguments, 2, message || 'optBoolean');
    return value;
  },

  isMandatoryBoolean: function (value, message) {
    if (typeof value !== 'boolean' && !(value instanceof Boolean))
      failed(arguments, 2, message || 'manBoolean');
    return value;
  },

  //endregion

  //region Object

  isOptionalObject: function (value, message) {
    if (value === undefined)
      value = null;
    if (typeof value !== 'object')
      failed(arguments, 2, message || 'optObject');
    return value;
  },

  isMandatoryObject: function (value, message) {
    if (typeof value !== 'object' || value === null)
      failed(arguments, 2, message || 'manObject');
    return value;
  },

  //endregion

  //region Function

  isOptionalFunction: function (value, message) {
    if (value === undefined)
      value = null;
    if (value !== null && typeof value !== 'function')
      failed(arguments, 2, message || 'optFunction');
    return value;
  },

  isMandatoryFunction: function (value, message) {
    if (typeof value !== 'function')
      failed(arguments, 2, message || 'manFunction');
    return value;
  },

  //endregion

  //region Type

  isOptionalType: function (value, type, message) {
    if (value === undefined)
      value = null;
    var types = type instanceof Array ? type : [ type ];
    if (value !== null && !(types.some(function (option) {
        return value instanceof option || value.super_ === option;
      })))
      failed(arguments, 3, message || 'optType', typeNames(types));
    return value;
  },

  isMandatoryType: function (value, type, message) {
    var types = type instanceof Array ? type : [ type ];
    if (!(types.some(function (option) {
        return value instanceof option || value.super_ === option;
      })))
      failed(arguments, 3, message || 'manType', typeNames(types));
    return value;
  },

  //endregion

  //region EnumMember

  isEnumMember: function (value, type, defaultValue, message) {
    if (!(type && type.hasMember && type.constructor &&
        type.constructor.super_ && type.constructor.super_.name === 'Enumeration'))
      failed(arguments, 4, 'enumType', type);
    if (defaultValue && (value === null || value === undefined))
      value = defaultValue;
    if (!type.hasMember(value))
      failed(arguments, 4, message || 'enumMember', type);
    return value;
  },

  //endregion

  //region Array

  isOptionalArray: function (value, type, message) {
    if (value === undefined || value === null)
      return [];
    var msgKey = 'optArray';
    if (type === String || type === Number || type === Boolean) {
      msgKey = 'optArrayPrim';
      var typeName = type.name.toLowerCase();
      if (typeof value === typeName || value instanceof type)
        return [value];
      if (value instanceof Array && (!value.length || value.every(function (item) {
          return typeof item === typeName || item instanceof type;
        })))
        return value;
    } else {
      if (value instanceof type)
        return [value];
      if (value instanceof Array && (!value.length || value.every(function (item) {
          return item instanceof type;
        })))
        return value;
    }
    failed(arguments, 3, message || msgKey, type);
  },

  isMandatoryArray: function (value, type, message) {
    var msgKey = 'manArray';
    if (type === String || type === Number || type === Boolean) {
      msgKey = 'manArrayPrim';
      var typeName = type.name.toLowerCase();
      if (typeof value === typeName || value instanceof type)
        return [value];
      if (value instanceof Array && value.length && value.every(function (item) {
          return typeof item === typeName || item instanceof type;
        }))
        return value;
    } else {
      if (value instanceof type)
        return [value];
      if (value instanceof Array && value.length && value.every(function (item) {
          return item instanceof type;
        }))
        return value;
    }
    failed(arguments, 3, message || msgKey, type);
  }

  //endregion
};

Object.freeze(ensureArgument);

module.exports = ensureArgument;
