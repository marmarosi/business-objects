'use strict';

//region Imports

var EditableRootObject = require('./editable-root-object.js');
var EditableChildObject = require('./editable-child-object.js');
var EditableRootCollection = require('./editable-root-collection.js');
var EditableChildCollection = require('./editable-child-collection.js');
var ReadOnlyRootObject = require('./read-only-root-object.js');
var ReadOnlyChildObject = require('./read-only-child-object.js');
var ReadOnlyRootCollection = require('./read-only-root-collection.js');
var ReadOnlyChildCollection = require('./read-only-child-collection.js');
var CommandObject = require('./command-object.js');

var PropertyManager = require('./shared/property-manager.js');
var RuleManager = require('./rules/rule-manager.js');
var ExtensionManager = require('./shared/extension-manager.js');

var Action = require('./rules/authorization-action.js');
var cr = require('./common-rules/index.js');

var PropertyInfo = require('./shared/property-info.js');
var dt = require('./data-types/index.js');

var ComposerError = require('./system/composer-error.js');

//endregion

/**
 * Factory method to create a model composer for asynchronous business objects.
 *
 * @function bo.ModelComposer
 * @param {string} modelName - The name of the model.
 * @returns {ModelComposer} The model composer.
 */
function ModelComposerFactory (modelName) {
  return new ModelComposer (modelName);
}

var ArgsType = {
  businessObject: 0,
  rootCollection: 1,
  childCollection: 2
};

/**
 * @classdesc
 *    Represents a model composer to build asynchronous business objects.
 * @description
 *    Creates a new asynchronous model composer instance.
 *
 * @name ModelComposer
 * @constructor
 * @param {string} modelName - The name of the model to build.
 */
function ModelComposer (modelName) {

  //region Variables

  var self = this;

  var modelFactory = null;
  var modelTypeName = null;
  var memberType = null;
  var argsType = null;
  var isCollection = null;
  var isRoot = null;
  var isEditable = null;

  var properties = null;
  var rules = null;
  var extensions = null;
  var currentProperty = null;

  //endregion

  //region Model types

  /**
   * Sets the type of the business object as editable root object.
   *
   * @function ModelComposer#editableRootObject
   * @param {string} dataSource - The identifier of the data source.
   * @param {string} modelPath - The path of the model definition.
   * @returns {ModelComposer} The model composer.
   */
  this.editableRootObject = function (dataSource, modelPath) {
    modelFactory = EditableRootObject;
    modelTypeName = 'EditableRootObject';
    argsType = ArgsType.businessObject;
    isCollection = false;
    isRoot = true;
    isEditable = true;
    return initialize(dataSource, modelPath);
  };

  /**
   * Sets the type of the business object as editable child object.
   *
   * @function ModelComposer#editableChildObject
   * @param {string} dataSource - The identifier of the data source.
   * @param {string} modelPath - The path of the model definition.
   * @returns {ModelComposer} The model composer.
   */
  this.editableChildObject = function (dataSource, modelPath) {
    modelFactory = EditableChildObject;
    modelTypeName = 'EditableChildObject';
    argsType = ArgsType.businessObject;
    isCollection = false;
    isRoot = false;
    isEditable = true;
    return initialize(dataSource, modelPath);
  };

  /**
   * Sets the type of the business object as read-only root object.
   *
   * @function ModelComposer#readOnlyRootObject
   * @param {string} dataSource - The identifier of the data source.
   * @param {string} modelPath - The path of the model definition.
   * @returns {ModelComposer} The model composer.
   */
  this.readOnlyRootObject = function (dataSource, modelPath) {
    modelFactory = ReadOnlyRootObject;
    modelTypeName = 'ReadOnlyRootObject';
    argsType = ArgsType.businessObject;
    isCollection = false;
    isRoot = true;
    isEditable = false;
    return initialize(dataSource, modelPath);
  };

  /**
   * Sets the type of the business object as read-only child object.
   *
   * @function ModelComposer#readOnlyChildObject
   * @param {string} dataSource - The identifier of the data source.
   * @param {string} modelPath - The path of the model definition.
   * @returns {ModelComposer} The model composer.
   */
  this.readOnlyChildObject = function (dataSource, modelPath) {
    modelFactory = ReadOnlyChildObject;
    modelTypeName = 'ReadOnlyChildObject';
    argsType = ArgsType.businessObject;
    isCollection = false;
    isRoot = false;
    isEditable = false;
    return initialize(dataSource, modelPath);
  };

  /**
   * Sets the type of the business object as editable root collection.
   *
   * @function ModelComposer#editableRootCollection
   * @param {string} dataSource - The identifier of the data source.
   * @param {string} modelPath - The path of the model definition.
   * @returns {ModelComposer} The model composer.
   */
  this.editableRootCollection = function (dataSource, modelPath) {
    modelFactory = EditableRootCollection;
    modelTypeName = 'EditableRootCollection';
    argsType = ArgsType.rootCollection;
    isCollection = true;
    isRoot = true;
    isEditable = true;
    return initialize(dataSource, modelPath);
  };

  /**
   * Sets the type of the business object as editable child collection.
   *
   * @function ModelComposer#editableChildCollection
   * @returns {ModelComposer} The model composer.
   */
  this.editableChildCollection = function () {
    modelFactory = EditableChildCollection;
    modelTypeName = 'EditableChildCollection';
    argsType = ArgsType.childCollection;
    isCollection = true;
    isRoot = false;
    isEditable = true;
    return initialize();
  };

  /**
   * Sets the type of the business object as read-only root collection.
   *
   * @function ModelComposer#readOnlyRootCollection
   * @param {string} dataSource - The identifier of the data source.
   * @param {string} modelPath - The path of the model definition.
   * @returns {ModelComposer} The model composer.
   */
  this.readOnlyRootCollection = function (dataSource, modelPath) {
    modelFactory = ReadOnlyRootCollection;
    modelTypeName = 'ReadOnlyRootCollection';
    argsType = ArgsType.rootCollection;
    isCollection = true;
    isRoot = true;
    isEditable = false;
    return initialize(dataSource, modelPath);
  };

  /**
   * Sets the type of the business object as read-only child collection.
   *
   * @function ModelComposer#readOnlyChildCollection
   * @returns {ModelComposer} The model composer.
   */
  this.readOnlyChildCollection = function () {
    modelFactory = ReadOnlyChildCollection;
    modelTypeName = 'ReadOnlyChildCollection';
    argsType = ArgsType.childCollection;
    isCollection = true;
    isRoot = false;
    isEditable = false;
    return initialize();
  };

  /**
   * Sets the type of the business object as command object.
   *
   * @function ModelComposer#commandObject
   * @param {string} dataSource - The identifier of the data source.
   * @param {string} modelPath - The path of the model definition.
   * @returns {ModelComposer} The model composer.
   */
  this.commandObject = function (dataSource, modelPath) {
    modelFactory = CommandObject;
    modelTypeName = 'CommandObject';
    argsType = ArgsType.businessObject;
    isCollection = false;
    isRoot = true;
    isEditable = true;
    return initialize(dataSource, modelPath);
  };

  function initialize (dataSource, modelPath) {
    if (argsType === ArgsType.businessObject)
      properties = new PropertyManager();
    if (argsType !== ArgsType.childCollection) {
      rules = new RuleManager();
      extensions = new ExtensionManager(dataSource, modelPath);
    }
    return self;
  }

  //endregion

  //region Collections

  /**
   * Defines the model type of the elements in a collection.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootCollection}
   *      * {@link EditableChildCollection}
   *      * {@link ReadOnlyRootCollection}
   *      * {@link ReadOnlyChildCollection}
   *
   * @function ModelComposer#itemType
   * @param {function} itemType - The model type of the collection elements.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.itemType = function (itemType) {
    if (!isCollection)
      invalid('itemType');
    memberType = itemType;
    return this;
  };

  //endregion

  //region Properties

  /**
   * Defines a Boolean property for the business object.
   * See {@link bo.dataTypes.Boolean Boolean} data type.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyChildObject}
   *      * {@link CommandObject}
   *
   * @function ModelComposer#boolean
   * @param {string} propertyName - The name of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.boolean = function (propertyName, flags, getter, setter) {
    if (isCollection)
      invalid('boolean');
    return addProperty(propertyName, dt.Boolean, flags, getter, setter);
  };

  /**
   * Defines a text property for the business object.
   * See {@link bo.dataTypes.Text text} data type.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyChildObject}
   *      * {@link CommandObject}
   *
   * @function ModelComposer#text
   * @param {string} propertyName - The name of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.text = function (propertyName, flags, getter, setter) {
    if (isCollection)
      invalid('text');
    return addProperty(propertyName, dt.Text, flags, getter, setter);
  };

  /**
   * Defines an e-mail address property for the business object.
   * See {@link bo.dataTypes.Email e-mail} data type.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyChildObject}
   *      * {@link CommandObject}
   *
   * @function ModelComposer#email
   * @param {string} propertyName - The name of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.email = function (propertyName, flags, getter, setter) {
    if (isCollection)
      invalid('email');
    return addProperty(propertyName, dt.Email, flags, getter, setter);
  };

  /**
   * Defines an integer property for the business object.
   * See {@link bo.dataTypes.Integer integer} data type.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyChildObject}
   *      * {@link CommandObject}
   *
   * @function ModelComposer#integer
   * @param {string} propertyName - The name of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.integer = function (propertyName, flags, getter, setter) {
    if (isCollection)
      invalid('integer');
    return addProperty(propertyName, dt.Integer, flags, getter, setter);
  };

  /**
   * Defines a decimal property for the business object.
   * See {@link bo.dataTypes.Decimal decimal} data type.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyChildObject}
   *      * {@link CommandObject}
   *
   * @function ModelComposer#decimal
   * @param {string} propertyName - The name of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.decimal = function (propertyName, flags, getter, setter) {
    if (isCollection)
      invalid('decimal');
    return addProperty(propertyName, dt.Decimal, flags, getter, setter);
  };

  /**
   * Defines an enumeration property for the business object.
   * See {@link bo.dataTypes.Enum enumeration} data type.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyChildObject}
   *      * {@link CommandObject}
   *
   * @function ModelComposer#enum
   * @param {string} propertyName - The name of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.enum = function (propertyName, flags, getter, setter) {
    if (isCollection)
      invalid('enum');
    return addProperty(propertyName, dt.Enum, flags, getter, setter);
  };

  /**
   * Defines a date-time property for the business object.
   * See {@link bo.dataTypes.DateTime date-time} data type.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyChildObject}
   *      * {@link CommandObject}
   *
   * @function ModelComposer#dateTime
   * @param {string} propertyName - The name of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.dateTime = function (propertyName, flags, getter, setter) {
    if (isCollection)
      invalid('dateTime');
    return addProperty(propertyName, dt.DateTime, flags, getter, setter);
  };

  /**
   * Defines a general property for the business object.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyChildObject}
   *      * {@link CommandObject}
   *
   * @function ModelComposer#property
   * @param {string} propertyName - The name of the property.
   * @param {function} typeCtor - The data type of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.property = function (propertyName, typeCtor, flags, getter, setter) {
    if (isCollection)
      invalid('property');
    return addProperty(propertyName, typeCtor, flags, getter, setter);
  };

  function addProperty (propertyName, propertyType, flags, getter, setter) {
    var property = new PropertyInfo(propertyName, propertyType, flags, getter, setter);
    properties.add(property);
    currentProperty = property;
    return self;
  }

  //endregion

  //region Property rules - validation

  /**
   * Adds a required rule to the current property.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject} - allowed but rarely used
   *      * {@link ReadOnlyChildObject} - allowed but rarely used
   *      * {@link CommandObject}
   *
   * @function ModelComposer#required
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority=50] - The priority of the rule.
   * @param {boolean} [stopsProcessing=false] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   * @throws {@link bo.system.ComposerError Composer error}: The current property is undefinable.
   */
  this.required = function (/* message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('required');
    checkCurrentProperty('required');
    return addValRule(cr.required, arguments);
  };

  /**
   * Adds a maximum length rule to the current property.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject} - allowed but rarely used
   *      * {@link ReadOnlyChildObject} - allowed but rarely used
   *      * {@link CommandObject}
   *
   * @function ModelComposer#maxLength
   * @param {number} maxLength - The maximum length of the property value.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority=10] - The priority of the rule.
   * @param {boolean} [stopsProcessing=false] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   * @throws {@link bo.system.ComposerError Composer error}: The current property is undefinable.
   */
  this.maxLength = function (/* maxLength, message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('maxLength');
    checkCurrentProperty('maxLength');
    return addValRule(cr.maxLength, arguments);
  };

  /**
   * Adds a minimum length rule to the current property.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject} - allowed but rarely used
   *      * {@link ReadOnlyChildObject} - allowed but rarely used
   *      * {@link CommandObject}
   *
   * @function ModelComposer#minLength
   * @param {number} minLength - The minimum length of the property value.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority=10] - The priority of the rule.
   * @param {boolean} [stopsProcessing=false] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   * @throws {@link bo.system.ComposerError Composer error}: The current property is undefinable.
   */
  this.minLength = function (/* minLength, message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('minLength');
    checkCurrentProperty('minLength');
    return addValRule(cr.minLength, arguments);
  };

  /**
   * Adds a required length rule to the current property.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject} - allowed but rarely used
   *      * {@link ReadOnlyChildObject} - allowed but rarely used
   *      * {@link CommandObject}
   *
   * @function ModelComposer#lengthIs
   * @param {number} length - The required length of the property value.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority=10] - The priority of the rule.
   * @param {boolean} [stopsProcessing=false] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   * @throws {@link bo.system.ComposerError Composer error}: The current property is undefinable.
   */
  this.lengthIs = function (/* length, message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('lengthIs');
    checkCurrentProperty('lengthIs');
    return addValRule(cr.lengthIs, arguments);
  };

  /**
   * Adds a maximum value rule to the current property.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject} - allowed but rarely used
   *      * {@link ReadOnlyChildObject} - allowed but rarely used
   *      * {@link CommandObject}
   *
   * @function ModelComposer#maxValue
   * @param {number} maxValue - The maximum value of the property value.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority=10] - The priority of the rule.
   * @param {boolean} [stopsProcessing=false] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   * @throws {@link bo.system.ComposerError Composer error}: The current property is undefinable.
   */
  this.maxValue = function (/* maxValue, message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('maxValue');
    checkCurrentProperty('maxValue');
    return addValRule(cr.maxValue, arguments);
  };

  /**
   * Adds a minimum value rule to the current property.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject} - allowed but rarely used
   *      * {@link ReadOnlyChildObject} - allowed but rarely used
   *      * {@link CommandObject}
   *
   * @function ModelComposer#minValue
   * @param {number} minValue - The minimum value of the property value.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority=10] - The priority of the rule.
   * @param {boolean} [stopsProcessing=false] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   * @throws {@link bo.system.ComposerError Composer error}: The current property is undefinable.
   */
  this.minValue = function (/* minValue, message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('minValue');
    checkCurrentProperty('minValue');
    return addValRule(cr.minValue, arguments);
  };

  /**
   * Adds an expression rule to the current property.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject} - allowed but rarely used
   *      * {@link ReadOnlyChildObject} - allowed but rarely used
   *      * {@link CommandObject}
   *
   * @function ModelComposer#expression
   * @param {regexp} regex - The regular expression that specifies the rule.
   * @param {bo.commonRules.NullResultOption} option - The action to execute when the value is null.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority=10] - The priority of the rule.
   * @param {boolean} [stopsProcessing=false] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   * @throws {@link bo.system.ComposerError Composer error}: The current property is undefinable.
   */
  this.expression = function (/* regex, option, message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('expression');
    checkCurrentProperty('expression');
    return addValRule(cr.expression, arguments);
  };

  /**
   * Adds a dependency rule to the current property.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject} - allowed but rarely used
   *      * {@link ReadOnlyChildObject} - allowed but rarely used
   *      * {@link CommandObject}
   *
   * @function ModelComposer#dependency
   * @param {(bo.shared.PropertyInfo|Array.<bo.shared.PropertyInfo>)} dependencies -
   *    A single dependent property or an array of them.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority=-100] - The priority of the rule.
   * @param {boolean} [stopsProcessing=false] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   * @throws {@link bo.system.ComposerError Composer error}: The current property is undefinable.
   */
  this.dependency = function (/* dependencies, message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('dependency');
    checkCurrentProperty('dependency');
    return addValRule(cr.dependency, arguments);
  };

  /**
   * Adds an information rule to the current property.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject} - allowed but rarely used
   *      * {@link ReadOnlyChildObject} - allowed but rarely used
   *      * {@link CommandObject}
   *
   * @function ModelComposer#information
   * @param {string} message - The information to display.
   * @param {number} [priority=1] - The priority of the rule.
   * @param {boolean} [stopsProcessing=false] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   * @throws {@link bo.system.ComposerError Composer error}: The current property is undefinable.
   */
  this.information = function (/* message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('information');
    checkCurrentProperty('information');
    return addValRule(cr.information, arguments);
  };

  function addValRule (ruleFactory, parameters) {
    var args = Array.prototype.slice.call(parameters);
    args.unshift(currentProperty);
    rules.add(ruleFactory.apply(null, args));
    return self;
  }

  /**
   * Adds a validation rule to the current property.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject} - allowed but rarely used
   *      * {@link ReadOnlyChildObject} - allowed but rarely used
   *      * {@link CommandObject}
   *
   * @function ModelComposer#validate
   * @param {function} ruleFactory - A factory function that return the
   *    {@link bo.rules.ValidationRule validation rule} to add.
   * @param {*} [&hellip;params] - Optional parameters depending on the validation rule.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority] - The priority of the rule.
   * @param {boolean} [stopsProcessing] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   * @throws {@link bo.system.ComposerError Composer error}: The current property is undefinable.
   */
  this.validate = function (/* ruleFactory, [params], message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('validate');
    checkCurrentProperty('validate');
    var args = Array.prototype.slice.call(parameters);
    var ruleFactory = args.shift();
    args.unshift(currentProperty);
    rules.add(ruleFactory.apply(null, args));
    return this;
  };

  //endregion

  //region Property rules - authorization

  /**
   * Adds an authorization rule to the current property that determines
   * whether the user can read it.
   * See {@link bo.commonRules common rules} to find authorization ones.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyChildObject}
   *      * {@link CommandObject}
   *
   * @function ModelComposer#canRead
   * @param {function} ruleFactory - A factory function that return the
   *    {@link bo.rules.AuthorizationRule authorization rule} to add.
   * @param {*} [&hellip;params] - Optional parameters depending on the authorization rule.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority] - The priority of the rule.
   * @param {boolean} [stopsProcessing] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   * @throws {@link bo.system.ComposerError Composer error}: The current property is undefinable.
   */
  this.canRead = function (/* ruleFactory, [params], message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('canRead');
    checkCurrentProperty('canRead');
    return addAuthRule(Action.readProperty, arguments);
  };

  /**
   * Adds an authorization rule to the current property that determines
   * whether the user can write it.
   * See {@link bo.commonRules common rules} to find authorization ones.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link CommandObject}
   *
   * @function ModelComposer#canWrite
   * @param {function} ruleFactory - A factory function that return the
   *    {@link bo.rules.AuthorizationRule authorization rule} to add.
   * @param {*} [&hellip;params] - Optional parameters depending on the authorization rule.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority] - The priority of the rule.
   * @param {boolean} [stopsProcessing] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   * @throws {@link bo.system.ComposerError Composer error}: The current property is undefinable.
   */
  this.canWrite = function (/* ruleFactory, [params], message, priority, stopsProcessing */) {
    if (isCollection || !isEditable)
      invalid('canWrite');
    checkCurrentProperty('canWrite');
    return addAuthRule(Action.writeProperty, arguments);
  };

  function addAuthRule (action, parameters) {
    var args = Array.prototype.slice.call(parameters);
    var ruleFactory = args.shift();
    args.unshift(action, currentProperty);
    rules.add(ruleFactory.apply(null, args));
    return self;
  }

  //endregion

  //region Object rules

  /**
   * Adds an authorization rule to the business object that determines
   * whether the user can create e new instance of it.
   * See {@link bo.commonRules common rules} to find authorization ones.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableRootCollection}
   *      * {@link EditableChildObject}
   *
   * @function ModelComposer#canCreate
   * @protected
   * @param {function} ruleFactory - A factory function that returns the
   *    {@link bo.rules.AuthorizationRule authorization rule} to add.
   * @param {*} [&hellip;params] - Optional parameters depending on the authorization rule.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority] - The priority of the rule.
   * @param {boolean} [stopsProcessing] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.canCreate = function (/* ruleFactory, [params], message, priority, stopsProcessing */) {
    if (!inGroup1())
      invalid('canCreate');
    return addObjRule(Action.createObject, arguments);
  };

  /**
   * Adds an authorization rule to the business object that determines
   * whether the user can retrieve instances of it.
   * See {@link bo.commonRules common rules} to find authorization ones.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableRootCollection}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyRootCollection}
   *      * {@link ReadOnlyChildObject}
   *
   * @function ModelComposer#canFetch
   * @protected
   * @param {function} ruleFactory - A factory function that returns the
   *    {@link bo.rules.AuthorizationRule authorization rule} to add.
   * @param {*} [&hellip;params] - Optional parameters depending on the authorization rule.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority] - The priority of the rule.
   * @param {boolean} [stopsProcessing] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.canFetch = function (/* ruleFactory, [params], message, priority, stopsProcessing */) {
    if (inGroup2())
      invalid('canFetch');
    return addObjRule(Action.fetchObject, arguments);
  };

  /**
   * Adds an authorization rule to the business object that determines
   * whether the user can update its instances.
   * See {@link bo.commonRules common rules} to find authorization ones.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableRootCollection}
   *      * {@link EditableChildObject}
   *
   * @function ModelComposer#canUpdate
   * @protected
   * @param {function} ruleFactory - A factory function that returns the
   *    {@link bo.rules.AuthorizationRule authorization rule} to add.
   * @param {*} [&hellip;params] - Optional parameters depending on the authorization rule.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority] - The priority of the rule.
   * @param {boolean} [stopsProcessing] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.canUpdate = function (/* ruleFactory, [params], message, priority, stopsProcessing */) {
    if (!inGroup1())
      invalid('canUpdate');
    return addObjRule(Action.updateObject, arguments);
  };

  /**
   * Adds an authorization rule to the business object that determines
   * whether the user can delete its instances.
   * See {@link bo.commonRules common rules} to find authorization ones.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableRootCollection}
   *      * {@link EditableChildObject}
   *
   * @function ModelComposer#canRemove
   * @protected
   * @param {function} ruleFactory - A factory function that returns the
   *    {@link bo.rules.AuthorizationRule authorization rule} to add.
   * @param {*} [&hellip;params] - Optional parameters depending on the authorization rule.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority] - The priority of the rule.
   * @param {boolean} [stopsProcessing] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.canRemove = function (/* ruleFactory, [params], message, priority, stopsProcessing */) {
    if (!inGroup1())
      invalid('canRemove');
    return addObjRule(Action.removeObject, arguments);
  };

  /**
   * Adds an authorization rule to the business object that determines
   * whether the user can execute a command.
   * See {@link bo.commonRules common rules} to find authorization ones.
   *
   *    The function is valid for the following model type:
   *
   *      * {@link CommandObject}
   *
   * @function ModelComposer#canExecute
   * @protected
   * @param {function} ruleFactory - A factory function that returns the
   *    {@link bo.rules.AuthorizationRule authorization rule} to add.
   * @param {*} [&hellip;params] - Optional parameters depending on the authorization rule.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority] - The priority of the rule.
   * @param {boolean} [stopsProcessing] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.canExecute = function (/* ruleFactory, [params], message, priority, stopsProcessing */) {
    if (modelFactory !== CommandObject)
      invalid('canExecute');
    return addObjRule(Action.executeCommand, arguments);
  };

  function addObjRule (action, parameters) {
    var args = Array.prototype.slice.call(parameters);
    var ruleFactory = args.shift();
    args.unshift(action, null);
    rules.add(ruleFactory.apply(null, args));
    return nonProperty();
  }

  /**
   * Adds an authorization rule to the business object that determines
   * whether the user can execute a custom fetch or a custom command.
   * See {@link bo.commonRules common rules} to find authorization ones.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableRootCollection}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyRootCollection}
   *      * {@link ReadOnlyChildObject}
   *      * {@link CommandObject}
   *
   * @function ModelComposer#canCall
   * @protected
   * @param {string} methodName - The name of the custom method to execute.
   * @param {function} ruleFactory - A factory function that returns the
   *    {@link bo.rules.AuthorizationRule authorization rule} to add.
   * @param {*} [&hellip;params] - Optional parameters depending on the authorization rule.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority] - The priority of the rule.
   * @param {boolean} [stopsProcessing] - Indicates the rule behavior in case of failure.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.canCall = function (/* methodName, ruleFactory, [params], message, priority, stopsProcessing */) {
    if (isCollection && !isRoot)
      invalid('canCall');
    var args = Array.prototype.slice.call(arguments);
    var methodName = args.shift();
    var ruleFactory = args.shift();
    args.unshift(Action.executeMethod, methodName);
    rules.add(ruleFactory.apply(null, args));
    return nonProperty();
  };

  //endregion

  //region Extensions

  /**
   * Adds a custom function to the business object that creates
   * the data access object of the model instance.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableRootCollection}
   *      * {@link EditableChildObject}
   *      * {@link EditableChildCollection}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyRootCollection}
   *      * {@link ReadOnlyChildObject}
   *      * {@link ReadOnlyChildCollection}
   *      * {@link CommandObject}
   *
   * @function ModelComposer#daoBuilder
   * @protected
   * @param {function} daoBuilder - A factory function that returns the
   *    {@link bo.dataAccess.daoBuilder data access object} for the model instance.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.daoBuilder = function (daoBuilder) {
    if (!isRoot && modelFactory !== EditableChildObject)
      invalid('daoBuilder');
    extensions.daoBuilder = daoBuilder;
    return nonProperty();
  };

  /**
   * Adds a custom function to the business object that converts
   * the model instance to data transfer object.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableRootCollection}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyRootCollection}
   *      * {@link CommandObject}
   *
   * @function ModelComposer#toDto
   * @protected
   * @param {function} toDto - A factory function that converts
   *    the model instance to data transfer object.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.toDto = function (toDto) {
    if (!isEditable || isCollection)
      invalid('toDto');
    extensions.toDto = toDto;
    return nonProperty();
  };

  /**
   * Adds a custom function to the business object that converts
   * the data transfer object to model instance.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyChildObject}
   *      * {@link CommandObject}
   *
   * @function ModelComposer#fromDto
   * @protected
   * @param {function} fromDto - A factory function that converts
   *    the data transfer object to model instance.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.fromDto = function (fromDto) {
    if (isCollection)
      invalid('fromDto');
    extensions.fromDto = fromDto;
    return nonProperty();
  };

  /**
   * Adds a custom function to the business object that converts
   * the model instance to client transfer object.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableRootCollection}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyRootCollection}
   *      * {@link ReadOnlyChildObject}
   *
   * @function ModelComposer#toCto
   * @protected
   * @param {function} toCto - A factory function that converts
   *    the model instance to client transfer object.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.toCto = function (toCto) {
    if (inGroup2())
      invalid('toCto');
    extensions.toCto = toCto;
    return nonProperty();
  };

  /**
   * Adds a custom function to the business object that converts
   * the client transfer object to model instance.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableRootCollection}
   *      * {@link EditableChildObject}
   *
   * @function ModelComposer#fromCto
   * @protected
   * @param {function} fromCto - A factory function that converts
   *    the client transfer object to model instance.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.fromCto = function (fromCto) {
    if (!inGroup1())
      invalid('fromCto');
    extensions.fromCto = fromCto;
    return nonProperty();
  };

  /**
   * Adds a custom function to the business object that returns
   * the property values of a new instance from the data source.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *
   * @function ModelComposer#dataCreate
   * @protected
   * @param {function} dataCreate - A factory function that returns
   *    the property values of a new instance from the data source.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.dataCreate = function (dataCreate) {
    if (!inGroup3())
      invalid('dataCreate');
    extensions.dataCreate = dataCreate;
    return nonProperty();
  };

  /**
   * Adds a custom function to the business object that returns
   * the property values of an existing instance from the data source.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableRootCollection}
   *      * {@link EditableChildObject}
   *      * {@link ReadOnlyRootObject}
   *      * {@link ReadOnlyRootCollection}
   *      * {@link ReadOnlyChildObject}
   *
   * @function ModelComposer#dataFetch
   * @protected
   * @param {function} dataFetch - A factory function that returns
   *    the property values of an existing instance from the data source.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.dataFetch = function (dataFetch) {
    if (inGroup2())
      invalid('dataFetch');
    extensions.dataFetch = dataFetch;
    return nonProperty();
  };

  /**
   * Adds a custom function to the business object that saves
   * a new instance into the data source.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *
   * @function ModelComposer#dataInsert
   * @protected
   * @param {function} dataInsert - A factory function that saves
   *    a new instance into the data source.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.dataInsert = function (dataInsert) {
    if (!inGroup3())
      invalid('dataInsert');
    extensions.dataInsert = dataInsert;
    return nonProperty();
  };

  /**
   * Adds a custom function to the business object that saves
   * an existing instance into the data source.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *
   * @function ModelComposer#dataUpdate
   * @protected
   * @param {function} dataUpdate - A factory function that saves
   *    an existing instance into the data source.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.dataUpdate = function (dataUpdate) {
    if (!inGroup3())
      invalid('dataUpdate');
    extensions.dataUpdate = dataUpdate;
    return nonProperty();
  };

  /**
   * Adds a custom function to the business object that deletes
   * an existing instance from the data source.
   *
   *    The function is valid for the following model types:
   *
   *      * {@link EditableRootObject}
   *      * {@link EditableChildObject}
   *
   * @function ModelComposer#dataRemove
   * @protected
   * @param {function} dataRemove - A factory function that deletes
   *    an existing instance from the data source.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.dataRemove = function (dataRemove) {
    if (!inGroup3())
      invalid('dataRemove');
    extensions.dataRemove = dataRemove;
    return nonProperty();
  };

  /**
   * Adds a custom function to the business object that executes
   * a command on the data source.
   *
   *    The function is valid for the following model type:
   *
   *      * {@link CommandObject}
   *
   * @function ModelComposer#dataExecute
   * @protected
   * @param {function} dataExecute - A factory function that executes
   *    a command on the data source.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.dataExecute = function (dataExecute) {
    if (modelFactory !== CommandObject)
      invalid('dataExecute');
    extensions.dataExecute = dataExecute;
    return nonProperty();
  };

  /**
   * Adds a new instance method to the business object that
   * will call a custom execute method on a command object instance.
   * See {@link bo.shared.ExtensionManagerBase#addOtherMethod addOtherMethod}
   * method of ExtensionManagerBase class.
   *
   *    The function is valid for the following model type:
   *
   *      * {@link CommandObject}
   *
   * @function ModelComposer#addMethod
   * @protected
   * @param {string} methodName - The name of the method on the data access object to be called.
   * @returns {ModelComposer}
   *
   * @throws {@link bo.system.ComposerError Composer error}: The function is not applicable to the model type.
   */
  this.addMethod = function (methodName) {
    if (modelFactory !== CommandObject)
      invalid('addMethod');
    extensions.addOtherMethod(methodName);
    return nonProperty();
  };

  //endregion

  //region Helper

  function nonProperty () {
    currentProperty = null;
    return self;
  }

  function inGroup1() {
    return [EditableRootObject, EditableChildObject, EditableRootCollection].some(function (element) {
      return element === modelFactory;
    });
  }

  function inGroup2() {
    return isCollection && !isRoot || modelFactory === CommandObject;
  }

  function inGroup3() {
    return modelFactory === EditableRootObject || modelFactory === EditableChildObject;
  }

  function checkCurrentProperty(methodName) {
    if (!currentProperty) {
      var error = new ComposerError('property', modelName, methodName);
      error.model = modelName;
      error.modelType = modelTypeName;
      error.method = methodName;
      throw error;
    }
  }

  function invalid(methodName) {
    var error = new ComposerError('invalid', modelName, methodName, modelTypeName);
    error.model = modelName;
    error.modelType = modelTypeName;
    error.method = methodName;
    throw error;
  }

  //endregion

  this.compose = function () {
    switch (argsType) {
      case ArgsType.businessObject:
        return new modelFactory(modelName, properties, rules, extensions);
      case ArgsType.rootCollection:
        return new modelFactory(modelName, memberType, rules, extensions);
      case ArgsType.childCollection:
        return new modelFactory(modelName, memberType);
    }
  };
}

module.exports = ModelComposerFactory;