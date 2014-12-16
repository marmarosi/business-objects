'use strict';

var fs = require('fs');
var path = require('path');
var daoBuilder = require('../data-access/dao-builder.js');
var NoAccessBehavior = require('../rules/no-access-behavior.js');

var options = [
  '/business-objects-config.js',
  '/business-objects-config.json',
  '/config/business-objects.js',
  '/config/business-objects.json'
];
var cwd = process.cwd();
var config = {};
var cfg;

for (var i = 0; i < options.length; i++) {
  var cfgPath = path.join(cwd, options[i]);
  if (fs.existsSync(cfgPath)) {
    cfg = require(cfgPath);
    break;
  }
}

if (cfg) {
  if (cfg.daoBuilder) {

    if (typeof cfg.daoBuilder !== 'string')
      throw new Error('The value of daoBuilder property of BusinessObjects configuration must be a string.');

    var daoBuilderPath = path.join(cwd, cfg.daoBuilder);
    if (!fs.existsSync(daoBuilderPath))
      throw new Error('The value of daoBuilder property of BusinessObjects configuration is not a valid file path: ' + daoBuilderPath);

    var daoBuilderFunction = require(daoBuilderPath);
    if (typeof daoBuilderFunction !== 'function')
      throw new Error('The file defined by the daoBuilder property of BusinessObjects configuration must return a function: ' + daoBuilderPath);

    config.daoBuilder = daoBuilderFunction;
  } else {
    config.daoBuilder = daoBuilder;
  }

  if (cfg.userReader) {

    if (typeof cfg.userReader !== 'string')
      throw new Error('The value of userReader property of BusinessObjects configuration must be a string.');

    var userReaderPath = path.join(cwd, cfg.userReader);
    if (!fs.existsSync(userReaderPath))
      throw new Error('The value of userReader property of BusinessObjects configuration is not a valid file path: ' + userReaderPath);

    var userReaderFunction = require(userReaderPath);
    if (typeof daoBuilderFunction !== 'function')
      throw new Error('The file defined by the userReader property of BusinessObjects configuration must return a function: ' + userReaderPath);

    config.userReader = userReaderFunction;
  }

  if (cfg.noAccessBehavior !== undefined && cfg.noAccessBehavior !== null) {
    NoAccessBehavior.check(cfg.noAccessBehavior,
      'The value of noAccessBehavior property of BusinessObjects configuration must be a NoAccessBehavior item.');
    config.noAccessBehavior = cfg.noAccessBehavior;
  }
}

Object.freeze(config);

module.exports = config;