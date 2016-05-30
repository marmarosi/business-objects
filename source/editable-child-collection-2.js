'use strict';

//region Imports

var util = require('util');
var Argument = require('./system/argument-check.js');

var CollectionBase = require('./collection-base-2.js');
const ModelType = require( './model-type.js' );
var ModelError = require('./shared/model-error.js');

var MODEL_STATE = require('./shared/model-state.js');
var CLASS_NAME = 'EditableChildCollection';

//endregion

//region Private variables

const _itemType = new WeakMap();
const _parent = new WeakMap();
const _eventHandlers = new WeakMap();
const _items = new WeakMap();

//endregion

/**
 * Represents the definition of an asynchronous editable child collection.
 *
 * _The name of the model type available as:
 * __&lt;instance&gt;.constructor.modelType__, returns 'EditableChildCollection'._
 *
 * @name EditableChildCollection
 * @extends CollectionBase
 */
class EditableChildCollection extends CollectionBase {

  //region Constructor

  /**
   * Creates a new asynchronous editable child collection instance.
   *
   * Valid parent model types are:
   *
   *   * EditableRootObject
   *   * EditableChildObject
   *
   * @param {object} parent - The parent business object.
   * @param {bo.shared.EventHandlerList} [eventHandlers] - The event handlers of the instance.
   *
   * @throws {@link bo.system.ArgumentError Argument error}:
   *    The parent object must be an EditableRootObject or EditableChildObject instance.
   */
  constructor(name, itemType, parent, eventHandlers) {
    super();

    // Verify the model type of the parent model.
    parent = Argument.inConstructor(name)
      .check(parent).for('parent').asModelType([
        ModelType.EditableRootObject,
        ModelType.EditableChildObject
    ]);

    // Resolve tree reference.
    if (typeof itemType === 'string') {
      if (itemType === parent.$modelName)
        itemType = parent.constructor;
      else
        throw new ModelError('invalidTree', itemType, parent.$modelName);
    }

    _itemType.set( this, itemType );
    _parent.set( this, parent );
    _eventHandlers.set( this, eventHandlers );
    _items.set( this, [] );

    /**
     * The name of the model.
     *
     * @name EditableChildCollection#$modelName
     * @type {string}
     * @readonly
     */
    this.$modelName = name;

    // Immutable definition object.
    Object.freeze(this);
  }

  //endregion

  //region Properties

  /**
   * The count of the child objects in the collection.
   *
   * @name EditableChildCollection#count
   * @type {number}
   * @readonly
   */
  get count() {
    const items = _items.get( this );
    return items.length;
  }

  /**
   * The name of the model type.
   *
   * @property {string} EditableChildCollection.modelType
   * @default EditableChildCollection
   * @readonly
   */
  static get modelType() {
    return ModelType.EditableChildCollection;
  }

  //endregion

  //region Transfer object methods

  /**
   * Transforms the business object collection to a plain object array to send to the client.
   * <br/>_This method is usually called by the parent object._
   *
   * @function EditableChildCollection#toCto
   * @returns {Array.<object>} The client transfer object.
   */
  toCto() {
    var cto = [];
    this.forEach( item => {
      cto.push(item.toCto());
    });
    return cto;
  }

  /**
   * Rebuilds the business object collection from a plain object array sent by the client.
   * <br/>_This method is usually called by the parent object._
   *
   * @function EditableChildCollection#fromCto
   * @param {Array.<object>} cto - The array of client transfer objects.
   * @returns {Promise.<EditableChildCollection>} Returns a promise to the child collection rebuilt.
   */
  fromCto( cto ) {
    const self = this;
    return new Promise( (fulfill, reject) => {
      if (cto instanceof Array) {
        const items = _items.get(self);
        var ctoNew = cto.filter( d => { return true; }); // Deep copy.
        var itemsLive = [];
        var itemsLate = [];
        var index;

        // Discover changed items.
        for (index = 0; index < items.length; index++) {
          var dataFound = false;
          var i = 0;
          for (; i < ctoNew.length; i++) {
            if (items[ index ].keyEquals( cto[i] )) {
              itemsLive.push( { item: index, cto: i } );
              dataFound = true;
              break;
            }
          }
          dataFound ?
            ctoNew.splice(i, 1) :
            itemsLate.push(index);
        }
        // Update existing items.
        Promise.all( itemsLive.map( live => {
          return items[ live.item ].fromCto( cto[ live.cto ] );
        }))
          .then( values => {
            // Remove non existing items.
            for (index = 0; index < itemsLate.length; index++) {
              items[ itemsLate[ index ]].remove();
            }
            // Insert non existing items.
            const itemType = _itemType.get(self);
            const parent = _parent.get(self);
            const eventHandlers = _eventHandlers.get(self);
            Promise.all( ctoNew.map( cto => {
              return itemType.create( parent, eventHandlers )
            }))
              .then( newItems => {
                items.push.apply( items, newItems );
                Promise.all( newItems.map( (newItem, j) => {
                  return newItem.fromCto( ctoNew[j] );
                }))
                  .then( values => {
                    _items.set(self, items);
                    // Finished.
                    fulfill( self );
                  })
              });
          });
      } else
      // Nothing to do.
        fulfill( self );
    });
  }

  //endregion

  //region Actions

  /**
   * Creates a new item and adds it to the collection at the specified index.
   *
   * @function EditableChildCollection#create
   * @param {number} index - The index of the new item.
   * @returns {Promise.<EditableChildObject>} Returns a promise to the editable child object created.
   */
  createItem( index ) {
    const items = _items.get(this);
    const itemType = _itemType.get(this);
    const parent = _parent.get(this);
    const eventHandlers = _eventHandlers.get(this);

    return itemType.create( parent, eventHandlers )
      .then( item => {
        var ix = parseInt( index || items.length, 10 );
        ix = isNaN( ix ) ? items.length : ix;
        items.splice( ix, 0, item );
        _items.set(this, items);
        return item;
      });
  }

  /**
   * Initializes the items in the collection with data retrieved from the repository.
   * <br/>_This method is called by the parent object._
   *
   * @function EditableChildCollection#fetch
   * @protected
   * @param {Array.<object>} [data] - The data to load into the business object collection.
   * @returns {Promise.<EditableChildCollection>} Returns a promise to the retrieved editable child collection.
   */
  fetch( data ) {
    const self = this;
    const items = _items.get(this);
    const itemType = _itemType.get(this);
    const parent = _parent.get(this);
    const eventHandlers = _eventHandlers.get(this);

    return data instanceof Array && data.length ?
      Promise.all( data.map( dto => {
        return itemType.load( parent, dto, eventHandlers )
      }))
        .then( list => {
          // Add loaded items to the collection.
          list.forEach( item => {
            items.push( item );
          });
          _items.set(self, items);
          // Nothing to return.
          return null;
        }) :
      Promise.resolve( null );
  }

  /**
   * Saves the changes of the business object collection to the repository.
   * <br/>_This method is called by the parent object._
   *
   * @function EditableChildCollection#save
   * @protected
   * @param {object} connection - The connection data.
   * @returns {Promise.<EditableChildCollection>} Returns a promise to the saved editable child collection.
   */
  save( connection ) {
    const self = this;
    let items = _items.get(this);

    return Promise.all( items.filter( item => {
      return item.isDirty();
    }).map( item => {
      return item.save( connection );
    }))
      .then( values => {
        // Store updated items.
        items = items.filter( item => {
          return item.getModelState() !== MODEL_STATE.getName( MODEL_STATE.removed );
        });
        _items.set(self, items);
      });
  }

  /**
   * Marks all items in the collection to be deleted from the repository on next save.
   *
   * @function EditableChildCollection#remove
   */
  remove() {
    this.forEach(function (item) {
      item.remove();
    });
  }

  /**
   * Indicates whether all items of the business collection are valid.
   * <br/>_This method is called by the parent object._
   *
   * @function EditableChildCollection#isValid
   * @protected
   * @returns {boolean}
   */
  isValid() {
    let items = _items.get(this);
    return items.every(function (item) {
      return item.isValid();
    });
  }

  /**
   * Executes validation on all items of the collection.
   * <br/>_This method is called by the parent object._
   *
   * @function EditableChildCollection#checkRules
   * @protected
   */
  checkRules() {
    this.forEach(function (item) {
      item.checkRules();
    });
  }

  /**
   * Gets the broken rules of all items of the collection.
   * <br/>_This method is called by the parent object._
   *
   * @function EditableChildCollection#getBrokenRules
   * @protected
   * @param {string} [namespace] - The namespace of the message keys when messages are localizable.
   * @returns {Array.<bo.rules.BrokenRulesOutput>} The broken rules of the collection.
   */
  getBrokenRules(namespace) {
    var bro = [];
    this.forEach(function (item) {
      var childBrokenRules = item.getBrokenRules(namespace);
      if (childBrokenRules)
        bro.push(childBrokenRules);
    });
    return bro.length ? bro : null;
  }

  //endregion

  //region Public array methods

  /**
   * Gets a collection item at a specific position.
   *
   * @function EditableChildCollection#at
   * @param {number} index - The index of the required item in the collection.
   * @returns {EditableChildObject} The required collection item.
   */
  at(index) {
    const items = _items.get(this);
    return items[index];
  }

  /**
   * Executes a provided function once per collection item.
   *
   * @function EditableChildCollection#forEach
   * @param {external.cbCollectionItem} callback - Function that produces an item of the new collection.
   */
  forEach(callback) {
    const items = _items.get(this);
    items.forEach(callback);
  }

  /**
   * Tests whether all items in the collection pass the test implemented by the provided function.
   *
   * @function EditableChildCollection#every
   * @param {external.cbCollectionItem} callback - Function to test for each collection item.
   * @returns {boolean} True when callback returns truthy value for each item, otherwise false.
   */
  every(callback) {
    const items = _items.get(this);
    return items.every(callback);
  }

  /**
   * Tests whether some item in the collection pass the test implemented by the provided function.
   *
   * @function EditableChildCollection#some
   * @param {external.cbCollectionItem} callback - Function to test for each collection item.
   * @returns {boolean} True when callback returns truthy value for some item, otherwise false.
   */
  some(callback) {
    const items = _items.get(this);
    return items.some(callback);
  }

  /**
   * Creates a new array with all collection items that pass the test
   * implemented by the provided function.
   *
   * @function EditableChildCollection#filter
   * @param {external.cbCollectionItem} callback - Function to test for each collection item.
   * @returns {Array.<EditableChildObject>} The new array of collection items.
   */
  filter(callback) {
    const items = _items.get(this);
    return items.filter(callback);
  }

  /**
   * Creates a new array with the results of calling a provided function
   * on every item in this collection.
   *
   * @function EditableChildCollection#map
   * @param {external.cbCollectionItem} callback - Function to test for each collection item.
   * @returns {Array.<*>} The new array of callback results.
   */
  map(callback) {
    const items = _items.get(this);
    return items.map(callback);
  }

  /**
   * Sorts the items of the collection in place and returns the collection.
   *
   * @function EditableChildCollection#sort
   * @param {external.cbCompare} [fnCompare] - Function that defines the sort order.
   *      If omitted, the collection is sorted according to each character's Unicode
   *      code point value, according to the string conversion of each item.
   * @returns {EditableChildCollection} The sorted collection.
   */
  sort(fnCompare) {
    const items = _items.get( this );
    const sorted = items.sort( fnCompare );
    _items.set( this, sorted );
    return sorted;
  }

  //endregion
}

/**
 * Factory method to create definitions of asynchronous editable child collections.
 *
 * @name bo.EditableChildCollection
 */
class EditableChildCollectionFactory {

  //region Constructor

  /**
   * Creates a definition for an editable child collection.
   *
   *    Valid collection item types are:
   *
   *      * EditableChildObject
   *
   * @param {string} name - The name of the collection.
   * @param {EditableChildObject} itemType - The model type of the collection items.
   * @returns {EditableChildCollection} The constructor of an asynchronous editable child collection.
   *
   * @throws {@link bo.system.ArgumentError Argument error}: The collection name must be a non-empty string.
   * @throws {@link bo.shared.ModelError Model error}: The item type must be an EditableChildObject.
   */
  constructor(name, itemType) {

    name = Argument.inConstructor(ModelType.EditableChildCollection)
      .check(name).forMandatory('name').asString();

    // Verify the model type of the items - when not a tree model.
    if (
      typeof itemType !== 'string' &&
      itemType.modelType !== ModelType.EditableChildObject
    )
      throw new ModelError( 'invalidItem',
        itemType.prototype.name, itemType.modelType,
        ModelType.EditableChildCollection, ModelType.EditableChildObject );

    // Create model definition.
    const Model = EditableChildCollection.bind( undefined, name, itemType );

    //region Factory methods

    /**
     * The name of the model type.
     *
     * @member {string} EditableChildCollection.modelType
     * @readonly
     */
    Model.modelType = ModelType.EditableChildCollection;

    //endregion

    // Immutable definition class.
    Object.freeze( Model );
    return Model;
  }

  //endregion
}
// Immutable factory class.
Object.freeze( EditableChildCollectionFactory );

module.exports = EditableChildCollectionFactory;