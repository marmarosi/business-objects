'use strict';

const t = require( '../locales/i18n-bo.js' )( 'Rules' );
const Argument = require( '../system/argument-check.js' );
const ValidationRule = require( '../rules/validation-rule.js' );

/**
 * The rule ensures that the length of the property value has a given length.
 *
 * @memberof bo.commonRules
 * @extends bo.rules.ValidationRule
 */
class LengthIsRule extends ValidationRule {

  /**
   * Creates a new length-is rule object.
   *
   * @param {bo.shared.PropertyInfo} primaryProperty - The property definition the rule relates to.
   * @param {number} length - The required length of the property value.
   * @param {string} message - Human-readable description of the rule failure.
   * @param {number} [priority=10] - The priority of the rule.
   * @param {boolean} [stopsProcessing=false] - Indicates the rule behavior in case of failure.
   *
   * @throws {@link bo.system.ArgumentError Argument error}: The primary property must be a PropertyInfo object.
   * @throws {@link bo.system.ArgumentError Argument error}: The length must be an integer value.
   * @throws {@link bo.system.ArgumentError Argument error}: The message must be a non-empty string.
   */
  constructor( primaryProperty, length, message, priority, stopsProcessing ) {
    super( 'LengthIs' );

    /**
     * The required length of the property value.
     * @member {number} bo.commonRules.LengthIsRule#length
     * @readonly
     */
    this.length = Argument.inConstructor( this.constructor.name )
      .check( length ).forMandatory( 'length' ).asInteger();

    // Initialize base properties.
    this.initialize(
      primaryProperty,
      message || (length > 1 ?
        t( 'lengthIs', primaryProperty.name, length ) :
        t( 'lengthIs1', primaryProperty.name )),
      priority,
      stopsProcessing
    );

    // Immutable object.
    Object.freeze( this );
  }

  /**
   * Checks if the length of the property value equals to the defined length.
   *
   * @function bo.commonRules.LengthIsRule#execute
   * @param {Array.<*>} inputs - An array of the values of the required properties.
   * @returns {(bo.rules.ValidationResult|undefined)} Information about the failure.
   */
  execute( inputs ) {

    const value = inputs[ this.primaryProperty.name ];

    if (!value || value.toString().length !== this.length)
      return this.result( this.message );
  }
}

module.exports = LengthIsRule;
