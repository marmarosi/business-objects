'use strict';

//region Imports

const config = require( './system/configuration-reader.js' );
const Argument = require( './system/argument-check.js' );

const ModelBase = require( './common/model-base.js' );
const ModelType = require( './common/model-type.js' );
const ModelError = require( './common/model-error.js' );
const ExtensionManager = require( './common/extension-manager.js' );
const EventHandlerList = require( './common/event-handler-list.js' );
const DataStore = require( './common/data-store.js' );
const DataType = require( './data-types/data-type.js' );

const PropertyManager = require( './common/property-manager.js' );
const PropertyContext = require( './common/property-context.js' );
const ValidationContext = require( './rules/validation-context.js' );
const ClientTransferContext = require( './common/client-transfer-context.js' );
const DataTransferContext = require( './common/data-transfer-context.js' );

const RuleManager = require( './rules/rule-manager.js' );
const DataTypeRule = require( './rules/data-type-rule.js' );
const BrokenRuleList = require( './rules/broken-rule-list.js' );
const AuthorizationAction = require( './rules/authorization-action.js' );
const AuthorizationContext = require( './rules/authorization-context.js' );

const DataPortalAction = require( './common/data-portal-action.js' );
const DataPortalContext = require( './common/data-portal-context.js' );
const DataPortalEvent = require( './common/data-portal-event.js' );
const DataPortalEventArgs = require( './common/data-portal-event-args.js' );
const DataPortalError = require( './common/data-portal-error.js' );

//endregion

//region Private variables

const MODEL_STATE = require( './common/model-state.js' );
const MODEL_DESC = 'Editable root object';
const M_FETCH = DataPortalAction.getName( DataPortalAction.fetch );

const _properties = new WeakMap();
const _rules = new WeakMap();
const _extensions = new WeakMap();
const _eventHandlers = new WeakMap();
const _propertyContext = new WeakMap();
const _store = new WeakMap();
const _state = new WeakMap();
const _isDirty = new WeakMap();
const _isValidated = new WeakMap();
const _brokenRules = new WeakMap();
const _dataContext = new WeakMap();
const _dao = new WeakMap();

//endregion

//region Helper methods

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
  const state = _state.get( this );
  if (state === MODEL_STATE.markedForRemoval || state === MODEL_STATE.removed)
    illegal.call( this, MODEL_STATE.pristine );
  else if (state !== MODEL_STATE.pristine) {
    _state.set( this, MODEL_STATE.pristine );
    _isDirty.set( this, false );
  }
}

function markAsCreated() {
  const state = _state.get( this );
  if (state === null) {
    _state.set( this, MODEL_STATE.created );
    _isDirty.set( this, true );
  }
  else if (state !== MODEL_STATE.created)
    illegal.call( this, MODEL_STATE.created );
}

function markAsChanged( itself ) {
  const state = _state.get( this );
  const isDirty = _isDirty.get( this );
  if (state === MODEL_STATE.pristine) {
    _state.set( this, MODEL_STATE.changed );
    _isDirty.set( this, isDirty || itself );
    _isValidated.set( this, false );
  }
  else if (state === MODEL_STATE.created) {
    _isDirty.set( this, isDirty || itself );
    _isValidated.set( this, false );
  }
  else if (state === MODEL_STATE.removed)
    illegal.call( this, MODEL_STATE.changed );
}

function markForRemoval() {
  const state = _state.get( this );
  if (state === MODEL_STATE.pristine || state === MODEL_STATE.changed) {
    _state.set( this, MODEL_STATE.markedForRemoval );
    _isDirty.set( this, true );
    propagateRemoval.call( this ); // down to children
  }
  else if (state === MODEL_STATE.created)
    _state.set( this, MODEL_STATE.removed );
  else if (state !== MODEL_STATE.markedForRemoval)
    illegal.call( this, MODEL_STATE.markedForRemoval );
}

function markAsRemoved() {
  const state = _state.get( this );
  if (state === MODEL_STATE.created || state === MODEL_STATE.markedForRemoval) {
    _state.set( this, MODEL_STATE.removed );
    _isDirty.set( this, false );
  }
  else if (state !== MODEL_STATE.removed)
    illegal.call( this, MODEL_STATE.removed );
}

function illegal( newState ) {
  const state = _state.get( this );
  throw new ModelError(
    'transition',
    (state == null ? 'NULL' : MODEL_STATE.getName( state )),
    MODEL_STATE.getName( newState )
  );
}

function propagateRemoval() {
  const properties = _properties.get( this );
  properties.children().forEach( property => {
    const child = getPropertyValue.call( this, property );
    child.remove();
  } );
}

//endregion

//region Transfer object methods

function getTransferContext( authorize ) {
  const properties = _properties.get( this );

  return authorize ?
    new ClientTransferContext(
      properties.toArray(),
      readPropertyValue.bind( this ),
      writePropertyValue.bind( this )
    ) :
    new DataTransferContext(
      properties.toArray(),
      getPropertyValue.bind( this ),
      setPropertyValue.bind( this )
    );
}

function baseToDto() {
  const dto = {};
  const self = this;
  const properties = _properties.get( this );

  properties
    .filter( property => {
      return property.isOnDto;
    } )
    .forEach( property => {
      dto[ property.name ] = getPropertyValue.call( self, property );
    } );
  return dto;
}

function toDto() {
  const extensions = _extensions.get( this );

  if (extensions.toDto)
    return extensions.toDto.call( this, getTransferContext.call( this, false ) );
  else
    return baseToDto.call( this );
}

function baseFromDto( dto ) {
  const self = this;
  const properties = _properties.get( this );

  properties
    .filter( property => {
      return property.isOnDto;
    } )
    .forEach( property => {
      if (dto.hasOwnProperty( property.name ) && typeof dto[ property.name ] !== 'function') {
        setPropertyValue.call( self, property, dto[ property.name ] );
      }
    } );
}

function fromDto( dto ) {
  const extensions = _extensions.get( this );

  if (extensions.fromDto)
    extensions.fromDto.call( this, getTransferContext.call( this, false ), dto );
  else
    baseFromDto.call( this, dto );
}

function baseToCto() {
  const cto = {};
  const self = this;
  const properties = _properties.get( this );

  properties
    .filter( property => {
      return property.isOnCto;
    } )
    .forEach( property => {
      cto[ property.name ] = readPropertyValue.call( self, property );
    } );
  return cto;
}

function baseFromCto( cto ) {
  if (cto && typeof cto === 'object') {
    const self = this;
    const properties = _properties.get( this );

    properties
      .filter( property => {
        return property.isOnCto;
      } )
      .forEach( property => {
        if (cto.hasOwnProperty( property.name ) && typeof cto[ property.name ] !== 'function') {
          writePropertyValue.call( self, property, cto[ property.name ] );
        }
      } );
  }
}

//endregion

//region Permissions

function getAuthorizationContext( action, targetName ) {
  return new AuthorizationContext( action, targetName || '', _brokenRules.get( this ) );
}

function canBeRead( property ) {
  const rules = _rules.get( this );
  return rules.hasPermission(
    getAuthorizationContext.call( this, AuthorizationAction.readProperty, property.name )
  );
}

function canBeWritten( property ) {
  const rules = _rules.get( this );
  return rules.hasPermission(
    getAuthorizationContext.call( this, AuthorizationAction.writeProperty, property.name )
  );
}

function canDo( action ) {
  const rules = _rules.get( this );
  return rules.hasPermission(
    getAuthorizationContext.call( this, action )
  );
}

function canExecute( methodName ) {
  const rules = _rules.get( this );
  return rules.hasPermission(
    getAuthorizationContext.call( this, AuthorizationAction.executeMethod, methodName )
  );
}

//endregion

//region Child methods

function createChildren( connection ) {
  const self = this;
  const properties = _properties.get( this );
  return Promise.all( properties.children().map( property => {
    const child = getPropertyValue.call( self, property );
    return child instanceof ModelBase ?
      child.create( connection ) :
      Promise.resolve( null );
  } ) );
}

function fetchChildren( dto ) {
  const self = this;
  const properties = _properties.get( this );
  return Promise.all( properties.children().map( property => {
    const child = getPropertyValue.call( self, property );
    return child.fetch( dto[ property.name ] );
  } ) );
}

function saveChildren( connection ) {
  const self = this;
  const properties = _properties.get( this );
  return Promise.all( properties.children().map( property => {
    const child = getPropertyValue.call( self, property );
    return child.save( connection );
  } ) );
}

function childrenAreValid() {
  const properties = _properties.get( this );
  return properties.children().every( property => {
    const child = getPropertyValue.call( this, property );
    return child.isValid();
  } );
}

function checkChildRules() {
  const properties = _properties.get( this );
  properties.children().forEach( property => {
    const child = getPropertyValue.call( this, property );
    child.checkRules();
  } );
}

function getChildBrokenRules( namespace, bro ) {
  const properties = _properties.get( this );
  properties.children().forEach( property => {
    const child = getPropertyValue.call( this, property );
    const childBrokenRules = child.getBrokenRules( namespace );
    if (childBrokenRules) {
      if (childBrokenRules instanceof Array)
        bro.addChildren( property.name, childBrokenRules );
      else
        bro.addChild( property.name, childBrokenRules );
    }
  } );
  return bro;
}

//endregion

//region Properties

function getPropertyValue( property ) {
  const store = _store.get( this );
  return store.getValue( property );
}

function setPropertyValue( property, value ) {
  const store = _store.get( this );
  if (store.setValue( property, value )) {
    _store.set( this, store );
    markAsChanged.call( this, true );
  }
}

function readPropertyValue( property ) {
  if (canBeRead.call( this, property )) {
    const store = _store.get( this );
    return property.getter ?
      property.getter( getPropertyContext.call( this, property ) ) :
      store.getValue( property );
  }
  else
    return null;
}

function writePropertyValue( property, value ) {
  if (canBeWritten.call( this, property )) {
    let changed = false;
    if (property.setter)
      changed = property.setter( getPropertyContext.call( this, property ), value );
    else {
      const store = _store.get( this );
      changed = store.setValue( property, value );
      _store.set( this, store );
    }
    if (changed === true)
      markAsChanged.call( this, true );
  }
}

function getPropertyContext( primaryProperty ) {
  let propertyContext = _propertyContext.get( this );
  if (!propertyContext) {
    const properties = _properties.get( this );
    propertyContext = new PropertyContext(
      this.$modelName,
      properties.toArray(),
      readPropertyValue.bind( this ),
      writePropertyValue.bind( this )
    );
    _propertyContext.set( this, propertyContext );
  }
  return propertyContext.with( primaryProperty );
}

function initialize( name, properties, rules, extensions, eventHandlers ) {

  eventHandlers = Argument.inConstructor( name )
    .check( eventHandlers ).forOptional( 'eventHandlers' ).asType( EventHandlerList );

  // Set up business rules.
  rules.initialize( config.noAccessBehavior );

  // Set up event handlers.
  if (eventHandlers)
    eventHandlers.setup( this );

  // Create properties.
  const store = new DataStore();
  properties.map( property => {

    const isNormal = property.type instanceof DataType; // Not child element.
    if (isNormal) {
      // Initialize normal property.
      store.initValue( property );
      // Add data type check.
      rules.add( new DataTypeRule( property ) );
    }
    else
    // Create child item/collection.
      store.initValue( property, property.type.empty( this, eventHandlers ) );

    // Create normal property.
    Object.defineProperty( this, property.name, {
      get: () => {
        return readPropertyValue.call( this, property );
      },
      set: value => {
        if (!isNormal || property.isReadOnly)
          throw new ModelError( 'readOnly', name, property.name );
        writePropertyValue.call( this, property, value );
      },
      enumerable: true
    } );
  } );

  // Initialize instance state.
  _properties.set( this, properties );
  _rules.set( this, rules );
  _extensions.set( this, extensions );
  _eventHandlers.set( this, eventHandlers );
  _store.set( this, store );
  _propertyContext.set( this, null );
  _state.set( this, null );
  _isDirty.set( this, false );
  _isValidated.set( this, false );
  _brokenRules.set( this, new BrokenRuleList( name ) );
  _dataContext.set( this, null );

  // Get data access object.
  _dao.set( this, extensions.getDataAccessObject( name ) );

  // Immutable definition object.
  Object.freeze( this );
}

//endregion

//endregion

//region Data portal methods

//region Helper

function getDataContext( connection ) {
  let dataContext = _dataContext.get( this );
  if (!dataContext) {
    const properties = _properties.get( this );
    dataContext = new DataPortalContext(
      _dao.get( this ),
      properties.toArray(),
      getPropertyValue.bind( this ),
      setPropertyValue.bind( this )
    );
    _dataContext.set( this, dataContext );
  }
  return dataContext.setState( connection, _isDirty.get( this ) );
}

function raiseEvent( event, methodName, error ) {
  this.emit(
    DataPortalEvent.getName( event ),
    new DataPortalEventArgs( event, this.$modelName, null, methodName, error )
  );
}

function raiseSave( event, action, error ) {
  this.emit(
    DataPortalEvent.getName( event ),
    new DataPortalEventArgs( event, this.$modelName, action, null, error )
  );
}

function wrapError( action, error ) {
  return new DataPortalError( MODEL_DESC, this.$modelName, action, error );
}

//endregion

//region Create

function data_create() {
  const self = this;
  return new Promise( ( fulfill, reject ) => {

    const dao = _dao.get( self );
    const extensions = _extensions.get( self );
    // Does it have initializing method?
    if (extensions.dataCreate || dao.$hasCreate()) {
      let connection = null;
      // Open connection.
      config.connectionManager.openConnection( extensions.dataSource )
        .then( dsc => {
          connection = dsc;
          // Launch start event.
          /**
           * The event arises before the business object instance will be initialized in the repository.
           * @event EditableRootObject#preCreate
           * @param {bo.common.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObject} oldObject - The instance of the model before the data portal action.
           */
          raiseEvent.call( self, DataPortalEvent.preCreate );
          // Execute creation.
          return extensions.dataCreate ?
            // *** Custom creation.
            extensions.$runMethod( 'create', self, getDataContext.call( self, connection ) ) :
            // *** Standard creation.
            dao.$runMethod( 'create', connection )
              .then( dto => {
                fromDto.call( self, dto );
              } );
        } )
        .then( none => {
          // Create children as well.
          return createChildren.call( self, connection );
        } )
        .then( none => {
          markAsCreated.call( self );
          // Launch finish event.
          /**
           * The event arises after the business object instance has been initialized in the repository.
           * @event EditableRootObject#postCreate
           * @param {bo.common.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObject} newObject - The instance of the model after the data portal action.
           */
          raiseEvent.call( self, DataPortalEvent.postCreate );
          // Close connection.
          config.connectionManager.closeConnection( extensions.dataSource, connection )
            .then( none => {
              // Return the new editable root object.
              fulfill( self );
            } );
        } )
        .catch( reason => {
          // Wrap the intercepted error.
          const dpe = wrapError.call( self, DataPortalAction.create, reason );
          // Launch finish event.
          if (connection)
            raiseEvent.call( self, DataPortalEvent.postCreate, null, dpe );
          // Close connection.
          return config.connectionManager.closeConnection( extensions.dataSource, connection )
            .then( none => {
              // Pass the error.
              reject( dpe );
            } );
        } );
    } else
    // Nothing to do.
      fulfill( self );
  } );
}

//endregion

//region Fetch

function data_fetch( filter, method ) {
  const self = this;
  return new Promise( ( fulfill, reject ) => {
    // Check permissions.
    if (method === M_FETCH ?
        canDo.call( self, AuthorizationAction.fetchObject ) :
        canExecute.call( self, method )) {

      let connection = null;
      const extensions = _extensions.get( self );
      // Open connection.
      config.connectionManager.openConnection( extensions.dataSource )
        .then( dsc => {
          connection = dsc;
          // Launch start event.
          /**
           * The event arises before the business object instance will be retrieved from the repository.
           * @event EditableRootObject#preFetch
           * @param {bo.common.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObject} oldObject - The instance of the model before the data portal action.
           */
          raiseEvent.call( self, DataPortalEvent.preFetch, method );
          // Execute fetch.
          const dao = _dao.get( self );
          // Root element fetches all data from repository.
          return extensions.dataFetch ?
            // *** Custom fetch.
            extensions.$runMethod( 'fetch', self, getDataContext.call( self, connection ), filter, method ) :
            // *** Standard fetch.
            dao.$runMethod( method, connection, filter )
              .then( dto => {
                fromDto.call( self, dto );
                return dto;
              } );
        } )
        .then( dto => {
          // Fetch children as well.
          return fetchChildren.call( self, dto );
        } )
        .then( none => {
          markAsPristine.call( self );
          // Launch finish event.
          /**
           * The event arises after the business object instance has been retrieved from the repository.
           * @event EditableRootObject#postFetch
           * @param {bo.common.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObject} newObject - The instance of the model after the data portal action.
           */
          raiseEvent.call( self, DataPortalEvent.postFetch, method );
          // Close connection.
          config.connectionManager.closeConnection( extensions.dataSource, connection )
            .then( none => {
              // Return the fetched editable root object.
              fulfill( self );
            } );
        } )
        .catch( reason => {
          // Wrap the intercepted error.
          const dpe = wrapError.call( self, DataPortalAction.fetch, reason );
          // Launch finish event.
          if (connection)
            raiseEvent.call( self, DataPortalEvent.postFetch, method, dpe );
          // Close connection.
          config.connectionManager.closeConnection( extensions.dataSource, connection )
            .then( none => {
              // Pass the error.
              reject( dpe );
            } );
        } );
    }
  } );
}

//endregion

//region Insert

function data_insert() {
  const self = this;
  return new Promise( ( fulfill, reject ) => {
    // Check permissions.
    if (canDo.call( self, AuthorizationAction.createObject )) {

      let connection = null;
      // Open connection.
      const extensions = _extensions.get( self );
      config.connectionManager.beginTransaction( extensions.dataSource )
        .then( dsc => {
          connection = dsc;
          // Launch start event.
          raiseSave.call( self, DataPortalEvent.preSave, DataPortalAction.insert );
          /**
           * The event arises before the business object instance will be created in the repository.
           * @event EditableRootObject#preInsert
           * @param {bo.common.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObject} oldObject - The instance of the model before the data portal action.
           */
          raiseEvent.call( self, DataPortalEvent.preInsert );
          // Execute insert.
          const dao = _dao.get( self );
          return extensions.dataInsert ?
            // *** Custom insert.
            extensions.$runMethod( 'insert', self, getDataContext.call( self, connection ) ) :
            // *** Standard insert.
            dao.$runMethod( 'insert', connection, toDto.call( self ) )
              .then( dto => {
                fromDto.call( self, dto );
              } );
        } )
        .then( none => {
          // Insert children as well.
          return saveChildren.call( self, connection );
        } )
        .then( none => {
          markAsPristine.call( self );
          /**
           * The event arises after the business object instance has been created in the repository.
           * @event EditableRootObject#postInsert
           * @param {bo.common.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObject} newObject - The instance of the model after the data portal action.
           */
          raiseEvent.call( self, DataPortalEvent.postInsert );
          // Launch finish event.
          raiseSave.call( self, DataPortalEvent.postSave, DataPortalAction.insert );
          // Finish transaction.
          return config.connectionManager.commitTransaction( extensions.dataSource, connection )
            .then( none => {
              // Return the created editable root object.
              fulfill( self );
            } );
        } )
        .catch( reason => {
          // Wrap the intercepted error.
          const dpe = wrapError.call( self, DataPortalAction.insert, reason );
          // Launch finish event.
          if (connection) {
            raiseEvent.call( self, DataPortalEvent.postInsert, null, dpe );
            raiseSave.call( self, DataPortalEvent.postSave, DataPortalAction.insert, dpe );
          }
          // Undo transaction.
          return config.connectionManager.rollbackTransaction( extensions.dataSource, connection )
            .then( none => {
              // Pass the error.
              reject( dpe );
            } )
        } );
    }
  } );
}

//endregion

//region Update

function data_update() {
  const self = this;
  return new Promise( ( fulfill, reject ) => {
    // Check permissions.
    if (canDo.call( self, AuthorizationAction.updateObject )) {

      let connection = null;
      // Start transaction.
      const extensions = _extensions.get( self );
      config.connectionManager.beginTransaction( extensions.dataSource )
        .then( dsc => {
          connection = dsc;
          // Launch start event.
          raiseSave.call( self, DataPortalEvent.preSave, DataPortalAction.update );
          /**
           * The event arises before the business object instance will be updated in the repository.
           * @event EditableRootObject#preUpdate
           * @param {bo.common.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObject} oldObject - The instance of the model before the data portal action.
           */
          raiseEvent.call( self, DataPortalEvent.preUpdate );
          // Execute update.
          const dao = _dao.get( self );
          return extensions.dataUpdate ?
            // *** Custom update.
            extensions.$runMethod( 'update', self, getDataContext.call( self, connection ) ) :
            // *** Standard update.
            dao.$runMethod( 'update', connection, /* dto = */ toDto.call( self ) )
              .then( dto => {
                fromDto.call( self, dto );
              } );
        } )
        .then( none => {
          // Update children as well.
          return saveChildren.call( self, connection );
        } )
        .then( none => {
          markAsPristine.call( self );
          // Launch finish event.
          /**
           * The event arises after the business object instance has been updated in the repository.
           * @event EditableRootObject#postUpdate
           * @param {bo.common.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObject} newObject - The instance of the model after the data portal action.
           */
          raiseEvent.call( self, DataPortalEvent.postUpdate );
          raiseSave.call( self, DataPortalEvent.postSave, DataPortalAction.update );
          // Finish transaction.
          return config.connectionManager.commitTransaction( extensions.dataSource, connection )
            .then( none => {
              // Return the updated editable root object.
              fulfill( self );
            } );
        } )
        .catch( reason => {
          // Wrap the intercepted error.
          const dpe = wrapError.call( self, DataPortalAction.update, reason );
          // Launch finish event.
          if (connection) {
            raiseEvent.call( self, DataPortalEvent.postUpdate, null, dpe );
            raiseSave.call( self, DataPortalEvent.postSave, DataPortalAction.update, dpe );
          }
          // Undo transaction.
          return config.connectionManager.rollbackTransaction( extensions.dataSource, connection )
            .then( none => {
              // Pass the error.
              reject( dpe );
            } );
        } );
    }
  } );
}

//endregion

//region Remove

function data_remove() {
  const self = this;
  return new Promise( ( fulfill, reject ) => {
    // Check permissions.
    if (canDo.call( self, AuthorizationAction.removeObject )) {

      let connection = null;
      const extensions = _extensions.get( self );
      // Start transaction.
      config.connectionManager.beginTransaction( extensions.dataSource )
        .then( dsc => {
          connection = dsc;
          // Launch start event.
          raiseSave.call( self, DataPortalEvent.preSave, DataPortalAction.remove );
          /**
           * The event arises before the business object instance will be removed from the repository.
           * @event EditableRootObject#preRemove
           * @param {bo.common.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObject} oldObject - The instance of the model before the data portal action.
           */
          raiseEvent.call( self, DataPortalEvent.preRemove );
          // Remove children first.
          return saveChildren.call( self, connection );
        } )
        .then( none => {
          // Execute removal.
          const dao = _dao.get( self );
          const properties = _properties.get( self );
          return extensions.dataRemove ?
            // Custom removal.
            extensions.$runMethod( 'remove', self, getDataContext.call( self, connection ) ) :
            // Standard removal.
            dao.$runMethod( 'remove', connection, properties.getKey( getPropertyValue.bind( self ) ) );
        } )
        .then( none => {
          markAsRemoved.call( self );
          // Launch finish event.
          /**
           * The event arises after the business object instance has been removed from the repository.
           * @event EditableRootObject#postRemove
           * @param {bo.common.DataPortalEventArgs} eventArgs - Data portal event arguments.
           * @param {EditableRootObject} newObject - The instance of the model after the data portal action.
           */
          raiseEvent.call( self, DataPortalEvent.postRemove );
          raiseSave.call( self, DataPortalEvent.postSave, DataPortalAction.remove );
          // Finish transaction.
          return config.connectionManager.commitTransaction( extensions.dataSource, connection )
            .then( none => {
              // Nothing to return.
              fulfill( null );
            } );
        } )
        .catch( reason => {
          // Wrap the intercepted error.
          let dpe = wrapError.call( self, DataPortalAction.remove, reason );
          // Launch finish event.
          if (connection) {
            raiseEvent.call( self, DataPortalEvent.postRemove, null, dpe );
            raiseSave.call( self, DataPortalEvent.postSave, DataPortalAction.remove, dpe );
          }
          // Undo transaction.
          return config.connectionManager.rollbackTransaction( extensions.dataSource, connection )
            .then( none => {
              // Pass the error.
              reject( dpe );
            } );
        } );
    }
  } );
}

//endregion

//endregion

/**
 * Represents the definition of an asynchronous editable root object.
 *
 * @name EditableRootObject
 * @extends ModelBase
 *
 * @fires EditableRootObject#preCreate
 * @fires EditableRootObject#postCreate
 * @fires EditableRootObject#preFetch
 * @fires EditableRootObject#postFetch
 * @fires EditableRootObject#preInsert
 * @fires EditableRootObject#postInsert
 * @fires EditableRootObject#preUpdate
 * @fires EditableRootObject#postUpdate
 * @fires EditableRootObject#preRemove
 * @fires EditableRootObject#postRemove
 * @fires EditableRootObject#preSave
 * @fires EditableRootObject#postSave
 */
class EditableRootObject extends ModelBase {

  //region Constructor

  /**
   * Creates a new asynchronous editable root object instance.
   *
   * _The name of the model type available as:
   * __&lt;instance&gt;.constructor.modelType__, returns 'EditableRootObject'._
   *
   * @param {bo.common.EventHandlerList} [eventHandlers] - The event handlers of the instance.
   *
   * @throws {@link bo.system.ArgumentError Argument error}:
   *    The event handlers must be an EventHandlerList object or null.
   */
  constructor( name, properties, rules, extensions, eventHandlers ) {
    super();

    /**
     * The name of the model. However, it can be hidden by a model property with the same name.
     *
     * @member {string} EditableRootObject#$modelName
     * @readonly
     */
    this.$modelName = name;

    // Initialize the instance.
    initialize.call( this, name, properties, rules, extensions, eventHandlers );
  }

  //endregion

  //region Properties

  /**
   * The name of the model type.
   *
   * @member {string} EditableRootObject.modelType
   * @default EditableRootObject
   * @readonly
   */
  static get modelType() {
    return ModelType.EditableRootObject;
  }

  //endregion

  //region Mark object state

  /**
   * Notes that a child object has changed.
   * <br/>_This method is called by child objects._
   *
   * @function EditableRootObject#childHasChanged
   * @protected
   */
  childHasChanged() {
    markAsChanged.call( this, false );
  }

  //endregion

  //region Show object state

  /**
   * Gets the state of the model. Valid states are:
   * pristine, created, changed, markedForRemoval and removed.
   *
   * @function EditableRootObject#getModelState
   * @returns {string} The state of the model.
   */
  getModelState() {
    return MODEL_STATE.getName( _state.get( this ) );
  }

  /**
   * Indicates whether the business object has been created newly and
   * not has been yet saved, i.e. its state is created.
   *
   * @function EditableRootObject#isNew
   * @returns {boolean} True when the business object is new, otherwise false.
   */
  isNew() {
    return _state.get( this ) === MODEL_STATE.created;
  }

  /**
   * Indicates whether the business object itself or any of its child objects differs the one
   * that is stored in the repository, i.e. its state is created, changed or markedForRemoval.
   *
   * @function EditableRootObject#isDirty
   * @returns {boolean} True when the business object has been changed, otherwise false.
   */
  isDirty() {
    const state = _state.get( this );
    return state === MODEL_STATE.created ||
      state === MODEL_STATE.changed ||
      state === MODEL_STATE.markedForRemoval;
  }

  /**
   * Indicates whether the business object itself, ignoring its child objects, differs the one
   * that is stored in the repository.
   *
   * @function EditableRootObject#isSelfDirty
   * @returns {boolean} True when the business object itself has been changed, otherwise false.
   */
  isSelfDirty() {
    return _isDirty.get( this );
  }

  /**
   * Indicates whether the business object will be deleted from the repository,
   * i.e. its state is markedForRemoval.
   *
   * @function EditableRootObject#isDeleted
   * @returns {boolean} True when the business object will be deleted, otherwise false.
   */
  isDeleted() {
    return _state.get( this ) === MODEL_STATE.markedForRemoval;
  }

  /**
   * Indicates whether the business object can be saved to the repository,
   * i.e. it has ben changed and is valid, and the user has permission to save it.
   *
   * @function EditableRootObject#isSavable
   * @returns {boolean} True when the user can save the business object, otherwise false.
   */
  isSavable() {
    let auth;
    if (this.isDeleted)
      auth = canDo.call( this, AuthorizationAction.removeObject );
    else if (this.isNew)
      auth = canDo.call( this, AuthorizationAction.createObject );
    else
      auth = canDo.call( this, AuthorizationAction.updateObject );
    return auth && this.isDirty && this.isValid();
  }

  //endregion

  //region Transfer object methods

  /**
   * Transforms the business object to a plain object to send to the client.
   *
   * @function EditableRootObject#toCto
   * @returns {object} The client transfer object.
   */
  toCto() {
    let cto = {};

    // Export self properties.
    const extensions = _extensions.get( this );
    if (extensions.toCto)
      cto = extensions.toCto.call( this, getTransferContext.call( this, true ) );
    else
      cto = baseToCto.call( this );

    // Export children.
    const properties = _properties.get( this );
    properties.children().forEach( property => {
      const child = getPropertyValue.call( this, property );
      cto[ property.name ] = child.toCto();
    } );

    return cto;
  }

  /**
   * Rebuilds the business object from a plain object sent by the client.
   *
   * @function EditableRootObject#fromCto
   * @param {object} cto - The client transfer object.
   * @returns {Promise.<EditableRootObject>} Returns a promise to the editable root object rebuilt.
   */
  fromCto( cto ) {
    const self = this;
    return new Promise( ( fulfill, reject ) => {

      // Set self properties.
      const extensions = _extensions.get( self );
      extensions.fromCto ?
        extensions.fromCto.call( self, getTransferContext.call( self, true ), cto ) :
        baseFromCto.call( self, cto );

      // Build children.
      const properties = _properties.get( self );
      Promise.all( properties.children().map( property => {
        const child = getPropertyValue.call( self, property );
        return cto[ property.name ] ?
          child.fromCto( cto[ property.name ] ) :
          Promise.resolve( null );
      } ) )
        .then( values => {
          // Finished.
          fulfill( self );
        } );
    } );
  }

  //endregion

  //region Actions

  /**
   * Initializes a newly created business object.
   * <br/>_This method is called by a factory method with the same name._
   *
   * @function EditableRootObject#create
   * @protected
   * @returns {Promise.<EditableRootObject>} Returns a promise to the new editable root object.
   *
   * @throws {@link bo.system.ArgumentError Argument error}:
   *      The callback must be a function.
   * @throws {@link bo.rules.AuthorizationError Authorization error}:
   *      The user has no permission to execute the action.
   * @throws {@link bo.common.DataPortalError Data portal error}:
   *      Creating the business object has failed.
   */
  create() {
    return data_create.call( this );
  }

  /**
   * Initializes a business object to be retrieved from the repository.
   * <br/>_This method is called by a factory method with the same name._
   *
   * @function EditableRootObject#fetch
   * @protected
   * @param {*} [filter] - The filter criteria.
   * @param {string} [method] - An alternative fetch method of the data access object.
   * @returns {Promise.<EditableRootObject>} Returns a promise to the retrieved editable root object.
   *
   * @throws {@link bo.system.ArgumentError Argument error}:
   *      The method must be a string or null.
   * @throws {@link bo.system.ArgumentError Argument error}:
   *      The callback must be a function.
   * @throws {@link bo.rules.AuthorizationError Authorization error}:
   *      The user has no permission to execute the action.
   * @throws {@link bo.common.DataPortalError Data portal error}:
   *      Fetching the business object has failed.
   */
  fetch( filter, method ) {
    method = Argument.inMethod( this.$modelName, 'fetch' )
      .check( method ).forOptional( 'method' ).asString();
    return data_fetch.call( this, filter, method || M_FETCH );
  }

  /**
   * Saves the changes of the business object to the repository.
   *
   * @function EditableRootObject#save
   * @returns {Promise.<EditableRootObject>} Returns a promise to the saved editable root object.
   *
   * @throws {@link bo.system.ArgumentError Argument error}:
   *      The callback must be a function.
   * @throws {@link bo.rules.AuthorizationError Authorization error}:
   *      The user has no permission to execute the action.
   * @throws {@link bo.common.DataPortalError Data portal error}:
   *      Inserting the business object has failed.
   * @throws {@link bo.common.DataPortalError Data portal error}:
   *      Updating the business object has failed.
   * @throws {@link bo.common.DataPortalError Data portal error}:
   *      Deleting the business object has failed.
   */
  save() {
    const self = this;
    return new Promise( ( fulfill, reject ) => {
      if (self.isValid()) {
        const state = _state.get( self );
        /**
         * The event arises before the business object instance will be saved in the repository.
         * The event is followed by a preInsert, preUpdate or preRemove event depending on the
         * state of the business object instance.
         * @event EditableRootObject#preSave
         * @param {bo.common.DataPortalEventArgs} eventArgs - Data portal event arguments.
         * @param {EditableRootObject} oldObject - The instance of the model before the data portal action.
         */
        switch (state) {
          case MODEL_STATE.created:
            data_insert.call( self )
              .then( inserted => {
                fulfill( inserted );
              } );
            break;
          case MODEL_STATE.changed:
            data_update.call( self )
              .then( updated => {
                fulfill( updated );
              } );
            break;
          case MODEL_STATE.markedForRemoval:
            data_remove.call( self )
              .then( removed => {
                fulfill( removed );
              } );
            break;
          default:
            fulfill( self );
        }
        /**
         * The event arises after the business object instance has been saved in the repository.
         * The event is preceded by a postInsert, postUpdate or postRemove event depending on the
         * state of the business object instance.
         * @event EditableRootObject#postSave
         * @param {bo.common.DataPortalEventArgs} eventArgs - Data portal event arguments.
         * @param {EditableRootObject} newObject - The instance of the model after the data portal action.
         */
      }
    } );
  }

  /**
   * Marks the business object to be deleted from the repository on next save.
   *
   * @function EditableRootObject#remove
   */
  remove() {
    markForRemoval.call( this );
  }

  //endregion

  //region Validation

  /**
   * Indicates whether all the validation rules of the business object, including
   * the ones of its child objects, succeeds. A valid business object may have
   * broken rules with severity of success, information and warning.
   *
   * @function EditableRootObject#isValid
   * @returns {boolean} True when the business object is valid, otherwise false.
   */
  isValid() {
    if (!_isValidated.get( this ))
      this.checkRules();

    const brokenRules = _brokenRules.get( this );
    return brokenRules.isValid() && childrenAreValid.call( this );
  }

  /**
   * Executes all the validation rules of the business object, including the ones
   * of its child objects.
   *
   * @function EditableRootObject#checkRules
   */
  checkRules() {
    const brokenRules = _brokenRules.get( this );
    brokenRules.clear();
    _brokenRules.set( this, brokenRules );

    const context = new ValidationContext( _store.get( this ), brokenRules );
    const properties = _properties.get( this );
    const rules = _rules.get( this );
    properties.forEach( property => {
      rules.validate( property, context );
    } );
    checkChildRules.call( this );

    _isValidated.set( this, true );
  }

  /**
   * Gets the broken rules of the business object.
   *
   * @function EditableRootObject#getBrokenRules
   * @param {string} [namespace] - The namespace of the message keys when messages are localizable.
   * @returns {bo.rules.BrokenRulesOutput} The broken rules of the business object.
   */
  getBrokenRules( namespace ) {
    const brokenRules = _brokenRules.get( this );
    let bro = brokenRules.output( namespace );
    bro = getChildBrokenRules.call( this, namespace, bro );
    return bro.$length ? bro : null;
  }

  /**
   * Gets the response to send to the client in case of broken rules.
   *
   * @function EditableRootObject#getResponse
   * @param {string} [message] - Human-readable description of the reason of the failure.
   * @param {string} [namespace] - The namespace of the message keys when messages are localizable.
   * @returns {*|bo.rules.BrokenRulesResponse} The broken rules response to send to the client.
   */
  getResponse( message, namespace ) {
    const output = this.getBrokenRules( namespace );
    return output ? new config.brokenRulesResponse( output, message ) : null;
  }

  //endregion
}

/**
 * Factory method to create definitions of editable root objects.
 *
 * @name bo.EditableRootObject
 */
class EditableRootObjectFactory {

  //region Constructor

  /**
   * Creates a definition for an editable root object.
   *
   *    Valid child model types are:
   *
   *      * EditableChildCollection
   *      * EditableChildObject
   *
   * @param {string} name - The name of the model.
   * @param {bo.common.PropertyManager} properties - The property definitions.
   * @param {bo.common.RuleManager} rules - The validation and authorization rules.
   * @param {bo.common.ExtensionManager} extensions - The customization of the model.
   * @returns {EditableRootObject} The constructor of an asynchronous editable root object.
   *
   * @throws {@link bo.system.ArgumentError Argument error}: The model name must be a non-empty string.
   * @throws {@link bo.system.ArgumentError Argument error}: The properties must be a PropertyManager object.
   * @throws {@link bo.system.ArgumentError Argument error}: The rules must be a RuleManager object.
   * @throws {@link bo.system.ArgumentError Argument error}: The extensions must be a ExtensionManager object.
   *
   * @throws {@link bo.common.ModelError Model error}:
   *    The child objects must be EditableChildCollection or EditableChildObject instances.
   */
  constructor( name, properties, rules, extensions ) {
    const check = Argument.inConstructor( ModelType.EditableRootObject );

    name = check( name ).forMandatory( 'name' ).asString();
    properties = check( properties ).forMandatory( 'properties' ).asType( PropertyManager );
    rules = check( rules ).forMandatory( 'rules' ).asType( RuleManager );
    extensions = check( extensions ).forMandatory( 'extensions' ).asType( ExtensionManager );

    // Verify the model types of child objects.
    properties.modelName = name;
    properties.verifyChildTypes( [
      ModelType.EditableChildCollection,
      ModelType.EditableChildObject
    ] );

    // Create model definition.
    const Model = EditableRootObject.bind( undefined, name, properties, rules, extensions );

    //region Factory methods

    /**
     * The name of the model type.
     *
     * @member {string} EditableRootObject.modelType
     * @default EditableRootObject
     * @readonly
     */
    Model.modelType = ModelType.EditableRootObject;

    /**
     * Creates a new editable root object instance.
     *
     * @function EditableRootObject.create
     * @param {bo.common.EventHandlerList} [eventHandlers] - The event handlers of the instance.
     * @returns {Promise.<EditableRootObject>} Returns a promise to the new editable root object.
     *
     * @throws {@link bo.system.ArgumentError Argument error}:
     *      The event handlers must be an EventHandlerList object or null.
     * @throws {@link bo.system.ArgumentError Argument error}:
     *      The callback must be a function.
     * @throws {@link bo.rules.AuthorizationError Authorization error}:
     *      The user has no permission to execute the action.
     * @throws {@link bo.common.DataPortalError Data portal error}:
     *      Creating the root object has failed.
     */
    Model.create = function ( eventHandlers ) {
      const instance = new Model( eventHandlers );
      return instance.create();
    };

    /**
     * Retrieves an editable root object from the repository.
     *
     * @function EditableRootObject.fetch
     * @param {*} [filter] - The filter criteria.
     * @param {string} [method] - An alternative fetch method of the data access object.
     * @param {bo.common.EventHandlerList} [eventHandlers] - The event handlers of the instance.
     * @returns {Promise.<EditableRootObject>} Returns a promise to the retrieved editable root object.
     *
     * @throws {@link bo.system.ArgumentError Argument error}:
     *      The method must be a string or null.
     * @throws {@link bo.system.ArgumentError Argument error}:
     *      The event handlers must be an EventHandlerList object or null.
     * @throws {@link bo.system.ArgumentError Argument error}:
     *      The callback must be a function.
     * @throws {@link bo.rules.AuthorizationError Authorization error}:
     *      The user has no permission to execute the action.
     * @throws {@link bo.common.DataPortalError Data portal error}:
     *      Fetching the business object has failed.
     */
    Model.fetch = function ( filter, method, eventHandlers ) {
      const instance = new Model( eventHandlers );
      return instance.fetch( filter, method );
    };

    //endregion

    // Immutable definition class.
    Object.freeze( Model );
    return Model;
  }

  //endregion
}
// Immutable factory class.
Object.freeze( EditableRootObjectFactory );

module.exports = EditableRootObjectFactory;
