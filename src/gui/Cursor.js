var Cursor = function(editor, color, height) {
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
