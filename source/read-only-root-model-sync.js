'use strict';

//region Imports

var util = require('util');
var config = require('./shared/configuration-reader.js');
var EnsureArgument = require('./system/ensure-argument.js');
var Enumeration = require('./system/enumeration.js');

var ModelBase = require('./model-base.js');
var ModelError = require('./shared/model-error.js');
var ExtensionManagerSync = require('./shared/extension-manager-sync.js');
var DataStore = require('./shared/data-store.js');
var DataType = require('./data-types/data-type.js');

var PropertyInfo = require('./shared/property-info.js');
var PropertyManager = require('./shared/property-manager.js');
var PropertyContext = require('./shared/property-context.js');
var TransferContext = require('./shared/transfer-context.js');

var RuleManager = require('./rules/rule-manager.js');
var BrokenRuleList = require('./rules/broken-rule-list.js');
var RuleSeverity = require('./rules/rule-severity.js');
var AuthorizationAction = require('./rules/authorization-action.js');
var AuthorizationContext = require('./rules/authorization-context.js');

var DataPortalAction = require('./shared/data-portal-action.js');
var DataPortalContext = require('./shared/data-portal-context.js');
var DataPortalEvent = require('./shared/data-portal-event.js');
var DataPortalEventArgs = require('./shared/data-portal-event-args.js');
var DataPortalError = require('./shared/data-portal-error.js');

var MODEL_DESC = 'Read-only root model';
var M_FETCH = DataPortalAction.getName(DataPortalAction.fetch);

//endregion

/**
 * Factory method to create definitions of synchronous read-only root models.
 *
 * @function bo.ReadOnlyRootModelSync
 * @param {bo.shared.PropertyManager} properties - The property definitions.
 * @param {bo.shared.RuleManager} rules - The validation and authorization rules.
 * @param {bo.shared.ExtensionManager} extensions - The customization of the model.
 * @returns {ReadOnlyRootModelSync} The constructor of a synchronous read-only root model.
 *
 * @throws {@link bo.system.ArgumentError Argument error}: The properties must be a PropertyManager object.
 * @throws {@link bo.system.ArgumentError Argument error}: The rules must be a RuleManager object.
 * @throws {@link bo.system.ArgumentError Argument error}: The extensions must be a ExtensionManagerSync object.
 *
 * @throws {@link bo.shared.ModelError Model error}:
 *    The child objects must be ReadOnlyChildCollectionSync or ReadOnlyChildModelSync instances.
 */
var ReadOnlyRootModelSyncFactory = function(properties, rules, extensions) {

  properties = EnsureArgument.isMandatoryType(properties, PropertyManager,
      'c_manType', 'ReadOnlyRootModelSync', 'properties');
  rules = EnsureArgument.isMandatoryType(rules, RuleManager,
      'c_manType', 'ReadOnlyRootModelSync', 'rules');
  extensions = EnsureArgument.isMandatoryType(extensions, ExtensionManagerSync,
      'c_manType', 'ReadOnlyRootModelSync', 'extensions');

  // Verify the model type of child models.
  properties.verifyChildTypes([ 'ReadOnlyChildCollectionSync', 'ReadOnlyChildModelSync' ]);

  /**
   * @classdesc
   *    Represents the definition of a synchronous read-only root model.
   * @description
   *    Creates a new synchronous read-only root model instance.
   *
   *    _The name of the model type available as:
   *    __&lt;instance&gt;.constructor.modelType__, returns 'ReadOnlyRootModelSync'._
   *
   * @name ReadOnlyRootModelSync
   * @constructor
   *
   * @extends ModelBase
   *
   * @fires ReadOnlyRootModelSync#preFetch
   * @fires ReadOnlyRootModelSync#postFetch
   */
  var ReadOnlyRootModelSync = function() {
    ModelBase.call(this);

    var self = this;
    var store = new DataStore();
    var brokenRules = new BrokenRuleList(properties.name);
    var dao = null;
    var propertyContext = null;
    var dataContext = null;
    var connection = null;

    // Set up business rules.
    rules.initialize(config.noAccessBehavior);

    // Get data access object.
    if (extensions.daoBuilder)
      dao = extensions.daoBuilder(extensions.dataSource, extensions.modelPath);
    else
      dao = config.daoBuilder(extensions.dataSource, extensions.modelPath);

    //region Transfer object methods

    function getTransferContext (authorize) {
      return authorize ?
          new TransferContext(properties.toArray(), readPropertyValue, null) :
          new TransferContext(properties.toArray(), null, setPropertyValue);
    }

    function baseFromDto(dto) {
      properties.filter(function (property) {
        return property.isOnDto;
      }).forEach(function (property) {
        if (dto.hasOwnProperty(property.name) && typeof dto[property.name] !== 'function') {
          setPropertyValue(property, dto[property.name]);
        }
      });
    }

    function fromDto (dto) {
      if (extensions.fromDto)
        extensions.fromDto.call(self, getTransferContext(false), dto);
      else
        baseFromDto(dto);
    }

    function baseToCto() {
      var cto = {};
      properties.filter(function (property) {
        return property.isOnCto;
      }).forEach(function (property) {
        cto[property.name] = readPropertyValue(property);
      });
      return cto;
    }

    /**
     * Transforms the business object to a plain object to send to the client.
     *
     * @function ReadOnlyRootModelSync#toCto
     * @returns {{}} The client transfer object.
     */
    this.toCto = function () {
      var cto = {};
      if (extensions.toCto)
        cto = extensions.toCto.call(self, getTransferContext(true));
      else
        cto = baseToCto();

      properties.children().forEach(function(property) {
        var child = getPropertyValue(property);
        cto[property.name] = child.toCto();
      });
      return cto;
    };

    //endregion

    //region Permissions

    function getAuthorizationContext(action, targetName) {
      return new AuthorizationContext(action, targetName || '', brokenRules);
    }

    function canBeRead (property) {
      return rules.hasPermission(
          getAuthorizationContext(AuthorizationAction.readProperty, property.name)
      );
    }

    function canDo (action) {
      return rules.hasPermission(
          getAuthorizationContext(action)
      );
    }

    function canExecute (methodName) {
      return rules.hasPermission(
          getAuthorizationContext(AuthorizationAction.executeMethod, methodName)
      );
    }

    //endregion

    //region Child methods

    function fetchChildren(dto) {
      properties.children().forEach(function(property) {
        var child = getPropertyValue(property);
        child.fetch(dto[property.name]);
      });
    }

    //endregion

    //region Data portal methods

    //region Helper

    function getDataContext (connection) {
      if (!dataContext)
        dataContext = new DataPortalContext(
            dao, properties.toArray(), getPropertyValue, setPropertyValue
        );
      return dataContext.setState(connection, false);
    }

    function getEventArgs (action, methodName, error) {
      return new DataPortalEventArgs(properties.name, action, methodName, error);
    }

    function wrapError (action, error) {
      return new DataPortalError(MODEL_DESC, properties.name, action, error);
    }

    //endregion

    //region Fetch

    function data_fetch (filter, method) {
      // Check permissions.
      if (method === M_FETCH ? canDo(AuthorizationAction.fetchObject) : canExecute(method)) {
        try {
          // Open connection.
          connection = config.connectionManager.openConnection(extensions.dataSource);
          // Launch start event.
          /**
           * The event arises before the business object instance will be retrieved from the repository.
           * @event ReadOnlyRootModelSync#preFetch
           * @param {bo.shared.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {ReadOnlyRootModelSync} oldObject - The instance of the model before the data portal action.
           */
          self.emit(
              DataPortalEvent.getName(DataPortalEvent.preFetch),
              getEventArgs(DataPortalAction.fetch, method),
              self
          );
          // Execute fetch.
          var dto = null;
          if (extensions.dataFetch) {
            // *** Custom fetch.
            dto = extensions.dataFetch.call(self, getDataContext(connection), filter, method);
          } else {
            // *** Standard fetch.
            // Root element fetches data from repository.
            dto = dao.$runMethod(method, connection, filter);
            fromDto.call(self, dto);
          }
          // Fetch children as well.
          fetchChildren(dto);
          // Launch finish event.
          /**
           * The event arises after the business object instance has been retrieved from the repository.
           * @event ReadOnlyRootModelSync#postFetch
           * @param {bo.shared.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {ReadOnlyRootModelSync} newObject - The instance of the model after the data portal action.
           */
          self.emit(
              DataPortalEvent.getName(DataPortalEvent.postFetch),
              getEventArgs(DataPortalAction.fetch, method),
              self
          );
          // Close connection.
          connection = config.connectionManager.closeConnection(extensions.dataSource, connection);
        } catch (e) {
          // Wrap the intercepted error.
          var dpError = wrapError(DataPortalAction.fetch, e);
          // Launch finish event.
          self.emit(
              DataPortalEvent.getName(DataPortalEvent.postFetch),
              getEventArgs(DataPortalAction.fetch, method, dpError),
              self
          );
          // Close connection.
          connection = config.connectionManager.closeConnection(extensions.dataSource, connection);
          // Rethrow error.
          throw dpError;
        }
      }
    }

    //endregion

    //endregion

    //region Actions

    /**
     * Initializes a business object to be retrieved from the repository.
     * <br/>_This method is called by a factory method with the same name._
     *
     * @function ReadOnlyRootModelSync#fetch
     * @protected
     * @param {*} [filter] - The filter criteria.
     * @param {string} [method] - An alternative fetch method of the data access object.
     */
    this.fetch = function(filter, method) {
      data_fetch(filter, method || M_FETCH);
    };

    //endregion

    //region Validation

    /**
     * Gets the broken rules of the business object.
     *
     * @function ReadOnlyRootModelSync#getBrokenRules
     * @param {string} [namespace] - The namespace of the message keys when messages are localizable.
     * @returns {bo.rules.BrokenRulesOutput} The broken rules of the business object.
     */
    this.getBrokenRules = function(namespace) {
      return brokenRules.output(namespace);
    };

    //endregion

    //region Properties

    function getPropertyValue(property) {
      return store.getValue(property);
    }

    function setPropertyValue(property, value) {
      //if (store.setValue(property, value))
      //  markAsChanged(true);
      store.setValue(property, value);
    }

    function readPropertyValue(property) {
      if (canBeRead(property))
        return store.getValue(property);
      else
        return null;
    }

    function getPropertyContext(primaryProperty) {
      if (!propertyContext)
        propertyContext = new PropertyContext(properties.toArray(), readPropertyValue);
      return propertyContext.with(primaryProperty);
    }

    properties.map(function(property) {

      if (property.type instanceof DataType) {
        // Normal property
        store.initValue(property);

        Object.defineProperty(self, property.name, {
          get: function () {
            if (property.getter)
              return property.getter(getPropertyContext(property));
            else
              return readPropertyValue(property);
          },
          set: function (value) {
            throw new ModelError('readOnly', properties.name , property.name);
          },
          enumerable: true
        });

      } else {
        // Child item/collection
        if (property.type.create) // Item
          store.initValue(property, property.type.create(self));
        else                      // Collection
          store.initValue(property, new property.type(self));

        Object.defineProperty(self, property.name, {
          get: function () {
            return readPropertyValue(property);
          },
          set: function (value) {
            throw new ModelError('readOnly', properties.name , property.name);
          },
          enumerable: false
        });
      }
    });

    //endregion

    // Immutable object.
    Object.freeze(this);
  };
  util.inherits(ReadOnlyRootModelSync, ModelBase);

  /**
   * The name of the model type.
   *
   * @property {string} ReadOnlyRootModelSync.constructor.modelType
   * @default ReadOnlyRootModelSync
   * @readonly
   */
  Object.defineProperty(ReadOnlyRootModelSync, 'modelType', {
    get: function () { return 'ReadOnlyRootModelSync'; }
  });
  /**
   * The name of the model. However, it can be hidden by a model property with the same name.
   *
   * @name ReadOnlyRootModelSync#$modelName
   * @type {string}
   * @readonly
   */
  ReadOnlyRootModelSync.prototype.$modelName = properties.name;

  //region Factory methods

  /**
   * Retrieves a read-only business object from the repository.
   *
   * @function ReadOnlyRootModelSync.fetch
   * @param {*} [filter] - The filter criteria.
   * @param {string} [method] - An alternative fetch method of the data access object.
   * @returns {ReadOnlyRootModelSync} The required read-only business object.
   *
   * @throws {@link bo.rules.AuthorizationError Authorization error}:
   *      The user has no permission to execute the action.
   * @throws {@link bo.shared.DataPortalError Data portal error}:
   *    Fetching the business object has failed.
   */
  ReadOnlyRootModelSync.fetch = function(filter, method) {
    var instance = new ReadOnlyRootModelSync();
    instance.fetch(filter, method);
    return instance;
  };

  //endregion

  return ReadOnlyRootModelSync;
};

module.exports = ReadOnlyRootModelSyncFactory;
