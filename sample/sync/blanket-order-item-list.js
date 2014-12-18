'use strict';

var bo = require('../../source/index.js');

var BlanketOrderItem = require('./blanket-order-item.js');

var BlanketOrderItemList = bo.EditableCollectionSync(
    'BlanketOrderItemList',
    BlanketOrderItem
);

module.exports = BlanketOrderItemList;
