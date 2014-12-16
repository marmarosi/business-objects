console.log('Testing rules/index.js...');

var rules = require('../../source/rules/index.js');

var ValidationRule = require('../../source/rules/validation-rule.js');
var ValidationContext = require('../../source/rules/validation-context.js');
var ValidationResult = require('../../source/rules/validation-result.js');
var ValidationError = require('../../source/rules/validation-error.js');

var AuthorizationRule = require('../../source/rules/authorization-rule.js');
var AuthorizationContext = require('../../source/rules/authorization-context.js');
var AuthorizationResult = require('../../source/rules/authorization-result.js');
var AuthorizationAction = require('../../source/rules/authorization-action.js');

var RuleManager = require('../../source/rules/rule-manager.js');
var RuleList = require('../../source/rules/rule-list.js');
var RuleBase = require('../../source/rules/rule-base.js');
var ResultBase = require('../../source/rules/result-base.js');

var BrokenRules = require('../../source/rules/broken-rules.js');
var BrokenRuleList = require('../../source/rules/broken-rule-list.js');
var BrokenRule = require('../../source/rules/broken-rule.js');

var RuleSeverity = require('../../source/rules/rule-severity.js');
var NoAccessBehavior = require('../../source/rules/no-access-behavior.js');

var UserInfo = require('../../source/shared/user-info.js');
var Enumeration = require('../../source/shared/enumeration.js');

describe('Rule component index', function () {
  function getProperty () { }
  var rule = new RuleBase();
  var brokenRules = new BrokenRuleList('modelName');
  var brs = new BrokenRules();
  var user = new UserInfo('user-code');

  it('properties return correct components', function () {

    expect(new rules.ValidationRule('ruleName')).toEqual(jasmine.any(ValidationRule));
    expect(new rules.ValidationContext(getProperty, brokenRules)).toEqual(jasmine.any(ValidationContext));
    expect(new rules.ValidationResult('ruleName', 'propertyName', 'message')).toEqual(jasmine.any(ValidationResult));
    expect(new rules.ValidationError(brs)).toEqual(jasmine.any(ValidationError));

    expect(new rules.AuthorizationRule('ruleName')).toEqual(jasmine.any(AuthorizationRule));
    expect(new rules.AuthorizationContext(AuthorizationAction.writeProperty, 'property', user, brokenRules)).toEqual(jasmine.any(AuthorizationContext));
    expect(new rules.AuthorizationResult('ruleName', 'propertyName', 'message')).toEqual(jasmine.any(AuthorizationResult));
    expect(rules.AuthorizationAction).toEqual(jasmine.any(Enumeration));

    expect(new rules.RuleManager()).toEqual(jasmine.any(RuleManager));
    expect(new rules.RuleList('property', rule)).toEqual(jasmine.any(RuleList));
    expect(new rules.RuleBase()).toEqual(jasmine.any(RuleBase));
    expect(new rules.ResultBase()).toEqual(jasmine.any(ResultBase));

    expect(new rules.BrokenRules()).toEqual(jasmine.any(BrokenRules));
    expect(new rules.BrokenRuleList('model')).toEqual(jasmine.any(BrokenRuleList));
    expect(new rules.BrokenRule('name', false, 'property', 'message', RuleSeverity.error)).toEqual(jasmine.any(BrokenRule));

    expect(rules.RuleSeverity).toEqual(jasmine.any(Enumeration));
    expect(rules.NoAccessBehavior).toEqual(jasmine.any(Enumeration));
  });
});