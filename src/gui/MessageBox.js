"use strict";

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
