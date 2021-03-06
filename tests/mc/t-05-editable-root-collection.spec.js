//region Imports

const BlanketOrders = require( '../../data/simple-mc/blanket-orders.js' );
const BlanketOrderChild = require( '../../data/simple-mc/blanket-order-child.js' );

const DataPortalEvent = require( '../../source/common/data-portal-event.js' );
const EventHandlerList = require( '../../source/common/event-handler-list.js' );

//endregion

function showTitle() {
  console.log( '' );
  console.log( '--------------------------------------------------' );
  console.log( 'Testing methods of simple collections...' );
  console.log( '--------------------------------------------------' );
}

describe( 'Data portal method', () => {

  //region Data

  const contractDate1 = new Date( 2015, 10, 23, 11, 7 );
  const contractDate2 = new Date( 2015, 10, 24, 15, 48 );
  const contractDate3 = new Date( 2015, 11, 7, 19, 0 );
  const expiry1 = new Date( 2016, 7, 1, 0, 0 );
  const expiry2 = new Date( 2016, 4, 1, 0, 0 );
  const expiry3 = new Date( 2016, 8, 20, 12, 0 );
  const shipDate1 = new Date( 2015, 12, 21, 12, 0 );
  const shipDate2 = new Date( 2016, 1, 12, 9, 45 );
  const shipDate3 = new Date( 2016, 2, 5, 17, 0 );

  //endregion

  //region Event handlers

  function logEvent( eventArgs ) {
    const id = eventArgs.modelName + '.' + eventArgs.methodName + ':' + eventArgs.eventName;
    if (eventArgs.eventName.substr( -4 ) === 'Save')
      console.log( ' :: ' + id + ' event.' );
    else
      console.log( '  : ' + id + ' event.' );
  }

  const ehBlanketOrders = new EventHandlerList();
  ehBlanketOrders.add( 'BlanketOrders', DataPortalEvent.preCreate, logEvent );
  ehBlanketOrders.add( 'BlanketOrders', DataPortalEvent.postCreate, logEvent );
  ehBlanketOrders.add( 'BlanketOrders', DataPortalEvent.preFetch, logEvent );
  ehBlanketOrders.add( 'BlanketOrders', DataPortalEvent.postFetch, logEvent );
  ehBlanketOrders.add( 'BlanketOrders', DataPortalEvent.preInsert, logEvent );
  ehBlanketOrders.add( 'BlanketOrders', DataPortalEvent.postInsert, logEvent );
  ehBlanketOrders.add( 'BlanketOrders', DataPortalEvent.preUpdate, logEvent );
  ehBlanketOrders.add( 'BlanketOrders', DataPortalEvent.postUpdate, logEvent );
  ehBlanketOrders.add( 'BlanketOrders', DataPortalEvent.preRemove, logEvent );
  ehBlanketOrders.add( 'BlanketOrders', DataPortalEvent.postRemove, logEvent );
  ehBlanketOrders.add( 'BlanketOrders', DataPortalEvent.preSave, logEvent );
  ehBlanketOrders.add( 'BlanketOrders', DataPortalEvent.postSave, logEvent );
  ehBlanketOrders.add( 'BlanketOrderChild', DataPortalEvent.preCreate, logEvent );
  ehBlanketOrders.add( 'BlanketOrderChild', DataPortalEvent.postCreate, logEvent );
  ehBlanketOrders.add( 'BlanketOrderChild', DataPortalEvent.preFetch, logEvent );
  ehBlanketOrders.add( 'BlanketOrderChild', DataPortalEvent.postFetch, logEvent );
  ehBlanketOrders.add( 'BlanketOrderChild', DataPortalEvent.preInsert, logEvent );
  ehBlanketOrders.add( 'BlanketOrderChild', DataPortalEvent.postInsert, logEvent );
  ehBlanketOrders.add( 'BlanketOrderChild', DataPortalEvent.preUpdate, logEvent );
  ehBlanketOrders.add( 'BlanketOrderChild', DataPortalEvent.postUpdate, logEvent );
  ehBlanketOrders.add( 'BlanketOrderChild', DataPortalEvent.preRemove, logEvent );
  ehBlanketOrders.add( 'BlanketOrderChild', DataPortalEvent.postRemove, logEvent );
  ehBlanketOrders.add( 'Address', DataPortalEvent.preCreate, logEvent );
  ehBlanketOrders.add( 'Address', DataPortalEvent.postCreate, logEvent );
  ehBlanketOrders.add( 'Address', DataPortalEvent.preFetch, logEvent );
  ehBlanketOrders.add( 'Address', DataPortalEvent.postFetch, logEvent );
  ehBlanketOrders.add( 'Address', DataPortalEvent.preInsert, logEvent );
  ehBlanketOrders.add( 'Address', DataPortalEvent.postInsert, logEvent );
  ehBlanketOrders.add( 'Address', DataPortalEvent.preUpdate, logEvent );
  ehBlanketOrders.add( 'Address', DataPortalEvent.postUpdate, logEvent );
  ehBlanketOrders.add( 'Address', DataPortalEvent.preRemove, logEvent );
  ehBlanketOrders.add( 'Address', DataPortalEvent.postRemove, logEvent );
  ehBlanketOrders.add( 'BlanketOrderItem', DataPortalEvent.preCreate, logEvent );
  ehBlanketOrders.add( 'BlanketOrderItem', DataPortalEvent.postCreate, logEvent );
  ehBlanketOrders.add( 'BlanketOrderItem', DataPortalEvent.preFetch, logEvent );
  ehBlanketOrders.add( 'BlanketOrderItem', DataPortalEvent.postFetch, logEvent );
  ehBlanketOrders.add( 'BlanketOrderItem', DataPortalEvent.preInsert, logEvent );
  ehBlanketOrders.add( 'BlanketOrderItem', DataPortalEvent.postInsert, logEvent );
  ehBlanketOrders.add( 'BlanketOrderItem', DataPortalEvent.preUpdate, logEvent );
  ehBlanketOrders.add( 'BlanketOrderItem', DataPortalEvent.postUpdate, logEvent );
  ehBlanketOrders.add( 'BlanketOrderItem', DataPortalEvent.preRemove, logEvent );
  ehBlanketOrders.add( 'BlanketOrderItem', DataPortalEvent.postRemove, logEvent );
  ehBlanketOrders.add( 'BlanketOrderSchedule', DataPortalEvent.preCreate, logEvent );
  ehBlanketOrders.add( 'BlanketOrderSchedule', DataPortalEvent.postCreate, logEvent );
  ehBlanketOrders.add( 'BlanketOrderSchedule', DataPortalEvent.preFetch, logEvent );
  ehBlanketOrders.add( 'BlanketOrderSchedule', DataPortalEvent.postFetch, logEvent );
  ehBlanketOrders.add( 'BlanketOrderSchedule', DataPortalEvent.preInsert, logEvent );
  ehBlanketOrders.add( 'BlanketOrderSchedule', DataPortalEvent.postInsert, logEvent );
  ehBlanketOrders.add( 'BlanketOrderSchedule', DataPortalEvent.preUpdate, logEvent );
  ehBlanketOrders.add( 'BlanketOrderSchedule', DataPortalEvent.postUpdate, logEvent );
  ehBlanketOrders.add( 'BlanketOrderSchedule', DataPortalEvent.preRemove, logEvent );
  ehBlanketOrders.add( 'BlanketOrderSchedule', DataPortalEvent.postRemove, logEvent );

  const ehBlanketOrderView = new EventHandlerList();
  ehBlanketOrderView.add( 'BlanketOrderView', DataPortalEvent.preFetch, logEvent );
  ehBlanketOrderView.add( 'BlanketOrderView', DataPortalEvent.postFetch, logEvent );
  ehBlanketOrderView.add( 'AddressView', DataPortalEvent.preFetch, logEvent );
  ehBlanketOrderView.add( 'AddressView', DataPortalEvent.postFetch, logEvent );
  ehBlanketOrderView.add( 'BlanketOrderItemView', DataPortalEvent.preFetch, logEvent );
  ehBlanketOrderView.add( 'BlanketOrderItemView', DataPortalEvent.postFetch, logEvent );
  ehBlanketOrderView.add( 'BlanketOrderScheduleView', DataPortalEvent.preFetch, logEvent );
  ehBlanketOrderView.add( 'BlanketOrderScheduleView', DataPortalEvent.postFetch, logEvent );

  const ehBlanketOrderList = new EventHandlerList();
  ehBlanketOrderList.add( 'BlanketOrderList', DataPortalEvent.preFetch, logEvent );
  ehBlanketOrderList.add( 'BlanketOrderList', DataPortalEvent.postFetch, logEvent );
  ehBlanketOrderList.add( 'BlanketOrderListItem', DataPortalEvent.preFetch, logEvent );
  ehBlanketOrderList.add( 'BlanketOrderListItem', DataPortalEvent.postFetch, logEvent );

  //endregion

  it( 'CREATE of simple editable collection', done => {
    showTitle();
    console.log( '\n*** Method CREATE' );

    //region Load data

    function createOrder1( list ) {
      console.log( '    < Create order #1 >' );
      return list.createItem().then( order1 => {

        order1.vendorName = 'Blue Zebra';
        order1.contractDate = contractDate1;
        order1.totalPrice = 400.0;
        order1.schedules = 2;
        order1.enabled = true;

        const address1 = order1.address;

        address1.country = 'Italia';
        address1.state = '';
        address1.city = 'Milano';
        address1.line1 = 'Via Battistotti Sassi 11/A';
        address1.line2 = '';
        address1.postalCode = '20133';

        return Promise.all( [
          createItem1( order1.items ),
          createItem2( order1.items )
        ] ).then( items => {
          return order1;
        } );
      } );
    }

    function createOrder2( list ) {
      console.log( '    < Create order #2 >' );
      return list.createItem().then( order2 => {

        order2.vendorName = 'Black Spider';
        order2.contractDate = contractDate2;
        order2.totalPrice = 6600.0;
        order2.schedules = 3;
        order2.enabled = true;

        const address2 = order2.address;

        address2.country = 'Poland';
        address2.state = '';
        address2.city = 'Warsawa';
        address2.line1 = 'ul. Żeromskiego 77';
        address2.line2 = 'III piętro';
        address2.postalCode = '01-882';

        createItem3( order2.items ).then( item3 => {
          return order2;
        } );
      } );
    }

    function createItem1( items ) {
      return items.createItem().then( item1 => {

        item1.productName = 'D810A';
        item1.obsolete = false;
        item1.expiry = expiry1;
        item1.quantity = 10;
        item1.unitPrice = 30;

        return Promise.all( [
          createSchedule1( item1.schedules ),
          createSchedule2( item1.schedules )
        ] ).then( schedules => {
          return item1;
        } );
      } );
    }

    function createItem2( items ) {
      return items.createItem().then( item2 => {

        item2.productName = 'R8';
        item2.obsolete = false;
        item2.expiry = expiry2;
        item2.quantity = 5;
        item2.unitPrice = 20;

        return item2;
      } );
    }

    function createItem3( items ) {
      return items.createItem().then( item3 => {

        item3.productName = 'Platforma SIRP';
        item3.obsolete = false;
        item3.expiry = expiry3;
        item3.quantity = 110;
        item3.unitPrice = 60;

        createSchedule3( item3.schedules ).then( schedule3 => {
          return item3;
        } );
      } );
    }

    function createSchedule1( schedules ) {
      return schedules.createItem().then( schedule1 => {

        schedule1.quantity = 5;
        schedule1.totalMass = 2.5;
        schedule1.required = true;
        schedule1.shipTo = 'Bologna';
        schedule1.shipDate = shipDate1;

        return schedule1;
      } );
    }

    function createSchedule2( schedules ) {
      return schedules.createItem().then( schedule2 => {

        schedule2.quantity = 5;
        schedule2.totalMass = 2.5;
        schedule2.required = true;
        schedule2.shipTo = 'Verona';
        schedule2.shipDate = shipDate2;

        return schedule2;
      } );
    }

    function createSchedule3( schedules ) {
      return schedules.createItem().then( schedule3 => {

        schedule3.quantity = 45;
        schedule3.totalMass = 540;
        schedule3.required = false;
        schedule3.shipTo = 'Krakow';
        schedule3.shipDate = shipDate3;

        return schedule3;
      } );
    }

    //endregion

    console.log( '    < Create order collection >' );
    BlanketOrders.create( ehBlanketOrders )
      .then( list => {
        return Promise.all( [
          createOrder1( list ),
          createOrder2( list )
        ] ).then( orders => {
          return list;
        } );
      } )
      .then( list => {
        console.log( '    < Save order collection >' );
        return list.save()
          .then( orders => {

            //region Check data

            expect( orders.count ).toBe( 2 );

            /* ---------------------------------------- */

            const order1 = orders.at( 0 );

            expect( order1.orderKey ).toBe( 5 );
            expect( order1.vendorName ).toBe( 'Blue Zebra' );
            expect( order1.contractDate ).toBe( contractDate1 );
            expect( order1.totalPrice ).toBe( 400.0 );
            expect( order1.schedules ).toBe( 2 );
            expect( order1.enabled ).toBe( true );
            expect( order1.createdDate.getDate() ).toBe( new Date().getDate() );
            expect( order1.modifiedDate ).toBeNull();

            const address1 = order1.address;

            expect( address1.addressKey ).toBe( 5 );
            expect( address1.orderKey ).toBe( 5 );
            expect( address1.country ).toBe( 'Italia' );
            expect( address1.state ).toBe( '' );
            expect( address1.city ).toBe( 'Milano' );
            expect( address1.line1 ).toBe( 'Via Battistotti Sassi 11/A' );
            expect( address1.line2 ).toBe( '' );
            expect( address1.postalCode ).toBe( '20133' );

            expect( order1.items.count ).toBe( 2 );

            const item1 = order1.items.at( 0 );

            expect( item1.orderItemKey ).toBe( 13 );
            expect( item1.orderKey ).toBe( 5 );
            expect( item1.productName ).toBe( 'D810A' );
            expect( item1.obsolete ).toBe( false );
            expect( item1.expiry ).toBe( expiry1 );
            expect( item1.quantity ).toBe( 10 );
            expect( item1.unitPrice ).toBe( 30 );

            const item2 = order1.items.at( 1 );

            expect( item2.orderItemKey ).toBe( 14 );
            expect( item2.orderKey ).toBe( 5 );
            expect( item2.productName ).toBe( 'R8' );
            expect( item2.obsolete ).toBe( false );
            expect( item2.expiry ).toBe( expiry2 );
            expect( item2.quantity ).toBe( 5 );
            expect( item2.unitPrice ).toBe( 20 );

            expect( item1.schedules.count ).toBe( 2 );

            expect( item2.schedules.count ).toBe( 0 );

            const schedule1 = item1.schedules.at( 0 );

            expect( schedule1.orderScheduleKey ).toBe( 17 );
            expect( schedule1.orderItemKey ).toBe( 13 );
            expect( schedule1.quantity ).toBe( 5 );
            expect( schedule1.totalMass ).toBe( 2.5 );
            expect( schedule1.required ).toBe( true );
            expect( schedule1.shipTo ).toBe( 'Bologna' );
            expect( schedule1.shipDate ).toBe( shipDate1 );

            const schedule2 = item1.schedules.at( 1 );

            expect( schedule2.orderScheduleKey ).toBe( 18 );
            expect( schedule2.orderItemKey ).toBe( 13 );
            expect( schedule2.quantity ).toBe( 5 );
            expect( schedule2.totalMass ).toBe( 2.5 );
            expect( schedule2.required ).toBe( true );
            expect( schedule2.shipTo ).toBe( 'Verona' );
            expect( schedule2.shipDate ).toBe( shipDate2 );

            /* ---------------------------------------- */

            const order2 = orders.at( 1 );

            expect( order2.orderKey ).toBe( 6 );
            expect( order2.vendorName ).toBe( 'Black Spider' );
            expect( order2.contractDate ).toBe( contractDate2 );
            expect( order2.totalPrice ).toBe( 6600.0 );
            expect( order2.schedules ).toBe( 3 );
            expect( order2.enabled ).toBe( true );
            expect( order2.createdDate.getDate() ).toBe( new Date().getDate() );
            expect( order2.modifiedDate ).toBeNull();

            const address2 = order2.address;

            expect( address2.addressKey ).toBe( 6 );
            expect( address2.orderKey ).toBe( 6 );
            expect( address2.country ).toBe( 'Poland' );
            expect( address2.state ).toBe( '' );
            expect( address2.city ).toBe( 'Warsawa' );
            expect( address2.line1 ).toBe( 'ul. Żeromskiego 77' );
            expect( address2.line2 ).toBe( 'III piętro' );
            expect( address2.postalCode ).toBe( '01-882' );

            const item3 = order2.items.at( 0 );

            expect( item3.orderItemKey ).toBe( 15 );
            expect( item3.orderKey ).toBe( 6 );
            expect( item3.productName ).toBe( 'Platforma SIRP' );
            expect( item3.obsolete ).toBe( false );
            expect( item3.expiry ).toBe( expiry3 );
            expect( item3.quantity ).toBe( 110 );
            expect( item3.unitPrice ).toBe( 60 );

            const schedule3 = item3.schedules.at( 0 );

            expect( schedule3.orderScheduleKey ).toBe( 19 );
            expect( schedule3.orderItemKey ).toBe( 15 );
            expect( schedule3.quantity ).toBe( 45 );
            expect( schedule3.totalMass ).toBe( 540 );
            expect( schedule3.required ).toBe( false );
            expect( schedule3.shipTo ).toBe( 'Krakow' );
            expect( schedule3.shipDate ).toBe( shipDate3 );

            //endregion

            done();
          } );
      } )
      .catch( reason => {
        console.log( reason );
      } );
  } );

  it( 'UPDATE of simple editable collection', done => {
    console.log( '\n*** Method UPDATE' );

    //region Update data

    function updateOrder1( list ) {
      console.log( '    < Update order #1 >' );

      const order1 = list.at( 0 );

      order1.vendorName = 'Pink Giraffe';
      order1.contractDate = contractDate2;
      order1.totalPrice = 500.0;
      order1.schedules = 5;
      order1.enabled = false;

      const address1 = order1.address;

      address1.country = 'Italia';
      address1.state = '';
      address1.city = 'Milano';
      address1.line1 = 'Via Battistotti Sassi 13';
      address1.line2 = '';
      address1.postalCode = '20133';

      const item1 = order1.items.at( 0 );

      item1.productName = 'D810B';
      item1.obsolete = false;
      item1.expiry = expiry2;
      item1.quantity = 20;
      item1.unitPrice = 35;

      const item2 = order1.items.at( 1 );
      item2.remove();

      const schedule1 = item1.schedules.at( 0 );
      schedule1.remove();

      const schedule2 = item1.schedules.at( 1 );

      schedule2.quantity = 10;
      schedule2.totalMass = 2.5;
      schedule2.required = true;
      schedule2.shipTo = 'Verona';
      schedule2.shipDate = shipDate1;

      return Promise.all( [
        createItem3( order1.items ),
        createSchedule3( item1.schedules )
      ] ).then( values => {
        return order1;
      } );
    }

    function deleteOrder2( list ) {
      console.log( '    < Delete order #2 >' );

      const order2 = list.at( 1 );
      order2.remove();

      return order2;
    }

    function createOrder3( list ) {
      console.log( '    < Create order #3 >' );

      return list.createItem().then( order3 => {

        order3.vendorName = 'Coward Rabbit';
        order3.contractDate = contractDate3;
        order3.totalPrice = 980;
        order3.schedules = 5;
        order3.enabled = false;

        const address2 = order3.address;

        address2.country = 'Slovakia';
        address2.state = '';
        address2.city = 'Komárno';
        address2.line1 = 'Ulica františkánov 22.';
        address2.line2 = '';
        address2.postalCode = '945 01';

        return createItem4( order3.items ).then( item4 => {
          return order3;
        } );
      } );
    }

    function createItem3( items ) {
      return items.createItem().then( item3 => {

        item3.productName = 'Babel Tower';
        item3.obsolete = false;
        item3.expiry = expiry1;
        item3.quantity = 3;
        item3.unitPrice = 49.9;

        return createSchedule4( item3.schedules ).then( schedule4 => {
          return item3;
        } );
      } );
    }

    function createItem4( items ) {
      return items.createItem().then( item4 => {

        item4.productName = 'OpenShift Origin';
        item4.obsolete = false;
        item4.expiry = expiry1;
        item4.quantity = 49;
        item4.unitPrice = 4.0;

        return createSchedule5( item4.schedules ).then( schedule5 => {
          return item4;
        } );
      } );
    }

    function createSchedule3( schedules ) {
      return schedules.createItem().then( schedule3 => {

        schedule3.quantity = 10;
        schedule3.totalMass = 2.5;
        schedule3.required = false;
        schedule3.shipTo = 'Torino';
        schedule3.shipDate = shipDate2;

        return schedule3;
      } );
    }

    function createSchedule4( schedules ) {
      return schedules.createItem().then( schedule4 => {

        schedule4.quantity = 3;
        schedule4.totalMass = 23.4;
        schedule4.required = true;
        schedule4.shipTo = 'Siena';
        schedule4.shipDate = shipDate3;

        return schedule4;
      } );
    }

    function createSchedule5( schedules ) {
      return schedules.createItem().then( schedule5 => {

        schedule5.quantity = 10;
        schedule5.totalMass = 13.7;
        schedule5.required = true;
        schedule5.shipTo = 'Bratislava';
        schedule5.shipDate = shipDate3;

        return schedule5;
      } );
    }

    //endregion

    console.log( '    < Fetch order collection >' );
    BlanketOrders.getFromTo( 5, 7, ehBlanketOrders )
      .then( list => {
        return Promise.all( [
          updateOrder1( list ),
          deleteOrder2( list ),
          createOrder3( list )
        ] ).then( orders => {
          return list;
        } );
      } )
      .then( list => {
        console.log( '    < Save order collection >' );
        return list.save()
          .then( orders => {

            //region Check data

            expect( orders.count ).toBe( 2 );

            /* ---------------------------------------- */

            const order1 = orders.at( 0 );

            expect( order1.orderKey ).toBe( 5 );
            expect( order1.vendorName ).toBe( 'Pink Giraffe' );
            expect( order1.contractDate ).toBe( contractDate2 );
            expect( order1.totalPrice ).toBe( 500.0 );
            expect( order1.schedules ).toBe( 5 );
            expect( order1.enabled ).toBe( false );
            expect( order1.createdDate.getDate() ).toBe( new Date().getDate() );
            expect( order1.modifiedDate.getDate() ).toBe( new Date().getDate() );

            const address1 = order1.address;

            expect( address1.addressKey ).toBe( 5 );
            expect( address1.orderKey ).toBe( 5 );
            expect( address1.country ).toBe( 'Italia' );
            expect( address1.state ).toBe( '' );
            expect( address1.city ).toBe( 'Milano' );
            expect( address1.line1 ).toBe( 'Via Battistotti Sassi 13' );
            expect( address1.line2 ).toBe( '' );
            expect( address1.postalCode ).toBe( '20133' );

            expect( order1.items.count ).toBe( 2 );

            const item1 = order1.items.at( 0 );

            expect( item1.orderItemKey ).toBe( 13 );
            expect( item1.orderKey ).toBe( 5 );
            expect( item1.productName ).toBe( 'D810B' );
            expect( item1.obsolete ).toBe( false );
            expect( item1.expiry ).toBe( expiry2 );
            expect( item1.quantity ).toBe( 20 );
            expect( item1.unitPrice ).toBe( 35 );

            const item2 = order1.items.at( 1 );

            expect( item2.orderItemKey ).toBe( 16 );
            expect( item2.orderKey ).toBe( 5 );
            expect( item2.productName ).toBe( 'Babel Tower' );
            expect( item2.obsolete ).toBe( false );
            expect( item2.expiry ).toBe( expiry1 );
            expect( item2.quantity ).toBe( 3 );
            expect( item2.unitPrice ).toBe( 49.9 );

            expect( item1.schedules.count ).toBe( 2 );

            expect( item2.schedules.count ).toBe( 1 );

            const schedule1 = item1.schedules.at( 0 );

            expect( schedule1.orderScheduleKey ).toBe( 18 );
            expect( schedule1.orderItemKey ).toBe( 13 );
            expect( schedule1.quantity ).toBe( 10 );
            expect( schedule1.totalMass ).toBe( 2.5 );
            expect( schedule1.required ).toBe( true );
            expect( schedule1.shipTo ).toBe( 'Verona' );
            expect( schedule1.shipDate ).toBe( shipDate1 );

            const schedule2 = item1.schedules.at( 1 );

            expect( schedule2.orderScheduleKey ).toBe( 20 );
            expect( schedule2.orderItemKey ).toBe( 13 );
            expect( schedule2.quantity ).toBe( 10 );
            expect( schedule2.totalMass ).toBe( 2.5 );
            expect( schedule2.required ).toBe( false );
            expect( schedule2.shipTo ).toBe( 'Torino' );
            expect( schedule2.shipDate ).toBe( shipDate2 );

            const schedule3 = item2.schedules.at( 0 );

            expect( schedule3.orderScheduleKey ).toBe( 21 );
            expect( schedule3.orderItemKey ).toBe( 16 );
            expect( schedule3.quantity ).toBe( 3 );
            expect( schedule3.totalMass ).toBe( 23.4 );
            expect( schedule3.required ).toBe( true );
            expect( schedule3.shipTo ).toBe( 'Siena' );
            expect( schedule3.shipDate ).toBe( shipDate3 );

            /* ---------------------------------------- */

            const order2 = orders.at( 1 );

            expect( order2.orderKey ).toBe( 7 );
            expect( order2.vendorName ).toBe( 'Coward Rabbit' );
            expect( order2.contractDate ).toBe( contractDate3 );
            expect( order2.totalPrice ).toBe( 980 );
            expect( order2.schedules ).toBe( 5 );
            expect( order2.enabled ).toBe( false );
            expect( order2.createdDate.getDate() ).toBe( new Date().getDate() );
            expect( order2.modifiedDate ).toBeNull();

            const address2 = order2.address;

            address2.country = 'Slovakia';
            address2.state = '';
            address2.city = 'Komárno';
            address2.line1 = 'Ulica františkánov 22.';
            address2.line2 = '';
            address2.postalCode = '945 01';

            expect( address2.addressKey ).toBe( 7 );
            expect( address2.orderKey ).toBe( 7 );
            expect( address2.country ).toBe( 'Slovakia' );
            expect( address2.state ).toBe( '' );
            expect( address2.city ).toBe( 'Komárno' );
            expect( address2.line1 ).toBe( 'Ulica františkánov 22.' );
            expect( address2.line2 ).toBe( '' );
            expect( address2.postalCode ).toBe( '945 01' );

            expect( order2.items.count ).toBe( 1 );

            const item3 = order2.items.at( 0 );

            expect( item3.orderItemKey ).toBe( 17 );
            expect( item3.orderKey ).toBe( 7 );
            expect( item3.productName ).toBe( 'OpenShift Origin' );
            expect( item3.obsolete ).toBe( false );
            expect( item3.expiry ).toBe( expiry1 );
            expect( item3.quantity ).toBe( 49 );
            expect( item3.unitPrice ).toBe( 4.0 );

            expect( item3.schedules.count ).toBe( 1 );

            const schedule4 = item3.schedules.at( 0 );

            expect( schedule4.orderScheduleKey ).toBe( 22 );
            expect( schedule4.orderItemKey ).toBe( 17 );
            expect( schedule4.quantity ).toBe( 10 );
            expect( schedule4.totalMass ).toBe( 13.7 );
            expect( schedule4.required ).toBe( true );
            expect( schedule4.shipTo ).toBe( 'Bratislava' );
            expect( schedule4.shipDate ).toBe( shipDate3 );

            //endregion

            done();
          } );
      } )
      .catch( reason => {
        console.log( reason );
      } );
  } );

  it( 'TO_FROM_CTO of simple editable collection', done => {
    console.log( '\n*** Method TO_FROM_CTO' );

    console.log( '    < Fetch order collection >' );
    BlanketOrders.getFromTo( 5, 7, ehBlanketOrders )
      .then( orders1 => {

        const data = orders1.toCto();
        BlanketOrders.create( ehBlanketOrders )
          .then( orders2 => {

            orders2.fromCto( data ).then( value => {

              //region Check data

              expect( orders2.count ).toBe( 2 );

              /* ---------------------------------------- */

              const order1 = orders2.at( 0 );

              expect( order1.orderKey ).toBe( 5 );
              expect( order1.vendorName ).toBe( 'Pink Giraffe' );
              expect( order1.contractDate ).toBe( contractDate2 );
              expect( order1.totalPrice ).toBe( 500.0 );
              expect( order1.schedules ).toBe( 5 );
              expect( order1.enabled ).toBe( false );
              expect( order1.createdDate.getDate() ).toBe( new Date().getDate() );
              expect( order1.modifiedDate.getDate() ).toBe( new Date().getDate() );

              const address1 = order1.address;

              expect( address1.addressKey ).toBe( 5 );
              expect( address1.orderKey ).toBe( 5 );
              expect( address1.country ).toBe( 'Italia' );
              expect( address1.state ).toBe( '' );
              expect( address1.city ).toBe( 'Milano' );
              expect( address1.line1 ).toBe( 'Via Battistotti Sassi 13' );
              expect( address1.line2 ).toBe( '' );
              expect( address1.postalCode ).toBe( '20133' );

              expect( order1.items.count ).toBe( 2 );

              const item1 = order1.items.at( 0 );

              expect( item1.orderItemKey ).toBe( 13 );
              expect( item1.orderKey ).toBe( 5 );
              expect( item1.productName ).toBe( 'D810B' );
              expect( item1.obsolete ).toBe( false );
              expect( item1.expiry ).toBe( expiry2 );
              expect( item1.quantity ).toBe( 20 );
              expect( item1.unitPrice ).toBe( 35 );

              const item2 = order1.items.at( 1 );

              expect( item2.orderItemKey ).toBe( 16 );
              expect( item2.orderKey ).toBe( 5 );
              expect( item2.productName ).toBe( 'Babel Tower' );
              expect( item2.obsolete ).toBe( false );
              expect( item2.expiry ).toBe( expiry1 );
              expect( item2.quantity ).toBe( 3 );
              expect( item2.unitPrice ).toBe( 49.9 );

              expect( item1.schedules.count ).toBe( 2 );

              expect( item2.schedules.count ).toBe( 1 );

              const schedule1 = item1.schedules.at( 0 );

              expect( schedule1.orderScheduleKey ).toBe( 18 );
              expect( schedule1.orderItemKey ).toBe( 13 );
              expect( schedule1.quantity ).toBe( 10 );
              expect( schedule1.totalMass ).toBe( 2.5 );
              expect( schedule1.required ).toBe( true );
              expect( schedule1.shipTo ).toBe( 'Verona' );
              expect( schedule1.shipDate ).toBe( shipDate1 );

              const schedule2 = item1.schedules.at( 1 );

              expect( schedule2.orderScheduleKey ).toBe( 20 );
              expect( schedule2.orderItemKey ).toBe( 13 );
              expect( schedule2.quantity ).toBe( 10 );
              expect( schedule2.totalMass ).toBe( 2.5 );
              expect( schedule2.required ).toBe( false );
              expect( schedule2.shipTo ).toBe( 'Torino' );
              expect( schedule2.shipDate ).toBe( shipDate2 );

              const schedule3 = item2.schedules.at( 0 );

              expect( schedule3.orderScheduleKey ).toBe( 21 );
              expect( schedule3.orderItemKey ).toBe( 16 );
              expect( schedule3.quantity ).toBe( 3 );
              expect( schedule3.totalMass ).toBe( 23.4 );
              expect( schedule3.required ).toBe( true );
              expect( schedule3.shipTo ).toBe( 'Siena' );
              expect( schedule3.shipDate ).toBe( shipDate3 );

              /* ---------------------------------------- */

              const order2 = orders2.at( 1 );

              expect( order2.orderKey ).toBe( 7 );
              expect( order2.vendorName ).toBe( 'Coward Rabbit' );
              expect( order2.contractDate ).toBe( contractDate3 );
              expect( order2.totalPrice ).toBe( 980 );
              expect( order2.schedules ).toBe( 5 );
              expect( order2.enabled ).toBe( false );
              expect( order2.createdDate.getDate() ).toBe( new Date().getDate() );
              expect( order2.modifiedDate ).toBeNull();

              const address2 = order2.address;

              address2.country = 'Slovakia';
              address2.state = '';
              address2.city = 'Komárno';
              address2.line1 = 'Ulica františkánov 22.';
              address2.line2 = '';
              address2.postalCode = '945 01';

              expect( address2.addressKey ).toBe( 7 );
              expect( address2.orderKey ).toBe( 7 );
              expect( address2.country ).toBe( 'Slovakia' );
              expect( address2.state ).toBe( '' );
              expect( address2.city ).toBe( 'Komárno' );
              expect( address2.line1 ).toBe( 'Ulica františkánov 22.' );
              expect( address2.line2 ).toBe( '' );
              expect( address2.postalCode ).toBe( '945 01' );

              expect( order2.items.count ).toBe( 1 );

              const item3 = order2.items.at( 0 );

              expect( item3.orderItemKey ).toBe( 17 );
              expect( item3.orderKey ).toBe( 7 );
              expect( item3.productName ).toBe( 'OpenShift Origin' );
              expect( item3.obsolete ).toBe( false );
              expect( item3.expiry ).toBe( expiry1 );
              expect( item3.quantity ).toBe( 49 );
              expect( item3.unitPrice ).toBe( 4.0 );

              expect( item3.schedules.count ).toBe( 1 );

              const schedule4 = item3.schedules.at( 0 );

              expect( schedule4.orderScheduleKey ).toBe( 22 );
              expect( schedule4.orderItemKey ).toBe( 17 );
              expect( schedule4.quantity ).toBe( 10 );
              expect( schedule4.totalMass ).toBe( 13.7 );
              expect( schedule4.required ).toBe( true );
              expect( schedule4.shipTo ).toBe( 'Bratislava' );
              expect( schedule4.shipDate ).toBe( shipDate3 );

              //endregion

              done();
            } );
          } );
      } )
      .catch( reason => {
        console.log( reason );
      } );
  } );

  it( 'REMOVE of simple editable collection', done => {
    console.log( '\n*** Method REMOVE' );

    console.log( '    < Fetch order collection >' );
    BlanketOrders.getFromTo( 5, 7, ehBlanketOrders )
      .then( orders => {

        console.log( '    < Remove order collection >' );
        orders.remove();
        orders.save()
          .then( orders => {

            //region Check data

            expect( orders ).toBeNull();

            console.log( '    < Re-fetch order collection >' );
            const exOrders = BlanketOrders.getFromTo( 12, 14, ehBlanketOrders )
              .then( exOrders => {

                expect( exOrders.count ).toBe( 0 );

                done();
              } );

            //endregion
          } );
      } )
      .catch( reason => {
        console.log( reason );
      } );
  } );
} );
