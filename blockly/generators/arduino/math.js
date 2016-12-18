/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Arduino for math blocks.
 * @author gasolin@gmail.com  (Fred Lin)
 */
'use strict';

goog.provide('Blockly.Arduino.math');

goog.require('Blockly.Arduino');


Blockly.Arduino.math_number = function() {
  // Numeric value.
  var code = window.parseFloat(this.getFieldValue('NUM'));
  // -4.abs() returns -4 in Dart due to strange order of operation choices.
  // -4 is actually an operator and a number.  Reflect this in the order.
  var order = code < 0 ?
      Blockly.Arduino.ORDER_UNARY_PREFIX : Blockly.Arduino.ORDER_ATOMIC;
  return [code, order];
};

Blockly.Arduino.math_arithmetic = function() {
  // Basic arithmetic operators, and power.
  var mode = this.getFieldValue('OP');
  var tuple = Blockly.Arduino.math_arithmetic.OPERATORS[mode];
  var operator = tuple[0];
  var order = tuple[1];
  var argument0 = Blockly.Arduino.valueToCode(this, 'A', order) || '0';
  var argument1 = Blockly.Arduino.valueToCode(this, 'B', order) || '0';
  var code;
  if (!operator) {
    Blockly.Arduino.definitions_['include_math'] = '#include "math.h"\n';
    code = 'pow(' + argument0 + ', ' + argument1 + ')';
    return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX];
  }
  code = argument0 + operator + argument1;
  return [code, order];
};

Blockly.Arduino.math_arithmetic.OPERATORS = {
  ADD: [' + ', Blockly.Arduino.ORDER_ADDITIVE],
  MINUS: [' - ', Blockly.Arduino.ORDER_ADDITIVE],
  MULTIPLY: [' * ', Blockly.Arduino.ORDER_MULTIPLICATIVE],
  DIVIDE: [' / ', Blockly.Arduino.ORDER_MULTIPLICATIVE],
  POWER: [null, Blockly.Arduino.ORDER_NONE]  // Handle power separately.
};



Blockly.Arduino['math_single'] = function() {
  // Math operators with single operand.
  var operator = this.getFieldValue('OP');
  var code;
  var arg;
  if (operator == 'NEG') {
    // Negation is a special case given its different operator precedence.
    arg = Blockly.Arduino.valueToCode(this, 'NUM',
        Blockly.Arduino.ORDER_UNARY_NEGATION) || '0';
    if (arg[0] == '-') {
      // --3 is not legal in JS.
      arg = ' ' + arg;
    }
    code = '-' + arg;
    return [code, Blockly.Arduino.ORDER_UNARY_NEGATION];
  }
  Blockly.Arduino.definitions_['include_math'] = '#define _USE_MATH_DEFINES\n#include "math.h"\n';
  if (operator == 'SIN' || operator == 'COS' || operator == 'TAN') {
    arg = Blockly.Arduino.valueToCode(this, 'NUM',
        Blockly.Arduino.ORDER_DIVISION) || '0';
  } else {
    arg = Blockly.Arduino.valueToCode(this, 'NUM',
        Blockly.Arduino.ORDER_NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = 'abs(' + arg + ')';
      break;
    case 'ROOT':
      code = 'sqrt(' + arg + ')';
      break;
    case 'LN':
      code = 'log(' + arg + ')';
      break;
    case 'EXP':
      code = 'exp(' + arg + ')';
      break;
    case 'POW10':
      code = 'pow(10,' + arg + ')';
      break;
    case 'ROUND':
      code = 'round(' + arg + ')';
      break;
    case 'ROUNDUP':
      code = 'ceil(' + arg + ')';
      break;
    case 'ROUNDDOWN':
      code = 'floor(' + arg + ')';
      break;
    case 'SIN':
      code = 'sin(' + arg + ' / 180 * M_PI)';
      break;
    case 'COS':
      code = 'cos(' + arg + ' / 180 * M_PI)';
      break;
    case 'TAN':
      code = 'tan(' + arg + ' / 180 * M_PI)';
      break;
  }
  if (code) {
    return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'LOG10':
      code = 'log(' + arg + ') / log(10)';
      break;
    case 'ASIN':
      code = 'asin(' + arg + ') / M_PI * 180';
      break;
    case 'ACOS':
      code = 'acos(' + arg + ') / M_PI * 180';
      break;
    case 'ATAN':
      code = 'atan(' + arg + ') / M_PI * 180';
      break;
    default:
      throw 'Unknown math operator: ' + operator;
  }
  return [code, Blockly.Arduino.ORDER_DIVISION];
};

Blockly.Arduino['math_constant'] = function() {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  Blockly.Arduino.definitions_['include_math'] = '#define _USE_MATH_DEFINES\n#include "math.h"\n';
  var CONSTANTS = {
    'PI': ['M_PI', Blockly.Arduino.ORDER_MEMBER],
    'E': ['M_E', Blockly.Arduino.ORDER_MEMBER],
    'GOLDEN_RATIO':
        ['(1 + sqrt(5)) / 2', Blockly.Arduino.ORDER_DIVISION],
    'SQRT2': ['M_SQRT2', Blockly.Arduino.ORDER_MEMBER],
    'SQRT1_2': ['M_SQRT1_2', Blockly.Arduino.ORDER_MEMBER],
    'INFINITY': ['10000000', Blockly.Arduino.ORDER_ATOMIC]
  };
  return CONSTANTS[this.getFieldValue('CONSTANT')];
};

Blockly.Arduino['math_number_property'] = function() {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  Blockly.Arduino.definitions_['include_math'] = '#define _USE_MATH_DEFINES\n#include "math.h"\n';
  var number_to_check = Blockly.Arduino.valueToCode(this, 'NUMBER_TO_CHECK',
      Blockly.Arduino.ORDER_MODULUS) || '0';
  var dropdown_property = this.getFieldValue('PROPERTY');
  var code;
  if (dropdown_property == 'PRIME') {
    // Prime is a special case as it is not a one-liner test.
    Blockly.Arduino.definitions_['define_mathIsPrime'] =
        'bool mathIsPrime(n) {\n'+
         '  // https://en.wikipedia.org/wiki/Primality_test#Naive_methods\n'+
         '  if (n == 2 || n == 3) {\n'+
         '    return true;\n'+
         '  }\n'+
         '  // False if n is NaN, negative, is 1, or not whole.\n'+
         '  // And false if n is divisible by 2 or 3.\n'+
         '  if (n <= 1 || n % 2 == 0 || n % 3 == 0) {\n'+
         '    return false;\n'+
         '  }\n'+
         '  // Check all the numbers of form 6k +/- 1, up to sqrt(n).\n'+
         '  for (var x = 6; x <= sqrt(n) + 1; x += 6) {\n'+
         '    if (n % (x - 1) == 0 || n % (x + 1) == 0) {\n'+
         '      return false;\n'+
         '    }\n'+
         '  }\n'+
         '  return true;\n'+
         '}\n';
    code = 'mathIsPrime(' + number_to_check + ')';
    return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
  }
  switch (dropdown_property) {
    case 'EVEN':
      code = number_to_check + ' % 2 == 0';
      break;
    case 'ODD':
      code = number_to_check + ' % 2 == 1';
      break;
    case 'WHOLE':
      code = number_to_check + ' % 1 == 0';
      break;
    case 'POSITIVE':
      code = number_to_check + ' > 0';
      break;
    case 'NEGATIVE':
      code = number_to_check + ' < 0';
      break;
    case 'DIVISIBLE_BY':
      var divisor = Blockly.Arduino.valueToCode(this, 'DIVISOR',
          Blockly.Arduino.ORDER_MODULUS) || '0';
      code = number_to_check + ' % ' + divisor + ' == 0';
      break;
  }
  return [code, Blockly.Arduino.ORDER_EQUALITY];
};

Blockly.Arduino['math_change'] = function() {
  // Add to a variable in place.
  var argument0 = Blockly.Arduino.valueToCode(this, 'DELTA',
      Blockly.Arduino.ORDER_ADDITION) || '0';
  var varName = Blockly.Arduino.variableDB_.getName(
      this.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  return varName + ' += ' + argument0 + ';\n';
};

// Rounding functions have a single operand.
Blockly.Arduino['math_round'] = Blockly.Arduino['math_single'];
// Trigonometry functions have a single operand.
Blockly.Arduino['math_trig'] = Blockly.Arduino['math_single'];

Blockly.Arduino['math_modulo'] = function() {
  // Remainder computation.
  var argument0 = Blockly.Arduino.valueToCode(this, 'DIVIDEND',
      Blockly.Arduino.ORDER_MODULUS) || '0';
  var argument1 = Blockly.Arduino.valueToCode(this, 'DIVISOR',
      Blockly.Arduino.ORDER_MODULUS) || '0';
  var code = argument0 + ' % ' + argument1;
  return [code, Blockly.Arduino.ORDER_MODULUS];
};

Blockly.Arduino['math_constrain'] = function() {
  // Constrain a number between two limits.
  var argument0 = Blockly.Arduino.valueToCode(this, 'VALUE',
      Blockly.Arduino.ORDER_COMMA) || '0';
  var argument1 = Blockly.Arduino.valueToCode(this, 'LOW',
      Blockly.Arduino.ORDER_COMMA) || '0';
  var argument2 = Blockly.Arduino.valueToCode(this, 'HIGH',
      Blockly.Arduino.ORDER_COMMA) || '100000000';
  var code = 'min(max(' + argument0 + ', ' + argument1 + '), ' +
      argument2 + ')';
  return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
};

Blockly.Arduino['math_random_int'] = function() {
  // Random integer between [X] and [Y].
  var argument0 = Blockly.Arduino.valueToCode(this, 'FROM',
      Blockly.Arduino.ORDER_COMMA) || '0';
  var argument1 = Blockly.Arduino.valueToCode(this, 'TO',
      Blockly.Arduino.ORDER_COMMA) || '0';
  var code = 'random(' + argument0 + ', ' + argument1 + ')';
  return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
};
