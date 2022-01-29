"use strict";

const Cookie = require ("../lib/Cookie")

var Statistics = function() {
  this.inputs = [];
};

module.exports = Statistics;

Statistics.prototype.InputOne = function(inputValue, realValue) {
  var input = {
    "input" : inputValue,
    "real": realValue,
    "time": new Date().getTime()
  }
  this.inputs.push(input)
}

Statistics.prototype.Done = function() {
  var total = 0, 
    right = 0, 
    time = 0;
  var wrongs = new Map();
  for(var i=0; i<this.inputs.length; i++) {
    if(this.inputs[i].input == this.inputs[i].real) {
      right++;
    } else {
      if(wrongs[this.inputs[i].real] == undefined) { 
        wrongs[this.inputs[i].real] = new Set();
      }
      wrongs[this.inputs[i].real].add(this.inputs[i].input);
    }
    if(i != 0) {
      let timeDiff = this.inputs[i].time - this.inputs[i-1].time;
      if(timeDiff > 4000) // to check if leaving
        timeDiff = 4000;
      time += timeDiff;
    }
    total++;
  }
  var percent = right/total;
  var cpm = (total - 1) * 1000 * 60 / time;
  this.writeHistory(Array.from(wrongs));
  return this.toString(percent, cpm, wrongs);
}

Statistics.prototype.toString = function(percent, cpm, wrongs) {
  let str = "You score is " + Math.round(percent*1000)/10 + "%.\n";
  str += "CPM is " + Math.round(cpm*100)/100 + ".\n";
  if(Object.keys(wrongs).length  > 0) {
    str += "Below are typos,\n";
    for(let dk in wrongs) {
      str += "  '" + dk + "' => ";
      for(let sv of wrongs[dk]) {
        str += "'" + sv + "'; ";
      } 
      str += "\n";
    }
  }
  return str;
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


