"use strict";

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
