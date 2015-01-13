/**
 * Configuration module.
 * @module shared/config-reader
 */
'use strict';

var fs = require('fs');
var path = require('path');
var daoBuilder = require('../data-access/dao-builder.js');
var NoAccessBehavior = require('../rules/no-access-behavior.js');
var configHelper = require('./config-helper.js');
var ConfigurationError = require('./configuration-error.js');
var UserInfo = require('./user-info.js');

// Define the possible configuration files.
var options = [
  '/business-objects-config.js',
  '/business-objects-config.json',
  '/config/business-objects.js',
  '/config/business-objects.json'
];
var cwd = process.cwd();
var config = {};
var cfg;

// Read first configuration file found.
for (var i = 0; i < options.length; i++) {
  var cfgPath = path.join(cwd, options[i]);
  if (fs.existsSync(cfgPath)) {
    cfg = require(cfgPath);
    break;
  }
}

// Test if configuration file was found.
if (cfg) {

  // Evaluate the data access object builder.
  if (cfg.daoBuilder) {
    config.daoBuilder = configHelper.getFunction(cfg.daoBuilder, 'daoBuilder', ConfigurationError);
  } else {
    config.daoBuilder = daoBuilder;
  }

  // Evaluate the user information reader.
  if (cfg.userReader) {
    config.userReader = configHelper.getFunction(cfg.userReader, 'userReader', ConfigurationError);
  }
  config.getUser = function () {
    var user = null;
    if (config.userReader) {
      user = config.userReader();
      if (user === undefined)
        user = null;
      else if (user !== null && !(user instanceof UserInfo) && user.super_ !== UserInfo)
        throw new ConfigurationError('userInfo');
    }
    return user;
  };

  // Evaluate the unauthorized behavior.
  if (cfg.noAccessBehavior !== undefined && cfg.noAccessBehavior !== null) {
    config.noAccessBehavior = configHelper.isEnumMember(
        cfg.noAccessBehavior, NoAccessBehavior, 'noAccessBehavior', ConfigurationError
    );
  }

  // Evaluate the path of locale.
  if (cfg.pathOfLocales) {
    config.pathOfLocales = configHelper.getDirectory(cfg.pathOfLocales, 'pathOfLocales', ConfigurationError);
  }

  // Evaluate the locale reader.
  if (cfg.localeReader) {
    config.localeReader = configHelper.getFunction(cfg.localeReader, 'localeReader', ConfigurationError);
  }
}

Object.freeze(config);

module.exports = config;
