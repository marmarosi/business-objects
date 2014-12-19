'use strict';

var bo = require('../../source/index.js');

var Properties = bo.shared.PropertyManager;
var Rules = bo.rules.RuleManager;
var Extensions = bo.shared.ExtensionManager;
var Property = bo.shared.PropertyInfo;
var F = bo.shared.PropertyFlag;
var dt = bo.dataTypes;
var cr = bo.commonRules;

var BlanketOrderScheduleList = require('./blanket-order-schedule-list.js');

var orderItemKey = new Property('orderItemKey', dt.Integer, F.key | F.readOnly);
var orderKey = new Property('orderKey', dt.Integer, F.parentKey | F.readOnly);
var productName = new Property('productName', dt.Text);
var obsolete = new Property('obsolete', dt.Boolean);
var expiry = new Property('expiry', dt.DateTime);
var quantity = new Property('quantity', dt.Integer);
var unitPrice = new Property('unitPrice', dt.Decimal);
var schedules = new Property('schedules', BlanketOrderScheduleList);

var properties = new Properties(
    'BlanketOrderItem',
    orderItemKey,
    orderKey,
    productName,
    obsolete,
    expiry,
    quantity,
    unitPrice,
    schedules
);

var rules = new Rules(
    new cr.required(productName),
    new cr.required(obsolete),
    new cr.required(expiry),
    new cr.required(quantity),
    new cr.required(unitPrice)
);

var extensions = new Extensions('dao', __filename);

var BlanketOrderItem = bo.EditableModel(properties, rules, extensions);

module.exports = BlanketOrderItem;
