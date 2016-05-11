'use strict';

var Enumeration = require( '../system/enumeration.js' );

/**
 * Specifies the events of models' data portal operations. Members:
 *
 *    * preFetch, postFetch
 *    * preCreate, postCreate
 *    * preInsert, postInsert
 *    * preUpdate, postUpdate
 *    * preRemove, postRemove
 *    * preExecute, postExecute
 *    * preSave, postSave
 *
 * @memberof bo.shared
 * @extends bo.system.Enumeration
 */
class DataPortalEvent extends Enumeration {

  /**
   * Creates a new enumeration to define the data portal events.
   */
  constructor() {
    super();

    /**
     * The event before a data portal fetch operation.
     * @constant {number} bo.shared.DataPortalEvent#preFetch
     * @default 0
     */
    this.preFetch = 0;
    /**
     * The event after a data portal fetch operation.
     * @constant {number} bo.shared.DataPortalEvent#postFetch
     * @default 1
     */
    this.postFetch = 1;
    /**
     * The event before a data portal create operation.
     * @constant {number} bo.shared.DataPortalEvent#preCreate
     * @default 2
     */
    this.preCreate = 2;
    /**
     * The event after a data portal create operation.
     * @constant {number} bo.shared.DataPortalEvent#postCreate
     * @default 3
     */
    this.postCreate = 3;
    /**
     * The event before a data portal insert operation.
     * @constant {number} bo.shared.DataPortalEvent#preInsert
     * @default 4
     */
    this.preInsert = 4;
    /**
     * The event after a data portal insert operation.
     * @constant {number} bo.shared.DataPortalEvent#postInsert
     * @default 5
     */
    this.postInsert = 5;
    /**
     * The event before a data portal update operation.
     * @constant {number} bo.shared.DataPortalEvent#preUpdate
     * @default 6
     */
    this.preUpdate = 6;
    /**
     * The event after a data portal update operation.
     * @constant {number} bo.shared.DataPortalEvent#postUpdate
     * @default 7
     */
    this.postUpdate = 7;
    /**
     * The event before a data portal remove operation.
     * @constant {number} bo.shared.DataPortalEvent#preRemove
     * @default 8
     */
    this.preRemove = 8;
    /**
     * The event after a data portal remove operation.
     * @constant {number} bo.shared.DataPortalEvent#postRemove
     * @default 9
     */
    this.postRemove = 9;
    /**
     * The event before a data portal execute operation.
     * @constant {number} bo.shared.DataPortalEvent#preExecute
     * @default 10
     */
    this.preExecute = 10;
    /**
     * The event after a data portal execute operation.
     * @constant {number} bo.shared.DataPortalEvent#postExecute
     * @default 11
     */
    this.postExecute = 11;
    /**
     * The event before a data portal save operation.
     * @constant {number} bo.shared.DataPortalEvent#preSave
     * @default 12
     */
    this.preSave = 12;
    /**
     * The event after a data portal save operation.
     * @constant {number} bo.shared.DataPortalEvent#postSave
     * @default 13
     */
    this.postSave = 13;

    // Immutable object.
    Object.freeze( this );
  }
}

module.exports = new DataPortalEvent();
