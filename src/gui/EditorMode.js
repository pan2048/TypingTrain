"use strict";

const HtmlTemplate = require ("../lib/HtmlTemplate")

var EditorMode = function (editor) {
    document.getElementById("main").appendChild(HtmlTemplate.htmlToElement(`
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
