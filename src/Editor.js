"use strict";

var FontMetrics = require('lib/FontMetrics'),
    Document = require('model/Document'),
    Selection = require('model/Selection'),
    Cursor = require('gui/Cursor'),
    TextInput = require('gui/TextInput'),
    Canvas = require('gui/Canvas');

/**
 * Simple plain-text text editor using html5 canvas.
 * @constructor
 */
var Editor = function() {
  this.options = {
    textColor: 'WindowText',
    backgroundColor: 'Window',
    selectionColor: 'Highlight',
    focusColor: '#09f',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 25,
    padding: 5,
    width: window.innerWidth - 25,
    height: 360
  };

  this._createWrapper();
  this._document = new Document();
  this._selection = new Selection(this._document);
  this._metrics = new FontMetrics(this.options.fontFamily, this.options.fontSize);
  this._cursor = new Cursor(this, this.options.textColor, this._metrics.getHeight());
  this.canvas = new Canvas(this);
  this.textInput = new TextInput(this);

  this._selection.onchange = this.canvas.selectionChange.bind(this.canvas);
};

module.exports = Editor;

Editor.prototype.className = 'canvas-text-editor';

Editor.prototype.setMode = function(mode) {
  this.mode = mode;
  this.canvas.render();
};

/**
 * Creates wrapper element for all parts of the editor
 * @private
 */
 Editor.prototype._createWrapper = function() {
  this.wrapper = document.createElement('div');
  this.wrapper.className = this.className;
  this.wrapper.style.position = 'absolute';
  this.wrapper.style.backgroundColor = this.options.backgroundColor;
  this.wrapper.style.border = this.options.padding + 'px solid ' + this.options.backgroundColor;
  this.wrapper.style.overflow = 'hidden';
  this.wrapper.tabIndex = 0; // tabindex is necessary to get focus
  this.wrapper.addEventListener('focus', this.focus.bind(this), false);
};

/**
 * Focus handler. Acts as a proxy to input focus.
 */
 Editor.prototype.focus = function() {
  this.textInput.inputEl.focus();
};

