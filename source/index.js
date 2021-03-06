'use strict';

//region Imports

const ModelComposer = require( './model-composer.js' );

const EditableRootObject = require( './editable-root-object.js' );
const EditableChildObject = require( './editable-child-object.js' );
const EditableRootCollection = require( './editable-root-collection.js' );
const EditableChildCollection = require( './editable-child-collection.js' );
const ReadOnlyRootObject = require( './read-only-root-object.js' );
const ReadOnlyChildObject = require( './read-only-child-object.js' );
const ReadOnlyRootCollection = require( './read-only-root-collection.js' );
const ReadOnlyChildCollection = require( './read-only-child-collection.js' );
const CommandObject = require( './command-object.js' );

const commonRules = require( './common-rules/index.js' );
const dataAccess = require( './data-access/index.js' );
const dataTypes = require( './data-types/index.js' );
const rules = require( './rules/index.js' );
const common = require( './common/index.js' );
const system = require( './system/index.js' );

const configuration = require( './system/configuration-reader.js' );
const i18n = require( './locales/i18n.js' );

//endregion

/**
 * List of models and helper namespaces.
 *
 * @namespace bo
 *
 * @property {namespace} commonRules - {@link bo.commonRules Common rules namespace}
 *      contains frequently used rules.
 * @property {namespace} dataAccess - {@link bo.dataAccess Data access namespace}
 *      contains data access components.
 * @property {namespace} dataTypes - {@link bo.dataTypes Data types namespace}
 *      contains data type components and definitions.
 * @property {namespace} rules - {@link bo.rules Rules namespace}
 *      contains components of validation and authorization rules.
 * @property {namespace} common - {@link bo.common Common namespace}
 *      contains components used by models, collections and other components.
 * @property {namespace} system - {@link bo.system System namespace}
 *      contains general components.
 *
 * @property {object} configuration - Object containing
 *      {@link bo.common~configuration configuration} data of the business objects.
 * @property {function} i18n - {@link bo.i18n Internationalization}
 *      constructor to create new a message localizer object.
 */
const index = {
  ModelComposer: ModelComposer,

  //ModelBase: ModelBase,
  //CollectionBase: CollectionBase,

  EditableRootObject: EditableRootObject,
  EditableChildObject: EditableChildObject,
  EditableRootCollection: EditableRootCollection,
  EditableChildCollection: EditableChildCollection,
  ReadOnlyRootObject: ReadOnlyRootObject,
  ReadOnlyChildObject: ReadOnlyChildObject,
  ReadOnlyRootCollection: ReadOnlyRootCollection,
  ReadOnlyChildCollection: ReadOnlyChildCollection,
  CommandObject: CommandObject,

  commonRules: commonRules,
  dataAccess: dataAccess,
  dataTypes: dataTypes,
  rules: rules,
  common: common,
  system: system,

  configuration: configuration,
  i18n: i18n,

  /**
   * Initializes the business objects.
   *
   * @function bo.initialize
   * @param {string} cfgPath -
   *    The relative path of the {@link external.configurationFile configuration file} (.js or .json).
   *    E.g. /config/business-objects.json
   */
  initialize: function ( cfgPath ) {
    this.configuration.initialize( cfgPath );
    this.i18n.initialize( this.configuration.pathOfLocales, this.configuration.getLocale );
  }
};

// Immutable object.
Object.freeze( index );

module.exports = index;
