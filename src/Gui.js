var Gui = function() {
  document.addEventListener('DOMContentLoaded', function(){
    var Editor = require('Editor'),
      editor = new Editor();
    
    var LocalFile = require('gui/LocalFile'),
      localFile = new LocalFile(editor);
    var EditorMode = require('gui/EditorMode'),
      editorMode = new EditorMode(editor);      
    document.body.appendChild(editor.wrapper);   
    var MessageBox = require('gui/MessageBox'),
      messageBox = new MessageBox();
    
    editor.messageBox = messageBox;  

    editor.focus();
  }, false);
};

module.exports = Gui;