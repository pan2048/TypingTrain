"use strict";

const Statistics = require("../model/Statistics");

/**
 * Simple plain-text text editor using html5 canvas.
 * @constructor
 */
var TextInput = function(editor) {
  this.editor = editor;

  this._createInput();

  this.statistics = new Statistics();
};

module.exports = TextInput;

/**
 * Creates textarea that will handle user input and copy-paste actions
 * @private
 */
 TextInput.prototype._createInput = function() {
  this.inputEl = document.createElement('input');
  this.inputEl.style.position = 'absolute';
  this.inputEl.style.top = '-50px';
  this.inputEl.style.left = '-50px';
  this.inputEl.style.height = '20px';
  this.inputEl.style.width = '20px';
  this.inputEl.addEventListener('input', this.handleInput.bind(this), false);
  this.inputEl.addEventListener('blur', this.blur.bind(this), false);
  this.inputEl.addEventListener('focus', this._inputFocus.bind(this), false);
  this.inputEl.addEventListener('keydown', this.keydown.bind(this), false);

  this.inputEl.addEventListener('keydown', this.addKeyModifier.bind(this), true);
  this.inputEl.addEventListener('keyup', this.removeKeyModfier.bind(this), true);
  this.inputEl.addEventListener('focus', this.clearKeyModifiers.bind(this), true);

  this.inputEl.tabIndex = -1; // we don't want input to get focus by tabbing
  this.editor.wrapper.appendChild(this.inputEl);
  this.editor.textInput = this;
  this.setInputText('', true);
};

/**
 * Determines if current browser is Opera
 * @type {Boolean}
 */
TextInput.prototype.isOpera = ('opera' in window) && ('version' in window.opera);

/**
 * Determines if user holds shift key at the moment
 * @type {Boolean}
 */
TextInput.prototype.shiftPressed = false;

 /**
  * Marks important for us key modfiers as pressed
  * @param {Event} e
  */
TextInput.prototype.addKeyModifier = function(e) {
   if (e.keyCode === 16) {
     this.shiftPressed = true;
   }
 };

 /**
 * Unmarks important for us key modfiers as pressed
 * @param {Event} e
 */
TextInput.prototype.removeKeyModfier = function(e) {
  if (e.keyCode === 16) {
    this.shiftPressed = false;
  }
};

/**
 * Clears all key modifiers
 */
TextInput.prototype.clearKeyModifiers = function() {
  this.shiftPressed = false;
};

/**
 * Handles regular text input into our proxy field
 * @param  {Event} e
 */
 TextInput.prototype.handleInput = function(e) {
  if (e.isComposing) {
    // Nothing to do during composition
    return;
  }
  var value = e.target.value;
  if (this.isOpera) {
    // Opera doesn't need a placeholder
    value = value.substring(0, value.length);
  } else {
    // Compensate for placeholder
    value = value.substring(0, value.length - 1);
  }
  if(this.handleInputCallback(value))
    ;
  this.needsClearing = true;  
  this.setInputText('', false);
  this.editor.canvas.render();
};

TextInput.prototype.handleInputCallback = function(value) {
  if(this.editor.mode === "type") {
    var pos = this.editor._selection.getPosition();
    var realValue = this.editor._document.charAt(pos[0],pos[1]);
    this.statistics.InputOne(value, realValue);
    if(value === realValue) {
      this.editor._selection.moveRight(1, false);
      this.testDone();  
    } else {
      this.editor.messageBox.log("Should be '" + realValue + "', not '" + value + "'");
      return false;
    }
  } else {
    this.editor._selection.insertTextAtCurrentPosition(value);
  }
  return true;
};

/**
 * Makes input contain only placeholder character and places cursor at start
 */
 TextInput.prototype.setInputText = function(text, force) {
  if(this.needsClearing || force === true) {
    if (this.isOpera) {
      this.inputEl.value = text;
      this.inputEl.select();
    } else {
      this.inputEl.value = text + '#';
      this.inputEl.selectionStart = 0;
      this.inputEl.selectionEnd = text.length;
    }
  }
  this.needsClearing = false;
};

/**
 * Blur handler.
 */
 TextInput.prototype.blur = function() {
  this.editor.wrapper.style.outline = 'none';
  this.editor._cursor.setVisible(false);
};


/**
 * Real handler code for editor gaining focus.
 * @private
 */
 TextInput.prototype._inputFocus = function() {
  this.editor.wrapper.style.outline = '3px solid ' + this.editor.options.focusColor;
  this.editor._cursor.setVisible(true);
};

TextInput.prototype.testDone = function(e) {
  var pos = this.editor._selection.getPosition();
  var realValue = this.editor._document.charAt(pos[0],pos[1]);
  if (!realValue) {
    this.editor._document.setText(this.editor._document.genText());
    this.editor._selection.setPosition(0, 0);
    var percent = 0,
      wrongs = [];
    [percent, wrongs] = this.statistics.Done();
    alert("You have a right score of " + Math.round(percent*1000)/10 + "%, and wrong ones are [" + wrongs + "]");
  }
}

/**
 * Main keydown handler
 * @param  {Event} e
 */
 TextInput.prototype.keydown = function(e) {
  var handled = true;
  if(this.editor.mode === "type") {
    var pos = this.editor._selection.getPosition();
    var realValue = this.editor._document.charAt(pos[0],pos[1]);
    if(e.keyCode === 13 && realValue === '\n' ) {
      this.editor._selection.moveRight(1, false);
      this.testDone();  
    }
    handled = false;
    this.editor.canvas.render();
    return
  } 
  switch(e.keyCode) {
    case 8: // Backspace
      this.editor._selection.deleteCharAtCurrentPosition(false);
      break;
    case 46: // Delete
      this.editor._selection.deleteCharAtCurrentPosition(true);
      break;
    case 13: // Enter
      this.editor._selection.insertTextAtCurrentPosition('\n');
      break;
    case 37: // Left arrow
      this.editor._selection.moveLeft(1, this.shiftPressed);
      break;
    case 38: // Up arrow
      this.editor._selection.moveUp(1, this.shiftPressed);
      break;
    case 39: // Right arrow
      this.editor._selection.moveRight(1, this.shiftPressed);
      break;
    case 40: // Down arrow
      this.editor._selection.moveDown(1, this.shiftPressed);
      break;
    default:
      handled = false;
  }
  if(handled) {
    e.preventDefault();
  }
  this.editor.canvas.render()
};


