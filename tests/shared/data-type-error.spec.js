console.log('Testing shared/data-type-error.js...');

var DataTypeError = require('../../source/shared/data-type-error.js');

describe('Data type error', function() {

  it('constructor expects one optional argument', function() {
    var dte1 = new DataTypeError();
    var dte2 = new DataTypeError('The passed value is not object.');

    expect(dte1).toEqual(jasmine.any(Error));
    expect(dte1.name).toBe('DataTypeError');
    expect(dte1.message).toBe('The data type of the passed value is invalid.');

    expect(dte2).toEqual(jasmine.any(Error));
    expect(dte2.name).toBe('DataTypeError');
    expect(dte2.message).toBe('The passed value is not object.');
  });
});
