'use strict';

//region Imports

const Argument = require( '../system/argument-check.js' );
const ResultBase = require( './result-base.js' );

//endregion

/**
 * Represents the failed result of executing an authorization rule.
 *
 * @memberof bo.rules
 * @extends bo.rules.ResultBase
 */
class AuthorizationResult extends ResultBase {

  /**
   * Creates a new authorization rule result object.
   *
   * @param {string} ruleName - The name of the rule.
   * @param {string} [targetName] - An eventual parameter of the authorization action.
   * @param {string} message - Human-readable description of the reason of the failure.
   *
   * @throws {@link bo.system.ArgumentError Argument error}: The rule name must be a non-empty string.
   * @throws {@link bo.system.ArgumentError Argument error}: The target name must be a string.
   * @throws {@link bo.system.ArgumentError Argument error}: The message must be a non-empty string.
   */
  constructor( ruleName, targetName, message ) {
    super( ruleName, targetName || '', message );

    targetName = Argument.inConstructor( this.constructor.name )
      .check( targetName || '' ).for( 'targetName' ).asString();
  }
}

module.exports = AuthorizationResult;
