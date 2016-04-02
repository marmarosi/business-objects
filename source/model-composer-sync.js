'use strict';

//region Imports

var EditableRootObjectSync = require('./editable-root-object-sync.js');
var EditableChildObjectSync = require('./editable-child-object-sync.js');
var EditableRootCollectionSync = require('./editable-root-collection-sync.js');
var EditableChildCollectionSync = require('./editable-child-collection-sync.js');
var ReadOnlyRootObjectSync = require('./read-only-root-object-sync.js');
var ReadOnlyChildObjectSync = require('./read-only-child-object-sync.js');
var ReadOnlyRootCollectionSync = require('./read-only-root-collection-sync.js');
var ReadOnlyChildCollectionSync = require('./read-only-child-collection-sync.js');
var CommandObjectSync = require('./command-object-sync.js');

var PropertyManager = require('./shared/property-manager.js');
var RuleManager = require('./rules/rule-manager.js');
var ExtensionManagerSync = require('./shared/extension-manager-sync.js');

var Action = require('./rules/authorization-action.js');
var cr = require('./common-rules/index.js');

var PropertyInfo = require('./shared/property-info.js');
var dt = require('./data-types/index.js');

var ComposerError = require('./system/composer-error.js');

//endregion

/**
 * Factory method to create a model composer for synchronous business objects.
 *
 * @function bo.ModelComposerSync
 * @param {string} modelName - The name of the model.
 * @returns {ModelComposerSync} The model composer.
 */
function ModelComposerSyncFactory (modelName) {
  return new ModelComposerSync (modelName);
}

var ArgsType = {
  businessObject: 0,
  rootCollection: 1,
  childCollection: 2
};

/**
 * @classdesc
 *    Represents a model composer to build synchronous business objects.
 * @description
 *    Creates a new synchronous model composer instance.
 *
 * @name ModelComposerSync
 * @constructor
 * @param {string} modelName - The name of the model to build.
 */
function ModelComposerSync (modelName) {

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
   * @function ModelComposerSync#editableRootObject
   * @protected
   * @param {string} dataSource - The identifier of the data source.
   * @param {string} modelPath - The path of the model definition.
   * @returns {ModelComposerSync} The model composer.
   */
  this.editableRootObject = function (dataSource, modelPath) {
    modelFactory = EditableRootObjectSync;
    modelTypeName = 'EditableRootObjectSync';
    argsType = ArgsType.businessObject;
    isCollection = false;
    isRoot = true;
    isEditable = true;
    return initialize(dataSource, modelPath);
  };

  /**
   * Sets the type of the business object as editable child object.
   *
   * @function ModelComposerSync#editableChildObject
   * @protected
   * @param {string} dataSource - The identifier of the data source.
   * @param {string} modelPath - The path of the model definition.
   * @returns {ModelComposerSync} The model composer.
   */
  this.editableChildObject = function (dataSource, modelPath) {
    modelFactory = EditableChildObjectSync;
    modelTypeName = 'EditableChildObjectSync';
    argsType = ArgsType.businessObject;
    isCollection = false;
    isRoot = false;
    isEditable = true;
    return initialize(dataSource, modelPath);
  };

  /**
   * Sets the type of the business object as read-only root object.
   *
   * @function ModelComposerSync#readOnlyRootObject
   * @protected
   * @param {string} dataSource - The identifier of the data source.
   * @param {string} modelPath - The path of the model definition.
   * @returns {ModelComposerSync} The model composer.
   */
  this.readOnlyRootObject = function (dataSource, modelPath) {
    modelFactory = ReadOnlyRootObjectSync;
    modelTypeName = 'ReadOnlyRootObjectSync';
    argsType = ArgsType.businessObject;
    isCollection = false;
    isRoot = true;
    isEditable = false;
    return initialize(dataSource, modelPath);
  };

  /**
   * Sets the type of the business object as read-only child object.
   *
   * @function ModelComposerSync#readOnlyChildObject
   * @protected
   * @param {string} dataSource - The identifier of the data source.
   * @param {string} modelPath - The path of the model definition.
   * @returns {ModelComposerSync} The model composer.
   */
  this.readOnlyChildObject = function (dataSource, modelPath) {
    modelFactory = ReadOnlyChildObjectSync;
    modelTypeName = 'ReadOnlyChildObjectSync';
    argsType = ArgsType.businessObject;
    isCollection = false;
    isRoot = false;
    isEditable = false;
    return initialize(dataSource, modelPath);
  };

  /**
   * Sets the type of the business object as editable root collection.
   *
   * @function ModelComposerSync#editableRootCollection
   * @protected
   * @param {string} dataSource - The identifier of the data source.
   * @param {string} modelPath - The path of the model definition.
   * @returns {ModelComposerSync} The model composer.
   */
  this.editableRootCollection = function (dataSource, modelPath) {
    modelFactory = EditableRootCollectionSync;
    modelTypeName = 'EditableRootCollectionSync';
    argsType = ArgsType.rootCollection;
    isCollection = true;
    isRoot = true;
    isEditable = true;
    return initialize(dataSource, modelPath);
  };

  /**
   * Sets the type of the business object as editable child collection.
   *
   * @function ModelComposerSync#editableChildCollection
   * @protected
   * @returns {ModelComposerSync} The model composer.
   */
  this.editableChildCollection = function () {
    modelFactory = EditableChildCollectionSync;
    modelTypeName = 'EditableChildCollectionSync';
    argsType = ArgsType.childCollection;
    isCollection = true;
    isRoot = false;
    isEditable = true;
    return initialize();
  };

  /**
   * Sets the type of the business object as read-only root collection.
   *
   * @function ModelComposerSync#readOnlyRootCollection
   * @protected
   * @param {string} dataSource - The identifier of the data source.
   * @param {string} modelPath - The path of the model definition.
   * @returns {ModelComposerSync} The model composer.
   */
  this.readOnlyRootCollection = function (dataSource, modelPath) {
    modelFactory = ReadOnlyRootCollectionSync;
    modelTypeName = 'ReadOnlyRootCollectionSync';
    argsType = ArgsType.rootCollection;
    isCollection = true;
    isRoot = true;
    isEditable = false;
    return initialize(dataSource, modelPath);
  };

  /**
   * Sets the type of the business object as read-only child collection.
   *
   * @function ModelComposerSync#readOnlyChildCollection
   * @protected
   * @returns {ModelComposerSync} The model composer.
   */
  this.readOnlyChildCollection = function () {
    modelFactory = ReadOnlyChildCollectionSync;
    modelTypeName = 'ReadOnlyChildCollectionSync';
    argsType = ArgsType.childCollection;
    isCollection = true;
    isRoot = false;
    isEditable = false;
    return initialize();
  };

  /**
   * Sets the type of the business object as command object.
   *
   * @function ModelComposerSync#commandObject
   * @protected
   * @param {string} dataSource - The identifier of the data source.
   * @param {string} modelPath - The path of the model definition.
   * @returns {ModelComposerSync} The model composer.
   */
  this.commandObject = function (dataSource, modelPath) {
    modelFactory = CommandObjectSync;
    modelTypeName = 'CommandObjectSync';
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
      extensions = new ExtensionManagerSync(dataSource, modelPath);
    }
    return self;
  }

  //endregion

  //region Collections

  /**
   * Defines the model type of the elements in a collection.
   *
   * @function ModelComposerSync#itemType
   * @protected
   * @param {function} itemType - The model type of the collection elements.
   * @returns {ModelComposerSync}
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
   *
   * @function ModelComposerSync#boolean
   * @protected
   * @param {string} propertyName - The name of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposerSync}
   */
  this.boolean = function (propertyName, flags, getter, setter) {
    if (isCollection)
      invalid('boolean');
    return addProperty(propertyName, dt.Boolean, flags, getter, setter);
  };

  /**
   * Defines a text property for the business object.
   *
   * @function ModelComposerSync#text
   * @protected
   * @param {string} propertyName - The name of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposerSync}
   */
  this.text = function (propertyName, flags, getter, setter) {
    if (isCollection)
      invalid('text');
    return addProperty(propertyName, dt.Text, flags, getter, setter);
  };

  /**
   * Defines an e-mail address property for the business object.
   *
   * @function ModelComposerSync#email
   * @protected
   * @param {string} propertyName - The name of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposerSync}
   */
  this.email = function (propertyName, flags, getter, setter) {
    if (isCollection)
      invalid('email');
    return addProperty(propertyName, dt.Email, flags, getter, setter);
  };

  /**
   * Defines an integer property for the business object.
   *
   * @function ModelComposerSync#integer
   * @protected
   * @param {string} propertyName - The name of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposerSync}
   */
  this.integer = function (propertyName, flags, getter, setter) {
    if (isCollection)
      invalid('integer');
    return addProperty(propertyName, dt.Integer, flags, getter, setter);
  };

  /**
   * Defines a decimal property for the business object.
   *
   * @function ModelComposerSync#decimal
   * @protected
   * @param {string} propertyName - The name of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposerSync}
   */
  this.decimal = function (propertyName, flags, getter, setter) {
    if (isCollection)
      invalid('decimal');
    return addProperty(propertyName, dt.Decimal, flags, getter, setter);
  };

  /**
   * Defines an enumeration property for the business object.
   *
   * @function ModelComposerSync#enum
   * @protected
   * @param {string} propertyName - The name of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposerSync}
   */
  this.enum = function (propertyName, flags, getter, setter) {
    if (isCollection)
      invalid('enum');
    return addProperty(propertyName, dt.Enum, flags, getter, setter);
  };

  /**
   * Defines a date-time property for the business object.
   *
   * @function ModelComposerSync#dateTime
   * @protected
   * @param {string} propertyName - The name of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposerSync}
   */
  this.dateTime = function (propertyName, flags, getter, setter) {
    if (isCollection)
      invalid('dateTime');
    return addProperty(propertyName, dt.DateTime, flags, getter, setter);
  };

  /**
   * Defines a general property for the business object.
   *
   * @function ModelComposerSync#property
   * @protected
   * @param {string} propertyName - The name of the property.
   * @param {function} typeCtor - The data type of the property.
   * @param {bo.shared.PropertyFlag} [flags] - Other attributes of the property.
   * @param {external.propertyGetter} [getter] - Custom function to read the value of the property.
   * @param {external.propertySetter} [setter] - Custom function to write the value of the property.
   * @returns {ModelComposerSync}
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

  //region Property rules

  this.required = function (/* message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('required');
    checkCurrentProperty('required');
    return addValRule(cr.required, arguments);
  };

  this.maxLength = function (/* maxLength, message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('maxLength');
    checkCurrentProperty('maxLength');
    return addValRule(cr.maxLength, arguments);
  };

  this.minLength = function (/* minLength, message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('minLength');
    checkCurrentProperty('minLength');
    return addValRule(cr.minLength, arguments);
  };

  this.lengthIs = function (/* length, message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('lengthIs');
    checkCurrentProperty('lengthIs');
    return addValRule(cr.lengthIs, arguments);
  };

  this.maxValue = function (/* maxValue, message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('maxValue');
    checkCurrentProperty('maxValue');
    return addValRule(cr.maxValue, arguments);
  };

  this.minValue = function (/* minValue, message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('minValue');
    checkCurrentProperty('minValue');
    return addValRule(cr.minValue, arguments);
  };

  this.expression = function (/* regex, option, message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('expression');
    checkCurrentProperty('expression');
    return addValRule(cr.expression, arguments);
  };

  this.dependency = function (/* dependencies, message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('dependency');
    checkCurrentProperty('dependency');
    return addValRule(cr.dependency, arguments);
  };

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

  this.canRead = function (/* ruleFactory, [params], message, priority, stopsProcessing */) {
    if (isCollection)
      invalid('canRead');
    checkCurrentProperty('canRead');
    return addAuthRule(Action.readProperty, arguments);
  };

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

  this.canCreate = function (/* ruleFactory, [params], message, priority, stopsProcessing */) {
    if (!inGroup1())
      invalid('canCreate');
    return addObjRule(Action.createObject, arguments);
  };

  this.canFetch = function (/* ruleFactory, [params], message, priority, stopsProcessing */) {
    if (inGroup2())
      invalid('canFetch');
    return addObjRule(Action.fetchObject, arguments);
  };

  this.canUpdate = function (/* ruleFactory, [params], message, priority, stopsProcessing */) {
    if (!inGroup1())
      invalid('canUpdate');
    return addObjRule(Action.updateObject, arguments);
  };

  this.canRemove = function (/* ruleFactory, [params], message, priority, stopsProcessing */) {
    if (!inGroup1())
      invalid('canRemove');
    return addObjRule(Action.removeObject, arguments);
  };

  this.canExecute = function (/* ruleFactory, [params], message, priority, stopsProcessing */) {
    if (modelFactory !== CommandObjectSync)
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

  this.daoBuilder = function (daoBuilder) {
    if (!isRoot && modelFactory !== EditableChildObjectSync)
      invalid('daoBuilder');
    extensions.daoBuilder = daoBuilder;
    return nonProperty();
  };

  this.toDto = function (toDto) {
    if (!isEditable || isCollection)
      invalid('toDto');
    extensions.toDto = toDto;
    return nonProperty();
  };

  this.fromDto = function (fromDto) {
    if (isCollection)
      invalid('fromDto');
    extensions.fromDto = fromDto;
    return nonProperty();
  };

  this.toCto = function (toCto) {
    if (inGroup2())
      invalid('toCto');
    extensions.toCto = toCto;
    return nonProperty();
  };

  this.fromCto = function (fromCto) {
    if (!inGroup1())
      invalid('fromCto');
    extensions.fromCto = fromCto;
    return nonProperty();
  };

  this.dataCreate = function (dataCreate) {
    if (!inGroup3())
      invalid('dataCreate');
    extensions.dataCreate = dataCreate;
    return nonProperty();
  };

  this.dataFetch = function (dataFetch) {
    if (inGroup2())
      invalid('dataFetch');
    extensions.dataFetch = dataFetch;
    return nonProperty();
  };

  this.dataInsert = function (dataInsert) {
    if (!inGroup3())
      invalid('dataInsert');
    extensions.dataInsert = dataInsert;
    return nonProperty();
  };

  this.dataUpdate = function (dataUpdate) {
    if (!inGroup3())
      invalid('dataUpdate');
    extensions.dataUpdate = dataUpdate;
    return nonProperty();
  };

  this.dataRemove = function (dataRemove) {
    if (!inGroup3())
      invalid('dataRemove');
    extensions.dataRemove = dataRemove;
    return nonProperty();
  };

  this.dataExecute = function (dataExecute) {
    if (modelFactory !== CommandObjectSync)
      invalid('dataExecute');
    extensions.dataExecute = dataExecute;
    return nonProperty();
  };

  this.addMethod = function (methodName) {
    if (modelFactory !== CommandObjectSync)
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
    return [EditableRootObjectSync, EditableChildObjectSync, EditableRootCollectionSync].some(function (element) {
      return element === modelFactory;
    });
  }

  function inGroup2() {
    return isCollection && !isRoot || modelFactory === CommandObjectSync;
  }

  function inGroup3() {
    return modelFactory === EditableRootObjectSync || modelFactory === EditableChildObjectSync;
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

module.exports = ModelComposerSyncFactory;
