'use strict';

const bo = require( '../../../source/index.js' );
const daoBuilder = require( '../dao-builder.js' );
const Model = bo.ModelComposer;
const F = bo.common.PropertyFlag;
const cr = bo.commonRules;

const AddressView = require( './address-view.js' );
const BlanketOrderItemsView = require( './blanket-order-items-view.js' );

//region Transfer object methods

function fromDto( ctx, dto ) {
  ctx.setValue( 'orderKey', dto.orderKey );
  ctx.setValue( 'vendorName', dto.vendorName );
  ctx.setValue( 'contractDate', dto.contractDate );
  ctx.setValue( 'totalPrice', dto.totalPrice );
  ctx.setValue( 'schedules', dto.schedules );
  ctx.setValue( 'enabled', dto.enabled );
  ctx.setValue( 'createdDate', dto.createdDate );
  ctx.setValue( 'modifiedDate', dto.modifiedDate );
}

function toCto( ctx ) {
  return {
    orderKey: this.orderKey,
    vendorName: this.vendorName,
    contractDate: this.contractDate,
    totalPrice: this.totalPrice,
    schedules: this.schedules,
    enabled: this.enabled,
    createdDate: this.createdDate,
    modifiedDate: this.modifiedDate
  };
}

//endregion

//region Data portal methods

function dataFetch( ctx, filter, method ) {
  function finish( dto ) {
    ctx.setValue( 'orderKey', dto.orderKey );
    ctx.setValue( 'vendorName', dto.vendorName );
    ctx.setValue( 'contractDate', dto.contractDate );
    ctx.setValue( 'totalPrice', dto.totalPrice );
    ctx.setValue( 'schedules', dto.schedules );
    ctx.setValue( 'enabled', dto.enabled );
    ctx.setValue( 'createdDate', dto.createdDate );
    ctx.setValue( 'modifiedDate', dto.modifiedDate );
    ctx.fulfill( dto );
  }

  if (method === 'fetchByName') {
    // filter: vendorName
    ctx.call( 'fetchByName', filter ).then( finish );
  } else {
    // filter: primaryKey
    ctx.fetch( filter ).then( finish );
  }
  // or:
  // ctx.call( method, filter ).then( finish );
}

//endregion

const BlanketOrderView = new Model( 'BlanketOrderView' )
  .readOnlyRootObject( 'dal', __filename )
  // --- Properties
  .integer( 'orderKey', F.key )
  .text( 'vendorName' )
  .dateTime( 'contractDate' )
  .decimal( 'totalPrice' )
    .canRead( cr.isInAnyRole, [ 'salesmen', 'administrators' ], 'You are not authorized to view the totalPrice of the blanket order.' )
  .integer( 'schedules' )
  .boolean( 'enabled' )
  .property( 'address', AddressView )
  .property( 'items', BlanketOrderItemsView )
  .dateTime( 'createdDate' )
  .dateTime( 'modifiedDate' )
  // --- Permissions
  .canFetch( cr.isInRole, 'designers', 'You are not authorized to retrieve blanket order.' )
  // --- Customization
  .daoBuilder( daoBuilder )
  .fromDto( fromDto )
  .toCto( toCto )
  .dataFetch( dataFetch )
  // --- Build model class
  .compose();

const BlanketOrderViewFactory = {
  get: function ( key, eventHandlers ) {
    return BlanketOrderView.fetch( key, null, eventHandlers );
  },
  getByName: function ( name, eventHandlers ) {
    return BlanketOrderView.fetch( name, 'fetchByName', eventHandlers );
  }
};

module.exports = BlanketOrderViewFactory;
