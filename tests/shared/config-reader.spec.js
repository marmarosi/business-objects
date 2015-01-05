console.log('Testing shared/config-reader.js...');

var path = require('path');
var ConfigReader = require('../../source/shared/config-reader.js');
var NoAccessBehavior = require('../../source/rules/no-access-behavior.js');

describe('Configuration reader object', function() {

  it('has a data access object builder method', function() {

    expect(ConfigReader.daoBuilder).toBeDefined();
  });

  it('has a user reader method', function() {
    var user = ConfigReader.userReader();

    expect(ConfigReader.userReader).toBeDefined();
    expect(ConfigReader.userReader).not.toThrow();

    expect(user).toEqual(jasmine.any(Object));
    expect(user.userCode).toBe('ada-lovelace');
    expect(user.userName).toBe('Ada Lovelace');
    expect(user.email).toBe('ada.lovelace@computer.net');
    expect(user.roles).toContain('administrators');
  });

  it('has a locale reader method', function() {
    var locale = ConfigReader.localeReader();

    expect(ConfigReader.localeReader).toBeDefined();

    expect(locale).toBe('hu-HU');
  });

  it('can have a property for the path of locales', function() {

    expect(ConfigReader.pathOfLocales.substr(-8)).toBe(path.sep + 'locales');
  });

  it('can have a no access behavior property', function() {

    expect(ConfigReader.noAccessBehavior).toBe(NoAccessBehavior.throwError);
  });
});
