"use strict";

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


