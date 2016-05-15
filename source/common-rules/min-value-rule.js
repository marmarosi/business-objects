'use strict';

const t = require( '../locales/i18n-bo.js' )( 'Rules' );
const Argument = require( '../system/argument-check.js' );
const ValidationRule = require( '../rules/validation-rule.js' );

/**
 * The rule ensures that the value of the property reaches a given value.
 *
 * @memberof bo.commonRules
 * @extends bo.rules.ValidationRule
 */
class MinValueRule extends ValidationRule {

  /**
   * Creates a new min-value rule object.
   *
   * @param {bo.shared.PropertyInfo} primaryProperty - The property definition the rule relates to.
   * @param {number} minValue - The minimum value of the property.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority=10] - The priority of the rule.
   * @param {boolean} [stopsProcessing=false] - Indicates the rule behavior in case of failure.
   *
   * @throws {@link bo.system.ArgumentError Argument error}: The primary property must be a PropertyInfo object.
   * @throws {@link bo.system.ArgumentError Argument error}: The minimum value is required.
   * @throws {@link bo.system.ArgumentError Argument error}: The message must be a non-empty string.
   */
  constructor( primaryProperty, minValue, message, priority, stopsProcessing ) {
    super( 'MinValue' );

    /**
     * The minimum value of the property.
     * @member {number} bo.commonRules.MinValueRule#minValue
     * @readonly
     */
    this.minValue = Argument.inConstructor( this.constructor.name )
      .check( minValue ).forMandatory( 'minValue' ).hasValue();

    // Initialize base properties.
    this.initialize(
      primaryProperty,
      message || t( 'minValue', primaryProperty.name, minValue ),
      priority,
      stopsProcessing
    );

    // Immutable object.
    Object.freeze( this );
  }

  /**
   * Checks if the value of the property reaches the defined value.
   *
   * @function bo.commonRules.MinValueRule#execute
   * @param {Array.<*>} inputs - An array of the values of the required properties.
   * @returns {(bo.rules.ValidationResult|undefined)} Information about the failure.
   */
  execute( inputs ) {

    const value = inputs[ this.primaryProperty.name ];

    if (!value || value < this.minValue)
      return this.result( this.message );
  }
}

module.exports = MinValueRule;
