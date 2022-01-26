var Gui = function() {
  document.addEventListener('DOMContentLoaded', function(){
    var Editor = require('Editor'),
      editor = new Editor();
    var LocalFile = require('gui/LocalFile'),
      localFile = new LocalFile(editor);
    var EditorMode = require('gui/EditorMode'),
      editorMode = new EditorMode(editor);      
    var MessageBox = require('gui/MessageBox'),
      messageBox = new MessageBox();
    
    editor.messageBox = messageBox;  
    document.body.appendChild(editor.wrapper); 

    editor.focus();
  }, false);
};

module.exports = Gui;