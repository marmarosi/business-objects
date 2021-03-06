'use strict';

const bo = require( '../../source/index.js' );

const BlanketOrderItemView = require( './blanket-order-item-view.js' );

const BlanketOrderItemsView = new bo.ReadOnlyChildCollection(
  'BlanketOrderItemsView',
  BlanketOrderItemView
);

module.exports = BlanketOrderItemsView;
