'use strict';

const bo = require( '../../source/index.js' );

const Properties = bo.common.PropertyManager;
const Rules = bo.rules.RuleManager;
const Action = bo.rules.AuthorizationAction;
const Extensions = bo.common.ExtensionManager;
const Property = bo.common.PropertyInfo;
const F = bo.common.PropertyFlag;
const dt = bo.dataTypes;
const cr = bo.commonRules;

const Address = require( './address.js' );
const BlanketOrderItems = require( './blanket-order-items.js' );

const orderKey = new Property( 'orderKey', dt.Integer, F.key | F.readOnly );
const vendorName = new Property( 'vendorName', dt.Text );
const contractDate = new Property( 'contractDate', dt.DateTime );
const totalPrice = new Property( 'totalPrice', dt.Decimal );
const schedules = new Property( 'schedules', dt.Integer );
const enabled = new Property( 'enabled', dt.Boolean );
const address = new Property( 'address', Address );
const items = new Property( 'items', BlanketOrderItems );
const createdDate = new Property( 'createdDate', dt.DateTime, F.readOnly );
const modifiedDate = new Property( 'modifiedDate', dt.DateTime, F.readOnly );

const properties = new Properties(
  orderKey,
  vendorName,
  contractDate,
  totalPrice,
  schedules,
  enabled,
  address,
  items,
  createdDate,
  modifiedDate
);

const rules = new Rules(
  cr.required( vendorName ),
  cr.required( contractDate ),
  cr.required( totalPrice ),
  cr.required( schedules ),
  cr.required( enabled ),
  cr.isInRole( Action.fetchObject, null, 'developers', 'You are not authorized to retrieve blanket order.' ),
  cr.isInRole( Action.createObject, null, 'developers', 'You are not authorized to create blanket order.' ),
  cr.isInRole( Action.updateObject, null, 'developers', 'You are not authorized to modify blanket order.' ),
  cr.isInRole( Action.removeObject, null, 'developers', 'You are not authorized to delete blanket order.' )
);

const extensions = new Extensions( 'dao', __filename );

const BlanketOrder = new bo.EditableRootObject( 'BlanketOrder', properties, rules, extensions );

const BlanketOrderFactory = {
  create: function ( eventHandlers ) {
    return BlanketOrder.create( eventHandlers );
  },
  get: function ( key, eventHandlers ) {
    return BlanketOrder.fetch( key, null, eventHandlers );
  },
  getByName: function ( name, eventHandlers ) {
    return BlanketOrder.fetch( name, 'fetchByName', eventHandlers );
  }
};

module.exports = BlanketOrderFactory;
