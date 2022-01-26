/**
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
