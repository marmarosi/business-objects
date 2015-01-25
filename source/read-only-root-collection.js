'use strict';

var util = require('util');
var CollectionBase = require('./collection-base.js');
var config = require('./shared/configuration-reader.js');
var EnsureArgument = require('./shared/ensure-argument.js');
var ModelError = require('./shared/model-error.js');

var ExtensionManager = require('./shared/extension-manager.js');
var DataContext = require('./shared/data-context.js');
var RuleManager = require('./rules/rule-manager.js');
var BrokenRuleList = require('./rules/broken-rule-list.js');
var Action = require('./rules/authorization-action.js');
var AuthorizationContext = require('./rules/authorization-context.js');
var DataPortalError = require('./shared/data-portal-error.js');

var MODEL_DESC = 'Read-only root collection';

/**
 * Factory method to create definitions of asynchronous read-only root collections.
 *
 * @function bo.ReadOnlyRootCollection
 * @param {string} name - The name of the collection.
 * @param {ReadOnlyChildModel} itemType - The model type of the collection items.
 * @param {bo.shared.RuleManager} rules - The validation and authorization rules.
 * @param {bo.shared.ExtensionManager} extensions - The customization of the collection.
 * @returns {ReadOnlyRootCollection} The constructor of an asynchronous read-only root collection.
 *
 * @throws {@link bo.shared.ArgumentError Argument error}: The collection name must be a non-empty string.
 * @throws {@link bo.shared.ArgumentError Argument error}: The rules must be a RuleManager object.
 * @throws {@link bo.shared.ArgumentError Argument error}: The extensions must be a ExtensionManager object.
 * @throws {@link bo.shared.ModelError Model error}: The item type must be an ReadOnlyChildModel.
 */
var ReadOnlyRootCollectionFactory = function(name, itemType, rules, extensions) {

  name = EnsureArgument.isMandatoryString(name,
      'c_manString', 'ReadOnlyRootCollection', 'name');
  rules = EnsureArgument.isMandatoryType(rules, RuleManager,
      'c_manType', 'ReadOnlyRootCollection', 'rules');
  extensions = EnsureArgument.isMandatoryType(extensions, ExtensionManager,
      'c_manType', 'ReadOnlyRootCollection', 'extensions');

  // Verify the model type of the item type.
  if (itemType.modelType !== 'ReadOnlyChildModel')
    throw new ModelError('invalidItem', itemType.prototype.name, itemType.modelType,
        'ReadOnlyRootCollection', 'ReadOnlyChildModel');

  /**
   * @classdesc Represents the definition of an asynchronous read-only root collection.
   * @description Creates a new asynchronous read-only root collection instance.
   *
   * @name ReadOnlyRootCollection
   * @constructor
   *
   * @extends ModelBase
   */
  var ReadOnlyRootCollection = function () {

    var self = this;
    var items = [];
    var brokenRules = new BrokenRuleList(name);
    var dao = null;
    var user = null;
    var dataContext = null;

    this.name = name;

    // Get data access object.
    if (extensions.daoBuilder)
      dao = extensions.daoBuilder(extensions.dataSource, extensions.modelPath);
    else
      dao = config.daoBuilder(extensions.dataSource, extensions.modelPath);

    // Get principal.
    user = config.getUser();

    Object.defineProperty(self, 'count', {
      get: function () {
        return items.length;
      },
      enumerable: false
    });

    //region Transfer object methods

    this.toCto = function () {
      var cto = [];
      items.forEach(function (item) {
        cto.push(item.toCto());
      });
      return cto;
    };

    //endregion

    //region Permissions

    function getAuthorizationContext(action, targetName) {
      return new AuthorizationContext(action, targetName || '', user, brokenRules);
    }

    function canDo (action) {
      return rules.hasPermission(
        getAuthorizationContext(action)
      );
    }

    function canExecute (methodName) {
      return rules.hasPermission(
        getAuthorizationContext(Action.executeMethod, methodName)
      );
    }

    //endregion

    //region Data portal methods

    function getDataContext(connection) {
      if (!dataContext)
        dataContext = new DataContext(dao, user);
      return dataContext.setState(connection, false);
    }

    function wrapError (err) {
      return new DataPortalError(MODEL_DESC, properties.name, 'fetch', err);
    }

    function runStatements (main, callback) {
      // Open connection.
      config.connectionManager.openConnection(
          extensions.dataSource, function (errOpen, connection) {
            if (errOpen)
              callback(wrapError(errOpen));
            else
              main(connection, function (err, result) {
                // Close connection.
                config.connectionManager.closeConnection(
                    extensions.dataSource, connection, function (errClose, connClosed) {
                      connection = connClosed;
                      if (err)
                        callback(wrapError(err));
                      else if (errClose)
                        callback(wrapError(errClose));
                      else
                        callback(null, result);
                    });
              });
          });
    }

    function data_fetch (filter, method, callback) {
      // Helper function for post-fetch actions.
      function finish (data, cb) {
        // Load children.
        if (data instanceof Array && data.length) {
          data.forEach(function (dto) {
            var count = 0;
            var error = null;
            itemType.load(self, dto, function (err, item) {
              if (err)
                error = error || err;
              else
                items.push(item);
              // Check if all items are done.
              if (++count === data.length) {
                cb(error, self);
              }
            });
          });
        } else
          cb(null, self);
      }
      // Main activity.
      function main (connection, cb) {
        // Execute fetch.
        if (extensions.dataFetch) {
          // *** Custom fetch.
          extensions.dataFetch.call(self, getDataContext(connection), filter, method, function (err, dto) {
            if (err)
              cb(err);
            else
              finish(dto, cb);
          });
        } else {
          // *** Standard fetch.
          // Root element fetches data from repository.
          dao.$runMethod(method, connection, filter, function (err, dto) {
            if (err)
              cb(err);
            else
              finish(dto, cb);
          });
        }
      }
      // Check permissions.
      if (method === 'fetch' ? canDo(Action.fetchObject) : canExecute(method))
        runStatements(main, callback);
      else
        callback(null, self);
    }

    //endregion

    //region Actions

    this.fetch = function(filter, method, callback) {
      data_fetch(filter, method || 'fetch', callback);
    };

    //endregion

    //region Validation

    this.getBrokenRules = function(namespace) {
      return brokenRules.output(namespace);
    };

    //endregion

    //region Public array methods

    this.at = function (index) {
      return items[index];
    };

    this.forEach = function (callback) {
      items.forEach(callback);
    };

    this.every = function (callback) {
      return items.every(callback);
    };

    this.some = function (callback) {
      return items.some(callback);
    };

    this.filter = function (callback) {
      return items.filter(callback);
    };

    this.map = function (callback) {
      return items.map(callback);
    };

    this.sort = function (fnCompare) {
      return items.sort(fnCompare);
    };

    //endregion

    // Immutable object.
    Object.freeze(this);
  };
  util.inherits(ReadOnlyRootCollection, CollectionBase);

  //region Factory methods

  ReadOnlyRootCollection.fetch = function(filter, method, callback) {
    if (!callback) {
      callback = method;
      method = undefined;
    }
    var instance = new ReadOnlyRootCollection();
    instance.fetch(filter, method, function (err) {
      if (err)
        callback(err);
      else
        callback(null, instance);
    });
  };

  //endregion

  ReadOnlyRootCollection.modelType = 'ReadOnlyRootCollection';

  return ReadOnlyRootCollection;
};

module.exports = ReadOnlyRootCollectionFactory;
