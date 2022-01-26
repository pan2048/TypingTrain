"use strict";

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
