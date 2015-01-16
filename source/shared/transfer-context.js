'use strict';

var ensureArgument = require('./ensure-argument.js');
var ModelError = require('./model-error.js');
var PropertyInfo = require('./property-info.js');

/**
 * @classdesc
 *    Provides the context for custom client transfer objects.
 * @description
 *    Creates a new transfer context object.
 *      </br></br>
 *    <i><b>Warning:</b> Transfer context objects are created in models internally.
 *    They are intended only to make publicly available the values of model properties
 *    for custom client transfer objects.</i>
 *
 * @memberof bo.shared
 * @constructor
 * @param {Array.<bo.shared.PropertyInfo>} properties - An array of property definitions.
 * @param {function} getValue - A function that returns the current value of a property.
 * @param {function} setValue - A function that changes the current value of a property.
 *
 * @throws {@link bo.shared.ArgumentError ArgumentError}: The properties must be an array
 *    of PropertyInfo objects, or a single PropertyInfo object or null.
 * @throws {@link bo.shared.ArgumentError ArgumentError}: The getValue argument must be a function.
 * @throws {@link bo.shared.ArgumentError ArgumentError}: The setValue argument must be a function.
 */
function TransferContext(properties, getValue, setValue) {
  var self = this;

  /**
   * Array of property definitions that may appear on the client transfer object.
   * @type {Array.<bo.shared.PropertyInfo>}
   * @readonly
   */
  this.properties = ensureArgument.isOptionalArray(properties, PropertyInfo,
      'c_optArray', 'TransferContext', 'properties');
  getValue = ensureArgument.isMandatoryFunction(getValue,
      'c_manFunction', 'TransferContext', 'getValue');
  setValue = ensureArgument.isMandatoryFunction(setValue,
      'c_manFunction', 'TransferContext', 'setValue');

  function getByName (name) {
    for (var i = 0; i < self.properties.length; i++) {
      if (self.properties[i].name === name)
        return self.properties[i];
    }
    throw new ModelError('noProperty', properties.name, name);
  }

  /**
   * Gets the current value of a model property.
   *
   * @param {string} propertyName - The name of the property.
   * @returns {*} The value of a model property.
   *
   * @throws {@link bo.shared.ArgumentError ArgumentError}: The name must be a non-empty string.
   * @throws {@link bo.shared.ArgumentError ArgumentError}: The model has no property with the given name.
   */
  this.getValue = function (propertyName) {
    propertyName = ensureArgument.isMandatoryString(propertyName,
        'm_manString', 'TransferContext', 'getValue', 'propertyName');
    return getValue(getByName(propertyName));
  };

  /**
   * Sets the current value of a model property.
   *
   * @param {string} propertyName - The name of the property.
   * @param {*} value - The new value of the property.
   *
   * @throws {@link bo.shared.ArgumentError ArgumentError}: The name must be a non-empty string.
   * @throws {@link bo.shared.ArgumentError ArgumentError}: The model has no property with the given name.
   * @throws {@link bo.dataTypes.DataTypeError DataTypeError}: The passed value has wrong data type.
   */
  this.setValue = function (propertyName, value) {
    propertyName = ensureArgument.isMandatoryString(propertyName,
        'm_manString', 'TransferContext', 'setValue', 'propertyName');
    if (value !== undefined) {
      setValue(getByName(propertyName), value);
    }
  };

  // Immutable object.
  Object.freeze(this);
}

module.exports = TransferContext;
