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
 * @fileoverview Generating Arduino for text blocks.
 * @author gasolin@gmail.com (Fred Lin)
 */
'use strict';

goog.provide('Blockly.Arduino.texts');

goog.require('Blockly.Arduino');


Blockly.Arduino.text = function() {
  // Text value.
  var code = 'String(' + Blockly.Arduino.quote_(this.getFieldValue('TEXT')) + ')';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['text_append'] = function() {
  // Append to a variable in place.
  var varName = Blockly.Arduino.variableDB_.getName(
      this.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var value = Blockly.Arduino.valueToCode(this, 'TEXT',
      Blockly.Arduino.ORDER_NONE) || '""';
  return varName + ' = String(' + varName + ') + String(' + value + ');\n';
};

Blockly.Arduino['text_length'] = function() {
  // String or array length.
  var text = Blockly.Arduino.valueToCode(this, 'VALUE',
      Blockly.Arduino.ORDER_FUNCTION_CALL) || 'String("")';
  return [text + '.length()', Blockly.Arduino.ORDER_MEMBER];
};

Blockly.Arduino['text_isEmpty'] = function() {
  // Is the string null or array empty?
  var text = Blockly.Arduino.valueToCode(this, 'VALUE',
      Blockly.Arduino.ORDER_MEMBER) || 'String("")';
  return ['!' + text + '.length()', Blockly.Arduino.ORDER_LOGICAL_NOT];
};

Blockly.Arduino['text_indexOf'] = function() {
  // Search the text for a substring.
  var operator = this.getFieldValue('END') == 'FIRST' ?
      'indexOf' : 'lastIndexOf';
  var substring = Blockly.Arduino.valueToCode(this, 'FIND',
      Blockly.Arduino.ORDER_NONE) || '""';
  var text = Blockly.Arduino.valueToCode(this, 'VALUE',
      Blockly.Arduino.ORDER_MEMBER) || 'String("")';
  var code = text + '.' + operator + '(' + substring + ')';
  // Adjust index if using one-based indices.
  if (this.workspace.options.oneBasedIndex) {
    return [code + ' + 1', Blockly.Arduino.ORDER_ADDITION];
  }
  return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
};

Blockly.Arduino['text_charAt'] = function() {
  // Get letter at index.
  var where = this.getFieldValue('WHERE') || 'FROM_START';
  var text = Blockly.Arduino.valueToCode(this, 'VALUE',
      Blockly.Arduino.ORDER_MEMBER) || 'String("")';
  var at = Blockly.Arduino.valueToCode(this, 'AT', Blockly.Arduino.ORDER_NONE);
  switch (where) {
    case 'FROM_START':
      var code = text + '.charAt(' + at + ')';
      return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
    case 'FROM_END':
      var code = text + '.charAt(' + text + '.length() - ' + at + ')';
      return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
  }
  throw 'Unhandled option (text_charAt).';
};

Blockly.Arduino['text_getSubstring'] = function() {
  // Get substring.
  var text = Blockly.Arduino.valueToCode(this, 'STRING',
      Blockly.Arduino.ORDER_FUNCTION_CALL) || 'String("")';
  var where1 = this.getFieldValue('WHERE1') || 'FROM_START';
  var at1 = Blockly.Arduino.valueToCode(this, 'AT1', Blockly.Arduino.ORDER_NONE);
  var where2 = this.getFieldValue('WHERE2') || 'FROM_START';
  var at2 = Blockly.Arduino.valueToCode(this, 'AT2', Blockly.Arduino.ORDER_NONE);
  if (where1 == 'FROM_END') {
    at1 = text + '.length() - ' + at1;
  }
  if (where2 == 'FROM_END') {
    at2 = text + '.length() - ' + at2;
  }
  code = text + '.substring(' + at1 + ', ' + at2 + ')';
  return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
};

Blockly.Arduino['text_changeCase'] = function() {
  // Change capitalization.
  var OPERATORS = {
    'UPPERCASE': '.toUpperCase()',
    'LOWERCASE': '.toLowerCase()',
    'TITLECASE': null
  };
  var operator = OPERATORS[this.getFieldValue('CASE')];
  var textOrder = operator ? Blockly.Arduino.ORDER_MEMBER :
      Blockly.Arduino.ORDER_NONE;
  var text = Blockly.Arduino.valueToCode(this, 'TEXT',
      textOrder) || 'String("")';
  if (operator) {
    // Upper and lower case are functions built into Arduino.
    var code = text + operator;
  } else {
    var code = text;
  }
  return [code, Blockly.Arduino.ORDER_FUNCTION_CALL];
};

Blockly.Arduino['text_trim'] = function() {
  var text = Blockly.Arduino.valueToCode(this, 'TEXT',
      Blockly.Arduino.ORDER_MEMBER) || 'String("")';
  return [text + '.trim()', Blockly.Arduino.ORDER_FUNCTION_CALL];
};
