'use strict';

var CLASS_NAME = 'DataStore';

var EnsureArgument = require('./../system/ensure-argument.js');
var PropertyInfo = require('./property-info.js');
var CollectionBase = require('../collection-base.js');
var ModelBase = require('../model-base.js');

/**
 * @classdesc Provides methods to manage the values of business object model's properties.
 * @description Creates a new data store object.
 *
 * @memberof bo.shared
 * @constructor
 */
function DataStore () {

  var data = {};
  var status = {};

  /**
   * Initializes the value of a property in the store.
   *
   * @param {bo.shared.PropertyInfo} property - The definition of the model property.
   * @param {*} value - The default value of the property (null or a child model).
   *
   * @throws {@link bo.system.ArgumentError Argument error}: The property must be a PropertyInfo object.
   * @throws {@link bo.system.ArgumentError Argument error}: The value must be null, a model or a collection.
   */
  this.initValue = function (property, value) {

    property = EnsureArgument.isMandatoryType(property, PropertyInfo,
        'm_manType', CLASS_NAME, 'initValue', 'property');
    value = EnsureArgument.isOptionalType(value, [ CollectionBase, ModelBase ],
        'm_optType', CLASS_NAME, 'initValue', 'value');

    data[property.name] = value;
    status[property.name] = true;
  };

  /**
   * Gets the value of a model property.
   *
   * @param {bo.shared.PropertyInfo} property - The definition of the model property.
   * @returns {*} The current value of the property.
   *
   * @throws {@link bo.system.ArgumentError Argument error}: The property must be a PropertyInfo object.
   */
  this.getValue = function (property) {

    property = EnsureArgument.isMandatoryType(property, PropertyInfo,
        'm_manType', CLASS_NAME, 'getValue', 'property');

    return data[property.name];
  };

  /**
   * Sets the value of a model property.
   *
   * @param {bo.shared.PropertyInfo} property - The definition of the model property.
   * @param {*} value - The new value of the property.
   * @returns {boolean} True if the value of the property has been changed, otherwise false.
   *
   * @throws {@link bo.system.ArgumentError Argument error}: The property must be a PropertyInfo object.
   * @throws {@link bo.system.ArgumentError Argument error}: The value must be defined.
   */
  this.setValue = function (property, value) {

    property = EnsureArgument.isMandatoryType(property, PropertyInfo,
        'm_manType', CLASS_NAME, 'setValue', 'property');
    value = EnsureArgument.isDefined(value,
        'm_defined', CLASS_NAME, 'setValue', 'value');

    // Check value.
    var parsed = property.type.parse(value);
    if (parsed === undefined) {
      // Invalid value.
      status[property.name] = false;
      return false;
    } else {
      // Valid value.
      if (parsed !== data[property.name]) {
        // Value has changed.
        data[property.name] = parsed;
        status[property.name] = true;
        return true;
      } else {
        // Value is unchanged.
        status[property.name] = true;
        return false;
      }
    }
  };

  /**
   * Indicates whether a property has a valid value.
   *
   * @param {bo.shared.PropertyInfo} property - The definition of the model property.
   * @returns {boolean} True if the property has a valid value, otherwise false.
   */
  this.hasValidValue = function (property) {

    property = EnsureArgument.isMandatoryType(property, PropertyInfo,
        'm_manType', CLASS_NAME, 'hasValidValue', 'property');

    return status[property.name];
  };

  // Immutable object.
  Object.freeze(this);
}

module.exports = DataStore;