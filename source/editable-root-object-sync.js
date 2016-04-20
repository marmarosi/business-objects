'use strict';

//region Imports

var util = require('util');
var config = require('./shared/configuration-reader.js');
var Argument = require('./system/argument-check.js');
var Enumeration = require('./system/enumeration.js');

var ModelBase = require('./model-base.js');
var ModelError = require('./shared/model-error.js');
var ExtensionManagerSync = require('./shared/extension-manager-sync.js');
var EventHandlerList = require('./shared/event-handler-list.js');
var DataStore = require('./shared/data-store.js');
var DataType = require('./data-types/data-type.js');

var PropertyInfo = require('./shared/property-info.js');
var PropertyManager = require('./shared/property-manager.js');
var PropertyContext = require('./shared/property-context.js');
var ValidationContext = require('./rules/validation-context.js');
var TransferContext = require('./shared/transfer-context.js');

var RuleManager = require('./rules/rule-manager.js');
var DataTypeRule = require('./rules/data-type-rule.js');
var BrokenRuleList = require('./rules/broken-rule-list.js');
var RuleSeverity = require('./rules/rule-severity.js');
var AuthorizationAction = require('./rules/authorization-action.js');
var AuthorizationContext = require('./rules/authorization-context.js');
var BrokenRulesResponse = require('./rules/broken-rules-response.js');

var DataPortalAction = require('./shared/data-portal-action.js');
var DataPortalContext = require('./shared/data-portal-context.js');
var DataPortalEvent = require('./shared/data-portal-event.js');
var DataPortalEventArgs = require('./shared/data-portal-event-args.js');
var DataPortalError = require('./shared/data-portal-error.js');

var MODEL_STATE = require('./shared/model-state.js');
var CLASS_NAME = 'EditableRootObjectSync';
var MODEL_DESC = 'Editable root object';
var M_FETCH = DataPortalAction.getName(DataPortalAction.fetch);

//endregion

/**
 * Factory method to create definitions of synchronous editable root objects.
 *
 *    Valid child model types are:
 *
 *      * EditableChildCollectionSync
 *      * EditableChildObjectSync
 *
 * @function bo.EditableRootObjectSync
 * @param {string} name - The name of the model.
 * @param {bo.shared.PropertyManager} properties - The property definitions.
 * @param {bo.shared.RuleManager} rules - The validation and authorization rules.
 * @param {bo.shared.ExtensionManager} extensions - The customization of the model.
 * @returns {EditableRootObjectSync} The constructor of a synchronous editable root object.
 *
 * @throws {@link bo.system.ArgumentError Argument error}: The model name must be a non-empty string.
 * @throws {@link bo.system.ArgumentError Argument error}: The properties must be a PropertyManager object.
 * @throws {@link bo.system.ArgumentError Argument error}: The rules must be a RuleManager object.
 * @throws {@link bo.system.ArgumentError Argument error}: The extensions must be a ExtensionManagerSync object.
 *
 * @throws {@link bo.shared.ModelError Model error}:
 *    The child objects must be EditableChildCollectionSync or EditableChildObjectSync instances.
 */
var EditableRootObjectSyncFactory = function (name, properties, rules, extensions) {
  var check = Argument.inConstructor(CLASS_NAME);

  name = check(name).forMandatory('name').asString();
  properties = check(properties).forMandatory('properties').asType(PropertyManager);
  rules = check(rules).forMandatory('rules').asType(RuleManager);
  extensions = check(extensions).forMandatory('extensions').asType(ExtensionManagerSync);

  // Verify the model types of child objects.
  properties.modelName = name;
  properties.verifyChildTypes([ 'EditableChildCollectionSync', 'EditableChildObjectSync' ]);

  // Get data access object.
  var dao = extensions.getDataAccessObject(name);

  /**
   * @classdesc
   *    Represents the definition of a synchronous editable root object.
   * @description
   *    Creates a new synchronous editable root object instance.
   *
   *    _The name of the model type available as:
   *    __&lt;instance&gt;.constructor.modelType__, returns 'EditableRootObjectSync'._
   *
   * @name EditableRootObjectSync
   * @constructor
   * @param {bo.shared.EventHandlerList} [eventHandlers] - The event handlers of the instance.
   *
   * @extends ModelBase
   *
   * @throws {@link bo.system.ArgumentError Argument error}:
   *    The event handlers must be an EventHandlerList object or null.
   *
   * @fires EditableRootObjectSync#preCreate
   * @fires EditableRootObjectSync#postCreate
   * @fires EditableRootObjectSync#preFetch
   * @fires EditableRootObjectSync#postFetch
   * @fires EditableRootObjectSync#preInsert
   * @fires EditableRootObjectSync#postInsert
   * @fires EditableRootObjectSync#preUpdate
   * @fires EditableRootObjectSync#postUpdate
   * @fires EditableRootObjectSync#preRemove
   * @fires EditableRootObjectSync#postRemove
   * @fires EditableRootObjectSync#preSave
   * @fires EditableRootObjectSync#postSave
   */
  var EditableRootObjectSync = function (eventHandlers) {
    ModelBase.call(this);

    eventHandlers = Argument.inConstructor(name)
        .check(eventHandlers).forOptional('eventHandlers').asType(EventHandlerList);

    var self = this;
    var state = null;
    var isDirty = false;
    var store = new DataStore();
    var brokenRules = new BrokenRuleList(name);
    var isValidated = false;
    var propertyContext = null;
    var dataContext = null;
    var connection = null;

    // Set up business rules.
    rules.initialize(config.noAccessBehavior);

    // Set up event handlers.
    if (eventHandlers)
      eventHandlers.setup(self);

    //region Mark object state

    /*
     * From:         To:  | pri | cre | cha | mfr | rem
     * -------------------------------------------------
     * NULL               |  +  |  +  |  N  |  N  |  N
     * -------------------------------------------------
     * pristine           |  o  |  -  |  +  |  +  |  -
     * -------------------------------------------------
     * created            |  +  |  o  |  o  | (-) |  +
     * -------------------------------------------------
     * changed            |  +  |  -  |  o  |  +  |  -
     * -------------------------------------------------
     * markedForRemoval   |  -  |  -  |  o  |  o  |  +
     * -------------------------------------------------
     * removed            |  -  |  -  |  -  |  -  |  o
     * -------------------------------------------------
     *
     * Explanation:
     *   +  :  possible transition
     *   -  :  not allowed transition, throws exception
     *   o  :  no change, no action
     *   N  :  impossible start up, throws exception
     */

    function markAsPristine() {
      if (state === MODEL_STATE.markedForRemoval || state === MODEL_STATE.removed)
        illegal(MODEL_STATE.pristine);
      else if (state !== MODEL_STATE.pristine) {
        state = MODEL_STATE.pristine;
        isDirty = false;
      }
    }

    function markAsCreated() {
      if (state === null) {
        state = MODEL_STATE.created;
        isDirty = true;
      }
      else if (state !== MODEL_STATE.created)
        illegal(MODEL_STATE.created);
    }

    function markAsChanged(itself) {
      if (state === MODEL_STATE.pristine) {
        state = MODEL_STATE.changed;
        isDirty = isDirty || itself;
        isValidated = false;
      }
      else if (state === MODEL_STATE.created) {
        isDirty = isDirty || itself;
        isValidated = false;
      }
      else if (state === MODEL_STATE.removed)
        illegal(MODEL_STATE.changed);
    }

    function markForRemoval() {
      if (state === MODEL_STATE.pristine || state === MODEL_STATE.changed) {
        state = MODEL_STATE.markedForRemoval;
        isDirty = true;
        propagateRemoval(); // down to children
      }
      else if (state === MODEL_STATE.created)
        state = MODEL_STATE.removed;
      else if (state !== MODEL_STATE.markedForRemoval)
        illegal(MODEL_STATE.markedForRemoval);
    }

    function markAsRemoved() {
      if (state === MODEL_STATE.created || state === MODEL_STATE.markedForRemoval) {
        state = MODEL_STATE.removed;
        isDirty = false;
      }
      else if (state !== MODEL_STATE.removed)
        illegal(MODEL_STATE.removed);
    }

    function illegal(newState) {
      throw new ModelError('transition',
        (state == null ? 'NULL' : MODEL_STATE.getName(state)),
        MODEL_STATE.getName(newState));
    }

    /**
     * Notes that a child object has changed.
     * <br/>_This method is called by child objects._
     *
     * @function EditableRootObjectSync#childHasChanged
     * @protected
     */
    this.childHasChanged = function() {
      markAsChanged(false);
    };

    function propagateRemoval() {
      properties.children().forEach(function(property) {
        var child = getPropertyValue(property);
        child.remove();
      });
    }

    //endregion

    //region Show object state

    /**
     * Gets the state of the model. Valid states are:
     * pristine, created, changed, markedForRemoval and removed.
     *
     * @function EditableRootObjectSync#getModelState
     * @returns {string} The state of the model.
     */
    this.getModelState = function () {
      return MODEL_STATE.getName(state);
    };

    /**
     * Indicates whether the business object has been created newly and
     * not has been yet saved, i.e. its state is created.
     *
     * @function EditableRootObjectSync#isNew
     * @returns {boolean} True when the business object is new, otherwise false.
     */
    this.isNew = function () {
      return state === MODEL_STATE.created;
    };

    /**
     * Indicates whether the business object itself or any of its child objects differs the one
     * that is stored in the repository, i.e. its state is created, changed or markedForRemoval.
     *
     * @function EditableRootObjectSync#isDirty
     * @returns {boolean} True when the business object has been changed, otherwise false.
     */
    this.isDirty = function () {
      return state === MODEL_STATE.created ||
             state === MODEL_STATE.changed ||
             state === MODEL_STATE.markedForRemoval;
    };

    /**
     * Indicates whether the business object itself, ignoring its child objects, differs the one
     * that is stored in the repository.
     *
     * @function EditableRootObjectSync#isSelfDirty
     * @returns {boolean} True when the business object itself has been changed, otherwise false.
     */
    this.isSelfDirty = function () {
      return isDirty;
    };

    /**
     * Indicates whether the business object will be deleted from the repository,
     * i.e. its state is markedForRemoval.
     *
     * @function EditableRootObjectSync#isDeleted
     * @returns {boolean} True when the business object will be deleted, otherwise false.
     */
    this.isDeleted = function () {
      return state === MODEL_STATE.markedForRemoval;
    };

    /**
     * Indicates whether the business object can be saved to the repository,
     * i.e. it has ben changed and is valid, and the user has permission to save it.
     *
     * @function EditableRootObjectSync#isSavable
     * @returns {boolean} True when the user can save the business object, otherwise false.
     */
    this.isSavable = function () {
      var auth;
      if (self.isDeleted)
        auth = canDo(AuthorizationAction.removeObject);
      else if (self.isNew)
        auth = canDo(AuthorizationAction.createObject);
      else
        auth = canDo(AuthorizationAction.updateObject);
      return auth && self.isDirty && self.isValid();
    };

    //endregion

    //region Transfer object methods

    function getTransferContext (authorize) {
      return authorize ?
          new TransferContext(properties.toArray(), readPropertyValue, writePropertyValue) :
          new TransferContext(properties.toArray(), getPropertyValue, setPropertyValue);
    }

    function baseToDto() {
      var dto = {};
      properties.filter(function (property) {
        return property.isOnDto;
      }).forEach(function (property) {
        dto[property.name] = getPropertyValue(property);
      });
      return dto;
    }

    function toDto () {
      if (extensions.toDto)
        return extensions.toDto.call(self, getTransferContext(false));
      else
        return baseToDto();
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
     * @function EditableRootObjectSync#toCto
     * @returns {object} The client transfer object.
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

    function baseFromCto(cto) {
      if (cto && typeof cto === 'object') {
        properties.filter(function (property) {
          return property.isOnCto;
        }).forEach(function (property) {
          if (cto.hasOwnProperty(property.name) && typeof cto[property.name] !== 'function') {
            writePropertyValue(property, cto[property.name]);
          }
        });
      }
    }

    /**
     * Rebuilds the business object from a plain object sent by the client.
     *
     * @function EditableRootObjectSync#fromCto
     * @param {object} cto - The client transfer object.
     */
    this.fromCto = function (cto) {
      if (extensions.fromCto)
        extensions.fromCto.call(self, getTransferContext(true), cto);
      else
        baseFromCto(cto);

      properties.children().forEach(function (property) {
        var child = getPropertyValue(property);
        if (cto[property.name]) {
          child.fromCto(cto[property.name]);
        }
      });
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

    function canBeWritten (property) {
      return rules.hasPermission(
          getAuthorizationContext(AuthorizationAction.writeProperty, property.name)
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

    function fetchChildren (dto) {
      properties.children().forEach(function(property) {
        var child = getPropertyValue(property);
        child.fetch(dto[property.name]);
      });
    }

    function insertChildren (connection) {
      properties.children().forEach(function(property) {
        var child = getPropertyValue(property);
        child.save(connection);
      });
    }

    function updateChildren (connection) {
      properties.children().forEach(function(property) {
        var child = getPropertyValue(property);
        child.save(connection);
      });
    }

    function removeChildren (connection) {
      properties.children().forEach(function(property) {
        var child = getPropertyValue(property);
        child.save(connection);
      });
    }

    function childrenAreValid () {
      return properties.children().every(function(property) {
        var child = getPropertyValue(property);
        return child.isValid();
      });
    }

    function checkChildRules () {
      properties.children().forEach(function (property) {
        var child = getPropertyValue(property);
        child.checkRules();
      });
    }

    function getChildBrokenRules (namespace, bro) {
      properties.children().forEach(function (property) {
        var child = getPropertyValue(property);
        var childBrokenRules = child.getBrokenRules(namespace);
        if (childBrokenRules) {
          if (childBrokenRules instanceof Array)
            bro.addChildren(property.name, childBrokenRules);
          else
            bro.addChild(property.name, childBrokenRules);
        }
      });
      return bro;
    }

    //endregion

    //region Data portal methods

    //region Helper

    function getDataContext (connection) {
      if (!dataContext)
        dataContext = new DataPortalContext(
            dao, properties.toArray(), getPropertyValue, setPropertyValue
        );
      return dataContext.setState(connection, isDirty);
    }

    function raiseEvent (event, methodName, error) {
      self.emit(
          DataPortalEvent.getName(event),
          new DataPortalEventArgs(event, name, null, methodName, error)
      );
    }

    function raiseSave (event, action, error) {
      self.emit(
          DataPortalEvent.getName(event),
          new DataPortalEventArgs(event, name, action, null, error)
      );
    }

    function wrapError (action, error) {
      return new DataPortalError(MODEL_DESC, name, action, error);
    }

    //endregion

    //region Create

    function data_create () {
      if (extensions.dataCreate || dao.$hasCreate()) {
        try {
          // Open connection.
          connection = config.connectionManager.openConnection(extensions.dataSource);
          // Launch start event.
          /**
           * The event arises before the business object instance will be initialized in the repository.
           * @event EditableRootObjectSync#preCreate
           * @param {bo.shared.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObjectSync} oldObject - The instance of the model before the data portal action.
           */
          raiseEvent(DataPortalEvent.preCreate);
          // Execute creation.
          if (extensions.dataCreate) {
            // *** Custom creation.
            extensions.dataCreate.call(self, getDataContext(connection));
          } else {
            // *** Standard creation.
            var dto = dao.$runMethod('create', connection);
            fromDto.call(self, dto);
          }
          markAsCreated();
          // Launch finish event.
          /**
           * The event arises after the business object instance has been initialized in the repository.
           * @event EditableRootObjectSync#postCreate
           * @param {bo.shared.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObjectSync} newObject - The instance of the model after the data portal action.
           */
          raiseEvent(DataPortalEvent.postCreate);
          // Close connection.
          connection = config.connectionManager.closeConnection(extensions.dataSource, connection);
        } catch (e) {
          // Wrap the intercepted error.
          var dpError = wrapError(DataPortalAction.create, e);
          // Launch finish event.
          if (connection)
            raiseEvent(DataPortalEvent.postCreate, null, dpError);
          // Close connection.
          connection = config.connectionManager.closeConnection(extensions.dataSource, connection);
          // Rethrow error.
          throw dpError;
        }
      }
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
           * @event EditableRootObjectSync#preFetch
           * @param {bo.shared.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObjectSync} oldObject - The instance of the model before the data portal action.
           */
          raiseEvent(DataPortalEvent.preFetch, method);
          // Execute fetch.
          var dto = null;
          if (extensions.dataFetch) {
            // *** Custom fetch.
            dto = extensions.dataFetch.call(self, getDataContext(connection), filter, method);
          } else {
            // *** Standard fetch.
            // Root element fetches data from repository.
            var dto = dao.$runMethod(method, connection, filter);
            fromDto.call(self, dto);
          }
          // Fetch children as well.
          fetchChildren(dto);
          markAsPristine();
          // Launch finish event.
          /**
           * The event arises after the business object instance has been retrieved from the repository.
           * @event EditableRootObjectSync#postFetch
           * @param {bo.shared.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObjectSync} newObject - The instance of the model after the data portal action.
           */
          raiseEvent(DataPortalEvent.postFetch, method);
          // Close connection.
          connection = config.connectionManager.closeConnection(extensions.dataSource, connection);
        } catch (e) {
          // Wrap the intercepted error.
          var dpError = wrapError(DataPortalAction.fetch, e);
          // Launch finish event.
          if (connection)
            raiseEvent(DataPortalEvent.postFetch, method, dpError);
          // Close connection.
          connection = config.connectionManager.closeConnection(extensions.dataSource, connection);
          // Rethrow error.
          throw dpError;
        }
      }
    }

    //endregion

    //region Insert

    function data_insert () {
      // Check permissions.
      if (canDo(AuthorizationAction.createObject)) {
        try {
          // Start transaction.
          connection = config.connectionManager.beginTransaction(extensions.dataSource);
          // Launch start event.
          raiseSave(DataPortalEvent.preSave, DataPortalAction.insert);
          /**
           * The event arises before the business object instance will be created in the repository.
           * @event EditableRootObjectSync#preInsert
           * @param {bo.shared.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObjectSync} oldObject - The instance of the model before the data portal action.
           */
          raiseEvent(DataPortalEvent.preInsert);
          // Execute insert.
          if (extensions.dataInsert) {
            // *** Custom insert.
            extensions.dataInsert.call(self, getDataContext(connection));
          } else {
            // *** Standard insert.
            var dto = toDto.call(self);
            var dto = dao.$runMethod('insert', connection, dto);
            fromDto.call(self, dto);
          }
          // Insert children as well.
          insertChildren(connection);
          markAsPristine();
          // Launch finish event.
          /**
           * The event arises after the business object instance has been created in the repository.
           * @event EditableRootObjectSync#postInsert
           * @param {bo.shared.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObjectSync} newObject - The instance of the model after the data portal action.
           */
          raiseEvent(DataPortalEvent.postInsert);
          raiseSave(DataPortalEvent.postSave, DataPortalAction.insert);
          // Finish transaction.
          connection = config.connectionManager.commitTransaction(extensions.dataSource, connection);
        } catch (e) {
          // Wrap the intercepted error.
          var dpError = wrapError(DataPortalAction.insert, e);
          // Launch finish event.
          if (connection) {
            raiseEvent(DataPortalEvent.postInsert, null, dpError);
            raiseSave(DataPortalEvent.postSave, DataPortalAction.insert, dpError);
          }
          // Undo transaction.
          connection = config.connectionManager.rollbackTransaction(extensions.dataSource, connection);
          // Rethrow error.
          throw dpError;
        }
      }
    }

    //endregion

    //region Update

    function data_update () {
      // Check permissions.
      if (canDo(AuthorizationAction.updateObject)) {
        try {
          // Start transaction.
          connection = config.connectionManager.beginTransaction(extensions.dataSource);
          // Launch start event.
          raiseSave(DataPortalEvent.preSave, DataPortalAction.update);
          /**
           * The event arises before the business object instance will be updated in the repository.
           * @event EditableRootObjectSync#preUpdate
           * @param {bo.shared.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObjectSync} oldObject - The instance of the model before the data portal action.
           */
          raiseEvent(DataPortalEvent.preUpdate);
          // Execute update.
          if (extensions.dataUpdate) {
            // *** Custom update.
            extensions.dataUpdate.call(self, getDataContext(connection));
          } else if (isDirty) {
            // *** Standard update.
            var dto = toDto.call(self);
            var dto = dao.$runMethod('update', connection, dto);
            fromDto.call(self, dto);
          }
          // Update children as well.
          updateChildren(connection);
          markAsPristine();
          // Launch finish event.
          /**
           * The event arises after the business object instance has been updated in the repository.
           * @event EditableRootObjectSync#postUpdate
           * @param {bo.shared.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObjectSync} newObject - The instance of the model after the data portal action.
           */
          raiseEvent(DataPortalEvent.postUpdate);
          raiseSave(DataPortalEvent.postSave, DataPortalAction.update);
          // Finish transaction.
          connection = config.connectionManager.commitTransaction(extensions.dataSource, connection);
        } catch (e) {
          // Wrap the intercepted error.
          var dpError = wrapError(DataPortalAction.update, e);
          // Launch finish event.
          if (connection) {
            raiseEvent(DataPortalEvent.postUpdate, null, dpError);
            raiseSave(DataPortalEvent.postSave, DataPortalAction.update, dpError);
          }
          // Undo transaction.
          connection = config.connectionManager.rollbackTransaction(extensions.dataSource, connection);
          // Rethrow error.
          throw dpError;
        }
      }
    }

    //endregion

    //region Remove

    function data_remove () {
      // Check permissions.
      if (canDo(AuthorizationAction.removeObject)) {
        try {
          // Start transaction.
          connection = config.connectionManager.beginTransaction(extensions.dataSource);
          // Launch start event.
          raiseSave(DataPortalEvent.preSave, DataPortalAction.remove);
          /**
           * The event arises before the business object instance will be removed from the repository.
           * @event EditableRootObjectSync#preRemove
           * @param {bo.shared.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObjectSync} oldObject - The instance of the model before the data portal action.
           */
          raiseEvent(DataPortalEvent.preRemove);
          // Remove children first.
          removeChildren(connection);
          // Execute removal.
          if (extensions.dataRemove) {
            // Custom removal.
            extensions.dataRemove.call(self, getDataContext(connection));
          } else {
            // Standard removal.
            var filter = properties.getKey(getPropertyValue);
            var dto = dao.$runMethod('remove', connection, filter);
          }
          markAsRemoved();
          // Launch finish event.
          /**
           * The event arises after the business object instance has been removed from the repository.
           * @event EditableRootObjectSync#postRemove
           * @param {bo.shared.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObjectSync} newObject - The instance of the model after the data portal action.
           */
          raiseEvent(DataPortalEvent.postRemove);
          raiseSave(DataPortalEvent.postSave, DataPortalAction.remove);
          // Finish transaction.
          connection = config.connectionManager.commitTransaction(extensions.dataSource, connection);
        } catch (e) {
          // Wrap the intercepted error.
          var dpError = wrapError(DataPortalAction.remove, e);
          // Launch finish event.
          if (connection) {
            raiseEvent(DataPortalEvent.postRemove, null, dpError);
            raiseSave(DataPortalEvent.postSave, DataPortalAction.remove, dpError);
          }
          // Undo transaction.
          connection = config.connectionManager.rollbackTransaction(extensions.dataSource, connection);
          // Rethrow error.
          throw dpError;
        }
      }
    }

    //endregion

    //endregion

    //region Actions

    /**
     * Initializes a newly created business object.
     * <br/>_This method is called by a factory method with the same name._
     *
     * @function EditableRootObjectSync#create
     * @protected
     *
     * @throws {@link bo.rules.AuthorizationError Authorization error}:
     *      The user has no permission to execute the action.
     * @throws {@link bo.shared.DataPortalError Data portal error}:
     *      Creating the business object has failed.
     */
    this.create = function() {
      data_create();
    };

    /**
     * Initializes a business object to be retrieved from the repository.
     * <br/>_This method is called by a factory method with the same name._
     *
     * @function EditableRootObjectSync#fetch
     * @protected
     * @param {*} [filter] - The filter criteria.
     * @param {string} [method] - An alternative fetch method of the data access object.
     *
     * @throws {@link bo.system.ArgumentError Argument error}:
     *      The method must be a string or null.
     * @throws {@link bo.rules.AuthorizationError Authorization error}:
     *      The user has no permission to execute the action.
     * @throws {@link bo.shared.DataPortalError Data portal error}:
     *      Fetching the business object has failed.
     */
    this.fetch = function(filter, method) {

      method = Argument.inMethod(name, 'fetch')
          .check(method).forOptional('method').asString();

      data_fetch(filter, method || M_FETCH);
    };

    /**
     * Saves the changes of the business object to the repository.
     *
     * @function EditableRootObjectSync#save
     * @returns {EditableRootObjectSync} The business object with the new state after the save.
     *
     * @throws {@link bo.rules.AuthorizationError Authorization error}:
     *      The user has no permission to execute the action.
     * @throws {@link bo.shared.DataPortalError Data portal error}:
     *      Inserting the business object has failed.
     * @throws {@link bo.shared.DataPortalError Data portal error}:
     *      Updating the business object has failed.
     * @throws {@link bo.shared.DataPortalError Data portal error}:
     *      Deleting the business object has failed.
     */
    this.save = function() {
      if (this.isValid()) {
        /**
         * The event arises before the business object instance will be saved in the repository.
         * The event is followed by a preInsert, preUpdate or preRemove event depending on the
         * state of the business object instance.
         * @event EditableRootObjectSync#preSave
         * @param {bo.shared.DataPortalEventArgs} eventArgs - Data portal event arguments.
         * @param {EditableRootObjectSync} oldObject - The instance of the model before the data portal action.
         */
        switch (state) {
          case MODEL_STATE.created:
            data_insert();
            return this;
          case MODEL_STATE.changed:
            data_update();
            return this;
          case MODEL_STATE.markedForRemoval:
            data_remove();
            return null;
          default:
            return this;
        }
        /**
         * The event arises after the business object instance has been saved in the repository.
         * The event is preceded by a postInsert, postUpdate or postRemove event depending on the
         * state of the business object instance.
         * @event EditableRootObjectSync#postSave
         * @param {bo.shared.DataPortalEventArgs} eventArgs - Data portal event arguments.
         * @param {EditableRootObjectSync} newObject - The instance of the model after the data portal action.
         */
      }
    };

    /**
     * Marks the business object to be deleted from the repository on next save.
     *
     * @function EditableRootObjectSync#remove
     */
    this.remove = function() {
      markForRemoval();
    };

    //endregion

    //region Validation

    /**
     * Indicates whether all the validation rules of the business object, including
     * the ones of its child objects, succeeds. A valid business object may have
     * broken rules with severity of success, information and warning.
     *
     * @function EditableRootObjectSync#isValid
     * @returns {boolean} True when the business object is valid, otherwise false.
     */
    this.isValid = function () {
      if (!isValidated)
        this.checkRules();

      return brokenRules.isValid() && childrenAreValid();
    };

    /**
     * Executes all the validation rules of the business object, including the ones
     * of its child objects.
     *
     * @function EditableRootObjectSync#checkRules
     */
    this.checkRules = function () {
      brokenRules.clear();

      var context = new ValidationContext(store, brokenRules);
      properties.forEach(function(property) {
        rules.validate(property, context);
      });
      checkChildRules();

      isValidated = true;
    };

    /**
     * Gets the broken rules of the business object.
     *
     * @function EditableRootObjectSync#getBrokenRules
     * @param {string} [namespace] - The namespace of the message keys when messages are localizable.
     * @returns {bo.rules.BrokenRulesOutput} The broken rules of the business object.
     */
    this.getBrokenRules = function (namespace) {
      var bro = brokenRules.output(namespace);
      bro = getChildBrokenRules(namespace, bro);
      return bro.$length ? bro : null;
    };

    /**
     * Gets the response to send to the client in case of broken rules.
     *
     * @function EditableRootObjectSync#getResponse
     * @param {string} [message] - Human-readable description of the reason of the failure.
     * @param {string} [namespace] - The namespace of the message keys when messages are localizable.
     * @returns {bo.rules.BrokenRulesResponse} The broken rules response to send to the client.
     */
    this.getResponse = function (message, namespace) {
      var output = this.getBrokenRules(namespace);
      return output ? new BrokenRulesResponse(output, message) : null;
    };

    //endregion

    //region Properties

    function getPropertyValue(property) {
      return store.getValue(property);
    }

    function setPropertyValue(property, value) {
      if (store.setValue(property, value))
        markAsChanged(true);
    }

    function readPropertyValue(property) {
      if (canBeRead(property)) {
        if (property.getter)
          return property.getter(getPropertyContext(property));
        else
          return store.getValue(property);
      } else
        return null;
    }

    function writePropertyValue(property, value) {
      if (canBeWritten(property)) {
        var changed = property.setter ?
            property.setter(getPropertyContext(property), value) :
            store.setValue(property, value);
        if (changed === true)
          markAsChanged(true);
      }
    }

    function getPropertyContext(primaryProperty) {
      if (!propertyContext)
        propertyContext = new PropertyContext(
            name, properties.toArray(), readPropertyValue, writePropertyValue);
      return propertyContext.with(primaryProperty);
    }

    properties.map(function(property) {

      if (property.type instanceof DataType) {
        // Normal property
        store.initValue(property);

        Object.defineProperty(self, property.name, {
          get: function () {
            return readPropertyValue(property);
          },
          set: function (value) {
            if (property.isReadOnly)
              throw new ModelError('readOnly', name, property.name);
            writePropertyValue(property, value);
          },
          enumerable: true
        });

        rules.add(new DataTypeRule(property));

      } else {
        // Child item/collection
        if (property.type.create) // Item
          store.initValue(property, property.type.create(self, eventHandlers));
        else                      // Collection
          store.initValue(property, new property.type(self, eventHandlers));

        Object.defineProperty(self, property.name, {
          get: function () {
            return readPropertyValue(property);
          },
          set: function (value) {
            throw new ModelError('readOnly', name , property.name);
          },
          enumerable: false
        });
      }
    });

    //endregion

    // Immutable object.
    Object.freeze(this);
  };
  util.inherits(EditableRootObjectSync, ModelBase);

  /**
   * The name of the model type.
   *
   * @property {string} EditableRootObjectSync.constructor.modelType
   * @default EditableRootObjectSync
   * @readonly
   */
  Object.defineProperty(EditableRootObjectSync, 'modelType', {
    get: function () { return CLASS_NAME; }
  });

  /**
   * The name of the model. However, it can be hidden by a model property with the same name.
   *
   * @name EditableRootObjectSync#$modelName
   * @type {string}
   * @readonly
   */
  EditableRootObjectSync.prototype.$modelName = name;

  //region Factory methods

  /**
   * Creates a new editable business object instance.
   *
   * @function EditableRootObjectSync.create
   * @param {bo.shared.EventHandlerList} [eventHandlers] - The event handlers of the instance.
   * @returns {EditableRootObjectSync} A new editable business object.
   *
   * @throws {@link bo.system.ArgumentError Argument error}:
   *      The event handlers must be an EventHandlerList object or null.
   * @throws {@link bo.rules.AuthorizationError Authorization error}:
   *      The user has no permission to execute the action.
   * @throws {@link bo.shared.DataPortalError Data portal error}:
   *      Creating the business object has failed.
   */
  EditableRootObjectSync.create = function(eventHandlers) {
    var instance = new EditableRootObjectSync(eventHandlers);
    instance.create();
    return instance;
  };

  /**
   * Retrieves an editable business object from the repository.
   *
   * @function EditableRootObjectSync.fetch
   * @param {*} [filter] - The filter criteria.
   * @param {string} [method] - An alternative fetch method of the data access object.
   * @param {bo.shared.EventHandlerList} [eventHandlers] - The event handlers of the instance.
   * @returns {EditableRootObjectSync} The required editable business object.
   *
   * @throws {@link bo.system.ArgumentError Argument error}:
   *      The method must be a string or null.
   * @throws {@link bo.system.ArgumentError Argument error}:
   *      The event handlers must be an EventHandlerList object or null.
   * @throws {@link bo.rules.AuthorizationError Authorization error}:
   *      The user has no permission to execute the action.
   * @throws {@link bo.shared.DataPortalError Data portal error}:
   *      Fetching the business object has failed.
   */
  EditableRootObjectSync.fetch = function(filter, method, eventHandlers) {
    var instance = new EditableRootObjectSync(eventHandlers);
    instance.fetch(filter, method);
    return instance;
  };

  //endregion

  return EditableRootObjectSync;
};

module.exports = EditableRootObjectSyncFactory;