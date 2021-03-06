console.log( 'Testing system/enumeration.js...' );

function read ( filename ) {
  return require( '../../../source/' + filename );
}
const Enumeration = read( 'system/enumeration.js' );

//region Test enumerations

class Numbers1 extends Enumeration {
  constructor() {
    super();
    this.one = 0;
    Object.freeze( this );
  }
}
class Numbers2 extends Enumeration {
  constructor() {
    super();
    this.one = 0;
    this.two = 1;
    Object.freeze( this );
  }
}
class Numbers3 extends Enumeration {
  constructor() {
    super();
    this.one = 0;
    this.two = 1;
    this.three = 2;
    Object.freeze( this );
  }
}

//endregion

describe( 'Enumeration', () => {
  const numbers1 = new Numbers1();
  const numbers2 = new Numbers2();
  const numbers3 = new Numbers3();

  it( 'constructor expects no argument', () => {

    function build01() { const options = new Enumeration(); }

    expect( build01 ).not.toThrow();
  } );

  it( '$name property returns the type name', () => {

    expect( numbers1.$name ).toBe( 'Numbers1' );
    expect( numbers2.$name ).toBe( 'Numbers2' );
    expect( numbers3.$name ).toBe( 'Numbers3' );
  } );

  it( 'has the defined items', () => {

    expect( numbers3.one ).toBe( 0 );
    expect( numbers3.two ).toBe( 1 );
    expect( numbers3.three ).toBe( 2 );
  } );

  it( 'items are read-only', () => {

    numbers3.one = 100;
    numbers3.two = 200;
    numbers3.three = 300;

    expect( numbers3.one ).toBe( 0 );
    expect( numbers3.two ).toBe( 1 );
    expect( numbers3.three ).toBe( 2 );
  } );

  it( 'count method returns the item count', () => {

    expect( numbers1.count() ).toBe( 1 );
    expect( numbers2.count() ).toBe( 2 );
    expect( numbers3.count() ).toBe( 3 );
  } );

  it( 'getName method returns the item name', () => {

    function getName1() { const n = numbers3.getName(); }
    function getName2() { const n = numbers3.getName( -1 ); }
    function getName3() { const n = numbers3.getName( 3 ); }

    expect( numbers3.getName( 0 ) ).toBe( 'one' );
    expect( numbers3.getName( 1 ) ).toBe( 'two' );
    expect( numbers3.getName( 2 ) ).toBe( 'three' );

    expect( getName1 ).toThrow();
    expect( getName2 ).toThrow();
    expect( getName3 ).toThrow();
  } );

  it( 'getValue method returns the item value', () => {

    function getValue1() { const n = numbers3.getName(); }
    function getValue2() { const n = numbers3.getName( '' ); }
    function getValue3() { const n = numbers3.getName( 'four' ); }

    expect( numbers3.getValue( 'one' ) ).toBe( 0 );
    expect( numbers3.getValue( 'two' ) ).toBe( 1 );
    expect( numbers3.getValue( 'three' ) ).toBe( 2 );

    expect( getValue1 ).toThrow();
    expect( getValue2 ).toThrow();
    expect( getValue3 ).toThrow();
  } );

  it( 'check method inspects a value', () => {

    function check1() {numbers3.check(); }
    function check2() {numbers3.check( true ); }
    function check3() {numbers3.check( '' ); }
    function check4() {numbers3.check( -1 ); }
    function check5() {numbers3.check( 0 ); }
    function check6() {numbers3.check( 2 ); }
    function check7() {numbers3.check( 3 ); }
    function check8() {numbers3.check( [ 0 ] ); }

    expect( check1 ).toThrow();
    expect( check2 ).toThrow();
    expect( check3 ).toThrow();
    expect( check4 ).toThrow();
    expect( check5 ).not.toThrow();
    expect( check6 ).not.toThrow();
    expect( check7 ).toThrow();
    expect( check8 ).toThrow();
  } );

  it( 'check method sets error message', () => {

    function check1() {numbers3.check( 10 ); }
    function check2() {numbers3.check( 20, 'Invalid enumeration value!' ); }

    expect( check1 ).toThrow( 'The passed value (10) is not a Numbers3 item.' );
    expect( check2 ).toThrow( 'Invalid enumeration value!' );
  } );

  it( 'hasMember method tests a value', () => {

    expect( numbers3.hasMember() ).toBe( false );
    expect( numbers3.hasMember( true ) ).toBe( false );
    expect( numbers3.hasMember( '' ) ).toBe( false );
    expect( numbers3.hasMember( -1 ) ).toBe( false );
    expect( numbers3.hasMember( 0 ) ).toBe( true );
    expect( numbers3.hasMember( 2 ) ).toBe( true );
    expect( numbers3.hasMember( 3 ) ).toBe( false );
    expect( numbers3.hasMember( [ 0 ] ) ).toBe( false );
  } );
} );
