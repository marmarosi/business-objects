'use strict';

const bo = require( '../../source/index.js' );
const Model = bo.ModelComposer;
const F = bo.common.PropertyFlag;

const AddressView = new Model( 'AddressView' )
  .readOnlyChildObject( 'dao', __filename )
  // --- Properties
  .integer( 'addressKey', F.key )
  .integer( 'orderKey', F.parentKey )
  .text( 'country' )
  .text( 'state' )
  .text( 'city' )
  .text( 'line1' )
  .text( 'line2' )
  .text( 'postalCode' )
  // --- Build model class
  .compose();

module.exports = AddressView;
