"use strict";

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

