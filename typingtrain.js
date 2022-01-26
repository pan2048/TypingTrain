
(function(/*! Stitch !*/) {
  if (!this.require) {
    var modules = {}, cache = {}, require = function(name, root) {
      var path = expand(root, name), module = cache[path], fn;
      if (module) {
        return module.exports;
      } else if (fn = modules[path] || modules[path = expand(path, './index')]) {
        module = {id: path, exports: {}};
        try {
          cache[path] = module;
          fn(module.exports, function(name) {
            return require(name, dirname(path));
          }, module);
          return module.exports;
        } catch (err) {
          delete cache[path];
          throw err;
        }
      } else {
        throw 'module \'' + name + '\' not found';
      }
    }, expand = function(root, name) {
      var results = [], parts, part;
      if (/^\.\.?(\/|$)/.test(name)) {
        parts = [root, name].join('/').split('/');
      } else {
        parts = name.split('/');
      }
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part == '..') {
          results.pop();
        } else if (part != '.' && part != '') {
          results.push(part);
        }
      }
      return results.join('/');
    }, dirname = function(path) {
      return path.split('/').slice(0, -1).join('/');
    };
    this.require = function(name) {
      return require(name, '');
    }
    this.require.define = function(bundle) {
      for (var key in bundle)
        modules[key] = bundle[key];
    };
  }
  return this.require.define;
}).call(this)({"Editor": function(exports, require, module) {"use strict";

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

}, "Gui": function(exports, require, module) {var Gui = function() {
  document.addEventListener('DOMContentLoaded', function(){
    var Editor = require('Editor'),
      editor = new Editor();
    var LocalFile = require('gui/LocalFile'),
      localFile = new LocalFile(editor);
    var EditorMode = require('gui/EditorMode'),
      editorMode = new EditorMode(editor);      
    var MessageBox = require('gui/MessageBox'),
      messageBox = new MessageBox();
    
    editor.messageBox = messageBox;  
    document.body.appendChild(editor.wrapper); 

    editor.focus();
  }, false);
};

module.exports = Gui;}, "gui/Canvas": function(exports, require, module) {"use strict";

var Canvas = function(editor) {
  this.editor = editor;

  this._createCanvas();
};

module.exports = Canvas;

Canvas.prototype._scrollTop = 0;
Canvas.prototype._scrollLeft = 0;

/**
 * Handles selection change
 */
Canvas.prototype.selectionChange = function() {
  this._checkScroll();
 
  // Assume that selection is empty
  var selectedText = this.editor._selection.getText();
  this.editor.textInput.setInputText(selectedText, true);
};

/**
 * Creates canvas for drawing
 * @private
 */
Canvas.prototype._createCanvas = function() {
  this.canvas = document.createElement('canvas');
  this.canvas.style.display = 'block';
  this.context = this.canvas.getContext('2d');
  this.resize(this.editor.options.width, this.editor.options.height);
  this.render();
  this.editor.wrapper.appendChild(this.canvas);
};

/**
 * Makes sure that cursor is visible
 * @return {[type]} [description]
 */
Canvas.prototype._checkScroll = function() {
  var RightGuard = 5;
  var BottomGuard = 2;
  var maxHeight = Math.ceil(this.canvas.height / this.editor._metrics.getHeight()) - 1,
      maxWidth = Math.ceil(this.canvas.width / this.editor._metrics.getWidth()) - 1,
      cursorPosition = this.editor._selection.getPosition();
  if (cursorPosition[0] > this._scrollLeft + maxWidth - RightGuard) {
    this._scrollLeft = cursorPosition[0] - maxWidth + RightGuard;
  } else if (cursorPosition[0] < this._scrollLeft) {
    this._scrollLeft = cursorPosition[0];
  }
  if (cursorPosition[1] > this._scrollTop + maxHeight - BottomGuard) {
    this._scrollTop = cursorPosition[1] - maxHeight + BottomGuard;
  } else if (cursorPosition[1] < this._scrollTop) {
    this._scrollTop = cursorPosition[1];
  }

  // Calculating new position on the screen
  var position = this.editor._selection.getPosition(),
  offsetY = (position[1] - this._scrollTop) * this.editor._metrics.getHeight();

  var line = this.editor._document.getLine(position[1]);
  var offsetX = 0;
  for(let i=this._scrollLeft; i<position[0]; i++) {    
    [i, offsetX] = this.calculateUtf(line, i, offsetY,offsetX);
  }    
  this.editor._cursor.updateCursor(offsetX, offsetY);
};

/**
 * Renders document onto the canvas
 * @return {[type]} [description]
 */
 Canvas.prototype.render = function() {
  var baselineOffset = this.editor._metrics.getBaseline(),
      lineHeight = this.editor._metrics.getHeight(),
      characterWidth = this.editor._metrics.getWidth(),
      maxHeight = Math.ceil(this.canvas.height / lineHeight) + this._scrollTop,
      lineCount = this.editor._document.getLineCount(),
      selectionRanges = this.editor._selection.lineRanges(),
      selectionWidth = 0;

  // Making sure we don't render something that we won't see
  if (lineCount < maxHeight) {
    maxHeight = lineCount;
  }

  // Clearing previous iteration
  this.context.fillStyle = this.editor.options.backgroundColor;
  this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  this.context.fillStyle = this.editor.options.textColor;

  // Looping over document lines
  for(var i = this._scrollTop; i < maxHeight; ++i) {
    var topOffset = lineHeight * (i - this._scrollTop);

    // Rendering selection for this line if one is present
    if (selectionRanges[i]) {
      this.context.fillStyle = this.editor.options.selectionColor;

      this.fillSelection(this.editor._document.getLine(i), selectionRanges[i], topOffset, lineHeight);
      // Restoring fill color for the text
      this.context.fillStyle = this.editor.options.textColor;
    }

    if (this.editor.mode === "type") {
      var pos = this.editor._selection.getPosition();
      if(i < pos[1]) {
        this.context.fillStyle = this.editor.options.selectionColor;
            // Drawing text
        this.fillText(this.editor._document.getLine(i).slice(this._scrollLeft), 0, topOffset + baselineOffset)
        this.context.fillStyle = this.editor.options.textColor;
        continue;  
      }
      if(i === pos[1]) {
        this.context.fillStyle = this.editor.options.selectionColor;
            // Drawing text
        var offset = this.fillText(this.editor._document.getLine(i).slice(this._scrollLeft, pos[0]), 0, topOffset + baselineOffset)
        this.context.fillStyle = this.editor.options.textColor;
        this.fillText(this.editor._document.getLine(i).slice(pos[0]), pos[0]-this._scrollLeft, topOffset + baselineOffset, offset)
        continue;          
      }      
    }
    // Drawing text
    this.fillText(this.editor._document.getLine(i).slice(this._scrollLeft), 0, topOffset + baselineOffset)
  }
};

Canvas.prototype.fillSelection = function (line, selectionRanges, topOffset, lineHeight) {
  let characterWidth = this.editor._metrics.getWidth();
  // Check whether we should select to the end of the line or not
  let selectionWidth = 0;
  if(selectionRanges[1] === true) {
    selectionWidth = this.canvas.width;
  } else {
    selectionWidth = 0;
    for(let i=selectionRanges[0]; i<selectionRanges[1]; i++) {
      [i, selectionWidth] = this.calculateUtf(line, i, topOffset, selectionWidth);
    }
  }

  let leftWidth = 0;
  for(let i=this._scrollLeft; i<selectionRanges[0]; i++) {
    [i, leftWidth] = this.calculateUtf(line, i, topOffset, leftWidth);
  }

  // Drawing selection
  this.context.fillRect(
    leftWidth,
    topOffset,
    selectionWidth,
    lineHeight
  );
}

Canvas.prototype.calculateUtf = function (line, i, y, offset = 0) {
  let a = line.charCodeAt(i);
  if(line.charCodeAt(i) > 128) {
    offset += this.editor._metrics.getWidthUtf();
  } else {
    offset += this.editor._metrics.getWidth();
  }
  return [i, offset]
}

Canvas.prototype.writeUtf = function (line, i, y, offset = 0) {
  let color = this.context.fillStyle;
  let a = line.charCodeAt(i);
  if(line.charCodeAt(i) > 128) {
    this.context.fillStyle = "Gainsboro";
    this.context.globalAlpha = 0.2;
    this.context.fillRect(offset, y - this._metrics.getBaseline(),
      this._metrics.getWidthUtf(),
      this._metrics.getHeight()
    );
    this.context.globalAlpha = 1.0;
    this.context.fillStyle = color;
    this.context.fillText(line[i], offset, y);           
    offset += this.editor._metrics.getWidthUtf();
  } else {
    this.context.fillStyle = "Gainsboro";
    this.context.globalAlpha = 0.2;
    this.context.fillRect(offset, y- this.editor._metrics.getBaseline(),
      this.editor._metrics.getWidth(),
      this.editor._metrics.getHeight()
    );
    this.context.globalAlpha = 1.0;
    this.context.fillStyle = color;
    this.context.fillText(line[i], offset, y);           
    offset += this.editor._metrics.getWidth();
  }
  return [i, offset]
}

Canvas.prototype.fillText = function (line, baseX, y, offset = 0) {
  let characterWidth = this.editor._metrics.getWidth();

  for(let i=0; i<line.length; i++) {
    [i, offset] = this.writeUtf(line, i, y, offset);
  }
  return offset;
}

/**
 * Resizes editor to provided dimensions.
 * @param  {Number} width 
 * @param  {Number} height
 */
 Canvas.prototype.resize = function(width, height) {
  this.canvas.width = width;
  this.canvas.height = height;
  // We need to update context settings every time we resize
  this.context.font = this.editor._metrics.getSize() + 'px ' + this.editor._metrics.getFamily();
};

}, "gui/Cursor": function(exports, require, module) {var Cursor = function(editor, color, height) {
  color = color || (color = '#000');

  this.el = document.createElement('div');
  this.el.style.position = 'absolute';
  this.el.style.width = '2px';
  this.el.style.height = height + 'px';
  this.el.style.backgroundColor = color;

  editor.wrapper.appendChild(this.el);
};

/**
 * Hold blink interval for the cursor
 * @type {Number}
 */
Cursor.prototype.blinkInterval = 500;

/**
 * Responsible for blinking
 * @return {void}
 */
Cursor.prototype.blink = function() {
  if (parseInt(this.el.style.opacity, 10)) {
    this.el.style.opacity = 0;
  } else {
    this.el.style.opacity = 1;
  }
};

/**
 * Updates cursor so it matches current position
 */
Cursor.prototype.updateCursor = function(offsetX, offsetY) {
  this.el.style.left = offsetX + 'px';
  this.el.style.top = offsetY + 'px';

  // This helps to see moving cursor when it is always in blink on
  // state on a new position. Try to move cursror in any editor and you
  // will see this in action.
  if(this.isVisible()) {
    this.el.style.opacity = 1;
    clearInterval(this.interval);
    this.interval = setInterval(this.blink.bind(this), this.blinkInterval);
  }
};

/**
 * Shows or hides cursor.
 * @param {void} visible Whether cursor should be visible
 */
Cursor.prototype.setVisible = function(visible) {
  clearInterval(this.interval);
  if(visible) {
    this.el.style.display = 'block';
    this.el.style.opacity = 1;
    this.interval = setInterval(this.blink.bind(this), this.blinkInterval);
  } else {
    this.el.style.display = 'none';
  }
  this.visible = visible;
};

/**
 * Returns visibility of the cursor.
 * @return {Boolean}
 */
Cursor.prototype.isVisible = function() {
  return this.visible;
};

module.exports = Cursor;
}, "gui/EditorMode": function(exports, require, module) {"use strict";

const HtmlTemplate = require ("../lib/HtmlTemplate")

var EditorMode = function (editor) {
    document.body.appendChild(HtmlTemplate.htmlToElement(`
    <div>
    <form id="editor_mode_form">
        <fieldset>
            <legend>Editor mode</legend>
            <input type="radio" name="editor_mode_input" checked="checked" value="type">Typing</input>
            <input type="radio" name="editor_mode_input" value="edit">Editing</input>
        </fieldset>
    </form>
    </div>
    `));
    var elements = document.getElementsByName('editor_mode_input');        
    for(var i = 0; i < elements.length; i++) {
        if(elements[i].checked)
            editor.setMode(elements[i].value);
    }
    document.getElementById("editor_mode_form").addEventListener('click', function (event) {
        if (event.target && event.target.matches("input[name='editor_mode_input']")) {
            editor.setMode(event.target.value);
        }
    });    
};

module.exports = EditorMode;
}, "gui/LocalFile": function(exports, require, module) {"use strict";

const HtmlTemplate = require ("../lib/HtmlTemplate")
const File = require ("../lib/File")

var LocalFile = function (editor) {
    document.body.appendChild(HtmlTemplate.htmlToElement(`
    <div>
    <form>
        <fieldset style="float:left">
            <legend>Upload file</legend>
            <input type="file" id="load_file"></button>
        </fieldset>
        <fieldset style="float:initial">
            <legend>Download file</legend>
            File name: <input type="text" id="file_name" id="name" size="12">
            <input type="button" value="Download" id="save_file"></button>
        </fieldset>
    </form>
    </div>
    `));
    document.getElementById("load_file").addEventListener('change', function (event) {
        File.upload(event, function(text) {
            editor._document.setText(text.replaceAll('\t', '  '));
            editor.canvas.render();
        })
    }, false);    
    document.getElementById("save_file").addEventListener('click', function (event) {
        var fileName = document.getElementById('file_name').value || "sample.txt";
        var text = editor._document.getText();
        File.download(fileName, text);        
    });    
};

module.exports = LocalFile;
}, "gui/MessageBox": function(exports, require, module) {"use strict";

const HtmlTemplate = require ("../lib/HtmlTemplate")

var MessageBox = function () {
    document.body.appendChild(HtmlTemplate.htmlToElement(`
    <div>
        <fieldset>
            <legend>Message box</legend>
            <div id="message_box">&nbsp</input>
        </fieldset>
    </div>
    `)); 
};

MessageBox.prototype.log = function(msg) {
    const node = document.getElementById('message_box');
    node.innerHTML = msg;
    function clean() {
        if(node.innerHTML == msg) {
            node.innerHTML = "&nbsp";
        }
      }
      setTimeout(clean, 3000);
}

module.exports = MessageBox;
}, "gui/TextInput": function(exports, require, module) {"use strict";

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


}, "lib/Cookie": function(exports, require, module) {function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}
  
function setCookie(cname, cvalue) {
    const d = new Date();
    d.setTime(d.getTime() + (365*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
  

module.exports = {
    getCookie,
    setCookie
}}, "lib/File": function(exports, require, module) {
function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}

function upload(event, callback) {
    var file = event.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function(event) {
        var text = event.target.result; 
        callback(text);
    };
    reader.readAsText(file);
}

module.exports = {
    download,
    upload
}}, "lib/FontMetrics": function(exports, require, module) {"use strict";

/**
 * A simple wrapper for system fonts to provide
 * @param {String} family Font Family (same as in CSS)
 * @param {Number} size Size in px
 * @constructor
 */
var FontMetrics = function(family, size) {
  this._family = family || (family = "Monaco, 'Courier New', Courier, monospace");
  this._size = parseInt(size) || (size = 18);

  // Preparing container
  var line = document.createElement('div');
  line.style.position = 'absolute';
  line.style.whiteSpace = 'nowrap';
  line.style.font = size + 'px ' + family;
  document.body.appendChild(line);

  // Now we can measure width and height of the letter
  var text = 'mmmmmmmm'; // 10 symbols to be more accurate with width
  var textUtf = '美美美美美美美美美美'; // 10 symbols to be more accurate with width
  line.innerHTML = text;
  this._width = line.offsetWidth  / text.length;
  this._height = line.offsetHeight;

  line.innerHTML = textUtf;
  this._widthUtf = line.offsetWidth  / textUtf.length;
  this._heightUtf = line.offsetHeight;
  this._height = this._heightUtf

  // Now creating 1px sized item that will be aligned to baseline
  // to calculate baseline shift
  var span = document.createElement('span');
  span.style.display = 'inline-block';
  span.style.overflow = 'hidden';
  span.style.width = '1px';
  span.style.height = '1px';
  line.appendChild(span);

  // Baseline is important for positioning text on canvas
  this._baseline = span.offsetTop + span.offsetHeight;

  document.body.removeChild(line);
};

module.exports = FontMetrics;

/**
 * Returns font family
 * @return {String}
 */
FontMetrics.prototype.getFamily = function() {
  return this._family;
};

/**
 * Returns font family
 * @return {Number}
 */
FontMetrics.prototype.getSize = function() {
  return this._size;
};

/**
 * Returns line height in px
 * @return {Number}
 */
FontMetrics.prototype.getHeight = function() {
  return this._height;
};
FontMetrics.prototype.getHeightUtf = function() {
  return this._heightUtf;
};
/**
 * Returns line height in px
 * @return {Number}
 */
FontMetrics.prototype.getWidth = function() {
  return this._width;
};
FontMetrics.prototype.getWidthUtf = function() {
  return this._widthUtf;
};

/**
 * Returns line height in px
 * @return {Number}
 */
FontMetrics.prototype.getBaseline = function() {
  return this._baseline;
};
}, "lib/HtmlTemplate": function(exports, require, module) {"use strict";

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
 function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

/**
 * @param {String} HTML representing any number of sibling elements
 * @return {NodeList} 
 */
function htmlToElements(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.childNodes;
}

module.exports = {
    htmlToElement, 
    htmlToElements
}
}, "model/Document": function(exports, require, module) {"use strict";

const Statistics = require("../model/Statistics");

var Document = function(text) {
  this.statistics = new Statistics();
  text = text || this.genText();
  this.storage = this.prepareText(text);
};

module.exports = Document;

Document.prototype.genText = function() {
  var text = '',
    characterCount = 0,
    arr = Array.from('!@#$%^&*()_+~`1234567890-={}[]:"|;\'\\<>?|,./\\');
  arr = arr.concat(this.statistics.getHistory());

  for (var i = 0; i < 6; i++) {
    characterCount = Math.floor(Math.random() * 3) + 9;
    for (var j = 0; j < characterCount; j++) {
      text += arr[Math.floor(Math.random() * arr.length)];
    };
    text += '\n';
  }
  return text;
}

Document.prototype.setText = function(text) {
  this.storage = this.prepareText(text);
}
/**
 * Splits text into array of lines. Can't use .split('\n') because
 * we want to keep trailing \n at the ends of lines.
 * @param  {string} text
 * @return {Array.{string}}
 */
Document.prototype.prepareText = function(text) {
  var lines = [],
      index = 0,
      newIndex;
  do {
    newIndex = text.indexOf('\n', index);
    // Adding from previous index to new one or to the end of the string
    lines.push(text.substr(index,  newIndex !== -1 ? newIndex - index + 1 : void 0));
    // next search will be after found newline
    index = newIndex + 1; 
  } while (newIndex !== -1);

  return lines;
};

/**
 * Returns line count for the document
 * @return {number}
 */
Document.prototype.getLineCount = function() {
  return this.storage.length;
};

/**
 * Returns line on the corresponding index.
 * @param  {number} 0-based index of the line
 * @return {string}
 */
Document.prototype.getLine = function(index) {
  return this.storage[index];
};

/**
 * Returns linear length of the document.
 * @return {number}
 */
Document.prototype.getLength = function() {
  var sum = 0;
  for(var i = this.storage.length - 1; i >= 0; --i) {
    sum += this.storage[i].length;
  }
  return sum;
};

/**
 * Returns linear length of the document.
 * @return {number}
 */
 Document.prototype.getText = function() {
  var text = "";
  for(var i=0; i<this.storage.length; i++) {
    text += this.storage[i];
  }
  return text;
};


/**
 * Returns char at specified offset.
 * @param  {number} offset
 * @return {string|undefined}
 */
Document.prototype.charAt = function(column, row) {
  row = this.storage[row];
  if (row){
    return row.charAt(column);
  }
};

/**
 * Inserts text into arbitrary position in the document
 * @param  {string} text
 * @param  {number} column
 * @param  {number} row
 * @return {Array} new position in the document
 */
Document.prototype.insertText = function(text, column, row) {
  // First we need to split inserting text into array lines
  text = this.prepareText(text);

  // First we calculate new column position because
  // text array will be changed in the process
  let text0 = text[text.length - 1];
  var newColumn = text0.length;
  if (text.length === 1) {
    newColumn += column;
  }

  // append remainder of the current line to last line in new text
  text[text.length - 1] += this.storage[row].substr(column);

  // append first line of the new text to current line up to "column" position
  this.storage[row] = this.storage[row].substr(0, column) + text[0];

  // now we are ready to splice other new lines
  // (not first and not last) into our storage
  var args = [row + 1, 0].concat(text.slice(1));
  this.storage.splice.apply(this.storage, args);

  // Finally we calculate new position
  column = newColumn;
  row += text.length - 1;

  return [column, row];
};

/**
 * Deletes text with specified range from the document.
 * @param  {number} startColumn
 * @param  {number} startRow
 * @param  {number} endColumn
 * @param  {number} endRow
 */
Document.prototype.deleteRange = function(startColumn, startRow, endColumn, endRow) {

  // Check bounds
  startRow >= 0 || (startRow = 0);
  startColumn >= 0 || (startColumn = 0);
  endRow < this.storage.length || (endRow = this.storage.length - 1);
  endColumn <= this.storage[endRow].replace(/(\r\n|\n|\r)/gm, "").length || (endColumn = this.storage[endRow].length);

  // Little optimization that does nothing if there's nothing to delete
  if(startColumn === endColumn && startRow === endRow) {
    return [startColumn, startRow];
  }

  // Now we append start of start row to the remainder of endRow
  this.storage[startRow] = this.storage[startRow].substr(0, startColumn) + 
                           this.storage[endRow].substr(endColumn);

  // And remove everything inbetween
  this.storage.splice(startRow + 1, endRow - startRow);

  // Return new position
  return [startColumn, startRow];
};

/**
 * Deletes one char forward or backward
 * @param  {boolean} forward
 * @param  {number}  column
 * @param  {number}  row
 * @return {Array}   new position
 */
Document.prototype.deleteChar = function(forward, startColumn, startRow) {
  var endRow = startRow,
      endColumn = startColumn;

  if (forward) {
    var characterCount = this.storage[startRow].replace(/(\r\n|\n|\r)/gm, "").length;
    // If there are characters after cursor on this line we simple remove one
    if (startColumn < characterCount) {
      ++endColumn;
    }
    // if there are rows after this one we append it
    else {
      startColumn = characterCount;
      if (startRow < this.storage.length - 1) {
        ++endRow;
        endColumn = 0;
      }
    }
  }
  // Deleting backwards
  else {
    // If there are characters before the cursor on this line we simple remove one
    if (startColumn > 0) {
      --startColumn;
    }
    // if there are rwos before we append current to previous one
    else if (startRow > 0) {
      --startRow;
      startColumn = this.storage[startRow].length - 1;
    }
  }

  return this.deleteRange(startColumn, startRow, endColumn, endRow);
};
}, "model/Selection": function(exports, require, module) {/**
 * Creates new selection for the editor.
 * @param {Editor} editor.
 * @constructor
 */
var Selection = function(document) {
  this.document = document;
  
  this.start = {
    line: 0,
    character: 0
  };

  this.end = {
    line: 0,
    character: 0
  };

  this.setPosition(0, 0);
};


/**
 * This callback called when selection size has changed
 * @type {Function}
 */
Selection.prototype.onchange = null;

/**
 * If true that means that we currently manipulate right side of the selection
 * @type {Boolean}
 */
Selection.prototype.activeEndSide = true;

/**
 * Returns selection split into line ranges
 * @return {Array}
 */
Selection.prototype.lineRanges = function() {
  if (this.isEmpty()) {
    return {};
  }
  var ranges = {},
      character = this.start.character,
      line = this.start.line;
  for(; line <= this.end.line ; line++) {
    ranges[line] = ([character, line !== this.end.line || this.end.character]);
    character = 0;
  }
  return ranges;
};

/**
 * Comparator for two cursor positions
 * @return {number}
 */
Selection.prototype.comparePosition = function(one, two) {
  if (one.line < two.line) {
    return -1;
  } else if (one.line > two.line) {
    return 1;
  } else {
    if (one.character < two.character) {
      return -1;
    } else if (one.character > two.character) {
      return 1;
    } else {
      return 0;
    }
  }
};

/**
 * Determines if selection is emtpy (zero-length)
 * @return {boolean}
 */
Selection.prototype.isEmpty = function() {
  return this.comparePosition(this.start, this.end) === 0;
};

/**
 * Moves both start and end to a specified position inside document.
 * @param {number} line
 * @param {number} character
 */
Selection.prototype.setPosition = function(character, line, keepSelection) {

  var position = this._forceBounds(character, line);

  // Calling private setter that does the heavy lifting
  this._doSetPosition(position[0], position[1], keepSelection);

  // Making a callback if necessary
  if (typeof this.onchange === 'function') {
    this.onchange(this, this.start, this.end);
  }
};

/**
 * Checks and forces bounds for proposed position updates
 * @return {Array}
 */
Selection.prototype._forceBounds = function(character, line) {
  var position = this.getPosition();

  // Checking lower bounds
  line >= 0 || (line = 0);
  if (character < 0) {
    // Wraparound for lines
    if (line === position[1] && line > 0) {
      --line;
      character = this.document.getLine(line).replace(/(\r\n|\n|\r)/gm, "").length;
    } else {
      character = 0;
    }
  }

  // Checking upper bounds
  var lineCount = this.document.getLineCount();
  line < lineCount || (line = lineCount - 1);
  var characterCount = this.document.getLine(line).replace(/(\r\n|\n|\r)/gm, "").length;
  if (character > characterCount) {
    // Wraparound for lines
    if (line === position[1] && line < this.document.getLineCount() - 1) {
      ++line;
      character = 0;
    } else {
      character = characterCount;
    }
  }
  return [character, line];
};

/**
 * Private unconditional setter for cursor position
 * @param  {number} character
 * @param  {number} line
 * @param  {boolean} keepSelection
 */
Selection.prototype._doSetPosition = function(character, line, keepSelection) {
  // If this is a selection range
  if (keepSelection) {

    var compare = this.comparePosition({
      line: line,
      character: character
    }, this.start);

    // Determining whether we should make the start side of the range active
    // (have a cursor). This happens when we start the selection be moving
    // left, or moving up.
    if (compare === -1 && (this.isEmpty() || line < this.start.line)) {
      this.activeEndSide = false;
    } 

    // Assign new value to the side that is active
    if (this.activeEndSide) {
      this.end.line = line;
      this.end.character = character;
    } else {
      this.start.line = line;
      this.start.character = character;
    }

    // Making sure that end is further than start and swap if necessary
    if (this.comparePosition(this.start, this.end) > 0) {
      this.activeEndSide = !this.activeEndSide;
      var temp = {
        line: this.start.line,
        character: this.start.character
      };
      this.start.line = this.end.line;
      this.start.character = this.end.character;
      this.end.line = temp.line;
      this.end.character = temp.character;
    }
  } else { // Simple cursor move
    this.activeEndSide = true;
    this.start.line = this.end.line = line;
    this.start.character = this.end.character = character;
  }
};

/**
 * Returns current position of the end of the selection
 * @return {Array}
 */
Selection.prototype.getPosition = function() {
  if (this.activeEndSide) {
    return [this.end.character, this.end.line];
  } else {
    return [this.start.character, this.start.line];
  }
};

/**
 * Moves up specified amount of lines.
 * @param  {number} length
 */
Selection.prototype.moveUp = function(length, keepSelection) {
  arguments.length || (length = 1);
  var position = this.getPosition();
  this.setPosition(position[0], position[1] - length, keepSelection);
};

/**
 * Moves down specified amount of lines.
 * @param  {number} length
 */
Selection.prototype.moveDown = function(length, keepSelection) {
  arguments.length || (length = 1);
  var position = this.getPosition();
  this.setPosition(position[0], position[1] + length, keepSelection);
};

/**
 * Moves left specified amount of characters.
 * @param  {number} length
 */
Selection.prototype.moveLeft = function(length, keepSelection) {
  arguments.length || (length = 1);
  var position = this.getPosition();
  this.setPosition(position[0] - length, position[1], keepSelection);
};

/**
 * Moves right specified amount of characters.
 * @param  {number} length
 */
Selection.prototype.moveRight = function(length, keepSelection) {
  arguments.length || (length = 1);
  var position = this.getPosition();
  this.setPosition(position[0] + length, position[1], keepSelection);
};

/**
 * Inserts text at the current cursor position
 * @param  {string} text
 */
 Selection.prototype.insertTextAtCurrentPosition = function(text) {
  // If selection is not empty we need to "replace" selected text with inserted
  // one which means deleting old selected text before inserting new one
  if (!this.isEmpty()) {
    this.deleteCharAtCurrentPosition();
  }

  var pos = this.getPosition();

  // Inserting new text and changing position of cursor to a new one
  this.setPosition.apply(
    this,
    this.document.insertText(text, pos[0], pos[1])
  );
};

/**
 * Deletes text at the current cursor position
 * @param  {string} text
 */
 Selection.prototype.deleteCharAtCurrentPosition = function(forward) {
  // If there is a selection we just remove it no matter what direction is
  if (!this.isEmpty()) {
    this.setPosition.apply(
      this,
      this.document.deleteRange(
        this.start.character, this.start.line,
        this.end.character, this.end.line
      )
    );
  } else {
    var pos = this.getPosition();
    // Deleting text and changing position of cursor to a new one
    this.setPosition.apply(
      this,
      this.document.deleteChar(forward, pos[0], pos[1])
    );
  }
};

Selection.prototype.getText = function() {
  // Assume that selection is empty
  var selectedText = '';
  // if it's not we put together selected text from document
  if (!this.isEmpty()) {
    var ranges = this.lineRanges();
    for(var key in ranges) {
      selectedText += this.document.getLine(parseInt(key)).slice(
        ranges[key][0], ranges[key][1] === true ? undefined : ranges[key][1]
      );
    }
  }
  return selectedText;
}

module.exports = Selection;
}, "model/Statistics": function(exports, require, module) {"use strict";

const Cookie = require ("../lib/Cookie")

var Statistics = function() {
  this.inputs = [];
};

module.exports = Statistics;

Statistics.prototype.InputOne = function(inputValue, realValue) {
  var input = {
    "input" : inputValue,
    "real": realValue
  }
  this.inputs.push(input)
}

Statistics.prototype.Done = function() {
  var total = 0, 
    right = 0;
  var wrongs = new Set();
  for(var i=0; i<this.inputs.length; i++) {
    if(this.inputs[i].input == this.inputs[i].real) {
      right++;
    } else {
      wrongs.add(this.inputs[i].real);
    }
    total++;
  }
  var percent = right/total;
  this.writeHistory(Array.from(wrongs));
  return [percent, Array.from(wrongs)];
}

Statistics.prototype.getHistory = function() {
  var json_str = Cookie.getCookie('editor_history');
  var arr = [];
  if(json_str) 
    arr = JSON.parse(json_str); 
  return arr;
}

Statistics.prototype.writeHistory = function(news) {
  var arr = this.getHistory();
  arr = arr.concat(news).slice(-20);
  var json_str = JSON.stringify(arr);
  Cookie.setCookie('editor_history', json_str);
}


}});
